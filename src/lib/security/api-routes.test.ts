import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  signUpEmailMock,
  authHandlerGetMock,
  authHandlerPostMock,
  requireWorkspaceContextMock,
  exportReportCsvMock,
} = vi.hoisted(() => ({
  signUpEmailMock: vi.fn(),
  authHandlerGetMock: vi.fn(),
  authHandlerPostMock: vi.fn(),
  requireWorkspaceContextMock: vi.fn(),
  exportReportCsvMock: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/src/lib/auth', () => ({
  auth: {
    api: {
      signUpEmail: signUpEmailMock,
    },
  },
}))
vi.mock('better-auth/next-js', () => ({
  toNextJsHandler: () => ({
    GET: authHandlerGetMock,
    POST: authHandlerPostMock,
  }),
}))
vi.mock('@/src/lib/workspaces/context', () => ({
  requireWorkspaceContext: requireWorkspaceContextMock,
}))
vi.mock('@/src/services/report.service', () => ({
  ReportService: {
    exportReportCsv: exportReportCsvMock,
  },
}))

import { NextRequest } from 'next/server'
import { POST as authPost } from '@/app/api/auth/[...all]/route'
import { POST as feedbackPost } from '@/app/api/feedback/route'
import { POST as registerPost } from '@/app/api/register/route'
import { GET as exportGet } from '@/app/api/reports/export/route'
import { DomainError } from '@/src/lib/errors'
import {
  authMutationRateLimiter,
  feedbackRateLimiter,
  registerRateLimiter,
  reportExportRateLimiter,
} from '@/src/lib/rate-limit'

describe('Security behavior of API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    registerRateLimiter.reset()
    authMutationRateLimiter.reset()
    reportExportRateLimiter.reset()
    feedbackRateLimiter.reset()
  })

  it('validates input and enforces rate limiting on /api/register', async () => {
    const invalidRequest = new Request('https://stockly.test/api/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '198.51.100.1' },
      body: JSON.stringify({ name: 'A', email: 'bad', password: '123' }),
    })

    const invalidRes = await registerPost(invalidRequest)
    expect(invalidRes.status).toBe(400)

    signUpEmailMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))

    for (let i = 0; i < 4; i++) {
      const okReq = new Request('https://stockly.test/api/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '198.51.100.1' },
        body: JSON.stringify({
          name: 'Budi Santoso',
          email: `budi${i}@toko.id`,
          password: 'PasswordKuat123',
        }),
      })
      const okRes = await registerPost(okReq)
      expect(okRes.status).toBe(200)
    }

    const limitedReq = new Request('https://stockly.test/api/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '198.51.100.1' },
      body: JSON.stringify({
        name: 'Budi Santoso',
        email: 'budi5@toko.id',
        password: 'PasswordKuat123',
      }),
    })
    const limitedRes = await registerPost(limitedReq)
    expect(limitedRes.status).toBe(429)
    expect(limitedRes.headers.get('Retry-After')).toBeTruthy()
  })

  it('enforces rate limiting on /api/auth POST mutations', async () => {
    authHandlerPostMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))

    for (let i = 0; i < 15; i++) {
      const req = new Request('https://stockly.test/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'x-forwarded-for': '198.51.100.2' },
      })
      const res = await authPost(req)
      expect(res.status).toBe(200)
    }

    const blockedReq = new Request('https://stockly.test/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'x-forwarded-for': '198.51.100.2' },
    })
    const blockedRes = await authPost(blockedReq)
    expect(blockedRes.status).toBe(429)
  })

  it('requires workspace authorization, enforces export rate limits, and hides internal errors on /api/reports/export', async () => {
    requireWorkspaceContextMock.mockRejectedValueOnce(
      new DomainError('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.'),
    )
    const unauthRes = await exportGet(new NextRequest('https://stockly.test/api/reports/export'))
    expect(unauthRes.status).toBe(401)

    requireWorkspaceContextMock.mockResolvedValue({
      userId: 'u-1',
      workspaceId: 'ws-1',
      role: 'OWNER',
    })
    exportReportCsvMock.mockResolvedValue({
      filename: 'stockly-laporan-stok-saat-ini.csv',
      csv: '\uFEFFSKU,Nama\nKOPI-01,Kopi',
    })

    const okRes = await exportGet(
      new NextRequest('https://stockly.test/api/reports/export?report=current-stock'),
    )
    expect(okRes.status).toBe(200)
    expect(okRes.headers.get('Content-Type')).toContain('text/csv')
    expect(okRes.headers.get('Cache-Control')).toBe('no-store')

    for (let i = 0; i < 19; i++) {
      const nextRes = await exportGet(new NextRequest('https://stockly.test/api/reports/export'))
      expect(nextRes.status).toBe(200)
    }

    const limitedRes = await exportGet(new NextRequest('https://stockly.test/api/reports/export'))
    expect(limitedRes.status).toBe(429)

    reportExportRateLimiter.reset()
    exportReportCsvMock.mockRejectedValueOnce(
      new Error('postgresql://admin:secret@host/db crashed'),
    )
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const errRes = await exportGet(new NextRequest('https://stockly.test/api/reports/export'))
    expect(errRes.status).toBe(500)
    const body = (await errRes.json()) as { message: string }
    expect(body.message).toBe('Terjadi kendala saat mengekspor laporan CSV.')
    expect(body.message).not.toContain('secret')
    errorSpy.mockRestore()
  })

  it('requires authentication, validates payload, logs structured info, and rate-limits /api/feedback', async () => {
    requireWorkspaceContextMock.mockRejectedValueOnce(
      new DomainError('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.'),
    )

    const unauthRes = await feedbackPost(
      new Request('https://stockly.test/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
    )
    expect(unauthRes.status).toBe(401)

    requireWorkspaceContextMock.mockResolvedValue({
      userId: 'user-pilot-1',
      workspaceId: 'ws-pilot-1',
      role: 'OWNER',
    })

    const badRes = await feedbackPost(
      new Request('https://stockly.test/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'BUG',
          rating: 0,
          pagePath: '/products',
          summary: 'x',
          details: 'y',
        }),
      }),
    )
    expect(badRes.status).toBe(400)

    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const okRes = await feedbackPost(
      new Request('https://stockly.test/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'USABILITY',
          rating: 5,
          pagePath: '/inventory/stock-in',
          summary: 'Alur stok masuk sangat jelas',
          details: 'Konfirmasi sebelum simpan membantu mencegah salah ketik jumlah barang.',
          viewportWidth: 1440,
        }),
      }),
    )
    expect(okRes.status).toBe(201)
    expect(infoSpy).toHaveBeenCalledTimes(1)
    const logged = JSON.parse(String(infoSpy.mock.calls[0][0]))
    expect(logged.scope).toBe('beta-feedback')
    expect(logged.context.workspaceId).toBe('ws-pilot-1')
    expect(logged.context.rating).toBe(5)
    infoSpy.mockRestore()

    const quietInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    for (let i = 0; i < 8; i++) {
      const nextRes = await feedbackPost(
        new Request('https://stockly.test/api/feedback', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            type: 'FEATURE',
            rating: 4,
            pagePath: '/reports',
            summary: `Masukan ke-${i + 2}`,
            details: 'Ekspor CSV sudah rapi dan mudah dibuka di Excel.',
          }),
        }),
      )
      expect(nextRes.status).toBe(201)
    }
    quietInfoSpy.mockRestore()

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const limitedRes = await feedbackPost(
      new Request('https://stockly.test/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'FEATURE',
          rating: 4,
          pagePath: '/reports',
          summary: 'Terlalu cepat',
          details: 'Harus kena batas rate limit.',
        }),
      }),
    )
    expect(limitedRes.status).toBe(429)
    warnSpy.mockRestore()
  })
})


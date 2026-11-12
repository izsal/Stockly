import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  signUpEmailMock,
  requireWorkspaceContextMock,
  exportReportCsvMock,
} = vi.hoisted(() => ({
  signUpEmailMock: vi.fn(),
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
vi.mock('@/src/lib/workspaces/context', () => ({
  requireWorkspaceContext: requireWorkspaceContextMock,
}))
vi.mock('@/src/services/report.service', () => ({
  ReportService: {
    exportReportCsv: exportReportCsvMock,
  },
}))

import { POST as registerPost } from '@/app/api/register/route'
import { GET as exportGet } from '@/app/api/reports/export/route'
import { serializeCsv } from '@/src/lib/csv'
import type { WorkspaceContext } from '@/src/lib/permissions/workspace'
import { registerRateLimiter, reportExportRateLimiter } from '@/src/lib/rate-limit'
import { computeAdjustmentResult, computeStockInResult, computeStockOutResult, reconcileLedgerBalance } from './inventory-calculations'

describe('E2E workflow: registration to stock reporting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    registerRateLimiter.reset()
    reportExportRateLimiter.reset()
  })

  it('completes registration -> workspace context -> stock movements -> reconciled CSV stock report', async () => {
    const provisionedWorkspace: WorkspaceContext = {
      userId: 'user-e2e-1',
      workspaceId: '11111111-1111-4111-8111-111111111111',
      role: 'OWNER',
    }

    signUpEmailMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          user: { id: provisionedWorkspace.userId, email: 'owner@tokoe2e.id' },
        }),
        { status: 200 },
      ),
    )

    const regResponse = await registerPost(
      new Request('https://stockly.test/api/register', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '203.0.113.55',
        },
        body: JSON.stringify({
          name: 'Toko E2E Sejahtera',
          email: 'owner@tokoe2e.id',
          password: 'PasswordKuat2026!',
        }),
      }),
    )
    expect(regResponse.status).toBe(200)

    const m1 = computeStockInResult(0, 30)
    const m2 = computeStockOutResult(m1.quantityAfter, 18)
    const m3 = computeAdjustmentResult(m2.quantityAfter, 10)
    const ledgerCheck = reconcileLedgerBalance([m1, m2, m3])
    expect(ledgerCheck).toEqual({ valid: true, computedBalance: 10 })

    const csvPayload = serializeCsv(
      ['SKU', 'Nama Produk', 'Stok Saat Ini', 'Status'],
      [['KOPI-E2E', 'Kopi Arabika E2E', ledgerCheck.computedBalance, 'Menipis']],
    )

    requireWorkspaceContextMock.mockResolvedValueOnce(provisionedWorkspace)
    exportReportCsvMock.mockResolvedValueOnce({
      filename: 'stockly-laporan-stok-saat-ini.csv',
      csv: csvPayload,
    })

    const exportResponse = await exportGet(
      new NextRequest('https://stockly.test/api/reports/export?report=current-stock'),
    )
    expect(exportResponse.status).toBe(200)
    const downloadedCsv = await exportResponse.text()
    expect(downloadedCsv).toContain('KOPI-E2E,Kopi Arabika E2E,10,Menipis')
  })
})


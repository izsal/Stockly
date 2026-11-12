import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { logServerError, redactSensitiveText, sanitizeLogContext } from './logger'

describe('logger', () => {
  it('redacts postgresql connection strings and bearer tokens from messages', () => {
    const raw =
      'Connection failed for postgresql://admin:secretpass@db.neon.tech/prod?sslmode=verify-full with Bearer abc.def.ghi'
    const redacted = redactSensitiveText(raw)

    expect(redacted).not.toContain('secretpass')
    expect(redacted).not.toContain('abc.def.ghi')
    expect(redacted).toContain('postgresql://[REDACTED]')
    expect(redacted).toContain('Bearer [REDACTED]')
  })

  it('redacts sensitive context keys while keeping correlation metadata', () => {
    const clean = sanitizeLogContext({
      workspaceId: 'ws-1',
      password: 'my-password',
      authorization: 'Bearer xyz',
      databaseUrl: 'postgresql://u:p@host/db',
    })

    expect(clean).toEqual({
      workspaceId: 'ws-1',
      password: '[REDACTED]',
      authorization: '[REDACTED]',
      databaseUrl: '[REDACTED]',
    })
  })

  it('logs structured JSON errors and returns correlationId', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const err = Object.assign(
      new Error('Failed query against postgresql://user:pw@host/db'),
      { code: 'ECONNREFUSED' },
    )

    const correlationId = logServerError('inventory-action', err, { userId: 'u-1' }, 'corr-123')

    expect(correlationId).toBe('corr-123')
    expect(spy).toHaveBeenCalledTimes(1)
    const logged = JSON.parse(String(spy.mock.calls[0][0]))
    expect(logged.correlationId).toBe('corr-123')
    expect(logged.errorCode).toBe('ECONNREFUSED')
    expect(logged.errorMessage).not.toContain('pw')
    expect(logged.context).toEqual({ userId: 'u-1' })

    spy.mockRestore()
  })
})


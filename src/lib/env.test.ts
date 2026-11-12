import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { assertValidServerEnv, validateServerEnv } from './env'

const VALID_ENV = {
  NODE_ENV: 'production',
  DATABASE_URL:
    'postgresql://user:pass@ep-demo-pooler.us-east-1.aws.neon.tech/neondb?sslmode=verify-full',
  DATABASE_URL_UNPOOLED:
    'postgresql://user:pass@ep-demo.us-east-1.aws.neon.tech/neondb?sslmode=verify-full',
  BETTER_AUTH_SECRET: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
  BETTER_AUTH_URL: 'https://stockly.example.com',
  NEXT_PUBLIC_APP_URL: 'https://stockly.example.com',
}

describe('validateServerEnv', () => {
  it('accepts valid production environment variables', () => {
    const result = validateServerEnv(VALID_ENV)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.isProduction).toBe(true)
      expect(result.value.betterAuthUrl).toBe('https://stockly.example.com')
    }
  })

  it('rejects missing or short BETTER_AUTH_SECRET and placeholder secrets in production', () => {
    const shortResult = validateServerEnv({
      ...VALID_ENV,
      BETTER_AUTH_SECRET: 'too-short',
    })
    expect(shortResult.ok).toBe(false)

    const placeholderResult = validateServerEnv({
      ...VALID_ENV,
      BETTER_AUTH_SECRET: 'replace-with-a-cryptographically-random-secret-min-32-chars',
    })
    expect(placeholderResult.ok).toBe(false)
    if (!placeholderResult.ok) {
      expect(placeholderResult.issues[0].key).toBe('BETTER_AUTH_SECRET')
    }
  })

  it('rejects non-postgres DATABASE_URL and malformed BETTER_AUTH_URL without leaking values', () => {
    expect(() =>
      assertValidServerEnv({
        ...VALID_ENV,
        DATABASE_URL: 'mysql://supersecret:password@host/db',
        BETTER_AUTH_URL: 'not-a-url',
      }),
    ).toThrow(/DATABASE_URL.*BETTER_AUTH_URL/)
  })
})


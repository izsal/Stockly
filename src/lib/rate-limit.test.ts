import { describe, expect, it } from 'vitest'
import {
  SlidingRateLimiter,
  createRateLimitHeaders,
  createRateLimitedResponse,
  getClientIp,
} from './rate-limit'

describe('SlidingRateLimiter', () => {
  it('allows requests up to the limit and blocks subsequent requests until window resets', () => {
    const limiter = new SlidingRateLimiter({ limit: 3, windowMs: 10_000 })
    const t0 = 1_700_000_000_000

    expect(limiter.check('ip:1.1.1.1', t0)).toMatchObject({ allowed: true, remaining: 2 })
    expect(limiter.check('ip:1.1.1.1', t0 + 100)).toMatchObject({ allowed: true, remaining: 1 })
    expect(limiter.check('ip:1.1.1.1', t0 + 200)).toMatchObject({ allowed: true, remaining: 0 })

    const blocked = limiter.check('ip:1.1.1.1', t0 + 300)
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.retryAfterSeconds).toBe(10)

    expect(limiter.check('ip:2.2.2.2', t0 + 300)).toMatchObject({ allowed: true, remaining: 2 })
    expect(limiter.check('ip:1.1.1.1', t0 + 10_000)).toMatchObject({ allowed: true, remaining: 2 })
  })

  it('evicts oldest keys when maxEntries cap is reached', () => {
    const limiter = new SlidingRateLimiter({ limit: 2, windowMs: 60_000, maxEntries: 100 })
    const now = 1_700_000_000_000

    for (let i = 0; i < 120; i++) {
      const res = limiter.check(`client-${i}`, now + i)
      expect(res.allowed).toBe(true)
    }
  })

  it('extracts client IP from proxy headers and creates standard 429 response', async () => {
    const request = new Request('https://stockly.test/api/register', {
      headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.1' },
    })
    expect(getClientIp(request)).toBe('203.0.113.10')

    const response = createRateLimitedResponse({
      allowed: false,
      limit: 5,
      remaining: 0,
      resetAt: 1_700_000_060_000,
      retryAfterSeconds: 45,
    })

    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('45')
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(createRateLimitHeaders({
      allowed: true,
      limit: 5,
      remaining: 4,
      resetAt: 1_700_000_060_000,
      retryAfterSeconds: 0,
    })).not.toHaveProperty('Retry-After')

    const body = (await response.json()) as { message: string }
    expect(body.message).toContain('Terlalu banyak')
  })
})


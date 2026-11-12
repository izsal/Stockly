export type RateLimitConfig = {
  limit: number
  windowMs: number
  maxEntries?: number
}

export type RateLimitDecision = {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: number
  retryAfterSeconds: number
}

type BucketEntry = {
  count: number
  resetAt: number
}

const DEFAULT_MAX_ENTRIES = 10_000

export class SlidingRateLimiter {
  private readonly store = new Map<string, BucketEntry>()
  private readonly limit: number
  private readonly windowMs: number
  private readonly maxEntries: number

  constructor(config: RateLimitConfig) {
    this.limit = Math.max(1, config.limit)
    this.windowMs = Math.max(1_000, config.windowMs)
    this.maxEntries = Math.max(100, config.maxEntries ?? DEFAULT_MAX_ENTRIES)
  }

  check(key: string, now: number = Date.now()): RateLimitDecision {
    const existing = this.store.get(key)

    if (!existing || now >= existing.resetAt) {
      this.pruneIfNeeded(now)
      const resetAt = now + this.windowMs
      this.store.set(key, { count: 1, resetAt })
      return {
        allowed: true,
        limit: this.limit,
        remaining: Math.max(0, this.limit - 1),
        resetAt,
        retryAfterSeconds: 0,
      }
    }

    if (existing.count >= this.limit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
      return {
        allowed: false,
        limit: this.limit,
        remaining: 0,
        resetAt: existing.resetAt,
        retryAfterSeconds,
      }
    }

    existing.count += 1
    this.store.set(key, existing)
    return {
      allowed: true,
      limit: this.limit,
      remaining: Math.max(0, this.limit - existing.count),
      resetAt: existing.resetAt,
      retryAfterSeconds: 0,
    }
  }

  reset(key?: string): void {
    if (key === undefined) {
      this.store.clear()
      return
    }
    this.store.delete(key)
  }

  private pruneIfNeeded(now: number): void {
    if (this.store.size < this.maxEntries) return

    for (const [entryKey, entry] of this.store) {
      if (now >= entry.resetAt) {
        this.store.delete(entryKey)
      }
    }

    while (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value
      if (!oldestKey) break
      this.store.delete(oldestKey)
    }
  }
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim()
    if (firstIp) return firstIp
  }

  const realIp = request.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp

  return 'unknown'
}

export function createRateLimitHeaders(decision: RateLimitDecision): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(decision.limit),
    'X-RateLimit-Remaining': String(decision.remaining),
    'X-RateLimit-Reset': String(Math.ceil(decision.resetAt / 1000)),
    'Cache-Control': 'no-store',
  }

  if (!decision.allowed) {
    headers['Retry-After'] = String(decision.retryAfterSeconds)
  }

  return headers
}

export function createRateLimitedResponse(
  decision: RateLimitDecision,
  message = 'Terlalu banyak permintaan. Silakan coba beberapa saat lagi.',
): Response {
  return Response.json(
    { message },
    {
      status: 429,
      headers: createRateLimitHeaders(decision),
    },
  )
}

export const registerRateLimiter = new SlidingRateLimiter({
  limit: 5,
  windowMs: 10 * 60 * 1000,
})

export const authMutationRateLimiter = new SlidingRateLimiter({
  limit: 15,
  windowMs: 5 * 60 * 1000,
})

export const reportExportRateLimiter = new SlidingRateLimiter({
  limit: 20,
  windowMs: 60 * 1000,
})

export const feedbackRateLimiter = new SlidingRateLimiter({
  limit: 10,
  windowMs: 10 * 60 * 1000,
})


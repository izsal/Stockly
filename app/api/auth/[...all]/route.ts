import { toNextJsHandler } from 'better-auth/next-js'
import { auth } from '@/src/lib/auth'
import { logServerWarn } from '@/src/lib/logger'
import {
  authMutationRateLimiter,
  createRateLimitedResponse,
  getClientIp,
} from '@/src/lib/rate-limit'

const handler = toNextJsHandler(auth)

export const GET = handler.GET

export async function POST(request: Request) {
  const clientIp = getClientIp(request)
  const decision = authMutationRateLimiter.check(`auth-post:${clientIp}`)
  if (!decision.allowed) {
    logServerWarn('auth-api', 'Rate limit exceeded for auth mutation endpoint', {
      clientIp,
    })
    return createRateLimitedResponse(
      decision,
      'Terlalu banyak percobaan autentikasi. Silakan tunggu beberapa saat lalu coba lagi.',
    )
  }

  return handler.POST(request)
}

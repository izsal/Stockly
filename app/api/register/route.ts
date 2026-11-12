import { auth } from '@/src/lib/auth'
import { logServerError, logServerWarn } from '@/src/lib/logger'
import {
  createRateLimitHeaders,
  createRateLimitedResponse,
  getClientIp,
  registerRateLimiter,
} from '@/src/lib/rate-limit'
import { registerInputSchema } from '@/src/lib/validation/auth'

export async function POST(request: Request) {
  const clientIp = getClientIp(request)
  const decision = registerRateLimiter.check(`register:${clientIp}`)
  if (!decision.allowed) {
    logServerWarn('auth-register', 'Rate limit exceeded for registration endpoint', {
      clientIp,
    })
    return createRateLimitedResponse(
      decision,
      'Terlalu banyak percobaan pendaftaran. Silakan tunggu beberapa menit lalu coba lagi.',
    )
  }

  const rateHeaders = createRateLimitHeaders(decision)
  const body = await request.json().catch(() => null)
  const parsed = registerInputSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json(
      {
        message: 'Periksa kembali data pendaftaran.',
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400, headers: rateHeaders },
    )
  }

  try {
    const response = await auth.api.signUpEmail({
      body: parsed.data,
      headers: request.headers,
      asResponse: true,
    })

    if (!response.ok) {
      logServerWarn('auth-register', 'Registration was rejected by auth provider', {
        status: response.status,
        clientIp,
      })
      return Response.json(
        { message: 'Pendaftaran belum berhasil. Periksa data lalu coba lagi.' },
        { status: response.status, headers: rateHeaders },
      )
    }

    return response
  } catch (error) {
    logServerError('auth-register', error, { clientIp })
    return Response.json(
      { message: 'Terjadi kendala saat membuat akun. Coba lagi.' },
      { status: 500, headers: rateHeaders },
    )
  }
}

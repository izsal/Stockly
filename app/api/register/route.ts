import { auth } from '@/src/lib/auth'
import { registerInputSchema } from '@/src/lib/validation/auth'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = registerInputSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json(
      {
        message: 'Periksa kembali data pendaftaran.',
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  try {
    const response = await auth.api.signUpEmail({
      body: parsed.data,
      headers: request.headers,
      asResponse: true,
    })

    if (!response.ok) {
      console.error('[auth] Registration was rejected', response.status)
      return Response.json(
        { message: 'Pendaftaran belum berhasil. Periksa data lalu coba lagi.' },
        { status: response.status, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    return response
  } catch (error) {
    console.error('[auth] Registration request failed', error)
    return Response.json(
      { message: 'Terjadi kendala saat membuat akun. Coba lagi.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}

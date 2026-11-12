import { randomUUID } from 'node:crypto'
import { isDomainError } from '@/src/lib/errors'
import { logServerError, logServerInfo, logServerWarn } from '@/src/lib/logger'
import {
  createRateLimitHeaders,
  createRateLimitedResponse,
  feedbackRateLimiter,
} from '@/src/lib/rate-limit'
import { betaFeedbackSchema } from '@/src/lib/validation/feedback'
import { requireWorkspaceContext } from '@/src/lib/workspaces/context'

export async function POST(request: Request) {
  try {
    const ctx = await requireWorkspaceContext()
    const decision = feedbackRateLimiter.check(`feedback:${ctx.workspaceId}:${ctx.userId}`)

    if (!decision.allowed) {
      logServerWarn('beta-feedback', 'Rate limit exceeded for beta feedback submission', {
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
      })
      return createRateLimitedResponse(
        decision,
        'Terlalu banyak masukan dikirim dalam waktu singkat. Coba beberapa menit lagi.',
      )
    }

    const rateHeaders = createRateLimitHeaders(decision)
    const body = await request.json().catch(() => null)
    const parsed = betaFeedbackSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        {
          message: 'Periksa kembali formulir masukan beta.',
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400, headers: rateHeaders },
      )
    }

    const feedbackId = randomUUID()
    logServerInfo('beta-feedback', 'Pilot usability feedback received', {
      feedbackId,
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      role: ctx.role,
      type: parsed.data.type,
      rating: parsed.data.rating,
      pagePath: parsed.data.pagePath,
      summary: parsed.data.summary,
      details: parsed.data.details,
      viewportWidth: parsed.data.viewportWidth,
    })

    return Response.json(
      {
        ok: true,
        id: feedbackId,
        message: 'Terima kasih! Masukan beta Anda berhasil dikirim.',
      },
      { status: 201, headers: rateHeaders },
    )
  } catch (error) {
    if (isDomainError(error)) {
      return Response.json(
        { message: error.message },
        { status: error.statusCode, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    logServerError('beta-feedback', error)
    return Response.json(
      { message: 'Terjadi kendala saat mengirim masukan. Silakan coba lagi.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}


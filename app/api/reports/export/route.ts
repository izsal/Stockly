import { NextResponse, type NextRequest } from 'next/server'
import { isDomainError } from '@/src/lib/errors'
import { logServerError, logServerWarn } from '@/src/lib/logger'
import {
  createRateLimitHeaders,
  createRateLimitedResponse,
  reportExportRateLimiter,
} from '@/src/lib/rate-limit'
import { requireWorkspaceContext } from '@/src/lib/workspaces/context'
import { ReportService } from '@/src/services/report.service'

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireWorkspaceContext('reports:read')
    const decision = reportExportRateLimiter.check(`export:${ctx.workspaceId}:${ctx.userId}`)
    if (!decision.allowed) {
      logServerWarn('report-export', 'Rate limit exceeded for CSV export', {
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
      })
      return createRateLimitedResponse(
        decision,
        'Terlalu sering mengekspor CSV. Silakan tunggu sebentar lalu coba lagi.',
      )
    }

    const searchParams = request.nextUrl.searchParams

    const { filename, csv } = await ReportService.exportReportCsv(ctx, {
      report: (searchParams.get('report') ?? 'current-stock') as
        | 'current-stock'
        | 'low-stock'
        | 'movements',
      search: searchParams.get('search') ?? undefined,
      categoryId: searchParams.get('categoryId') ?? undefined,
      stockStatus: (searchParams.get('stockStatus') ?? 'all') as
        | 'all'
        | 'normal'
        | 'low'
        | 'out',
      productId: searchParams.get('productId') ?? undefined,
      type: (searchParams.get('type') ?? undefined) as 'IN' | 'OUT' | 'ADJUSTMENT' | undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
    })

    return new NextResponse(csv, {
      status: 200,
      headers: {
        ...createRateLimitHeaders(decision),
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    if (isDomainError(error)) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode })
    }

    logServerError('report-export', error)
    return NextResponse.json(
      { message: 'Terjadi kendala saat mengekspor laporan CSV.' },
      { status: 500 },
    )
  }
}


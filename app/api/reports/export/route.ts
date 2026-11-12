import { randomUUID } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { isDomainError } from '@/src/lib/errors'
import { requireWorkspaceContext } from '@/src/lib/workspaces/context'
import { ReportService } from '@/src/services/report.service'

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireWorkspaceContext('reports:read')
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
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    if (isDomainError(error)) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode })
    }

    const correlationId = randomUUID()
    console.error(`[report-export:${correlationId}]`, error)
    return NextResponse.json(
      { message: 'Terjadi kendala saat mengekspor laporan CSV.' },
      { status: 500 },
    )
  }
}


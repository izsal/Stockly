import type { Metadata } from 'next'
import { DashboardShell } from '@/src/components/app/dashboard-shell'
import { MissingWorkspaceState } from '@/src/components/app/missing-workspace-card'
import { ReportsView } from '@/src/features/reports/reports-view'
import { uuidSchema } from '@/src/lib/validation/catalog'
import { MOVEMENT_TYPES, type MovementType } from '@/src/lib/validation/inventory'
import { parsePageSizeParam } from '@/src/lib/validation/pagination'
import {
  REPORT_TABS,
  STOCK_STATUS_FILTERS,
  type ReportTab,
  type StockStatusFilter,
} from '@/src/lib/validation/reports'
import { requireDashboardWorkspace } from '@/src/lib/workspaces/dashboard-auth'
import { CategoryService } from '@/src/services/category.service'
import { ProductService } from '@/src/services/product.service'
import { ReportService } from '@/src/services/report.service'

export const metadata: Metadata = {
  title: 'Laporan',
  robots: { index: false, follow: false },
}

const DATE_PARAM_REGEX = /^\d{4}-\d{2}-\d{2}$/

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { session, workspace } = await requireDashboardWorkspace()
  if (!workspace) {
    return <MissingWorkspaceState userName={session.user.name} />
  }

  const resolvedParams = await searchParams
  const rawTab = typeof resolvedParams.tab === 'string' ? resolvedParams.tab : 'current-stock'
  const tab: ReportTab = (REPORT_TABS as readonly string[]).includes(rawTab)
    ? (rawTab as ReportTab)
    : 'current-stock'

  const search = typeof resolvedParams.search === 'string' ? resolvedParams.search : ''

  const rawCategoryId =
    typeof resolvedParams.categoryId === 'string' ? resolvedParams.categoryId : ''
  const validCategoryId = uuidSchema.safeParse(rawCategoryId).success ? rawCategoryId : ''

  const rawStockStatus =
    typeof resolvedParams.stockStatus === 'string' ? resolvedParams.stockStatus : 'all'
  const stockStatus: StockStatusFilter = (STOCK_STATUS_FILTERS as readonly string[]).includes(
    rawStockStatus,
  )
    ? (rawStockStatus as StockStatusFilter)
    : 'all'

  const rawProductId =
    typeof resolvedParams.productId === 'string' ? resolvedParams.productId : ''
  const validProductId = uuidSchema.safeParse(rawProductId).success ? rawProductId : ''

  const rawType = typeof resolvedParams.type === 'string' ? resolvedParams.type : ''
  const validType: MovementType | '' = (MOVEMENT_TYPES as readonly string[]).includes(rawType)
    ? (rawType as MovementType)
    : ''

  const dateFrom =
    typeof resolvedParams.dateFrom === 'string' && DATE_PARAM_REGEX.test(resolvedParams.dateFrom)
      ? resolvedParams.dateFrom
      : ''
  const dateTo =
    typeof resolvedParams.dateTo === 'string' && DATE_PARAM_REGEX.test(resolvedParams.dateTo)
      ? resolvedParams.dateTo
      : ''

  const rawPage = typeof resolvedParams.page === 'string' ? Number(resolvedParams.page) : 1
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1
  const pageSize = parsePageSizeParam(resolvedParams.pageSize, 10)

  const ctx = {
    userId: session.user.id,
    workspaceId: workspace.id,
    role: workspace.role,
  }

  const [categoriesResult, productsResult, currentStockData, lowStockData, movementData] =
    await Promise.all([
      CategoryService.listCategories(ctx, { page: 1, pageSize: 100 }),
      ProductService.listProducts(ctx, { status: 'all', page: 1, pageSize: 100 }),
      tab === 'current-stock'
        ? ReportService.getCurrentStockReport(ctx, {
          search: search || undefined,
          categoryId: validCategoryId || undefined,
          stockStatus,
          page,
          pageSize,
        })
        : Promise.resolve(null),
      tab === 'low-stock'
        ? ReportService.getLowStockReport(ctx, {
          search: search || undefined,
          categoryId: validCategoryId || undefined,
          page,
          pageSize,
        })
        : Promise.resolve(null),
      tab === 'movements'
        ? ReportService.getMovementReport(ctx, {
          search: search || undefined,
          productId: validProductId || undefined,
          type: validType || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          page,
          pageSize,
        })
        : Promise.resolve(null),
    ])

  return (
    <DashboardShell
      workspaceName={workspace.name}
      userName={session.user.name}
      role={workspace.role}
    >
      <ReportsView
        tab={tab}
        categories={categoriesResult.items.map((c) => ({ id: c.id, name: c.name }))}
        products={productsResult.items.map((p) => ({ id: p.id, name: p.name, sku: p.sku }))}
        initialSearch={search}
        initialCategoryId={validCategoryId}
        initialStockStatus={stockStatus}
        initialProductId={validProductId}
        initialType={validType}
        initialDateFrom={dateFrom}
        initialDateTo={dateTo}
        currentStockData={currentStockData}
        lowStockData={lowStockData}
        movementData={movementData}
      />
    </DashboardShell>
  )
}


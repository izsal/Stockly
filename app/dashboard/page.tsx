import type { Metadata } from 'next'
import { DashboardShell } from '@/src/components/app/dashboard-shell'
import { MissingWorkspaceState } from '@/src/components/app/missing-workspace-card'
import { DashboardView } from '@/src/features/dashboard/dashboard-view'
import { uuidSchema } from '@/src/lib/validation/catalog'
import { requireDashboardWorkspace } from '@/src/lib/workspaces/dashboard-auth'
import { CategoryService } from '@/src/services/category.service'
import { ReportService } from '@/src/services/report.service'

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
}

const DATE_PARAM_REGEX = /^\d{4}-\d{2}-\d{2}$/

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { session, workspace } = await requireDashboardWorkspace()

  if (!workspace) {
    return <MissingWorkspaceState userName={session.user.name} />
  }

  const resolvedParams = await searchParams
  const dateFrom =
    typeof resolvedParams.dateFrom === 'string' && DATE_PARAM_REGEX.test(resolvedParams.dateFrom)
      ? resolvedParams.dateFrom
      : undefined
  const dateTo =
    typeof resolvedParams.dateTo === 'string' && DATE_PARAM_REGEX.test(resolvedParams.dateTo)
      ? resolvedParams.dateTo
      : undefined

  const rawSalesYear =
    typeof resolvedParams.salesYear === 'string' ? Number(resolvedParams.salesYear) : undefined
  const salesYear =
    Number.isInteger(rawSalesYear) && (rawSalesYear as number) >= 2000 && (rawSalesYear as number) <= 2100
      ? (rawSalesYear as number)
      : undefined

  const rawSalesCategory =
    typeof resolvedParams.salesCategory === 'string' ? resolvedParams.salesCategory : undefined
  const salesCategoryId =
    rawSalesCategory && uuidSchema.safeParse(rawSalesCategory).success
      ? rawSalesCategory
      : undefined

  const salesReason = resolvedParams.salesReason === 'ALL_OUT' ? 'ALL_OUT' : 'SALE'

  const ctx = {
    userId: session.user.id,
    workspaceId: workspace.id,
    role: workspace.role,
  }

  const [summary, monthlySales, categoriesResult] = await Promise.all([
    ReportService.getDashboardSummary(ctx, { dateFrom, dateTo }),
    ReportService.getMonthlySales(ctx, {
      year: salesYear,
      categoryId: salesCategoryId,
      reason: salesReason,
    }),
    CategoryService.listCategories(ctx, { page: 1, pageSize: 100 }),
  ])
  const roleLabel = workspace.role === 'OWNER' ? 'Pemilik' : 'Staf'

  return (
    <DashboardShell
      workspaceName={workspace.name}
      userName={session.user.name}
      role={workspace.role}
    >
      <DashboardView
        userName={session.user.name}
        workspaceName={workspace.name}
        roleLabel={roleLabel}
        summary={summary}
        monthlySales={monthlySales}
        categories={categoriesResult.items.map((c) => ({ id: c.id, name: c.name }))}
      />
    </DashboardShell>
  )
}

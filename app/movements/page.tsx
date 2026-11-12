import type { Metadata } from 'next'
import { DashboardShell } from '@/src/components/app/dashboard-shell'
import { MissingWorkspaceState } from '@/src/components/app/missing-workspace-card'
import { MovementsView } from '@/src/features/inventory/movements-view'
import { uuidSchema } from '@/src/lib/validation/catalog'
import { MOVEMENT_TYPES, type MovementType } from '@/src/lib/validation/inventory'
import { requireDashboardWorkspace } from '@/src/lib/workspaces/dashboard-auth'
import { InventoryService } from '@/src/services/inventory.service'
import { ProductService } from '@/src/services/product.service'

export const metadata: Metadata = {
  title: 'Riwayat Stok',
  robots: { index: false, follow: false },
}

const DATE_PARAM_REGEX = /^\d{4}-\d{2}-\d{2}$/

export default async function MovementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { session, workspace } = await requireDashboardWorkspace()
  if (!workspace) {
    return <MissingWorkspaceState userName={session.user.name} />
  }

  const resolvedParams = await searchParams
  const search = typeof resolvedParams.search === 'string' ? resolvedParams.search : ''

  const rawProductId =
    typeof resolvedParams.productId === 'string' ? resolvedParams.productId : ''
  const validProductId = uuidSchema.safeParse(rawProductId).success ? rawProductId : ''

  const rawType = typeof resolvedParams.type === 'string' ? resolvedParams.type : ''
  const validType: MovementType | '' = (MOVEMENT_TYPES as readonly string[]).includes(rawType)
    ? (rawType as MovementType)
    : ''

  const rawDateFrom =
    typeof resolvedParams.dateFrom === 'string' && DATE_PARAM_REGEX.test(resolvedParams.dateFrom)
      ? resolvedParams.dateFrom
      : ''
  const rawDateTo =
    typeof resolvedParams.dateTo === 'string' && DATE_PARAM_REGEX.test(resolvedParams.dateTo)
      ? resolvedParams.dateTo
      : ''

  const rawPage = typeof resolvedParams.page === 'string' ? Number(resolvedParams.page) : 1
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1

  const ctx = {
    userId: session.user.id,
    workspaceId: workspace.id,
    role: workspace.role,
  }

  const [movementsResult, productsResult] = await Promise.all([
    InventoryService.listMovements(ctx, {
      search: search || undefined,
      productId: validProductId || undefined,
      type: validType || undefined,
      dateFrom: rawDateFrom || undefined,
      dateTo: rawDateTo || undefined,
      page,
      pageSize: 20,
    }),
    ProductService.listProducts(ctx, { status: 'all', page: 1, pageSize: 100 }),
  ])

  return (
    <DashboardShell
      workspaceName={workspace.name}
      userName={session.user.name}
      role={workspace.role}
    >
      <MovementsView
        items={movementsResult.items}
        total={movementsResult.total}
        page={movementsResult.page}
        pageSize={movementsResult.pageSize}
        totalPages={movementsResult.totalPages}
        products={productsResult.items.map((p) => ({ id: p.id, name: p.name, sku: p.sku }))}
        initialSearch={search}
        initialProductId={validProductId}
        initialType={validType}
        initialDateFrom={rawDateFrom}
        initialDateTo={rawDateTo}
      />
    </DashboardShell>
  )
}


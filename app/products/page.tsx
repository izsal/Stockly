import type { Metadata } from 'next'
import { DashboardShell } from '@/src/components/app/dashboard-shell'
import { MissingWorkspaceState } from '@/src/components/app/missing-workspace-card'
import { ProductsView } from '@/src/features/products/products-view'
import { hasWorkspacePermission } from '@/src/lib/permissions/workspace'
import { uuidSchema } from '@/src/lib/validation/catalog'
import { parsePageSizeParam } from '@/src/lib/validation/pagination'
import { requireDashboardWorkspace } from '@/src/lib/workspaces/dashboard-auth'
import { CategoryService } from '@/src/services/category.service'
import { InventoryService } from '@/src/services/inventory.service'
import { ProductService } from '@/src/services/product.service'

export const metadata: Metadata = {
  title: 'Produk',
  robots: { index: false, follow: false },
}

export default async function ProductsPage({
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
  const rawCategoryId =
    typeof resolvedParams.categoryId === 'string' ? resolvedParams.categoryId : ''
  const validCategoryId = uuidSchema.safeParse(rawCategoryId).success ? rawCategoryId : ''

  const rawStatus = typeof resolvedParams.status === 'string' ? resolvedParams.status : 'active'
  const status =
    rawStatus === 'archived' || rawStatus === 'all' || rawStatus === 'active'
      ? rawStatus
      : 'active'

  const rawPage = typeof resolvedParams.page === 'string' ? Number(resolvedParams.page) : 1
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1
  const pageSize = parsePageSizeParam(resolvedParams.pageSize, 10)

  const ctx = {
    userId: session.user.id,
    workspaceId: workspace.id,
    role: workspace.role,
  }

  const [productsResult, categoriesResult] = await Promise.all([
    ProductService.listProducts(ctx, {
      search: search || undefined,
      categoryId: validCategoryId || undefined,
      status,
      page,
      pageSize,
    }),
    CategoryService.listCategories(ctx, { page: 1, pageSize: 100 }),
  ])

  const stockByProductId = await InventoryService.listProductStocksMap(
    ctx,
    productsResult.items.map((item) => item.id),
  )

  return (
    <DashboardShell
      workspaceName={workspace.name}
      userName={session.user.name}
      role={workspace.role}
    >
      <ProductsView
        items={productsResult.items}
        stockByProductId={stockByProductId}
        total={productsResult.total}
        page={productsResult.page}
        pageSize={productsResult.pageSize}
        totalPages={productsResult.totalPages}
        categories={categoriesResult.items.map((c) => ({ id: c.id, name: c.name }))}
        initialSearch={search}
        initialCategoryId={validCategoryId}
        initialStatus={status}
        canWrite={hasWorkspacePermission(workspace.role, 'products:write')}
      />
    </DashboardShell>
  )
}


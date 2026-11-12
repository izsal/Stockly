import type { Metadata } from 'next'
import { DashboardShell } from '@/src/components/app/dashboard-shell'
import { MissingWorkspaceState } from '@/src/components/app/missing-workspace-card'
import { StockInForm } from '@/src/features/inventory/stock-in-form'
import { requireDashboardWorkspace } from '@/src/lib/workspaces/dashboard-auth'
import { InventoryService } from '@/src/services/inventory.service'
import { SupplierService } from '@/src/services/supplier.service'

export const metadata: Metadata = {
  title: 'Stok Masuk',
  robots: { index: false, follow: false },
}

export default async function StockInPage() {
  const { session, workspace } = await requireDashboardWorkspace()
  if (!workspace) {
    return <MissingWorkspaceState userName={session.user.name} />
  }

  const ctx = {
    userId: session.user.id,
    workspaceId: workspace.id,
    role: workspace.role,
  }

  const [products, suppliersResult] = await Promise.all([
    InventoryService.listActiveProductsWithStock(ctx),
    SupplierService.listSuppliers(ctx, { page: 1, pageSize: 100 }),
  ])

  return (
    <DashboardShell
      workspaceName={workspace.name}
      userName={session.user.name}
      role={workspace.role}
    >
      <StockInForm
        products={products}
        suppliers={suppliersResult.items.map((s) => ({ id: s.id, name: s.name }))}
      />
    </DashboardShell>
  )
}


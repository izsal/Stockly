import type { Metadata } from 'next'
import { DashboardShell } from '@/src/components/app/dashboard-shell'
import { MissingWorkspaceState } from '@/src/components/app/missing-workspace-card'
import { StockOutForm } from '@/src/features/inventory/stock-out-form'
import { requireDashboardWorkspace } from '@/src/lib/workspaces/dashboard-auth'
import { InventoryService } from '@/src/services/inventory.service'

export const metadata: Metadata = {
  title: 'Stok Keluar',
  robots: { index: false, follow: false },
}

export default async function StockOutPage() {
  const { session, workspace } = await requireDashboardWorkspace()
  if (!workspace) {
    return <MissingWorkspaceState userName={session.user.name} />
  }

  const ctx = {
    userId: session.user.id,
    workspaceId: workspace.id,
    role: workspace.role,
  }

  const products = await InventoryService.listActiveProductsWithStock(ctx)

  return (
    <DashboardShell
      workspaceName={workspace.name}
      userName={session.user.name}
      role={workspace.role}
    >
      <StockOutForm products={products} />
    </DashboardShell>
  )
}


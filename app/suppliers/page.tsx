import type { Metadata } from 'next'
import { DashboardShell } from '@/src/components/app/dashboard-shell'
import { MissingWorkspaceState } from '@/src/components/app/missing-workspace-card'
import { SuppliersView } from '@/src/features/suppliers/suppliers-view'
import { hasWorkspacePermission } from '@/src/lib/permissions/workspace'
import { parsePageSizeParam } from '@/src/lib/validation/pagination'
import { requireDashboardWorkspace } from '@/src/lib/workspaces/dashboard-auth'
import { SupplierService } from '@/src/services/supplier.service'

export const metadata: Metadata = {
  title: 'Supplier',
  robots: { index: false, follow: false },
}

export default async function SuppliersPage({
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
  const rawPage = typeof resolvedParams.page === 'string' ? Number(resolvedParams.page) : 1
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1
  const pageSize = parsePageSizeParam(resolvedParams.pageSize, 10)

  const ctx = {
    userId: session.user.id,
    workspaceId: workspace.id,
    role: workspace.role,
  }

  const result = await SupplierService.listSuppliers(ctx, {
    search: search || undefined,
    page,
    pageSize,
  })

  return (
    <DashboardShell
      workspaceName={workspace.name}
      userName={session.user.name}
      role={workspace.role}
    >
      <SuppliersView
        items={result.items}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        initialSearch={search}
        canWrite={hasWorkspacePermission(workspace.role, 'suppliers:write')}
      />
    </DashboardShell>
  )
}


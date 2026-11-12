import type { Metadata } from 'next'
import { DashboardShell } from '@/src/components/app/dashboard-shell'
import { MissingWorkspaceState } from '@/src/components/app/missing-workspace-card'
import { CategoriesView } from '@/src/features/categories/categories-view'
import { hasWorkspacePermission } from '@/src/lib/permissions/workspace'
import { parsePageSizeParam } from '@/src/lib/validation/pagination'
import { requireDashboardWorkspace } from '@/src/lib/workspaces/dashboard-auth'
import { CategoryService } from '@/src/services/category.service'

export const metadata: Metadata = {
  title: 'Kategori',
  robots: { index: false, follow: false },
}

export default async function CategoriesPage({
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

  const result = await CategoryService.listCategories(ctx, {
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
      <CategoriesView
        items={result.items}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        initialSearch={search}
        canWrite={hasWorkspacePermission(workspace.role, 'categories:write')}
      />
    </DashboardShell>
  )
}


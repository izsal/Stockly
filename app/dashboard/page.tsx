import type { Metadata } from 'next'
import { DashboardShell } from '@/src/components/app/dashboard-shell'
import { MissingWorkspaceState } from '@/src/components/app/missing-workspace-card'
import { DashboardView } from '@/src/features/dashboard/dashboard-view'
import { requireDashboardWorkspace } from '@/src/lib/workspaces/dashboard-auth'
import { ReportService } from '@/src/services/report.service'

export const metadata: Metadata = {
  title: 'Ringkasan',
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

  const ctx = {
    userId: session.user.id,
    workspaceId: workspace.id,
    role: workspace.role,
  }

  const summary = await ReportService.getDashboardSummary(ctx, { dateFrom, dateTo })
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
      />
    </DashboardShell>
  )
}

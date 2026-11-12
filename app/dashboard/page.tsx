import type { Metadata } from 'next'
import { and, eq } from 'drizzle-orm'
import { Building2, ShieldCheck, Warehouse } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
import { DashboardShell } from '@/src/components/app/dashboard-shell'
import { MissingWorkspaceState } from '@/src/components/app/missing-workspace-card'
import { db } from '@/src/db'
import { warehouses } from '@/src/db/schema'
import { requireDashboardWorkspace } from '@/src/lib/workspaces/dashboard-auth'

export const metadata: Metadata = {
  title: 'Ringkasan',
  robots: { index: false, follow: false },
}

export default async function DashboardPage() {
  const { session, workspace } = await requireDashboardWorkspace()

  if (!workspace) {
    return <MissingWorkspaceState userName={session.user.name} />
  }

  const [defaultWarehouse] = await db
    .select({ id: warehouses.id, name: warehouses.name })
    .from(warehouses)
    .where(and(eq(warehouses.workspaceId, workspace.id), eq(warehouses.isDefault, true)))
    .limit(1)

  return (
    <DashboardShell
      workspaceName={workspace.name}
      userName={session.user.name}
      role={workspace.role}
    >
      <section aria-labelledby="dashboard-title">
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-sm font-medium text-primary">Ruang kerja siap</p>
          <h1 id="dashboard-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Selamat datang, {session.user.name}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Fondasi akses dan lokasi penyimpanan untuk bisnis Anda sudah tersusun.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex-row items-center gap-3 px-5 pt-5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground" aria-hidden="true">
                <Building2 className="size-5" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">Ruang kerja</p>
                <h2 className="mt-1 text-base font-semibold">Aktif</h2>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <p className="truncate text-sm text-muted-foreground" title={workspace.name}>{workspace.name}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-3 px-5 pt-5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground" aria-hidden="true">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">Peran akses</p>
                <h2 className="mt-1 text-base font-semibold">
                  {workspace.role === 'OWNER' ? 'Pemilik' : 'Staf'}
                </h2>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <p className="text-sm text-muted-foreground">Akses untuk ruang kerja ini</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-3 px-5 pt-5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground" aria-hidden="true">
                <Warehouse className="size-5" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">Gudang utama</p>
                <h2 className="mt-1 text-base font-semibold">{defaultWarehouse ? 'Siap' : 'Belum tersedia'}</h2>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <p className="truncate text-sm text-muted-foreground" title={defaultWarehouse?.name ?? 'Gudang belum ditetapkan'}>
                {defaultWarehouse?.name ?? 'Gudang belum ditetapkan'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader className="px-5 pt-5 sm:px-6 sm:pt-6">
            <h2 className="text-base font-semibold">Detail ruang kerja</h2>
            <p className="text-sm text-muted-foreground">Informasi dasar yang terhubung dengan akun Anda.</p>
          </CardHeader>
          <CardContent className="grid gap-5 px-5 pb-5 sm:grid-cols-2 sm:px-6 sm:pb-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Nama ruang kerja</p>
              <p className="mt-1.5 break-words text-sm font-medium">{workspace.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email akun</p>
              <p className="mt-1.5 break-all text-sm font-medium">{session.user.email}</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </DashboardShell>
  )
}

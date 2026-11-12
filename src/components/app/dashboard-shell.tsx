import type { ReactNode } from 'react'
import Link from 'next/link'
import { Boxes, LayoutDashboard, Menu } from 'lucide-react'
import { LogoutButton } from './logout-button'

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-ring">
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground" aria-hidden="true">
        <Boxes className="size-[18px]" />
      </span>
      <span className="text-lg font-semibold tracking-tight">Stockly</span>
    </Link>
  )
}

function DashboardNavigation() {
  return (
    <nav aria-label="Navigasi utama" className="flex flex-col gap-1">
      <Link
        href="/dashboard"
        aria-current="page"
        className="flex items-center gap-3 rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        <LayoutDashboard className="size-4" aria-hidden="true" />
        Ringkasan
      </Link>
    </nav>
  )
}

export function DashboardShell({
  children,
  workspaceName,
  userName,
}: {
  children: ReactNode
  workspaceName: string
  userName: string
}) {
  const initials = userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <div className="min-h-svh bg-background lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="hidden border-r border-sidebar-border bg-sidebar px-5 py-6 lg:flex lg:flex-col">
        <Brand />
        <div className="mt-10">
          <p className="mb-3 px-3 text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            MENU
          </p>
          <DashboardNavigation />
        </div>
        <div className="mt-auto rounded-xl border border-border bg-background p-4">
          <p className="text-xs font-medium text-muted-foreground">Ruang kerja</p>
          <p className="mt-1 truncate text-sm font-semibold" title={workspaceName}>{workspaceName}</p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="border-b border-border bg-card/90">
          <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <details className="group relative lg:hidden">
                <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-lg border border-border bg-background text-foreground focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
                  <span className="sr-only">Buka navigasi</span>
                  <Menu className="size-4" aria-hidden="true" />
                </summary>
                <div className="absolute left-0 top-12 z-10 w-56 rounded-xl border border-border bg-card p-3 shadow-lg">
                  <DashboardNavigation />
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="truncate px-3 text-xs text-muted-foreground">{workspaceName}</p>
                  </div>
                </div>
              </details>
              <div className="lg:hidden"><Brand /></div>
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-medium">{workspaceName}</p>
                <p className="text-xs text-muted-foreground">Ruang kerja</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">Akun pemilik</p>
              </div>
              <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground" aria-label={`Inisial ${userName}`}>
                {initials || 'S'}
              </span>
              <LogoutButton />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  )
}

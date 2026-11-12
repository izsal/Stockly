'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { Boxes, Menu, X } from 'lucide-react'
import type { WorkspaceRole } from '@/src/lib/permissions/workspace'
import { DashboardNav } from './dashboard-nav'
import { LogoutButton } from './logout-button'

function Brand() {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-ring"
    >
      <span
        className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"
        aria-hidden="true"
      >
        <Boxes className="size-[18px]" />
      </span>
      <span className="text-lg font-semibold tracking-tight">Stockly</span>
    </Link>
  )
}

export function DashboardShell({
  children,
  workspaceName,
  userName,
  role = 'OWNER',
}: {
  children: ReactNode
  workspaceName: string
  userName: string
  role?: WorkspaceRole
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const initials = userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  const roleLabel = role === 'OWNER' ? 'Akun pemilik' : 'Akun staf'

  return (
    <div className="min-h-svh bg-background lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="hidden border-r border-sidebar-border bg-sidebar px-5 py-6 lg:flex lg:flex-col">
        <Brand />
        <div className="mt-10">
          <DashboardNav />
        </div>
        <div className="mt-auto rounded-xl border border-border bg-background p-4">
          <p className="text-xs font-medium text-muted-foreground">Ruang kerja</p>
          <p className="mt-1 truncate text-sm font-semibold" title={workspaceName}>
            {workspaceName}
          </p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="border-b border-border bg-card/90">
          <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative lg:hidden">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((prev) => !prev)}
                  aria-expanded={mobileMenuOpen}
                  aria-label={mobileMenuOpen ? 'Tutup navigasi' : 'Buka navigasi'}
                  className="flex size-10 items-center justify-center rounded-lg border border-border bg-background text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {mobileMenuOpen ? (
                    <X className="size-4" aria-hidden="true" />
                  ) : (
                    <Menu className="size-4" aria-hidden="true" />
                  )}
                </button>
                {mobileMenuOpen ? (
                  <div className="absolute left-0 top-12 z-30 w-64 rounded-xl border border-border bg-card p-4 shadow-lg">
                    <DashboardNav onNavigate={() => setMobileMenuOpen(false)} />
                    <div className="mt-4 border-t border-border pt-3">
                      <p className="text-xs text-muted-foreground">Ruang kerja</p>
                      <p className="truncate text-sm font-medium">{workspaceName}</p>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="lg:hidden">
                <Brand />
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-medium">{workspaceName}</p>
                <p className="text-xs text-muted-foreground">Ruang kerja</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{roleLabel}</p>
              </div>
              <span
                className="flex size-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
                aria-label={`Inisial ${userName}`}
              >
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

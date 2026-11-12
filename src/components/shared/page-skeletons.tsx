'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Boxes, Building2, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardNav } from '@/src/components/app/dashboard-nav'
import { toggleSidebarCollapsed, useSidebarCollapsed } from '@/src/components/app/sidebar-state'

export function DashboardShellSkeleton({ children }: { children: ReactNode }) {
  const collapsed = useSidebarCollapsed()

  return (
    <div
      className={cn(
        'min-h-svh bg-background lg:grid',
        collapsed
          ? 'lg:grid-cols-[72px_minmax(0,1fr)]'
          : 'lg:grid-cols-[248px_minmax(0,1fr)]',
      )}
    >
      <aside
        className={cn(
          'hidden border-r border-sidebar-border bg-sidebar py-6 lg:flex lg:flex-col',
          collapsed ? 'px-3' : 'px-5',
        )}
      >
        <div className={cn('flex items-center', collapsed ? 'justify-center' : 'justify-between')}>
          <Link
            href="/dashboard"
            className={cn('flex items-center rounded-lg', collapsed ? 'justify-center' : 'gap-3')}
          >
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"
              aria-hidden="true"
            >
              <Boxes className="size-[18px]" />
            </span>
            <span className={cn('text-lg font-semibold tracking-tight', collapsed && 'sr-only')}>
              Stockly
            </span>
          </Link>
        </div>

        <div className="mt-8 flex-1 overflow-y-auto">
          <DashboardNav collapsed={collapsed} />
        </div>

        <div className="mt-6 flex flex-col gap-2">
          {collapsed ? (
            <div className="flex items-center justify-center rounded-xl border border-border bg-background p-2.5 text-muted-foreground">
              <Building2 className="size-4 shrink-0" aria-hidden="true" />
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-xs font-medium text-muted-foreground">Ruang kerja</p>
              <Skeleton className="mt-1.5 h-4 w-28" />
            </div>
          )}

          <button
            type="button"
            onClick={toggleSidebarCollapsed}
            aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
            className={cn(
              'flex items-center rounded-lg py-2 text-xs font-medium text-muted-foreground',
              collapsed ? 'justify-center px-2' : 'gap-2.5 px-3',
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4 shrink-0" aria-hidden="true" />
            ) : (
              <>
                <PanelLeftClose className="size-4 shrink-0" aria-hidden="true" />
                <span>Sembunyikan label</span>
              </>
            )}
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="border-b border-border bg-card/90">
          <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground lg:hidden">
                <Menu className="size-4" aria-hidden="true" />
              </div>
              <div className="hidden space-y-1.5 sm:block">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <div className="hidden space-y-1.5 sm:block">
                <Skeleton className="ml-auto h-4 w-28" />
                <Skeleton className="ml-auto h-3 w-20" />
              </div>
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="h-8 w-20" />
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

function PageHeaderSkeleton({
  hasAction = true,
  titleWidth = 'w-40',
  descriptionWidth = 'w-80',
}: {
  hasAction?: boolean
  titleWidth?: string
  descriptionWidth?: string
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <Skeleton className={cn('h-8', titleWidth)} />
        <Skeleton className={cn('h-4 max-w-full', descriptionWidth)} />
      </div>
      {hasAction ? <Skeleton className="h-9 w-36 shrink-0" /> : null}
    </div>
  )
}

function PaginationSkeleton() {
  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <Skeleton className="h-4 w-48" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-24" />
      </div>
    </div>
  )
}

export function DashboardLoadingSkeleton() {
  return (
    <DashboardShellSkeleton>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-72 max-w-full" />
            <Skeleton className="h-5 w-96 max-w-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <Card key={index}>
              <CardHeader className="flex-row items-center gap-3 px-5 pt-5">
                <Skeleton className="size-10 shrink-0 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-7 w-16" />
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <Skeleton className="h-3.5 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-36" />
              <Skeleton className="h-9 w-36" />
              <Skeleton className="h-9 w-24" />
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {[0, 1].map((col) => (
            <Card key={col}>
              <CardHeader className="px-5 pt-5">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
              </CardHeader>
              <CardContent className="space-y-3 px-5 pb-5">
                {[0, 1, 2, 3].map((row) => (
                  <Skeleton key={row} className="h-12 w-full rounded-lg" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardShellSkeleton>
  )
}

export function ReportsLoadingSkeleton() {
  return (
    <DashboardShellSkeleton>
      <div>
        <PageHeaderSkeleton titleWidth="w-36" descriptionWidth="w-96" />

        <div className="mb-6 flex flex-wrap gap-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-40" />
        </div>

        <Card className="mb-6">
          <CardContent className="flex flex-col gap-3 p-4 lg:flex-row">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 w-44" />
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-9 w-24" />
          </CardContent>
        </Card>

        <Card>
          <div className="overflow-x-auto">
            <div className="min-w-[780px] divide-y divide-border">
              <div className="grid grid-cols-[1fr_1.8fr_1.2fr_1fr_1fr_1fr] gap-4 px-4 py-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              {[0, 1, 2, 3, 4, 5].map((row) => (
                <div
                  key={row}
                  className="grid grid-cols-[1fr_1.8fr_1.2fr_1fr_1fr_1fr] items-center gap-4 px-4 py-3.5"
                >
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>
          <PaginationSkeleton />
        </Card>
      </div>
    </DashboardShellSkeleton>
  )
}

export function CategoriesLoadingSkeleton() {
  return (
    <DashboardShellSkeleton>
      <div>
        <PageHeaderSkeleton titleWidth="w-32" descriptionWidth="w-96" />

        <Card className="mb-6">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 w-20" />
          </CardContent>
        </Card>

        <Card>
          <div className="divide-y divide-border">
            <div className="grid grid-cols-[1.2fr_2fr_140px] gap-4 px-4 py-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="ml-auto h-4 w-12" />
            </div>
            {[0, 1, 2, 3, 4].map((row) => (
              <div
                key={row}
                className="grid grid-cols-[1.2fr_2fr_140px] items-center gap-4 px-4 py-3.5"
              >
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-64 max-w-full" />
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-7 w-14" />
                  <Skeleton className="h-7 w-16" />
                </div>
              </div>
            ))}
          </div>
          <PaginationSkeleton />
        </Card>
      </div>
    </DashboardShellSkeleton>
  )
}

export function ProductsLoadingSkeleton() {
  return (
    <DashboardShellSkeleton>
      <div>
        <PageHeaderSkeleton titleWidth="w-28" descriptionWidth="w-96" />

        <Card className="mb-6">
          <CardContent className="flex flex-col gap-3 p-4 lg:flex-row">
            <Skeleton className="h-9 flex-1" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex">
              <Skeleton className="h-9 w-full lg:w-48" />
              <Skeleton className="h-9 w-full lg:w-40" />
            </div>
            <Skeleton className="h-9 w-20" />
          </CardContent>
        </Card>

        <Card>
          <div className="overflow-x-auto">
            <div className="min-w-[820px] divide-y divide-border">
              <div className="grid grid-cols-[2fr_1fr_1.1fr_0.9fr_0.9fr_1fr_1fr_0.8fr_130px] gap-3 px-4 py-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-14" />
                <Skeleton className="ml-auto h-4 w-10" />
              </div>
              {[0, 1, 2, 3, 4].map((row) => (
                <div
                  key={row}
                  className="grid grid-cols-[2fr_1fr_1.1fr_0.9fr_0.9fr_1fr_1fr_0.8fr_130px] items-center gap-3 px-4 py-3.5"
                >
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <div className="flex justify-end gap-1.5">
                    <Skeleton className="h-7 w-14" />
                    <Skeleton className="h-7 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <PaginationSkeleton />
        </Card>
      </div>
    </DashboardShellSkeleton>
  )
}

export function SuppliersLoadingSkeleton() {
  return (
    <DashboardShellSkeleton>
      <div>
        <PageHeaderSkeleton titleWidth="w-32" descriptionWidth="w-96" />

        <Card className="mb-6">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 w-20" />
          </CardContent>
        </Card>

        <Card>
          <div className="overflow-x-auto">
            <div className="min-w-[680px] divide-y divide-border">
              <div className="grid grid-cols-[1.5fr_1.5fr_1.8fr_1.2fr_130px] gap-4 px-4 py-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="ml-auto h-4 w-10" />
              </div>
              {[0, 1, 2, 3, 4].map((row) => (
                <div
                  key={row}
                  className="grid grid-cols-[1.5fr_1.5fr_1.8fr_1.2fr_130px] items-center gap-4 px-4 py-3.5"
                >
                  <Skeleton className="h-4 w-40" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-4 w-28" />
                  <div className="flex justify-end gap-1.5">
                    <Skeleton className="h-7 w-14" />
                    <Skeleton className="h-7 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <PaginationSkeleton />
        </Card>
      </div>
    </DashboardShellSkeleton>
  )
}

export function InventoryFormLoadingSkeleton() {
  return (
    <DashboardShellSkeleton>
      <div>
        <PageHeaderSkeleton titleWidth="w-48" descriptionWidth="w-96" />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-40" />
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader className="space-y-2 px-5 pt-5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4 px-5 pb-5">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-4 w-36" />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShellSkeleton>
  )
}

export function MovementsLoadingSkeleton() {
  return (
    <DashboardShellSkeleton>
      <div>
        <PageHeaderSkeleton titleWidth="w-40" descriptionWidth="w-96" hasAction={false} />

        <Card className="mb-6">
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_auto_auto_auto]">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-20" />
          </CardContent>
        </Card>

        <Card>
          <div className="overflow-x-auto">
            <div className="min-w-[820px] divide-y divide-border">
              <div className="grid grid-cols-[1.1fr_1.6fr_0.8fr_0.8fr_1.1fr_1.3fr_1fr] gap-3 px-4 py-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-16" />
              </div>
              {[0, 1, 2, 3, 4, 5].map((row) => (
                <div
                  key={row}
                  className="grid grid-cols-[1.1fr_1.6fr_0.8fr_0.8fr_1.1fr_1.3fr_1fr] items-center gap-3 px-4 py-3.5"
                >
                  <Skeleton className="h-4 w-28" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
          <PaginationSkeleton />
        </Card>
      </div>
    </DashboardShellSkeleton>
  )
}


'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  ClipboardCheck,
  History,
  LayoutDashboard,
  Package,
  PackageMinus,
  PackagePlus,
  Tags,
  Truck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_GROUPS = [
  {
    label: 'DASHBOARD',
    items: [
      {
        href: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: 'INVENTARIS',
    items: [
      {
        href: '/products',
        label: 'Produk',
        icon: Package,
      },
      {
        href: '/categories',
        label: 'Kategori',
        icon: Tags,
      },
      {
        href: '/inventory/stock-in',
        label: 'Stok Masuk',
        icon: PackagePlus,
      },
      {
        href: '/inventory/stock-out',
        label: 'Stok Keluar',
        icon: PackageMinus,
      },
      {
        href: '/inventory/adjustment',
        label: 'Penyesuaian Stok',
        icon: ClipboardCheck,
      },
      {
        href: '/movements',
        label: 'Riwayat Stok',
        icon: History,
      },
    ],
  },
  {
    label: 'RELASI',
    items: [
      {
        href: '/suppliers',
        label: 'Supplier',
        icon: Truck,
      },
    ],
  },
  {
    label: 'LAPORAN',
    items: [
      {
        href: '/reports',
        label: 'Laporan',
        icon: BarChart3,
      },
    ],
  },
] as const

export function DashboardNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()

  return (
    <nav aria-label="Navigasi utama" className={cn('flex flex-col', collapsed ? 'gap-4' : 'gap-6')}>
      {NAV_GROUPS.map((group, groupIndex) => (
        <div key={group.label}>
          {collapsed ? (
            groupIndex > 0 ? (
              <div className="mx-auto mb-3 h-px w-6 bg-sidebar-border" aria-hidden="true" />
            ) : null
          ) : (
            <p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              {group.label}
            </p>
          )}
          <div className="flex flex-col gap-1">
            {group.items.map((item) => {
              const Icon = item.icon
              const active =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring',
                    collapsed ? 'justify-center px-2' : 'gap-3 px-3',
                    active
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className={cn('truncate', collapsed && 'sr-only')}>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}

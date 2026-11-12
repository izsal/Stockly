'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Boxes,
  CalendarRange,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  History,
  Package,
  PackageMinus,
  PackagePlus,
  PackageX,
  Warehouse,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatRupiah } from '@/src/lib/format'
import type { MovementType } from '@/src/lib/validation/inventory'
import { getDefaultDateRange } from '@/src/lib/validation/reports'

type DashboardSummaryData = {
  defaultWarehouse: { id: string; name: string } | null
  dateRange: { dateFrom: string; dateTo: string }
  kpis: {
    totalActiveProducts: number
    totalStockUnits: number
    totalInventoryValue: number
    lowStockProducts: number
    outOfStockProducts: number
  }
  movementSummary: {
    totalMovements: number
    stockInCount: number
    stockInUnits: number
    stockOutCount: number
    stockOutUnits: number
    adjustmentCount: number
    netDelta: number
  }
  recentMovements: Array<{
    id: string
    productId: string
    productName: string | null
    productSku: string | null
    productUnit: string | null
    actorName: string | null
    type: MovementType
    quantityDelta: number
    quantityBefore: number
    quantityAfter: number
    reason: string | null
    createdAt: Date | string
  }>
  attentionProducts: Array<{
    id: string
    name: string
    sku: string
    unit: string
    minimumStock: number
    currentStock: number
    status: 'OUT' | 'LOW' | 'NORMAL'
  }>
}

function formatShortDateTime(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatNumberId(value: number) {
  return new Intl.NumberFormat('id-ID').format(value)
}

export function DashboardView({
  userName,
  workspaceName,
  roleLabel,
  summary,
}: {
  userName: string
  workspaceName: string
  roleLabel: string
  summary: DashboardSummaryData
}) {
  const router = useRouter()
  const [dateFrom, setDateFrom] = useState(summary.dateRange.dateFrom)
  const [dateTo, setDateTo] = useState(summary.dateRange.dateTo)
  const [checklistDismissed, setChecklistDismissed] = useState(false)

  function applyRange(nextFrom: string, nextTo: string) {
    setDateFrom(nextFrom)
    setDateTo(nextTo)
    const params = new URLSearchParams()
    if (nextFrom) params.set('dateFrom', nextFrom)
    if (nextTo) params.set('dateTo', nextTo)
    const qs = params.toString()
    router.push(qs ? `/dashboard?${qs}` : '/dashboard')
  }

  function handleRangeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    applyRange(dateFrom, dateTo)
  }

  function applyPreset(days: number) {
    const range = getDefaultDateRange(days)
    applyRange(range.dateFrom, range.dateTo)
  }

  const { kpis, movementSummary, recentMovements, attentionProducts, defaultWarehouse } = summary
  const hasProducts = kpis.totalActiveProducts > 0
  const hasMovements = movementSummary.totalMovements > 0 || recentMovements.length > 0
  const showOnboardingChecklist = !checklistDismissed && (!hasProducts || !hasMovements)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-primary">Ringkasan operasional</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Selamat datang, {userName}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Pantau kondisi stok ruang kerja <span className="font-medium text-foreground">{workspaceName}</span>{' '}
            ({roleLabel}) dan ringkasan pergerakan barang.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/inventory/stock-in"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <PackagePlus className="size-4" aria-hidden="true" />
            Stok Masuk
          </Link>
          <Link
            href="/inventory/stock-out"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <PackageMinus className="size-4" aria-hidden="true" />
            Stok Keluar
          </Link>
          <Link
            href="/reports"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <BarChart3 className="size-4" aria-hidden="true" />
            Laporan
          </Link>
        </div>
      </div>

      {showOnboardingChecklist ? (
        <Card className="border-primary/25 bg-primary/[0.03]">
          <CardHeader className="flex-row items-start justify-between gap-4 px-5 pt-5 pb-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
                Panduan Memulai Usaha Baru
              </p>
              <h2 className="mt-1 text-base font-semibold">
                Siapkan operasional stok toko Anda dalam 4 langkah
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setChecklistDismissed(true)}
              aria-label="Sembunyikan panduan memulai"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </CardHeader>
          <CardContent className="grid gap-3 px-5 pb-5 sm:grid-cols-2 xl:grid-cols-4">
            <Link
              href="/categories"
              className="flex items-start gap-2.5 rounded-lg border border-border bg-background p-3 text-sm transition-colors hover:border-primary/40"
            >
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="font-medium">1. Siapkan kategori & supplier</p>
                <p className="text-xs text-muted-foreground">Kelompokkan produk dan relasi pemasok.</p>
              </div>
            </Link>
            <Link
              href="/products"
              className="flex items-start gap-2.5 rounded-lg border border-border bg-background p-3 text-sm transition-colors hover:border-primary/40"
            >
              {hasProducts ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              ) : (
                <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              )}
              <div>
                <p className="font-medium">2. Tambah produk pertama</p>
                <p className="text-xs text-muted-foreground">
                  {hasProducts ? 'Produk aktif sudah tersedia.' : 'Isi SKU, harga, dan stok minimum.'}
                </p>
              </div>
            </Link>
            <Link
              href="/inventory/stock-in"
              className="flex items-start gap-2.5 rounded-lg border border-border bg-background p-3 text-sm transition-colors hover:border-primary/40"
            >
              {hasMovements ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              ) : (
                <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              )}
              <div>
                <p className="font-medium">3. Catat stok masuk awal</p>
                <p className="text-xs text-muted-foreground">
                  {hasMovements ? 'Mutasi stok awal sudah tercatat.' : 'Tambahkan saldo awal via Stok Masuk.'}
                </p>
              </div>
            </Link>
            <Link
              href="/reports"
              className="flex items-start gap-2.5 rounded-lg border border-border bg-background p-3 text-sm transition-colors hover:border-primary/40"
            >
              <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div>
                <p className="font-medium">4. Cek laporan & ekspor CSV</p>
                <p className="text-xs text-muted-foreground">Pantau stok menipis dan unduh laporan.</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex-row items-center gap-3 px-5 pt-5">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"
              aria-hidden="true"
            >
              <Package className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Produk Aktif</p>
              <p className="mt-0.5 text-2xl font-semibold tracking-tight">
                {formatNumberId(kpis.totalActiveProducts)}
              </p>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <Link
              href="/products"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Lihat katalog produk
              <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-3 px-5 pt-5">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"
              aria-hidden="true"
            >
              <Boxes className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Total Unit Stok</p>
              <p className="mt-0.5 text-2xl font-semibold tracking-tight">
                {formatNumberId(kpis.totalStockUnits)}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-1 px-5 pb-5">
            <p className="text-xs font-medium text-foreground">
              Nilai aset: {formatRupiah(kpis.totalInventoryValue)}
            </p>
            <p className="text-xs text-muted-foreground">
              Total unit produk aktif ({defaultWarehouse?.name ?? 'Gudang Utama'})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-3 px-5 pt-5">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700"
              aria-hidden="true"
            >
              <AlertTriangle className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Produk Stok Menipis</p>
              <p className="mt-0.5 text-2xl font-semibold tracking-tight">
                {formatNumberId(kpis.lowStockProducts)}
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-2 px-5 pb-5">
            <p className="text-xs text-muted-foreground">Stok ≤ stok minimum</p>
            <Link
              href="/reports?tab=low-stock"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Laporan
              <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-3 px-5 pt-5">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700"
              aria-hidden="true"
            >
              <PackageX className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Produk Stok Habis</p>
              <p className="mt-0.5 text-2xl font-semibold tracking-tight">
                {formatNumberId(kpis.outOfStockProducts)}
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-2 px-5 pb-5">
            <p className="text-xs text-muted-foreground">Stok = 0 unit</p>
            <Link
              href="/reports?tab=current-stock&stockStatus=out"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Periksa
              <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 px-5 pt-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarRange className="size-4 text-primary" aria-hidden="true" />
              <h2 className="text-base font-semibold">Ringkasan Pergerakan Stok</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Periode: <span className="font-medium text-foreground">{summary.dateRange.dateFrom}</span>{' '}
              s/d <span className="font-medium text-foreground">{summary.dateRange.dateTo}</span>{' '}
              (WIB / UTC+7)
            </p>
          </div>

          <form onSubmit={handleRangeSubmit} className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1">
              <Button type="button" variant="outline" size="sm" onClick={() => applyPreset(1)}>
                Hari ini
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => applyPreset(7)}>
                7 hari
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => applyPreset(30)}>
                30 hari
              </Button>
            </div>
            <Input
              type="date"
              aria-label="Dari tanggal"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-8 w-36 text-xs"
            />
            <span className="text-xs text-muted-foreground">s/d</span>
            <Input
              type="date"
              aria-label="Sampai tanggal"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-8 w-36 text-xs"
            />
            <Button type="submit" variant="secondary" size="sm">
              Terapkan
            </Button>
          </form>
        </CardHeader>

        <CardContent className="grid gap-4 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs font-medium text-muted-foreground">Total Transaksi</p>
            <p className="mt-1 text-xl font-semibold">
              {formatNumberId(movementSummary.totalMovements)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Selisih bersih: {movementSummary.netDelta > 0 ? `+${movementSummary.netDelta}` : movementSummary.netDelta}{' '}
              unit
            </p>
          </div>

          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4">
            <p className="text-xs font-medium text-emerald-800">Stok Masuk</p>
            <p className="mt-1 text-xl font-semibold text-emerald-700">
              +{formatNumberId(movementSummary.stockInUnits)} unit
            </p>
            <p className="mt-1 text-xs text-emerald-700/80">
              {formatNumberId(movementSummary.stockInCount)} transaksi masuk
            </p>
          </div>

          <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4">
            <p className="text-xs font-medium text-amber-800">Stok Keluar</p>
            <p className="mt-1 text-xl font-semibold text-amber-700">
              -{formatNumberId(movementSummary.stockOutUnits)} unit
            </p>
            <p className="mt-1 text-xs text-amber-700/80">
              {formatNumberId(movementSummary.stockOutCount)} transaksi keluar
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-medium text-muted-foreground">Penyesuaian Stok</p>
            <p className="mt-1 text-xl font-semibold">
              {formatNumberId(movementSummary.adjustmentCount)}
            </p>
            <Link
              href={`/reports?tab=movements&dateFrom=${summary.dateRange.dateFrom}&dateTo=${summary.dateRange.dateTo}`}
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Lihat detail periode
              <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4 px-5 pt-5">
            <div>
              <h2 className="text-base font-semibold">Pergerakan Stok Terbaru</h2>
              <p className="text-xs text-muted-foreground">
                6 transaksi terakhir di ruang kerja ini.
              </p>
            </div>
            <Link
              href="/movements"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Semua riwayat
              <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {recentMovements.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-4 py-8 text-center">
                <History className="size-5 text-muted-foreground" aria-hidden="true" />
                <p className="mt-2 text-sm font-medium">Belum ada pergerakan stok</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Catat stok masuk pertama untuk mulai memantau mutasi inventaris.
                </p>
                <Link
                  href="/inventory/stock-in"
                  className="mt-3 inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground"
                >
                  Catat Stok Masuk
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentMovements.map((item) => {
                  const unit = item.productUnit ?? 'pcs'
                  const deltaLabel =
                    item.quantityDelta > 0
                      ? `+${item.quantityDelta}`
                      : String(item.quantityDelta)

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {item.type === 'IN' ? (
                            <Badge variant="success">
                              <ArrowUpRight className="size-3" aria-hidden="true" />
                              Masuk
                            </Badge>
                          ) : item.type === 'OUT' ? (
                            <Badge variant="warning">
                              <ArrowDownRight className="size-3" aria-hidden="true" />
                              Keluar
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <ClipboardCheck className="size-3" aria-hidden="true" />
                              Opname
                            </Badge>
                          )}
                          <p className="truncate text-sm font-medium">
                            {item.productName ?? 'Produk'}
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatShortDateTime(item.createdAt)} · {item.actorName ?? 'Pengguna'}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p
                          className={
                            item.quantityDelta > 0
                              ? 'text-sm font-semibold text-emerald-700'
                              : 'text-sm font-semibold text-amber-700'
                          }
                        >
                          {deltaLabel} {unit}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Saldo: {item.quantityAfter} {unit}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4 px-5 pt-5">
            <div>
              <h2 className="text-base font-semibold">Perlu Perhatian Stok</h2>
              <p className="text-xs text-muted-foreground">
                Produk dengan stok saat ini ≤ stok minimum.
              </p>
            </div>
            <Link
              href="/reports?tab=low-stock"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Laporan stok menipis
              <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {attentionProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-4 py-8 text-center">
                <Warehouse className="size-5 text-emerald-600" aria-hidden="true" />
                <p className="mt-2 text-sm font-medium">Semua stok produk aman</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tidak ada produk aktif yang berada di bawah batas stok minimum.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {attentionProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {product.sku} · Min: {product.minimumStock} {product.unit}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={product.status === 'OUT' ? 'destructive' : 'warning'}>
                        {product.status === 'OUT' ? 'Habis' : 'Menipis'} ({product.currentStock}{' '}
                        {product.unit})
                      </Badge>
                      <Link
                        href={`/inventory/stock-in?productId=${product.id}`}
                        className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2 text-xs font-medium text-primary transition-colors hover:bg-muted"
                      >
                        <PackagePlus className="size-3" aria-hidden="true" />
                        Isi stok
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


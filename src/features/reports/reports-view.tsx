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
  CalendarRange,
  ClipboardCheck,
  Download,
  Package,
  Search,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ModernSelect } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/src/components/shared/empty-state'
import { PageHeader } from '@/src/components/shared/page-header'
import { TablePagination } from '@/src/components/shared/table-pagination'
import { formatRupiah } from '@/src/lib/format'
import {
  STOCK_OUT_REASON_LABELS,
  type MovementType,
  type StockOutReason,
} from '@/src/lib/validation/inventory'
import type { ReportTab, StockStatusFilter } from '@/src/lib/validation/reports'

export type CurrentStockReportItem = {
  id: string
  name: string
  sku: string
  barcode: string | null
  categoryName: string | null
  unit: string
  minimumStock: number
  currentStock: number
  costPrice: string
  sellingPrice: string
  status: 'OUT' | 'LOW' | 'NORMAL'
}

export type LowStockReportItem = {
  id: string
  name: string
  sku: string
  categoryName: string | null
  unit: string
  minimumStock: number
  currentStock: number
  deficit: number
  status: 'OUT' | 'LOW' | 'NORMAL'
}

export type MovementReportItem = {
  id: string
  productId: string
  productName: string | null
  productSku: string | null
  productUnit: string | null
  supplierName: string | null
  actorName: string | null
  type: MovementType
  quantityDelta: number
  quantityBefore: number
  quantityAfter: number
  reason: string | null
  referenceNumber: string | null
  notes: string | null
  createdAt: Date | string
}

type CategoryOption = { id: string; name: string }
type ProductOption = { id: string; name: string; sku: string }

function formatDateTime(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatReasonLabel(type: MovementType, reason: string | null) {
  if (!reason) return null
  if (type === 'IN' && reason === 'PURCHASE') return 'Penerimaan / Pembelian'
  if (type === 'IN' && reason === 'OPENING_BALANCE') return 'Saldo Awal'
  if (type === 'OUT' && reason in STOCK_OUT_REASON_LABELS) {
    return STOCK_OUT_REASON_LABELS[reason as StockOutReason]
  }
  return reason
}

function StockStatusBadge({ status }: { status: 'OUT' | 'LOW' | 'NORMAL' }) {
  if (status === 'OUT') {
    return <Badge variant="destructive">Habis</Badge>
  }
  if (status === 'LOW') {
    return <Badge variant="warning">Menipis</Badge>
  }
  return <Badge variant="success">Normal</Badge>
}

export function ReportsView({
  tab,
  categories,
  products,
  initialSearch,
  initialCategoryId,
  initialStockStatus,
  initialProductId,
  initialType,
  initialDateFrom,
  initialDateTo,
  currentStockData,
  lowStockData,
  movementData,
}: {
  tab: ReportTab
  categories: CategoryOption[]
  products: ProductOption[]
  initialSearch: string
  initialCategoryId: string
  initialStockStatus: StockStatusFilter
  initialProductId: string
  initialType: MovementType | ''
  initialDateFrom: string
  initialDateTo: string
  currentStockData: {
    items: CurrentStockReportItem[]
    totalUnits: number
    total: number
    page: number
    pageSize: number
    totalPages: number
  } | null
  lowStockData: {
    items: LowStockReportItem[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  } | null
  movementData: {
    dateRange: { dateFrom: string; dateTo: string }
    summary: {
      totalMovements: number
      stockInUnits: number
      stockOutUnits: number
      adjustmentNetDelta: number
      netDelta: number
    }
    items: MovementReportItem[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  } | null
}) {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState(initialSearch)

  function buildQueryParams(
    overrides: Partial<{
      tab: ReportTab
      search: string
      categoryId: string
      stockStatus: StockStatusFilter
      productId: string
      type: MovementType | ''
      dateFrom: string
      dateTo: string
      page: number
    }> = {},
  ) {
    const nextTab = overrides.tab ?? tab
    const params = new URLSearchParams()
    params.set('tab', nextTab)

    const searchVal = (overrides.search ?? initialSearch).trim()
    if (searchVal) params.set('search', searchVal)

    if (nextTab === 'current-stock' || nextTab === 'low-stock') {
      const catVal = overrides.categoryId ?? initialCategoryId
      if (catVal) params.set('categoryId', catVal)
    }

    if (nextTab === 'current-stock') {
      const statusVal = overrides.stockStatus ?? initialStockStatus
      if (statusVal && statusVal !== 'all') params.set('stockStatus', statusVal)
    }

    if (nextTab === 'movements') {
      const productVal = overrides.productId ?? initialProductId
      const typeVal = overrides.type ?? initialType
      const fromVal = overrides.dateFrom ?? initialDateFrom
      const toVal = overrides.dateTo ?? initialDateTo
      if (productVal) params.set('productId', productVal)
      if (typeVal) params.set('type', typeVal)
      if (fromVal) params.set('dateFrom', fromVal)
      if (toVal) params.set('dateTo', toVal)
    }

    const pageVal = overrides.page ?? 1
    if (pageVal > 1) params.set('page', String(pageVal))

    return params.toString()
  }

  function navigateWith(overrides: Parameters<typeof buildQueryParams>[0]) {
    router.push(`/reports?${buildQueryParams(overrides)}`)
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigateWith({ search: searchInput, page: 1 })
  }

  function handleResetFilters() {
    setSearchInput('')
    router.push(`/reports?tab=${tab}`)
  }

  function buildExportHref() {
    const params = new URLSearchParams()
    params.set('report', tab)
    if (initialSearch.trim()) params.set('search', initialSearch.trim())

    if (tab === 'current-stock' || tab === 'low-stock') {
      if (initialCategoryId) params.set('categoryId', initialCategoryId)
    }
    if (tab === 'current-stock' && initialStockStatus !== 'all') {
      params.set('stockStatus', initialStockStatus)
    }
    if (tab === 'movements') {
      if (initialProductId) params.set('productId', initialProductId)
      if (initialType) params.set('type', initialType)
      if (initialDateFrom) params.set('dateFrom', initialDateFrom)
      if (initialDateTo) params.set('dateTo', initialDateTo)
    }

    return `/api/reports/export?${params.toString()}`
  }

  const hasFilters = Boolean(
    initialSearch.trim() ||
      (tab !== 'movements' && initialCategoryId) ||
      (tab === 'current-stock' && initialStockStatus !== 'all') ||
      (tab === 'movements' && (initialProductId || initialType || initialDateFrom || initialDateTo)),
  )

  return (
    <div>
      <PageHeader
        title="Laporan"
        description="Analisis stok saat ini, produk menipis, pergerakan periode tertentu, dan ekspor CSV."
        action={
          <a
            href={buildExportHref()}
            download
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Download className="size-4" aria-hidden="true" />
            Ekspor CSV
          </a>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Jenis laporan">
        <Link
          href="/reports?tab=current-stock"
          role="tab"
          aria-selected={tab === 'current-stock'}
          className={
            tab === 'current-stock'
              ? 'inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground'
              : 'inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground'
          }
        >
          <Package className="size-4" aria-hidden="true" />
          Stok Saat Ini
        </Link>
        <Link
          href="/reports?tab=low-stock"
          role="tab"
          aria-selected={tab === 'low-stock'}
          className={
            tab === 'low-stock'
              ? 'inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground'
              : 'inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground'
          }
        >
          <AlertTriangle className="size-4" aria-hidden="true" />
          Stok Menipis
        </Link>
        <Link
          href="/reports?tab=movements"
          role="tab"
          aria-selected={tab === 'movements'}
          className={
            tab === 'movements'
              ? 'inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground'
              : 'inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground'
          }
        >
          <BarChart3 className="size-4" aria-hidden="true" />
          Pergerakan Stok
        </Link>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          {tab === 'movements' ? (
            <form
              onSubmit={handleSearchSubmit}
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto_auto_auto]"
            >
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Cari produk, SKU, atau no. referensi…"
                  aria-label="Cari laporan pergerakan"
                  className="h-9 pl-9"
                />
              </div>

              <ModernSelect
                ariaLabel="Filter tipe pergerakan"
                value={initialType}
                onValueChange={(nextValue) =>
                  navigateWith({ type: nextValue as MovementType | '', page: 1 })
                }
                options={[
                  { value: '', label: 'Semua tipe' },
                  { value: 'IN', label: 'Stok Masuk' },
                  { value: 'OUT', label: 'Stok Keluar' },
                  { value: 'ADJUSTMENT', label: 'Penyesuaian' },
                ]}
                className="w-full min-w-0"
              />

              <ModernSelect
                ariaLabel="Filter produk"
                value={initialProductId}
                onValueChange={(nextValue) => navigateWith({ productId: nextValue, page: 1 })}
                options={[
                  { value: '', label: 'Semua produk' },
                  ...products.map((product) => ({
                    value: product.id,
                    label: `${product.name} (${product.sku})`,
                  })),
                ]}
                className="w-full min-w-0"
              />

              <Input
                type="date"
                aria-label="Dari tanggal"
                value={movementData?.dateRange.dateFrom ?? initialDateFrom}
                onChange={(e) => navigateWith({ dateFrom: e.target.value, page: 1 })}
                className="h-9 lg:w-36"
              />

              <Input
                type="date"
                aria-label="Sampai tanggal"
                value={movementData?.dateRange.dateTo ?? initialDateTo}
                onChange={(e) => navigateWith({ dateTo: e.target.value, page: 1 })}
                className="h-9 lg:w-36"
              />

              <div className="flex gap-2">
                <Button type="submit" variant="secondary" size="lg">
                  Cari
                </Button>
                {hasFilters ? (
                  <Button type="button" variant="outline" size="lg" onClick={handleResetFilters}>
                    <X data-icon="inline-start" />
                    Reset
                  </Button>
                ) : null}
              </div>
            </form>
          ) : (
            <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Cari nama produk, SKU, atau barcode…"
                  aria-label="Cari produk dalam laporan"
                  className="h-9 pl-9"
                />
              </div>

              <ModernSelect
                ariaLabel="Filter kategori"
                value={initialCategoryId}
                onValueChange={(nextValue) => navigateWith({ categoryId: nextValue, page: 1 })}
                options={[
                  { value: '', label: 'Semua kategori' },
                  ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
                ]}
                className="w-full min-w-0 lg:w-48"
              />

              {tab === 'current-stock' ? (
                <ModernSelect
                  ariaLabel="Filter status stok"
                  value={initialStockStatus}
                  onValueChange={(nextValue) =>
                    navigateWith({
                      stockStatus: nextValue as StockStatusFilter,
                      page: 1,
                    })
                  }
                  options={[
                    { value: 'all', label: 'Semua status stok' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'low', label: 'Menipis (≤ min.)' },
                    { value: 'out', label: 'Habis (= 0)' },
                  ]}
                  className="w-full min-w-0 lg:w-40"
                />
              ) : null}

              <div className="flex gap-2">
                <Button type="submit" variant="secondary" size="lg">
                  Cari
                </Button>
                {hasFilters ? (
                  <Button type="button" variant="outline" size="lg" onClick={handleResetFilters}>
                    <X data-icon="inline-start" />
                    Reset
                  </Button>
                ) : null}
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {tab === 'current-stock' && currentStockData ? (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <p>
              Menampilkan{' '}
              <span className="font-semibold text-foreground">{currentStockData.total}</span> produk
              aktif dengan total{' '}
              <span className="font-semibold text-foreground">
                {new Intl.NumberFormat('id-ID').format(currentStockData.totalUnits)}
              </span>{' '}
              unit stok.
            </p>
          </div>

          {currentStockData.items.length === 0 ? (
            <EmptyState
              icon={<Package className="size-6" />}
              title="Data stok tidak ditemukan"
              description="Tidak ada produk aktif yang sesuai dengan filter laporan."
              action={
                hasFilters ? (
                  <Button type="button" variant="outline" onClick={handleResetFilters}>
                    Reset Filter
                  </Button>
                ) : null
              }
            />
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Stok Saat Ini</TableHead>
                    <TableHead>Stok Min.</TableHead>
                    <TableHead>Harga Jual</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentStockData.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs font-medium">{item.sku}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.categoryName ?? 'Tanpa kategori'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-semibold">
                        {item.currentStock} {item.unit}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {item.minimumStock} {item.unit}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatRupiah(item.sellingPrice)}
                      </TableCell>
                      <TableCell>
                        <StockStatusBadge status={item.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <TablePagination
                page={currentStockData.page}
                totalPages={currentStockData.totalPages}
                total={currentStockData.total}
                pageSize={currentStockData.pageSize}
                onPageChange={(nextPage) => navigateWith({ page: nextPage })}
              />
            </Card>
          )}
        </>
      ) : null}

      {tab === 'low-stock' && lowStockData ? (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            Definisi stok menipis: produk aktif dengan stok saat ini ≤ stok minimum (termasuk stok
            habis = 0).
          </p>

          {lowStockData.items.length === 0 ? (
            <EmptyState
              icon={<AlertTriangle className="size-6" />}
              title={hasFilters ? 'Data stok menipis tidak ditemukan' : 'Tidak ada produk menipis'}
              description={
                hasFilters
                  ? 'Tidak ada produk menipis yang cocok dengan filter.'
                  : 'Semua produk aktif memiliki stok di atas batas minimum.'
              }
              action={
                hasFilters ? (
                  <Button type="button" variant="outline" onClick={handleResetFilters}>
                    Reset Filter
                  </Button>
                ) : null
              }
            />
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Stok Saat Ini</TableHead>
                    <TableHead>Stok Minimum</TableHead>
                    <TableHead>Kekurangan</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockData.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs font-medium">{item.sku}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.categoryName ?? 'Tanpa kategori'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-semibold">
                        {item.currentStock} {item.unit}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {item.minimumStock} {item.unit}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium text-amber-700">
                        {item.deficit > 0 ? `${item.deficit} ${item.unit}` : 'Tepat di batas min.'}
                      </TableCell>
                      <TableCell>
                        <StockStatusBadge status={item.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <TablePagination
                page={lowStockData.page}
                totalPages={lowStockData.totalPages}
                total={lowStockData.total}
                pageSize={lowStockData.pageSize}
                onPageChange={(nextPage) => navigateWith({ page: nextPage })}
              />
            </Card>
          )}
        </>
      ) : null}

      {tab === 'movements' && movementData ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <CalendarRange className="size-4 text-primary" aria-hidden="true" />
            <span>
              Periode aktif:{' '}
              <span className="font-medium text-foreground">{movementData.dateRange.dateFrom}</span>{' '}
              s/d{' '}
              <span className="font-medium text-foreground">{movementData.dateRange.dateTo}</span>{' '}
              (Zona waktu: WIB / UTC+7)
            </span>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground">Total Transaksi</p>
                <p className="mt-1 text-xl font-semibold">
                  {new Intl.NumberFormat('id-ID').format(movementData.summary.totalMovements)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground">Total Stok Masuk</p>
                <p className="mt-1 text-xl font-semibold text-emerald-700">
                  +{new Intl.NumberFormat('id-ID').format(movementData.summary.stockInUnits)} unit
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground">Total Stok Keluar</p>
                <p className="mt-1 text-xl font-semibold text-amber-700">
                  -{new Intl.NumberFormat('id-ID').format(movementData.summary.stockOutUnits)} unit
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground">Selisih Bersih Periode</p>
                <p className="mt-1 text-xl font-semibold">
                  {movementData.summary.netDelta > 0
                    ? `+${movementData.summary.netDelta}`
                    : movementData.summary.netDelta}{' '}
                  unit
                </p>
              </CardContent>
            </Card>
          </div>

          {movementData.items.length === 0 ? (
            <EmptyState
              icon={<BarChart3 className="size-6" />}
              title="Tidak ada pergerakan pada periode ini"
              description="Ubah rentang tanggal atau reset filter untuk melihat riwayat pergerakan stok lainnya."
              action={
                hasFilters ? (
                  <Button type="button" variant="outline" onClick={handleResetFilters}>
                    Reset Filter
                  </Button>
                ) : null
              }
            />
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu (WIB)</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Perubahan</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Alasan & Referensi</TableHead>
                    <TableHead>Petugas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movementData.items.map((item) => {
                    const unit = item.productUnit ?? 'pcs'
                    const reasonLabel = formatReasonLabel(item.type, item.reason)
                    const deltaDisplay =
                      item.quantityDelta > 0
                        ? `+${item.quantityDelta}`
                        : String(item.quantityDelta)

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatDateTime(item.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="min-w-36">
                            <p className="font-medium">{item.productName ?? 'Produk dihapus'}</p>
                            {item.productSku ? (
                              <p className="font-mono text-xs text-muted-foreground">
                                {item.productSku}
                              </p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
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
                              Penyesuaian
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell
                          className={
                            item.quantityDelta > 0
                              ? 'whitespace-nowrap font-semibold text-emerald-700'
                              : 'whitespace-nowrap font-semibold text-amber-700'
                          }
                        >
                          {deltaDisplay} {unit}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <span>{item.quantityBefore}</span>
                            <ArrowRight className="size-3" aria-hidden="true" />
                            <span className="font-semibold text-foreground">
                              {item.quantityAfter} {unit}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs text-xs">
                          <div className="flex flex-col gap-0.5">
                            {reasonLabel ? <span className="font-medium">{reasonLabel}</span> : null}
                            {item.supplierName ? (
                              <span className="text-muted-foreground">
                                Supplier: {item.supplierName}
                              </span>
                            ) : null}
                            {item.referenceNumber ? (
                              <span className="font-mono text-muted-foreground">
                                Ref: {item.referenceNumber}
                              </span>
                            ) : null}
                            {!reasonLabel && !item.supplierName && !item.referenceNumber ? '—' : null}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {item.actorName ?? 'Pengguna'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              <TablePagination
                page={movementData.page}
                totalPages={movementData.totalPages}
                total={movementData.total}
                pageSize={movementData.pageSize}
                onPageChange={(nextPage) => navigateWith({ page: nextPage })}
              />
            </Card>
          )}
        </>
      ) : null}
    </div>
  )
}


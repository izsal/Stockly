'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ClipboardCheck,
  History,
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
import {
  STOCK_OUT_REASON_LABELS,
  type MovementType,
  type StockOutReason,
} from '@/src/lib/validation/inventory'

export type MovementItem = {
  id: string
  productId: string
  productName: string | null
  productSku: string | null
  productUnit: string | null
  warehouseName: string | null
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

export type MovementProductOption = {
  id: string
  name: string
  sku: string
}

const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  IN: 'Stok Masuk',
  OUT: 'Stok Keluar',
  ADJUSTMENT: 'Penyesuaian',
}

function formatDateTime(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('id-ID', {
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

export function MovementsView({
  items,
  total,
  page,
  pageSize,
  totalPages,
  products,
  initialSearch,
  initialProductId,
  initialType,
  initialDateFrom,
  initialDateTo,
}: {
  items: MovementItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  products: MovementProductOption[]
  initialSearch: string
  initialProductId: string
  initialType: MovementType | ''
  initialDateFrom: string
  initialDateTo: string
}) {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState(initialSearch)

  function navigateWithParams(next: {
    search?: string
    productId?: string
    type?: MovementType | ''
    dateFrom?: string
    dateTo?: string
    page?: number
  }) {
    const params = new URLSearchParams()
    const searchVal = (next.search ?? initialSearch).trim()
    const productVal = next.productId ?? initialProductId
    const typeVal = next.type ?? initialType
    const fromVal = next.dateFrom ?? initialDateFrom
    const toVal = next.dateTo ?? initialDateTo
    const pageVal = next.page ?? 1

    if (searchVal) params.set('search', searchVal)
    if (productVal) params.set('productId', productVal)
    if (typeVal) params.set('type', typeVal)
    if (fromVal) params.set('dateFrom', fromVal)
    if (toVal) params.set('dateTo', toVal)
    if (pageVal > 1) params.set('page', String(pageVal))

    const queryString = params.toString()
    router.push(queryString ? `/movements?${queryString}` : '/movements')
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigateWithParams({ search: searchInput, page: 1 })
  }

  function handleResetFilters() {
    setSearchInput('')
    router.push('/movements')
  }

  const hasFilters = Boolean(
    initialSearch.trim() ||
      initialProductId ||
      initialType ||
      initialDateFrom ||
      initialDateTo,
  )

  return (
    <div>
      <PageHeader
        title="Riwayat Stok"
        description="Catatan pergerakan stok masuk, stok keluar, dan penyesuaian yang bersifat permanen (append-only)."
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/inventory/stock-in"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Stok Masuk
            </Link>
            <Link
              href="/inventory/stock-out"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Stok Keluar
            </Link>
          </div>
        }
      />

      <Card className="mb-6">
        <CardContent className="p-4">
          <form
            onSubmit={handleSearchSubmit}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_auto_auto_auto]"
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
                aria-label="Cari riwayat stok"
                className="h-9 pl-9"
              />
            </div>

            <ModernSelect
              ariaLabel="Filter tipe pergerakan"
              value={initialType}
              onValueChange={(nextValue) =>
                navigateWithParams({ type: nextValue as MovementType | '', page: 1 })
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
              onValueChange={(nextValue) =>
                navigateWithParams({ productId: nextValue, page: 1 })
              }
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
              value={initialDateFrom}
              onChange={(e) => navigateWithParams({ dateFrom: e.target.value, page: 1 })}
              className="h-9 lg:w-36"
            />

            <Input
              type="date"
              aria-label="Sampai tanggal"
              value={initialDateTo}
              onChange={(e) => navigateWithParams({ dateTo: e.target.value, page: 1 })}
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
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <EmptyState
          icon={<History className="size-6" />}
          title={hasFilters ? 'Riwayat stok tidak ditemukan' : 'Belum ada pergerakan stok'}
          description={
            hasFilters
              ? 'Tidak ada pergerakan stok yang cocok dengan filter yang Anda pilih.'
              : 'Setiap pencatatan stok masuk, stok keluar, atau penyesuaian akan muncul di sini.'
          }
          action={
            hasFilters ? (
              <Button type="button" variant="outline" onClick={handleResetFilters}>
                Reset Filter
              </Button>
            ) : (
              <Link
                href="/inventory/stock-in"
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Catat Stok Masuk Pertama
              </Link>
            )
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Perubahan</TableHead>
                <TableHead>Saldo Stok</TableHead>
                <TableHead>Alasan & Referensi</TableHead>
                <TableHead>Petugas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const unit = item.productUnit ?? 'pcs'
                const reasonLabel = formatReasonLabel(item.type, item.reason)
                const deltaDisplay =
                  item.quantityDelta > 0 ? `+${item.quantityDelta}` : String(item.quantityDelta)

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
                          {MOVEMENT_TYPE_LABELS.IN}
                        </Badge>
                      ) : item.type === 'OUT' ? (
                        <Badge variant="warning">
                          <ArrowDownRight className="size-3" aria-hidden="true" />
                          {MOVEMENT_TYPE_LABELS.OUT}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <ClipboardCheck className="size-3" aria-hidden="true" />
                          {MOVEMENT_TYPE_LABELS.ADJUSTMENT}
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
                      <span className="inline-flex items-center gap-1.5">
                        <span>{item.quantityBefore}</span>
                        <ArrowRight className="size-3" aria-hidden="true" />
                        <span className="font-semibold text-foreground">
                          {item.quantityAfter} {unit}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="flex flex-col gap-0.5 text-xs">
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
                        {item.notes ? (
                          <span className="truncate text-muted-foreground" title={item.notes}>
                            {item.notes}
                          </span>
                        ) : null}
                        {!reasonLabel && !item.supplierName && !item.referenceNumber && !item.notes
                          ? '—'
                          : null}
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
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={(nextPage) => navigateWithParams({ page: nextPage })}
          />
        </Card>
      )}
    </div>
  )
}


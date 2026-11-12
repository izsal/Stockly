'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@yusufceng1z/ding-react'
import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  Package,
  Pencil,
  Plus,
  Search,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { archiveProductAction, restoreProductAction } from '@/src/actions/catalog.actions'
import { ConfirmDialog } from '@/src/components/shared/confirm-dialog'
import { EmptyState } from '@/src/components/shared/empty-state'
import { PageHeader } from '@/src/components/shared/page-header'
import { TablePagination } from '@/src/components/shared/table-pagination'
import { formatRupiah } from '@/src/lib/format'
import {
  ProductFormDialog,
  type CategoryOption,
  type ProductItem,
} from './product-form-dialog'

type StatusFilter = 'active' | 'archived' | 'all'

export function ProductsView({
  items,
  stockByProductId,
  total,
  page,
  pageSize,
  totalPages,
  categories,
  initialSearch,
  initialCategoryId,
  initialStatus,
  canWrite,
}: {
  items: ProductItem[]
  stockByProductId: Record<string, number>
  total: number
  page: number
  pageSize: number
  totalPages: number
  categories: CategoryOption[]
  initialSearch: string
  initialCategoryId: string
  initialStatus: StatusFilter
  canWrite: boolean
}) {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState(initialSearch)
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<{
    product: ProductItem
    mode: 'archive' | 'restore'
  } | null>(null)
  const [statusPending, setStatusPending] = useState(false)

  function navigateWithParams(next: {
    search?: string
    categoryId?: string
    status?: StatusFilter
    page?: number
  }) {
    const params = new URLSearchParams()
    const searchValue = (next.search ?? initialSearch).trim()
    const categoryValue = next.categoryId ?? initialCategoryId
    const statusValue = next.status ?? initialStatus
    const pageValue = next.page ?? 1

    if (searchValue) params.set('search', searchValue)
    if (categoryValue) params.set('categoryId', categoryValue)
    if (statusValue && statusValue !== 'active') params.set('status', statusValue)
    if (pageValue > 1) params.set('page', String(pageValue))

    const queryString = params.toString()
    router.push(queryString ? `/products?${queryString}` : '/products')
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigateWithParams({ search: searchInput, page: 1 })
  }

  function handleResetFilters() {
    setSearchInput('')
    router.push('/products')
  }

  function openCreateDialog() {
    setEditingProduct(null)
    setFormOpen(true)
  }

  function openEditDialog(product: ProductItem) {
    setEditingProduct(product)
    setFormOpen(true)
  }

  async function handleConfirmStatusChange() {
    if (!confirmTarget || statusPending) return
    setStatusPending(true)
    try {
      const result =
        confirmTarget.mode === 'archive'
          ? await archiveProductAction(confirmTarget.product.id)
          : await restoreProductAction(confirmTarget.product.id)

      if (!result.ok) {
        toast.error(result.message)
        return
      }

      setConfirmTarget(null)
      toast.success(
        confirmTarget.mode === 'archive'
          ? 'Produk berhasil diarsipkan.'
          : 'Produk berhasil dipulihkan.',
      )
      router.refresh()
    } catch {
      toast.error('Gagal memperbarui status produk. Coba lagi.')
    } finally {
      setStatusPending(false)
    }
  }

  const hasFilters = Boolean(
    initialSearch.trim() || initialCategoryId || initialStatus !== 'active',
  )

  return (
    <div>
      <PageHeader
        title="Produk"
        description="Kelola daftar SKU, kategori, harga, dan stok minimum di ruang kerja Anda."
        action={
          canWrite ? (
            <Button type="button" size="lg" onClick={openCreateDialog}>
              <Plus data-icon="inline-start" />
              Tambah Produk
            </Button>
          ) : null
        }
      />

      <Card className="mb-6">
        <CardContent className="p-4">
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
                aria-label="Cari produk"
                className="h-9 pl-9"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:items-center">
              <select
                aria-label="Filter kategori"
                value={initialCategoryId}
                onChange={(e) =>
                  navigateWithParams({ categoryId: e.target.value, page: 1 })
                }
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 lg:w-48"
              >
                <option value="">Semua kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter status produk"
                value={initialStatus}
                onChange={(e) =>
                  navigateWithParams({ status: e.target.value as StatusFilter, page: 1 })
                }
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 lg:w-40"
              >
                <option value="active">Aktif</option>
                <option value="archived">Diarsipkan</option>
                <option value="all">Semua status</option>
              </select>
            </div>

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
          icon={<Package className="size-6" />}
          title={hasFilters ? 'Produk tidak ditemukan' : 'Belum ada produk'}
          description={
            hasFilters
              ? 'Tidak ada produk yang cocok dengan pencarian atau filter yang dipilih.'
              : 'Tambahkan produk pertama untuk mulai menyusun katalog persediaan bisnis Anda.'
          }
          action={
            hasFilters ? (
              <Button type="button" variant="outline" onClick={handleResetFilters}>
                Reset Filter
              </Button>
            ) : canWrite ? (
              <Button type="button" onClick={openCreateDialog}>
                <Plus data-icon="inline-start" />
                Tambah Produk Pertama
              </Button>
            ) : null
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Stok Saat Ini</TableHead>
                <TableHead>Stok Min.</TableHead>
                <TableHead>Harga Modal</TableHead>
                <TableHead>Harga Jual</TableHead>
                <TableHead>Status</TableHead>
                {canWrite ? <TableHead className="text-right">Aksi</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((product) => {
                const isArchived = !product.isActive || Boolean(product.deletedAt)
                const currentStock = stockByProductId[product.id] ?? 0
                const stockBadgeVariant =
                  currentStock === 0
                    ? 'destructive'
                    : currentStock <= product.minimumStock
                      ? 'warning'
                      : 'secondary'

                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="min-w-40">
                        <p className="font-medium">{product.name}</p>
                        {product.barcode ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Barcode: {product.barcode}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-medium">{product.sku}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.categoryName ?? 'Tanpa kategori'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={stockBadgeVariant}>
                        {currentStock} {product.unit}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {product.minimumStock} {product.unit}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatRupiah(product.costPrice)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium">
                      {formatRupiah(product.sellingPrice)}
                    </TableCell>
                    <TableCell>
                      {isArchived ? (
                        <Badge variant="secondary">
                          <Archive className="size-3" aria-hidden="true" />
                          Diarsipkan
                        </Badge>
                      ) : (
                        <Badge variant="success">
                          <CheckCircle2 className="size-3" aria-hidden="true" />
                          Aktif
                        </Badge>
                      )}
                    </TableCell>
                    {canWrite ? (
                      <TableCell className="text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(product)}
                            aria-label={`Edit produk ${product.name}`}
                          >
                            <Pencil className="size-3.5" aria-hidden="true" />
                            Edit
                          </Button>
                          {isArchived ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setConfirmTarget({ product, mode: 'restore' })
                              }
                              aria-label={`Pulihkan produk ${product.name}`}
                            >
                              <ArchiveRestore className="size-3.5" aria-hidden="true" />
                              Pulihkan
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() =>
                                setConfirmTarget({ product, mode: 'archive' })
                              }
                              aria-label={`Arsipkan produk ${product.name}`}
                            >
                              <Archive className="size-3.5" aria-hidden="true" />
                              Arsipkan
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    ) : null}
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

      {formOpen ? (
        <ProductFormDialog
          key={editingProduct?.id ?? 'create-product'}
          open={formOpen}
          onOpenChange={setFormOpen}
          product={editingProduct}
          categories={categories}
          onSuccess={(message) => {
            toast.success(message)
            router.refresh()
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
        title={
          confirmTarget?.mode === 'archive' ? 'Arsipkan produk?' : 'Pulihkan produk?'
        }
        description={
          confirmTarget?.mode === 'archive'
            ? `Produk "${confirmTarget.product.name}" akan dinonaktifkan dari daftar aktif. Riwayat transaksi stok di masa depan tetap terjaga untuk audit.`
            : confirmTarget
              ? `Produk "${confirmTarget.product.name}" akan diaktifkan kembali di daftar produk aktif.`
              : ''
        }
        confirmLabel={confirmTarget?.mode === 'archive' ? 'Arsipkan' : 'Pulihkan'}
        variant={confirmTarget?.mode === 'archive' ? 'destructive' : 'default'}
        pending={statusPending}
        onConfirm={handleConfirmStatusChange}
      />
    </div>
  )
}


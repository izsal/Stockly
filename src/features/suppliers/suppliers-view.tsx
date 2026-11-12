'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@yusufceng1z/ding-react'
import { Mail, Pencil, Phone, Plus, Search, Trash2, Truck, X } from 'lucide-react'
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
import { deleteSupplierAction } from '@/src/actions/inventory.actions'
import { ConfirmDialog } from '@/src/components/shared/confirm-dialog'
import { EmptyState } from '@/src/components/shared/empty-state'
import { PageHeader } from '@/src/components/shared/page-header'
import { TablePagination } from '@/src/components/shared/table-pagination'
import { SupplierFormDialog, type SupplierItem } from './supplier-form-dialog'

export function SuppliersView({
  items,
  total,
  page,
  pageSize,
  totalPages,
  initialSearch,
  canWrite,
}: {
  items: SupplierItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  initialSearch: string
  canWrite: boolean
}) {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState(initialSearch)
  const [formOpen, setFormOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<SupplierItem | null>(null)
  const [deletingSupplier, setDeletingSupplier] = useState<SupplierItem | null>(null)
  const [deletePending, setDeletePending] = useState(false)

  function navigateWithParams(nextSearch: string, nextPage: number) {
    const params = new URLSearchParams()
    const trimmed = nextSearch.trim()
    if (trimmed) params.set('search', trimmed)
    if (nextPage > 1) params.set('page', String(nextPage))
    const queryString = params.toString()
    router.push(queryString ? `/suppliers?${queryString}` : '/suppliers')
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigateWithParams(searchInput, 1)
  }

  function handleResetFilters() {
    setSearchInput('')
    router.push('/suppliers')
  }

  function openCreateDialog() {
    setEditingSupplier(null)
    setFormOpen(true)
  }

  function openEditDialog(supplier: SupplierItem) {
    setEditingSupplier(supplier)
    setFormOpen(true)
  }

  async function handleConfirmDelete() {
    if (!deletingSupplier || deletePending) return
    setDeletePending(true)
    try {
      const result = await deleteSupplierAction(deletingSupplier.id)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      setDeletingSupplier(null)
      toast.success('Supplier berhasil dihapus.')
      router.refresh()
    } catch {
      toast.error('Gagal menghapus supplier. Coba lagi.')
    } finally {
      setDeletePending(false)
    }
  }

  const hasFilters = Boolean(initialSearch.trim())

  return (
    <div>
      <PageHeader
        title="Supplier"
        description="Kelola daftar pemasok barang yang terhubung dengan pencatatan stok masuk."
        action={
          canWrite ? (
            <Button type="button" size="lg" onClick={openCreateDialog}>
              <Plus data-icon="inline-start" />
              Tambah Supplier
            </Button>
          ) : null
        }
      />

      <Card className="mb-6">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari nama, nomor telepon, atau email supplier…"
                aria-label="Cari supplier"
                className="h-9 pl-9"
              />
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
          icon={<Truck className="size-6" />}
          title={hasFilters ? 'Supplier tidak ditemukan' : 'Belum ada supplier'}
          description={
            hasFilters
              ? 'Tidak ada supplier yang cocok dengan kata kunci pencarian Anda.'
              : 'Tambahkan supplier pertama untuk mempermudah pelacakan pemasok saat stok masuk.'
          }
          action={
            hasFilters ? (
              <Button type="button" variant="outline" onClick={handleResetFilters}>
                Reset Pencarian
              </Button>
            ) : canWrite ? (
              <Button type="button" onClick={openCreateDialog}>
                <Plus data-icon="inline-start" />
                Tambah Supplier Pertama
              </Button>
            ) : null
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Supplier</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead>Catatan</TableHead>
                {canWrite ? <TableHead className="text-right">Aksi</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>
                    {supplier.phone || supplier.email ? (
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        {supplier.phone ? (
                          <span className="inline-flex items-center gap-1.5 text-foreground">
                            <Phone className="size-3 text-muted-foreground" aria-hidden="true" />
                            {supplier.phone}
                          </span>
                        ) : null}
                        {supplier.email ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Mail className="size-3" aria-hidden="true" />
                            {supplier.email}
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs text-muted-foreground">
                    {supplier.address ?? '—'}
                  </TableCell>
                  <TableCell className="max-w-xs text-muted-foreground">
                    {supplier.notes ?? '—'}
                  </TableCell>
                  {canWrite ? (
                    <TableCell className="text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(supplier)}
                          aria-label={`Edit supplier ${supplier.name}`}
                        >
                          <Pencil className="size-3.5" aria-hidden="true" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeletingSupplier(supplier)}
                          aria-label={`Hapus supplier ${supplier.name}`}
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                          Hapus
                        </Button>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TablePagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={(nextPage) => navigateWithParams(initialSearch, nextPage)}
          />
        </Card>
      )}

      {formOpen ? (
        <SupplierFormDialog
          key={editingSupplier?.id ?? 'create-supplier'}
          open={formOpen}
          onOpenChange={setFormOpen}
          supplier={editingSupplier}
          onSuccess={(message) => {
            toast.success(message)
            router.refresh()
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deletingSupplier)}
        onOpenChange={(open) => !open && setDeletingSupplier(null)}
        title="Hapus supplier?"
        description={
          deletingSupplier
            ? `Supplier "${deletingSupplier.name}" akan dinonaktifkan dari daftar aktif. Riwayat stok masuk yang pernah tercatat tetap terjaga untuk audit.`
            : ''
        }
        confirmLabel="Hapus Supplier"
        pending={deletePending}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}


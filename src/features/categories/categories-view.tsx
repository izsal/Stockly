'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@yusufceng1z/ding-react'
import { Pencil, Plus, Search, Tags, Trash2, X } from 'lucide-react'
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
import { deleteCategoryAction } from '@/src/actions/catalog.actions'
import { ConfirmDialog } from '@/src/components/shared/confirm-dialog'
import { EmptyState } from '@/src/components/shared/empty-state'
import { PageHeader } from '@/src/components/shared/page-header'
import { TablePagination } from '@/src/components/shared/table-pagination'
import { useDebouncedSearch } from '@/src/lib/hooks/use-debounced-search'
import { CategoryFormDialog, type CategoryItem } from './category-form-dialog'

export function CategoriesView({
  items,
  total,
  page,
  pageSize,
  totalPages,
  initialSearch,
  canWrite,
}: {
  items: CategoryItem[]
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
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null)
  const [deletePending, setDeletePending] = useState(false)

  function navigateWithParams(
    nextSearch: string,
    nextPage: number,
    nextPageSize = pageSize,
  ) {
    const params = new URLSearchParams()
    const trimmed = nextSearch.trim()
    if (trimmed) params.set('search', trimmed)
    if (nextPage > 1) params.set('page', String(nextPage))
    if (nextPageSize !== 10) params.set('pageSize', String(nextPageSize))
    const queryString = params.toString()
    router.push(queryString ? `/categories?${queryString}` : '/categories')
  }

  useDebouncedSearch(searchInput, initialSearch, (nextSearch) => {
    navigateWithParams(nextSearch, 1)
  })

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigateWithParams(searchInput, 1)
  }

  function handleResetFilters() {
    setSearchInput('')
    router.push('/categories')
  }

  function openCreateDialog() {
    setEditingCategory(null)
    setFormOpen(true)
  }

  function openEditDialog(category: CategoryItem) {
    setEditingCategory(category)
    setFormOpen(true)
  }

  async function handleConfirmDelete() {
    if (!deletingCategory || deletePending) return
    setDeletePending(true)
    try {
      const result = await deleteCategoryAction(deletingCategory.id)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      setDeletingCategory(null)
      toast.success('Kategori berhasil dihapus.')
      router.refresh()
    } catch {
      toast.error('Gagal menghapus kategori. Coba lagi.')
    } finally {
      setDeletePending(false)
    }
  }

  const hasFilters = Boolean(initialSearch.trim())

  return (
    <div>
      <PageHeader
        title="Kategori"
        description="Kelola kategori untuk mengelompokkan daftar produk di ruang kerja Anda."
        action={
          canWrite ? (
            <Button type="button" size="lg" onClick={openCreateDialog}>
              <Plus data-icon="inline-start" />
              Tambah Kategori
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
                placeholder="Cari nama atau deskripsi kategori…"
                aria-label="Cari kategori"
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
          icon={<Tags className="size-6" />}
          title={hasFilters ? 'Kategori tidak ditemukan' : 'Belum ada kategori'}
          description={
            hasFilters
              ? 'Tidak ada kategori yang cocok dengan kata kunci pencarian Anda.'
              : 'Tambahkan kategori pertama untuk merapikan pengelompokan produk.'
          }
          action={
            hasFilters ? (
              <Button type="button" variant="outline" onClick={handleResetFilters}>
                Reset Pencarian
              </Button>
            ) : canWrite ? (
              <Button type="button" onClick={openCreateDialog}>
                <Plus data-icon="inline-start" />
                Tambah Kategori Pertama
              </Button>
            ) : null
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Kategori</TableHead>
                <TableHead>Deskripsi</TableHead>
                {canWrite ? <TableHead className="text-right">Aksi</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="max-w-md text-muted-foreground">
                    {category.description ?? '—'}
                  </TableCell>
                  {canWrite ? (
                    <TableCell className="text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(category)}
                          aria-label={`Edit kategori ${category.name}`}
                        >
                          <Pencil className="size-3.5" aria-hidden="true" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeletingCategory(category)}
                          aria-label={`Hapus kategori ${category.name}`}
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
            onPageSizeChange={(nextPageSize) =>
              navigateWithParams(initialSearch, 1, nextPageSize)
            }
          />
        </Card>
      )}

      {formOpen ? (
        <CategoryFormDialog
          key={editingCategory?.id ?? 'create-category'}
          open={formOpen}
          onOpenChange={setFormOpen}
          category={editingCategory}
          onSuccess={(message) => {
            toast.success(message)
            router.refresh()
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deletingCategory)}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
        title="Hapus kategori?"
        description={
          deletingCategory
            ? `Kategori "${deletingCategory.name}" akan dihapus permanen. Produk yang sebelumnya memakai kategori ini akan tetap tersimpan tanpa kategori.`
            : ''
        }
        confirmLabel="Hapus Kategori"
        pending={deletePending}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}


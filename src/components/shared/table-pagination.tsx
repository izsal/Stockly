'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ModernSelect } from '@/components/ui/select'

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50] as const

export function TablePagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (nextPage: number) => void
  onPageSizeChange?: (nextPageSize: number) => void
  pageSizeOptions?: readonly number[]
}) {
  if (total === 0) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <p>
          Menampilkan <span className="font-medium text-foreground">{start}</span>–
          <span className="font-medium text-foreground">{end}</span> dari{' '}
          <span className="font-medium text-foreground">{total}</span> data
        </p>

        {onPageSizeChange ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Per halaman</span>
            <ModernSelect
              ariaLabel="Jumlah baris per halaman"
              value={String(pageSize)}
              onValueChange={(next) => onPageSizeChange(Number(next))}
              options={pageSizeOptions.map((size) => ({
                value: String(size),
                label: `${size}`,
              }))}
              className="w-20"
            />
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft data-icon="inline-start" />
          Sebelumnya
        </Button>
        <span className="px-2 text-xs font-medium text-foreground">
          Halaman {page} dari {Math.max(totalPages, 1)}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Berikutnya
          <ChevronRight data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}

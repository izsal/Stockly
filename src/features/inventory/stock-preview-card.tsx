import { AlertTriangle, ArrowRight, Package } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { InventoryProductOption } from './types'

export function StockPreviewCard({
  product,
  projectedStock,
  delta,
}: {
  product: InventoryProductOption | undefined
  projectedStock: number | null
  delta: number | null
}) {
  if (!product) {
    return (
      <Card className="h-fit">
        <CardHeader className="px-5 pt-5">
          <h2 className="text-base font-semibold">Ringkasan Stok</h2>
          <p className="text-sm text-muted-foreground">
            Pilih produk terlebih dahulu untuk melihat stok saat ini dan estimasi perubahan.
          </p>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            <Package className="size-4 shrink-0" aria-hidden="true" />
            <span>Belum ada produk yang dipilih.</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isNegativeProjection = projectedStock !== null && projectedStock < 0
  const isLowAfter =
    projectedStock !== null && projectedStock >= 0 && projectedStock <= product.minimumStock

  return (
    <Card className="h-fit">
      <CardHeader className="px-5 pt-5">
        <h2 className="text-base font-semibold">Ringkasan Stok</h2>
        <p className="truncate text-sm text-muted-foreground" title={product.name}>
          {product.name} ({product.sku})
        </p>
      </CardHeader>
      <CardContent className="space-y-4 px-5 pb-5">
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-xs font-medium text-muted-foreground">Stok saat ini</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {product.currentStock} <span className="text-sm font-normal">{product.unit}</span>
          </p>
        </div>

        {projectedStock !== null && delta !== null ? (
          <div
            className={cn(
              'rounded-xl border p-4',
              isNegativeProjection
                ? 'border-destructive/30 bg-destructive/5'
                : 'border-border bg-background',
            )}
          >
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Estimasi setelah transaksi</span>
              <span
                className={cn(
                  'font-semibold',
                  delta > 0
                    ? 'text-emerald-700'
                    : delta < 0
                      ? 'text-amber-700'
                      : 'text-muted-foreground',
                )}
              >
                {delta > 0 ? `+${delta}` : delta} {product.unit}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
              <span>{product.currentStock}</span>
              <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className={cn(isNegativeProjection && 'text-destructive')}>
                {projectedStock} {product.unit}
              </span>
            </div>

            {isNegativeProjection ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
                Jumlah melebihi stok tersedia.
              </p>
            ) : isLowAfter ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
                <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
                Stok akhir berada di bawah atau sama dengan stok minimum ({product.minimumStock}{' '}
                {product.unit}).
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span>Stok minimum</span>
          <span className="font-medium text-foreground">
            {product.minimumStock} {product.unit}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}


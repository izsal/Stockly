'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from '@yusufceng1z/ding-react'
import { ClipboardCheck, History, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createStockAdjustmentAction } from '@/src/actions/inventory.actions'
import { ConfirmDialog } from '@/src/components/shared/confirm-dialog'
import { EmptyState } from '@/src/components/shared/empty-state'
import { PageHeader } from '@/src/components/shared/page-header'
import { stockAdjustmentSchema } from '@/src/lib/validation/inventory'
import { StockPreviewCard } from './stock-preview-card'
import type { InventoryProductOption } from './types'

const ADJUSTMENT_REASON_PRESETS = [
  'Opname Stok',
  'Koreksi Data',
  'Barang Hilang',
  'Barang Rusak',
] as const

export function StockAdjustmentForm({ products }: { products: InventoryProductOption[] }) {
  const router = useRouter()
  const [productId, setProductId] = useState(products[0]?.id ?? '')
  const [countedQuantity, setCountedQuantity] = useState('')
  const [reason, setReason] = useState('Opname Stok')
  const [notes, setNotes] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const selectedProduct = products.find((p) => p.id === productId)
  const hasCountedValue = countedQuantity.trim().length > 0
  const parsedCounted = hasCountedValue ? Number(countedQuantity) : NaN
  const validCounted =
    Number.isInteger(parsedCounted) && parsedCounted >= 0 ? parsedCounted : null
  const calculatedDelta =
    selectedProduct && validCounted !== null ? validCounted - selectedProduct.currentStock : null

  function handleValidateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return

    setFormError('')
    setFieldErrors({})

    if (!hasCountedValue) {
      setFieldErrors({ countedQuantity: 'Jumlah fisik wajib diisi.' })
      return
    }

    const parsed = stockAdjustmentSchema.safeParse({
      productId,
      countedQuantity,
      reason,
      notes,
    })

    if (!parsed.success) {
      setFieldErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      )
      return
    }

    if (selectedProduct && parsed.data.countedQuantity === selectedProduct.currentStock) {
      setFieldErrors({
        countedQuantity:
          'Jumlah fisik sama dengan stok saat ini. Tidak ada penyesuaian yang diperlukan.',
      })
      return
    }

    setConfirmOpen(true)
  }

  async function handleConfirmSubmit() {
    if (pending) return
    setPending(true)
    setFormError('')

    try {
      const result = await createStockAdjustmentAction({
        productId,
        countedQuantity,
        reason,
        notes,
      })

      if (!result.ok) {
        setConfirmOpen(false)
        if (result.fieldErrors) {
          setFieldErrors(
            Object.fromEntries(
              Object.entries(result.fieldErrors)
                .filter(([, msgs]) => Boolean(msgs?.length))
                .map(([key, msgs]) => [key, msgs![0]]),
            ),
          )
        }
        setFormError(result.message)
        toast.error(result.message)
        return
      }

      setConfirmOpen(false)
      setCountedQuantity('')
      setNotes('')
      const deltaText =
        result.data.quantityDelta > 0
          ? `+${result.data.quantityDelta}`
          : String(result.data.quantityDelta)
      toast.success(
        `Penyesuaian stok berhasil disimpan (${selectedProduct?.name ?? 'Produk'} ${deltaText}).`,
      )
      router.refresh()
    } catch {
      setConfirmOpen(false)
      setFormError('Terjadi kendala saat menyimpan penyesuaian stok. Coba lagi.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Penyesuaian Stok"
        description="Sesuaikan stok sistem agar cocok dengan hasil hitung fisik (stock opname)."
        action={
          <Link
            href="/movements"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <History className="size-4" aria-hidden="true" />
            Lihat Riwayat Stok
          </Link>
        }
      />

      {products.length === 0 ? (
        <EmptyState
          icon={<Package className="size-6" />}
          title="Belum ada produk aktif"
          description="Tambahkan produk aktif terlebih dahulu sebelum melakukan penyesuaian stok."
          action={
            <Link
              href="/products"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Kelola Produk
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleValidateSubmit} noValidate className="flex flex-col gap-5">
                <FieldGroup>
                  <Field data-invalid={Boolean(fieldErrors.productId)}>
                    <FieldLabel htmlFor="adjustment-product">Produk *</FieldLabel>
                    <select
                      id="adjustment-product"
                      name="productId"
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                      disabled={pending}
                      aria-invalid={Boolean(fieldErrors.productId)}
                      className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <option value="">Pilih produk…</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.sku}) — Stok sistem: {product.currentStock}{' '}
                          {product.unit}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.productId ? (
                      <FieldError>{fieldErrors.productId}</FieldError>
                    ) : null}
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="adjustment-current-stock">Stok sistem saat ini</FieldLabel>
                      <Input
                        id="adjustment-current-stock"
                        value={
                          selectedProduct
                            ? `${selectedProduct.currentStock} ${selectedProduct.unit}`
                            : '—'
                        }
                        readOnly
                        disabled
                      />
                    </Field>

                    <Field data-invalid={Boolean(fieldErrors.countedQuantity)}>
                      <FieldLabel htmlFor="adjustment-counted">Jumlah fisik aktual *</FieldLabel>
                      <Input
                        id="adjustment-counted"
                        name="countedQuantity"
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        value={countedQuantity}
                        onChange={(e) => setCountedQuantity(e.target.value)}
                        placeholder="Masukkan hasil hitung fisik"
                        disabled={pending}
                        aria-invalid={Boolean(fieldErrors.countedQuantity)}
                      />
                      {fieldErrors.countedQuantity ? (
                        <FieldError>{fieldErrors.countedQuantity}</FieldError>
                      ) : calculatedDelta !== null ? (
                        <FieldDescription>
                          Selisih otomatis:{' '}
                          <span className="font-medium text-foreground">
                            {calculatedDelta > 0 ? `+${calculatedDelta}` : calculatedDelta}{' '}
                            {selectedProduct?.unit}
                          </span>
                        </FieldDescription>
                      ) : null}
                    </Field>
                  </div>

                  <Field data-invalid={Boolean(fieldErrors.reason)}>
                    <FieldLabel htmlFor="adjustment-reason">Alasan penyesuaian *</FieldLabel>
                    <Input
                      id="adjustment-reason"
                      name="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Contoh: Opname Stok Bulanan"
                      maxLength={80}
                      disabled={pending}
                      aria-invalid={Boolean(fieldErrors.reason)}
                    />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {ADJUSTMENT_REASON_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setReason(preset)}
                          className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                    {fieldErrors.reason ? <FieldError>{fieldErrors.reason}</FieldError> : null}
                  </Field>

                  <Field data-invalid={Boolean(fieldErrors.notes)}>
                    <FieldLabel htmlFor="adjustment-notes">Catatan (opsional)</FieldLabel>
                    <Textarea
                      id="adjustment-notes"
                      name="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Keterangan hasil pemeriksaan fisik atau lokasi rak"
                      maxLength={500}
                      rows={3}
                      disabled={pending}
                      aria-invalid={Boolean(fieldErrors.notes)}
                    />
                    {fieldErrors.notes ? <FieldError>{fieldErrors.notes}</FieldError> : null}
                  </Field>
                </FieldGroup>

                {formError ? (
                  <p
                    role="alert"
                    className="rounded-lg border border-destructive/25 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive"
                  >
                    {formError}
                  </p>
                ) : null}

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <Button type="submit" size="lg" disabled={pending}>
                    <ClipboardCheck data-icon="inline-start" />
                    Simpan Penyesuaian
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <StockPreviewCard
            product={selectedProduct}
            delta={calculatedDelta}
            projectedStock={validCounted}
          />
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Konfirmasi penyesuaian stok?"
        description={
          selectedProduct && validCounted !== null && calculatedDelta !== null
            ? `Sesuaikan stok "${selectedProduct.name}" dari ${selectedProduct.currentStock} menjadi ${validCounted} ${selectedProduct.unit} (selisih ${calculatedDelta > 0 ? `+${calculatedDelta}` : calculatedDelta}). Pergerakan penyesuaian akan tercatat permanen di riwayat.`
            : ''
        }
        confirmLabel="Simpan Penyesuaian"
        variant="default"
        pending={pending}
        onConfirm={handleConfirmSubmit}
      />
    </div>
  )
}


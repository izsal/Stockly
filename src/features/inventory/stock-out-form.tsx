'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from '@yusufceng1z/ding-react'
import { History, Package, PackageMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createStockOutAction } from '@/src/actions/inventory.actions'
import { ConfirmDialog } from '@/src/components/shared/confirm-dialog'
import { EmptyState } from '@/src/components/shared/empty-state'
import { PageHeader } from '@/src/components/shared/page-header'
import {
  STOCK_OUT_REASONS,
  STOCK_OUT_REASON_LABELS,
  stockOutSchema,
  type StockOutReason,
} from '@/src/lib/validation/inventory'
import { StockPreviewCard } from './stock-preview-card'
import type { InventoryProductOption } from './types'

export function StockOutForm({ products }: { products: InventoryProductOption[] }) {
  const router = useRouter()
  const [productId, setProductId] = useState(products[0]?.id ?? '')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState<StockOutReason>('SALE')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const selectedProduct = products.find((p) => p.id === productId)
  const parsedQuantity = Number(quantity)
  const validQuantity = Number.isInteger(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : null

  function handleValidateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return

    setFormError('')
    setFieldErrors({})

    const parsed = stockOutSchema.safeParse({
      productId,
      quantity,
      reason,
      referenceNumber,
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

    if (selectedProduct && parsed.data.quantity > selectedProduct.currentStock) {
      setFieldErrors({
        quantity: `Stok tidak mencukupi. Stok tersedia: ${selectedProduct.currentStock} ${selectedProduct.unit}.`,
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
      const result = await createStockOutAction({
        productId,
        quantity,
        reason,
        referenceNumber,
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
      setQuantity('')
      setReferenceNumber('')
      setNotes('')
      toast.success(
        `Stok keluar berhasil dicatat (${selectedProduct?.name ?? 'Produk'} ${result.data.quantityDelta}).`,
      )
      router.refresh()
    } catch {
      setConfirmOpen(false)
      setFormError('Terjadi kendala saat mencatat stok keluar. Coba lagi.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Stok Keluar"
        description="Catat pengurangan stok untuk penjualan, barang rusak, atau pemakaian internal."
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
          description="Tambahkan produk aktif terlebih dahulu sebelum mencatat transaksi stok keluar."
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
                    <FieldLabel htmlFor="stock-out-product">Produk *</FieldLabel>
                    <select
                      id="stock-out-product"
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
                          {product.name} ({product.sku}) — Tersedia: {product.currentStock}{' '}
                          {product.unit}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.productId ? (
                      <FieldError>{fieldErrors.productId}</FieldError>
                    ) : null}
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field data-invalid={Boolean(fieldErrors.quantity)}>
                      <FieldLabel htmlFor="stock-out-quantity">Jumlah keluar *</FieldLabel>
                      <Input
                        id="stock-out-quantity"
                        name="quantity"
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="Contoh: 5"
                        disabled={pending}
                        aria-invalid={Boolean(fieldErrors.quantity)}
                      />
                      {fieldErrors.quantity ? (
                        <FieldError>{fieldErrors.quantity}</FieldError>
                      ) : (
                        <FieldDescription>
                          Stok tersedia:{' '}
                          <span className="font-medium text-foreground">
                            {selectedProduct?.currentStock ?? 0} {selectedProduct?.unit ?? 'pcs'}
                          </span>
                        </FieldDescription>
                      )}
                    </Field>

                    <Field data-invalid={Boolean(fieldErrors.reason)}>
                      <FieldLabel htmlFor="stock-out-reason">Alasan keluar *</FieldLabel>
                      <select
                        id="stock-out-reason"
                        name="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value as StockOutReason)}
                        disabled={pending}
                        aria-invalid={Boolean(fieldErrors.reason)}
                        className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        {STOCK_OUT_REASONS.map((reasonKey) => (
                          <option key={reasonKey} value={reasonKey}>
                            {STOCK_OUT_REASON_LABELS[reasonKey]}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.reason ? <FieldError>{fieldErrors.reason}</FieldError> : null}
                    </Field>
                  </div>

                  <Field data-invalid={Boolean(fieldErrors.referenceNumber)}>
                    <FieldLabel htmlFor="stock-out-reference">
                      Nomor referensi / Invoice (opsional)
                    </FieldLabel>
                    <Input
                      id="stock-out-reference"
                      name="referenceNumber"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="Contoh: INV-2026-089"
                      maxLength={100}
                      disabled={pending}
                      aria-invalid={Boolean(fieldErrors.referenceNumber)}
                    />
                    {fieldErrors.referenceNumber ? (
                      <FieldError>{fieldErrors.referenceNumber}</FieldError>
                    ) : null}
                  </Field>

                  <Field data-invalid={Boolean(fieldErrors.notes)}>
                    <FieldLabel htmlFor="stock-out-notes">Catatan (opsional)</FieldLabel>
                    <Textarea
                      id="stock-out-notes"
                      name="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Keterangan tambahan mengenai pengeluaran barang"
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
                    <PackageMinus data-icon="inline-start" />
                    Simpan Stok Keluar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <StockPreviewCard
            product={selectedProduct}
            delta={validQuantity !== null ? -validQuantity : null}
            projectedStock={
              selectedProduct && validQuantity !== null
                ? selectedProduct.currentStock - validQuantity
                : null
            }
          />
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Konfirmasi stok keluar?"
        description={
          selectedProduct && validQuantity !== null
            ? `Kurangi ${validQuantity} ${selectedProduct.unit} dari produk "${selectedProduct.name}" (${STOCK_OUT_REASON_LABELS[reason]}). Stok akan berubah dari ${selectedProduct.currentStock} menjadi ${selectedProduct.currentStock - validQuantity} ${selectedProduct.unit}.`
            : ''
        }
        confirmLabel="Catat Stok Keluar"
        variant="default"
        pending={pending}
        onConfirm={handleConfirmSubmit}
      />
    </div>
  )
}


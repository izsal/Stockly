'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from '@yusufceng1z/ding-react'
import { History, Package, PackagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createStockInAction } from '@/src/actions/inventory.actions'
import { ConfirmDialog } from '@/src/components/shared/confirm-dialog'
import { EmptyState } from '@/src/components/shared/empty-state'
import { PageHeader } from '@/src/components/shared/page-header'
import { stockInSchema } from '@/src/lib/validation/inventory'
import { StockPreviewCard } from './stock-preview-card'
import type { InventoryProductOption, InventorySupplierOption } from './types'

export function StockInForm({
  products,
  suppliers,
}: {
  products: InventoryProductOption[]
  suppliers: InventorySupplierOption[]
}) {
  const router = useRouter()
  const [productId, setProductId] = useState(products[0]?.id ?? '')
  const [quantity, setQuantity] = useState('')
  const [supplierId, setSupplierId] = useState('')
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

    const parsed = stockInSchema.safeParse({
      productId,
      quantity,
      supplierId,
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

    setConfirmOpen(true)
  }

  async function handleConfirmSubmit() {
    if (pending) return
    setPending(true)
    setFormError('')

    try {
      const result = await createStockInAction({
        productId,
        quantity,
        supplierId,
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
        `Stok masuk berhasil dicatat (${selectedProduct?.name ?? 'Produk'} +${result.data.quantityDelta}).`,
      )
      router.refresh()
    } catch {
      setConfirmOpen(false)
      setFormError('Terjadi kendala saat mencatat stok masuk. Coba lagi.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Stok Masuk"
        description="Catat penerimaan barang dari supplier atau penambahan stok awal ke gudang."
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
          description="Tambahkan produk aktif terlebih dahulu sebelum mencatat transaksi stok masuk."
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
                    <FieldLabel htmlFor="stock-in-product">Produk *</FieldLabel>
                    <select
                      id="stock-in-product"
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
                          {product.name} ({product.sku}) — Stok: {product.currentStock} {product.unit}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.productId ? (
                      <FieldError>{fieldErrors.productId}</FieldError>
                    ) : null}
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field data-invalid={Boolean(fieldErrors.quantity)}>
                      <FieldLabel htmlFor="stock-in-quantity">Jumlah masuk *</FieldLabel>
                      <Input
                        id="stock-in-quantity"
                        name="quantity"
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="Contoh: 25"
                        disabled={pending}
                        aria-invalid={Boolean(fieldErrors.quantity)}
                      />
                      {fieldErrors.quantity ? (
                        <FieldError>{fieldErrors.quantity}</FieldError>
                      ) : (
                        <FieldDescription>
                          Masukkan jumlah unit yang diterima ({selectedProduct?.unit ?? 'pcs'}).
                        </FieldDescription>
                      )}
                    </Field>

                    <Field data-invalid={Boolean(fieldErrors.supplierId)}>
                      <FieldLabel htmlFor="stock-in-supplier">Supplier (opsional)</FieldLabel>
                      <select
                        id="stock-in-supplier"
                        name="supplierId"
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
                        disabled={pending}
                        className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <option value="">Tanpa supplier</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.supplierId ? (
                        <FieldError>{fieldErrors.supplierId}</FieldError>
                      ) : null}
                    </Field>
                  </div>

                  <Field data-invalid={Boolean(fieldErrors.referenceNumber)}>
                    <FieldLabel htmlFor="stock-in-reference">
                      Nomor referensi / Surat jalan (opsional)
                    </FieldLabel>
                    <Input
                      id="stock-in-reference"
                      name="referenceNumber"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="Contoh: SJ-2026-001 atau PO-104"
                      maxLength={100}
                      disabled={pending}
                      aria-invalid={Boolean(fieldErrors.referenceNumber)}
                    />
                    {fieldErrors.referenceNumber ? (
                      <FieldError>{fieldErrors.referenceNumber}</FieldError>
                    ) : null}
                  </Field>

                  <Field data-invalid={Boolean(fieldErrors.notes)}>
                    <FieldLabel htmlFor="stock-in-notes">Catatan (opsional)</FieldLabel>
                    <Textarea
                      id="stock-in-notes"
                      name="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Catatan kondisi barang atau keterangan tambahan"
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
                    <PackagePlus data-icon="inline-start" />
                    Simpan Stok Masuk
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <StockPreviewCard
            product={selectedProduct}
            delta={validQuantity}
            projectedStock={
              selectedProduct && validQuantity !== null
                ? selectedProduct.currentStock + validQuantity
                : null
            }
          />
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Konfirmasi stok masuk?"
        description={
          selectedProduct && validQuantity !== null
            ? `Tambah ${validQuantity} ${selectedProduct.unit} ke produk "${selectedProduct.name}". Stok akan berubah dari ${selectedProduct.currentStock} menjadi ${selectedProduct.currentStock + validQuantity} ${selectedProduct.unit}.`
            : ''
        }
        confirmLabel="Catat Stok Masuk"
        variant="default"
        pending={pending}
        onConfirm={handleConfirmSubmit}
      />
    </div>
  )
}


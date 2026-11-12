'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createProductAction, updateProductAction } from '@/src/actions/catalog.actions'
import {
  formatDecimalToRupiahInput,
  formatRupiahTyping,
  parseRupiahInputToDecimal,
} from '@/src/lib/format'
import { createProductSchema } from '@/src/lib/validation/catalog'

export type ProductItem = {
  id: string
  categoryId: string | null
  categoryName: string | null
  name: string
  sku: string
  barcode: string | null
  description: string | null
  unit: string
  costPrice: string
  sellingPrice: string
  minimumStock: number
  isActive: boolean
  deletedAt: Date | string | null
}

export type CategoryOption = {
  id: string
  name: string
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  categories,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: ProductItem | null
  categories: CategoryOption[]
  onSuccess: (message: string) => void
}) {
  const isEditing = Boolean(product)

  const [name, setName] = useState(product?.name ?? '')
  const [sku, setSku] = useState(product?.sku ?? '')
  const [barcode, setBarcode] = useState(product?.barcode ?? '')
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? '')
  const [unit, setUnit] = useState(product?.unit ?? 'pcs')
  const [costPrice, setCostPrice] = useState(
    product ? formatDecimalToRupiahInput(product.costPrice) : '0',
  )
  const [sellingPrice, setSellingPrice] = useState(
    product ? formatDecimalToRupiahInput(product.sellingPrice) : '0',
  )
  const [minimumStock, setMinimumStock] = useState(
    product ? String(product.minimumStock) : '0',
  )
  const [description, setDescription] = useState(product?.description ?? '')
  const [pending, setPending] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return

    setFormError('')
    setFieldErrors({})

    const parsed = createProductSchema.safeParse({
      name,
      sku,
      barcode,
      categoryId: categoryId || null,
      unit,
      costPrice: parseRupiahInputToDecimal(costPrice),
      sellingPrice: parseRupiahInputToDecimal(sellingPrice),
      minimumStock,
      description,
    })

    if (!parsed.success) {
      setFieldErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      )
      return
    }

    setPending(true)
    try {
      const result =
        isEditing && product
          ? await updateProductAction(product.id, parsed.data)
          : await createProductAction(parsed.data)

      if (!result.ok) {
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
        return
      }

      onOpenChange(false)
      onSuccess(isEditing ? 'Produk berhasil diperbarui.' : 'Produk berhasil ditambahkan.')
    } catch {
      setFormError('Terjadi kendala saat menyimpan produk. Coba lagi.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !pending && onOpenChange(nextOpen)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Produk' : 'Tambah Produk'}</DialogTitle>
          <DialogDescription>
            Lengkapi informasi katalog produk. Jumlah stok hanya dapat diubah melalui mutasi stok.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-4">
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={Boolean(fieldErrors.name)} className="sm:col-span-2">
                <FieldLabel htmlFor="product-name">Nama produk *</FieldLabel>
                <Input
                  id="product-name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Kopi Susu Gula Aren 250ml"
                  maxLength={180}
                  required
                  disabled={pending}
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? 'product-name-error' : undefined}
                />
                {fieldErrors.name ? (
                  <FieldError id="product-name-error">{fieldErrors.name}</FieldError>
                ) : null}
              </Field>

              <Field data-invalid={Boolean(fieldErrors.sku)}>
                <FieldLabel htmlFor="product-sku">SKU *</FieldLabel>
                <Input
                  id="product-sku"
                  name="sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Contoh: KSGA-250"
                  maxLength={80}
                  required
                  disabled={pending}
                  aria-invalid={Boolean(fieldErrors.sku)}
                  aria-describedby={fieldErrors.sku ? 'product-sku-error' : 'product-sku-hint'}
                />
                {fieldErrors.sku ? (
                  <FieldError id="product-sku-error">{fieldErrors.sku}</FieldError>
                ) : (
                  <FieldDescription id="product-sku-hint">
                    Otomatis disimpan dalam huruf kapital.
                  </FieldDescription>
                )}
              </Field>

              <Field data-invalid={Boolean(fieldErrors.barcode)}>
                <FieldLabel htmlFor="product-barcode">Barcode (opsional)</FieldLabel>
                <Input
                  id="product-barcode"
                  name="barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Contoh: 8991234567890"
                  maxLength={100}
                  disabled={pending}
                  aria-invalid={Boolean(fieldErrors.barcode)}
                  aria-describedby={fieldErrors.barcode ? 'product-barcode-error' : undefined}
                />
                {fieldErrors.barcode ? (
                  <FieldError id="product-barcode-error">{fieldErrors.barcode}</FieldError>
                ) : null}
              </Field>

              <Field data-invalid={Boolean(fieldErrors.categoryId)}>
                <FieldLabel htmlFor="product-category">Kategori (opsional)</FieldLabel>
                <select
                  id="product-category"
                  name="categoryId"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={pending}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Tanpa kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.categoryId ? (
                  <FieldError>{fieldErrors.categoryId}</FieldError>
                ) : null}
              </Field>

              <Field data-invalid={Boolean(fieldErrors.unit)}>
                <FieldLabel htmlFor="product-unit">Satuan *</FieldLabel>
                <Input
                  id="product-unit"
                  name="unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="pcs"
                  maxLength={30}
                  required
                  disabled={pending}
                  aria-invalid={Boolean(fieldErrors.unit)}
                  aria-describedby={fieldErrors.unit ? 'product-unit-error' : undefined}
                />
                {fieldErrors.unit ? (
                  <FieldError id="product-unit-error">{fieldErrors.unit}</FieldError>
                ) : null}
              </Field>

              <Field data-invalid={Boolean(fieldErrors.costPrice)}>
                <FieldLabel htmlFor="product-cost-price">Harga modal (Rp)</FieldLabel>
                <div className="relative">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-muted-foreground"
                  >
                    Rp
                  </span>
                  <Input
                    id="product-cost-price"
                    name="costPrice"
                    inputMode="decimal"
                    className="pl-9 tabular-nums"
                    value={costPrice}
                    onChange={(e) => setCostPrice(formatRupiahTyping(e.target.value))}
                    placeholder="0"
                    disabled={pending}
                    aria-invalid={Boolean(fieldErrors.costPrice)}
                    aria-describedby={fieldErrors.costPrice ? 'product-cost-error' : undefined}
                  />
                </div>
                {fieldErrors.costPrice ? (
                  <FieldError id="product-cost-error">{fieldErrors.costPrice}</FieldError>
                ) : null}
              </Field>

              <Field data-invalid={Boolean(fieldErrors.sellingPrice)}>
                <FieldLabel htmlFor="product-selling-price">Harga jual (Rp)</FieldLabel>
                <div className="relative">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-muted-foreground"
                  >
                    Rp
                  </span>
                  <Input
                    id="product-selling-price"
                    name="sellingPrice"
                    inputMode="decimal"
                    className="pl-9 tabular-nums"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(formatRupiahTyping(e.target.value))}
                    placeholder="0"
                    disabled={pending}
                    aria-invalid={Boolean(fieldErrors.sellingPrice)}
                    aria-describedby={fieldErrors.sellingPrice ? 'product-selling-error' : undefined}
                  />
                </div>
                {fieldErrors.sellingPrice ? (
                  <FieldError id="product-selling-error">{fieldErrors.sellingPrice}</FieldError>
                ) : null}
              </Field>

              <Field data-invalid={Boolean(fieldErrors.minimumStock)} className="sm:col-span-2">
                <FieldLabel htmlFor="product-minimum-stock">Stok minimum</FieldLabel>
                <Input
                  id="product-minimum-stock"
                  name="minimumStock"
                  type="number"
                  min={0}
                  step={1}
                  value={minimumStock}
                  onChange={(e) => setMinimumStock(e.target.value)}
                  disabled={pending}
                  aria-invalid={Boolean(fieldErrors.minimumStock)}
                  aria-describedby={
                    fieldErrors.minimumStock ? 'product-min-stock-error' : undefined
                  }
                />
                {fieldErrors.minimumStock ? (
                  <FieldError id="product-min-stock-error">{fieldErrors.minimumStock}</FieldError>
                ) : null}
              </Field>

              <Field data-invalid={Boolean(fieldErrors.description)} className="sm:col-span-2">
                <FieldLabel htmlFor="product-description">Deskripsi (opsional)</FieldLabel>
                <Textarea
                  id="product-description"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Catatan tambahan mengenai produk"
                  maxLength={1000}
                  disabled={pending}
                  aria-invalid={Boolean(fieldErrors.description)}
                  aria-describedby={
                    fieldErrors.description ? 'product-description-error' : undefined
                  }
                />
                {fieldErrors.description ? (
                  <FieldError id="product-description-error">{fieldErrors.description}</FieldError>
                ) : null}
              </Field>
            </div>
          </FieldGroup>

          {formError ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/25 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive"
            >
              {formError}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Menyimpan…' : isEditing ? 'Simpan Perubahan' : 'Simpan Produk'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


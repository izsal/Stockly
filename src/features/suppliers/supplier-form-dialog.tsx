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
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createSupplierAction, updateSupplierAction } from '@/src/actions/inventory.actions'
import { supplierInputSchema } from '@/src/lib/validation/inventory'

export type SupplierItem = {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export function SupplierFormDialog({
  open,
  onOpenChange,
  supplier,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier: SupplierItem | null
  onSuccess: (message: string) => void
}) {
  const isEditing = Boolean(supplier)
  const [name, setName] = useState(supplier?.name ?? '')
  const [phone, setPhone] = useState(supplier?.phone ?? '')
  const [email, setEmail] = useState(supplier?.email ?? '')
  const [address, setAddress] = useState(supplier?.address ?? '')
  const [notes, setNotes] = useState(supplier?.notes ?? '')
  const [pending, setPending] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return

    setFormError('')
    setFieldErrors({})

    const parsed = supplierInputSchema.safeParse({ name, phone, email, address, notes })
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
        isEditing && supplier
          ? await updateSupplierAction(supplier.id, parsed.data)
          : await createSupplierAction(parsed.data)

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
      onSuccess(isEditing ? 'Supplier berhasil diperbarui.' : 'Supplier berhasil ditambahkan.')
    } catch {
      setFormError('Terjadi kendala saat menyimpan supplier. Coba lagi.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !pending && onOpenChange(nextOpen)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Supplier' : 'Tambah Supplier'}</DialogTitle>
          <DialogDescription>
            Catat informasi pemasok agar pencatatan stok masuk lebih rapi dan mudah dilacak.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-4">
          <FieldGroup>
            <Field data-invalid={Boolean(fieldErrors.name)}>
              <FieldLabel htmlFor="supplier-name">Nama supplier *</FieldLabel>
              <Input
                id="supplier-name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: PT Sumber Makmur Jaya"
                maxLength={160}
                required
                disabled={pending}
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? 'supplier-name-error' : undefined}
              />
              {fieldErrors.name ? (
                <FieldError id="supplier-name-error">{fieldErrors.name}</FieldError>
              ) : null}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={Boolean(fieldErrors.phone)}>
                <FieldLabel htmlFor="supplier-phone">Telepon / WhatsApp</FieldLabel>
                <Input
                  id="supplier-phone"
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812-3456-7890"
                  maxLength={40}
                  disabled={pending}
                  aria-invalid={Boolean(fieldErrors.phone)}
                  aria-describedby={fieldErrors.phone ? 'supplier-phone-error' : undefined}
                />
                {fieldErrors.phone ? (
                  <FieldError id="supplier-phone-error">{fieldErrors.phone}</FieldError>
                ) : null}
              </Field>

              <Field data-invalid={Boolean(fieldErrors.email)}>
                <FieldLabel htmlFor="supplier-email">Email</FieldLabel>
                <Input
                  id="supplier-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="order@supplier.id"
                  maxLength={255}
                  disabled={pending}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'supplier-email-error' : undefined}
                />
                {fieldErrors.email ? (
                  <FieldError id="supplier-email-error">{fieldErrors.email}</FieldError>
                ) : null}
              </Field>
            </div>

            <Field data-invalid={Boolean(fieldErrors.address)}>
              <FieldLabel htmlFor="supplier-address">Alamat (opsional)</FieldLabel>
              <Textarea
                id="supplier-address"
                name="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Alamat gudang atau kantor pemasok"
                maxLength={1000}
                rows={2}
                disabled={pending}
                aria-invalid={Boolean(fieldErrors.address)}
                aria-describedby={fieldErrors.address ? 'supplier-address-error' : undefined}
              />
              {fieldErrors.address ? (
                <FieldError id="supplier-address-error">{fieldErrors.address}</FieldError>
              ) : null}
            </Field>

            <Field data-invalid={Boolean(fieldErrors.notes)}>
              <FieldLabel htmlFor="supplier-notes">Catatan (opsional)</FieldLabel>
              <Textarea
                id="supplier-notes"
                name="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Jadwal kirim, termin pembayaran, atau PIC"
                maxLength={1000}
                rows={2}
                disabled={pending}
                aria-invalid={Boolean(fieldErrors.notes)}
                aria-describedby={fieldErrors.notes ? 'supplier-notes-error' : undefined}
              />
              {fieldErrors.notes ? (
                <FieldError id="supplier-notes-error">{fieldErrors.notes}</FieldError>
              ) : null}
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
              {pending ? 'Menyimpan…' : isEditing ? 'Simpan Perubahan' : 'Simpan Supplier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


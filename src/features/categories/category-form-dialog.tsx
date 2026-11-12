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
import { createCategoryAction, updateCategoryAction } from '@/src/actions/catalog.actions'
import { categoryInputSchema } from '@/src/lib/validation/catalog'

export type CategoryItem = {
  id: string
  name: string
  description: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: CategoryItem | null
  onSuccess: (message: string) => void
}) {
  const isEditing = Boolean(category)
  const [name, setName] = useState(category?.name ?? '')
  const [description, setDescription] = useState(category?.description ?? '')
  const [pending, setPending] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return

    setFormError('')
    setFieldErrors({})

    const parsed = categoryInputSchema.safeParse({ name, description })
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
      const result = isEditing && category
        ? await updateCategoryAction(category.id, parsed.data)
        : await createCategoryAction(parsed.data)

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
      onSuccess(isEditing ? 'Kategori berhasil diperbarui.' : 'Kategori berhasil ditambahkan.')
    } catch {
      setFormError('Terjadi kendala saat menyimpan kategori. Coba lagi.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !pending && onOpenChange(nextOpen)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle>
          <DialogDescription>
            Kelompokkan produk agar lebih mudah dicari dan difilter.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-4">
          <FieldGroup>
            <Field data-invalid={Boolean(fieldErrors.name)}>
              <FieldLabel htmlFor="category-name">Nama kategori *</FieldLabel>
              <Input
                id="category-name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Minuman Kemasan"
                maxLength={100}
                required
                disabled={pending}
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? 'category-name-error' : undefined}
              />
              {fieldErrors.name ? (
                <FieldError id="category-name-error">{fieldErrors.name}</FieldError>
              ) : null}
            </Field>

            <Field data-invalid={Boolean(fieldErrors.description)}>
              <FieldLabel htmlFor="category-description">Deskripsi (opsional)</FieldLabel>
              <Textarea
                id="category-description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Catatan singkat mengenai kategori ini"
                maxLength={1000}
                disabled={pending}
                aria-invalid={Boolean(fieldErrors.description)}
                aria-describedby={
                  fieldErrors.description ? 'category-description-error' : undefined
                }
              />
              {fieldErrors.description ? (
                <FieldError id="category-description-error">{fieldErrors.description}</FieldError>
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
              {pending ? 'Menyimpan…' : isEditing ? 'Simpan Perubahan' : 'Simpan Kategori'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


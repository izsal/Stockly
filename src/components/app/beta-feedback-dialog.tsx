'use client'

import { useState, type FormEvent } from 'react'
import { usePathname } from 'next/navigation'
import { toast } from '@yusufceng1z/ding-react'
import { MessageSquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ModernSelect } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  BETA_FEEDBACK_RATING_LABELS,
  BETA_FEEDBACK_TYPES,
  BETA_FEEDBACK_TYPE_LABELS,
  betaFeedbackSchema,
  type BetaFeedbackType,
} from '@/src/lib/validation/feedback'

export function BetaFeedbackButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Kirim masukan beta"
        title="Kirim masukan beta atau laporkan kendala"
      >
        <MessageSquarePlus data-icon="inline-start" />
        <span className="hidden sm:inline">Masukan Beta</span>
      </Button>

      {open ? <BetaFeedbackDialog open={open} onOpenChange={setOpen} /> : null}
    </>
  )
}

function BetaFeedbackDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const pathname = usePathname() || '/dashboard'
  const [type, setType] = useState<BetaFeedbackType>('USABILITY')
  const [rating, setRating] = useState<number>(4)
  const [summary, setSummary] = useState('')
  const [details, setDetails] = useState('')
  const [pending, setPending] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return

    setFormError('')
    setFieldErrors({})

    const parsed = betaFeedbackSchema.safeParse({
      type,
      rating,
      pagePath: pathname,
      summary,
      details,
      viewportWidth: typeof window !== 'undefined' ? window.innerWidth : undefined,
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
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(parsed.data),
      })

      const body = (await response.json().catch(() => null)) as
        | { message?: string; errors?: Record<string, string[] | undefined> }
        | null

      if (!response.ok) {
        if (body?.errors) {
          setFieldErrors(
            Object.fromEntries(
              Object.entries(body.errors)
                .filter(([, msgs]) => Boolean(msgs?.length))
                .map(([key, msgs]) => [key, msgs![0]]),
            ),
          )
        }
        setFormError(body?.message ?? 'Masukan belum dapat dikirim. Coba lagi.')
        return
      }

      onOpenChange(false)
      toast.success(body?.message ?? 'Terima kasih! Masukan Anda telah dicatat.')
    } catch {
      setFormError('Koneksi bermasalah saat mengirim masukan. Coba lagi.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !pending && onOpenChange(nextOpen)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Masukan Uji Coba Beta</DialogTitle>
          <DialogDescription>
            Bantu kami menyempurnakan Stockly. Laporkan kendala penghambat atau bagikan pengalaman Anda di halaman ini.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={Boolean(fieldErrors.type)}>
                <FieldLabel htmlFor="feedback-type">Jenis masukan</FieldLabel>
                <ModernSelect
                  id="feedback-type"
                  value={type}
                  onValueChange={(nextValue) => setType(nextValue as BetaFeedbackType)}
                  disabled={pending}
                  options={BETA_FEEDBACK_TYPES.map((item) => ({
                    value: item,
                    label: BETA_FEEDBACK_TYPE_LABELS[item],
                  }))}
                  className="w-full min-w-0"
                />
                {fieldErrors.type ? <FieldError>{fieldErrors.type}</FieldError> : null}
              </Field>

              <Field data-invalid={Boolean(fieldErrors.rating)}>
                <FieldLabel htmlFor="feedback-rating">Kemudahan penggunaan</FieldLabel>
                <ModernSelect
                  id="feedback-rating"
                  value={String(rating)}
                  onValueChange={(nextValue) => setRating(Number(nextValue))}
                  disabled={pending}
                  options={[5, 4, 3, 2, 1].map((score) => ({
                    value: String(score),
                    label: BETA_FEEDBACK_RATING_LABELS[score],
                  }))}
                  className="w-full min-w-0"
                />
                {fieldErrors.rating ? <FieldError>{fieldErrors.rating}</FieldError> : null}
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="feedback-page">Halaman terkait</FieldLabel>
              <Input id="feedback-page" value={pathname} readOnly disabled className="bg-muted/50" />
            </Field>

            <Field data-invalid={Boolean(fieldErrors.summary)}>
              <FieldLabel htmlFor="feedback-summary">Ringkasan</FieldLabel>
              <Input
                id="feedback-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Contoh: Filter laporan mudah dipahami"
                disabled={pending}
                aria-invalid={Boolean(fieldErrors.summary)}
              />
              {fieldErrors.summary ? <FieldError>{fieldErrors.summary}</FieldError> : null}
            </Field>

            <Field data-invalid={Boolean(fieldErrors.details)}>
              <FieldLabel htmlFor="feedback-details">Detail masukan / langkah kendala</FieldLabel>
              <Textarea
                id="feedback-details"
                rows={4}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Ceritakan bagian yang sudah nyaman atau kendala yang Anda temui..."
                disabled={pending}
                aria-invalid={Boolean(fieldErrors.details)}
              />
              <FieldDescription>
                Jangan sertakan kata sandi atau data rahasia dalam masukan.
              </FieldDescription>
              {fieldErrors.details ? <FieldError>{fieldErrors.details}</FieldError> : null}
            </Field>
          </FieldGroup>

          {formError ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
            >
              {formError}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Mengirim…' : 'Kirim Masukan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


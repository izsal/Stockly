'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { authClient } from '@/src/lib/auth-client'
import {
  registerInputSchema,
  signInInputSchema,
  signUpFormSchema,
} from '@/src/lib/validation/auth'

type AuthMode = 'sign-in' | 'sign-up'
type FieldErrors = Record<string, string>

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter()
  const isSignUp = mode === 'sign-up'
  const [pending, setPending] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    setFieldErrors({})

    const formData = new FormData(event.currentTarget)
    const rawValues = Object.fromEntries(formData.entries())
    const parsed = isSignUp
      ? signUpFormSchema.safeParse(rawValues)
      : signInInputSchema.safeParse(rawValues)

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
      if (isSignUp) {
        const registration = registerInputSchema.parse(parsed.data)
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(registration),
        })

        if (!response.ok) {
          const result = (await response.json().catch(() => null)) as
            | { message?: string }
            | null
          setFormError(result?.message ?? 'Pendaftaran belum berhasil. Coba lagi.')
          return
        }
      } else {
        const result = await authClient.signIn.email(parsed.data)
        if (result.error) {
          if (result.error.status === 429) {
            setFormError(
              result.error.message ||
                'Terlalu banyak percobaan masuk. Silakan tunggu beberapa saat lalu coba lagi.',
            )
          } else {
            setFormError('Email atau kata sandi tidak cocok. Periksa kembali lalu coba lagi.')
          }
          return
        }
      }

      router.replace('/dashboard')
      router.refresh()
    } catch {
      setFormError('Terjadi kendala. Periksa koneksi lalu coba lagi.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="border-border/80 shadow-xl shadow-foreground/[0.04]">
      <CardHeader className="gap-2 px-6 pt-7 sm:px-8 sm:pt-8">
        <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          {isSignUp ? 'Buat akun' : 'Selamat datang kembali'}
        </p>
        <CardTitle className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
          <h1>{isSignUp ? 'Mulai dengan Stockly' : 'Masuk ke Stockly'}</h1>
        </CardTitle>
        <CardDescription className="text-sm leading-6">
          {isSignUp
            ? 'Buat ruang kerja dan siapkan gudang utama dalam satu langkah.'
            : 'Masuk untuk melanjutkan ke ruang kerja bisnis Anda.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-7 sm:px-8 sm:pb-8">
        <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-5">
          <FieldGroup>
            {isSignUp && (
              <Field data-invalid={Boolean(fieldErrors.name)}>
                <FieldLabel htmlFor="name">Nama lengkap</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  placeholder="Nama Anda"
                  maxLength={80}
                  required
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                />
                {fieldErrors.name && <FieldError id="name-error">{fieldErrors.name}</FieldError>}
              </Field>
            )}
            <Field data-invalid={Boolean(fieldErrors.email)}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="nama@bisnis.com"
                maxLength={255}
                required
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              />
              {fieldErrors.email && <FieldError id="email-error">{fieldErrors.email}</FieldError>}
            </Field>
            <Field data-invalid={Boolean(fieldErrors.password)}>
              <FieldLabel htmlFor="password">Kata sandi</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                placeholder={isSignUp ? 'Minimal 8 karakter' : 'Masukkan kata sandi'}
                maxLength={128}
                required
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              />
              {fieldErrors.password ? (
                <FieldError id="password-error">{fieldErrors.password}</FieldError>
              ) : isSignUp ? (
                <FieldDescription>Gunakan minimal 8 karakter.</FieldDescription>
              ) : null}
            </Field>
            {isSignUp && (
              <Field data-invalid={Boolean(fieldErrors.confirmPassword)}>
                <FieldLabel htmlFor="confirmPassword">Konfirmasi kata sandi</FieldLabel>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Ulangi kata sandi"
                  maxLength={128}
                  required
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                  aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined}
                />
                {fieldErrors.confirmPassword && (
                  <FieldError id="confirm-password-error">{fieldErrors.confirmPassword}</FieldError>
                )}
              </Field>
            )}
          </FieldGroup>

          {formError && (
            <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive/5 px-3.5 py-3 text-sm text-destructive">
              {formError}
            </p>
          )}

          <Button type="submit" size="lg" className="mt-1 h-11 w-full" disabled={pending}>
            {pending ? 'Sedang memproses…' : isSignUp ? 'Buat akun' : 'Masuk'}
            {!pending && <ArrowRight data-icon="inline-end" />}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignUp ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
          <Link
            href={isSignUp ? '/sign-in' : '/sign-up'}
            className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
          >
            {isSignUp ? 'Masuk' : 'Daftar'}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

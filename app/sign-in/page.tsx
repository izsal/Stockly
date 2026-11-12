import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/src/components/auth/auth-form'
import { AuthLayout } from '@/src/components/auth/auth-layout'
import { getSession } from '@/src/lib/auth-session'

export const metadata: Metadata = {
  title: 'Masuk',
  robots: { index: false, follow: false },
}

export default async function SignInPage() {
  const session = await getSession()
  if (session?.user) redirect('/dashboard')

  return (
    <AuthLayout>
      <AuthForm mode="sign-in" />
    </AuthLayout>
  )
}

'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { authClient } from '@/src/lib/auth-client'

export function LogoutButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleSignOut() {
    setPending(true)
    const result = await authClient.signOut()
    if (result.error) {
      setPending(false)
      return
    }

    router.replace('/sign-in')
    router.refresh()
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleSignOut}
      disabled={pending}
    >
      <LogOut data-icon="inline-start" />
      {pending ? 'Keluar…' : 'Keluar'}
    </Button>
  )
}

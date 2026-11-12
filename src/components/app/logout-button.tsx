'use client'

import { useState } from 'react'
import { toast } from '@yusufceng1z/ding-react'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { authClient } from '@/src/lib/auth-client'

export function LogoutButton({
  variant = 'header',
  collapsed = false,
}: {
  variant?: 'header' | 'sidebar'
  collapsed?: boolean
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleSignOut() {
    if (pending) return
    setPending(true)

    try {
      const result = await authClient.signOut()
      if (result?.error) {
        toast.error(result.error.message || 'Gagal keluar dari sesi. Silakan coba lagi.')
        setPending(false)
        return
      }

      router.replace('/')
      router.refresh()
    } catch {
      toast.error('Koneksi bermasalah saat keluar. Silakan coba lagi.')
      setPending(false)
    }
  }

  if (variant === 'sidebar') {
    const label = pending ? 'Keluar…' : 'Keluar'
    return (
      <button
        type="button"
        onClick={handleSignOut}
        disabled={pending}
        title={collapsed ? label : undefined}
        aria-label={collapsed ? label : undefined}
        className={cn(
          'flex items-center rounded-lg border border-transparent py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:bg-background hover:text-destructive focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50',
          collapsed ? 'justify-center px-2' : 'gap-2.5 px-3',
        )}
      >
        <LogOut className="size-4 shrink-0" aria-hidden="true" />
        <span className={cn(collapsed && 'sr-only')}>{label}</span>
      </button>
    )
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

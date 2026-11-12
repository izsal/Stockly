'use client'

import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function ErrorState({
  title = 'Gagal memuat data',
  description = 'Terjadi kendala saat mengambil data dari server. Silakan coba lagi.',
  onRetry,
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <Card role="alert">
      <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
        <span
          className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"
          aria-hidden="true"
        >
          <AlertTriangle className="size-6" />
        </span>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
        {onRetry ? (
          <Button type="button" variant="outline" className="mt-5" onClick={onRetry}>
            <RotateCcw data-icon="inline-start" />
            Coba lagi
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}


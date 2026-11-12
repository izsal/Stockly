'use client'

import { ErrorState } from '@/src/components/shared/error-state'

export default function SuppliersError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      title="Gagal memuat daftar supplier"
      description="Terjadi kendala saat mengambil data supplier. Silakan coba lagi."
      onRetry={reset}
    />
  )
}


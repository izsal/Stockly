'use client'

import { ErrorState } from '@/src/components/shared/error-state'

export default function CategoriesError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      title="Gagal memuat daftar kategori"
      description="Terjadi kendala saat mengambil data kategori. Silakan coba lagi."
      onRetry={reset}
    />
  )
}


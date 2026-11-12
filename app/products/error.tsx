'use client'

import { ErrorState } from '@/src/components/shared/error-state'

export default function ProductsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      title="Gagal memuat daftar produk"
      description="Terjadi kendala saat mengambil data produk. Silakan coba lagi."
      onRetry={reset}
    />
  )
}


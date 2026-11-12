'use client'

import { ErrorState } from '@/src/components/shared/error-state'

export default function StockInError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      title="Gagal memuat halaman stok masuk"
      description="Terjadi kendala saat mengambil data produk atau supplier. Silakan coba lagi."
      onRetry={reset}
    />
  )
}


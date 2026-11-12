'use client'

import { ErrorState } from '@/src/components/shared/error-state'

export default function StockOutError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      title="Gagal memuat halaman stok keluar"
      description="Terjadi kendala saat mengambil data produk dan stok. Silakan coba lagi."
      onRetry={reset}
    />
  )
}


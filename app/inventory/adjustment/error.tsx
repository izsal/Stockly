'use client'

import { ErrorState } from '@/src/components/shared/error-state'

export default function StockAdjustmentError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      title="Gagal memuat halaman penyesuaian stok"
      description="Terjadi kendala saat mengambil data produk dan stok. Silakan coba lagi."
      onRetry={reset}
    />
  )
}


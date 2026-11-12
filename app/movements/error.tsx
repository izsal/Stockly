'use client'

import { ErrorState } from '@/src/components/shared/error-state'

export default function MovementsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      title="Gagal memuat riwayat stok"
      description="Terjadi kendala saat mengambil catatan pergerakan stok. Silakan coba lagi."
      onRetry={reset}
    />
  )
}


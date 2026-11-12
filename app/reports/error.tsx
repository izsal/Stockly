'use client'

import { ErrorState } from '@/src/components/shared/error-state'

export default function ReportsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      title="Gagal memuat laporan"
      description="Terjadi kendala saat mengambil data laporan inventaris. Silakan coba lagi."
      onRetry={reset}
    />
  )
}


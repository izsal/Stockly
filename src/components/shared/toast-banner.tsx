'use client'

import { CheckCircle2, X, AlertCircle } from 'lucide-react'

export type ToastMessage = {
  id: number
  type: 'success' | 'error'
  text: string
}

export function ToastBanner({
  toast,
  onDismiss,
}: {
  toast: ToastMessage | null
  onDismiss: () => void
}) {
  if (!toast) return null

  const isError = toast.type === 'error'

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live="polite"
      className={`fixed bottom-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${
        isError
          ? 'border-red-200 bg-red-50 text-red-900'
          : 'border-emerald-200 bg-emerald-50 text-emerald-900'
      }`}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
      )}
      <p className="flex-1 leading-5 font-medium">{toast.text}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Tutup notifikasi"
        className="rounded p-0.5 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-ring"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}


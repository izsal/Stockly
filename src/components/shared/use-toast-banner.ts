'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ToastMessage } from './toast-banner'

export function useToastBanner(autoHideMs = 4500) {
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dismissToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setToast(null)
  }, [])

  const showToast = useCallback(
    (type: ToastMessage['type'], text: string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      setToast({ id: Date.now(), type, text })
      timerRef.current = setTimeout(() => {
        setToast(null)
        timerRef.current = null
      }, autoHideMs)
    },
    [autoHideMs],
  )

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return { toast, showToast, dismissToast }
}


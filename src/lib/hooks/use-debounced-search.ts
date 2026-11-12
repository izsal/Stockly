'use client'

import { useEffect, useRef } from 'react'

/**
 * Triggers `onSearch` after `delayMs` when `value` diverges from `committedValue`.
 */
export function useDebouncedSearch(
  value: string,
  committedValue: string,
  onSearch: (nextValue: string) => void,
  delayMs = 350,
) {
  const onSearchRef = useRef(onSearch)

  useEffect(() => {
    onSearchRef.current = onSearch
  }, [onSearch])

  useEffect(() => {
    if (value === committedValue) return

    const timer = window.setTimeout(() => {
      onSearchRef.current(value)
    }, delayMs)

    return () => window.clearTimeout(timer)
  }, [value, committedValue, delayMs])
}


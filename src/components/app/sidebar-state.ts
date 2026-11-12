'use client'

import { useSyncExternalStore } from 'react'

const SIDEBAR_STORAGE_KEY = 'stockly-sidebar-collapsed'
const SIDEBAR_CHANGE_EVENT = 'stockly-sidebar-collapsed-change'

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === SIDEBAR_STORAGE_KEY) {
      callback()
    }
  }

  window.addEventListener('storage', handleStorage)
  window.addEventListener(SIDEBAR_CHANGE_EVENT, callback)

  return () => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener(SIDEBAR_CHANGE_EVENT, callback)
  }
}

function getSnapshot(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function getServerSnapshot(): boolean {
  return false
}

export function useSidebarCollapsed(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function toggleSidebarCollapsed(): void {
  if (typeof window === 'undefined') return
  const next = !getSnapshot()
  try {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
  } catch {
    // Ignore storage errors in restricted browsing contexts.
  }
  window.dispatchEvent(new Event(SIDEBAR_CHANGE_EVENT))
}


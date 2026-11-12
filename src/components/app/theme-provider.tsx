'use client'

import type { ReactNode } from 'react'
import { Toaster } from '@yusufceng1z/ding-react'
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes'

function ThemeToaster() {
  const { resolvedTheme } = useTheme()

  return (
    <Toaster
      position="top-center"
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      labels={{ region: 'Notifikasi', dismiss: 'Tutup notifikasi' }}
    />
  )
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
    >
      <ThemeToaster />
      {children}
    </NextThemesProvider>
  )
}


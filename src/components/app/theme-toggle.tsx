'use client'

import { useSyncExternalStore, type MouseEvent } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { flushSync } from 'react-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const emptySubscribe = () => () => {}

type ViewTransitionDocument = Document & {
  startViewTransition?: (updateCallback: () => void) => {
    ready: Promise<void>
  }
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )

  const isDark = mounted && resolvedTheme === 'dark'
  const label = isDark ? 'Ubah ke mode terang' : 'Ubah ke mode gelap'

  function handleToggle(event: MouseEvent<HTMLButtonElement>) {
    const nextTheme = isDark ? 'light' : 'dark'
    const doc = document as ViewTransitionDocument
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!doc.startViewTransition || prefersReducedMotion) {
      setTheme(nextTheme)
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const originX = event.clientX > 0 ? event.clientX : rect.left + rect.width / 2
    const originY = event.clientY > 0 ? event.clientY : rect.top + rect.height / 2
    const maxRadius = Math.hypot(
      Math.max(originX, window.innerWidth - originX),
      Math.max(originY, window.innerHeight - originY),
    )

    const transition = doc.startViewTransition(() => {
      flushSync(() => {
        setTheme(nextTheme)
      })
    })

    void transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${originX}px ${originY}px)`,
            `circle(${maxRadius}px at ${originX}px ${originY}px)`,
          ],
        },
        {
          duration: 420,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      )
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      onClick={handleToggle}
      aria-label={label}
      title={label}
      className="relative overflow-hidden"
    >
      <span className="relative flex size-4 items-center justify-center" aria-hidden="true">
        <Sun
          className={cn(
            'absolute size-4 transition-all duration-300',
            isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-90 opacity-0',
          )}
        />
        <Moon
          className={cn(
            'absolute size-4 transition-all duration-300',
            isDark ? 'scale-0 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100',
          )}
        />
      </span>
    </Button>
  )
}

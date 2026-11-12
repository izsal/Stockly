import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
        <span
          className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground"
          aria-hidden="true"
        >
          {icon}
        </span>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </CardContent>
    </Card>
  )
}


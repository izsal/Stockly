import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT_DIR = path.resolve(process.cwd())

function readSource(relPath: string): string {
  return fs.readFileSync(path.join(ROOT_DIR, relPath), 'utf8')
}

describe('Responsive layout safeguards across 375px, 768px, 1024px, and 1440px', () => {
  it('uses mobile drawer below lg (375px/768px) and collapsible sidebar grid at lg/xl (1024px/1440px)', () => {
    const shell = readSource('src/components/app/dashboard-shell.tsx')

    expect(shell).toContain("lg:grid-cols-[72px_minmax(0,1fr)]")
    expect(shell).toContain("lg:grid-cols-[248px_minmax(0,1fr)]")
    expect(shell).toContain('lg:hidden')
    expect(shell).toContain('max-w-7xl')
    expect(shell).toContain('min-w-0')
  })

  it('wraps data tables in horizontal scroll containers to prevent 375px viewport overflow', () => {
    const tableUi = readSource('components/ui/table.tsx')
    expect(tableUi).toContain('overflow-x-auto')
  })

  it('constrains filter select controls with w-full min-w-0 on narrow mobile screens', () => {
    const responsiveFilterFiles = [
      'src/features/products/products-view.tsx',
      'src/features/inventory/movements-view.tsx',
      'src/features/reports/reports-view.tsx',
      'src/components/app/beta-feedback-dialog.tsx',
    ]

    for (const file of responsiveFilterFiles) {
      const content = readSource(file)
      expect(content, `${file} should use w-full min-w-0 on select controls`).toContain(
        'w-full min-w-0',
      )
    }
  })

  it('adapts dashboard KPI and onboarding grids across mobile, tablet (768px), and desktop (1024px/1440px)', () => {
    const dashboard = readSource('src/features/dashboard/dashboard-view.tsx')
    expect(dashboard).toContain('sm:grid-cols-2')
    expect(dashboard).toContain('xl:grid-cols-4')
  })

  it('keeps public landing page responsive across 375px, 768px, 1024px, and 1440px', () => {
    const landing = readSource('src/components/marketing/landing-page.tsx')
    expect(landing).toContain('max-w-7xl')
    expect(landing).toContain('min-w-0')
    expect(landing).toContain('sm:grid-cols-2')
    expect(landing).toContain('lg:grid-cols-3')
  })
})


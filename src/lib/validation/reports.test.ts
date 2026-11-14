import { describe, expect, it } from 'vitest'
import {
  currentStockReportQuerySchema,
  getDefaultDateRange,
  monthlySalesQuerySchema,
  reportExportQuerySchema,
  resolveJakartaDateBounds,
} from './reports'

describe('reports validation and date helpers', () => {
  it('computes Jakarta default date range inclusively', () => {
    const fixedNow = new Date('2026-11-12T03:00:00.000Z') // 10:00 WIB on 2026-11-12
    const range = getDefaultDateRange(7, fixedNow)
    expect(range).toEqual({
      dateFrom: '2026-11-06',
      dateTo: '2026-11-12',
    })
  })

  it('swaps reversed date bounds and resolves Jakarta WIB timestamps', () => {
    const bounds = resolveJakartaDateBounds('2026-11-12', '2026-11-01')
    expect(bounds.dateFrom).toBe('2026-11-01')
    expect(bounds.dateTo).toBe('2026-11-12')
    expect(bounds.startDate?.toISOString()).toBe('2026-10-31T17:00:00.000Z')
    expect(bounds.endDate?.toISOString()).toBe('2026-11-12T16:59:59.999Z')
  })

  it('normalizes current stock report filters and rejects invalid export type', () => {
    const parsed = currentStockReportQuerySchema.parse({
      search: '  kopi ',
      categoryId: '',
      stockStatus: 'low',
    })
    expect(parsed).toEqual({
      search: 'kopi',
      categoryId: null,
      stockStatus: 'low',
      page: 1,
      pageSize: 10,
    })

    expect(reportExportQuerySchema.safeParse({ report: 'unknown' }).success).toBe(false)
  })

  it('validates monthly sales query parameters', () => {
    const parsed = monthlySalesQuerySchema.parse({
      year: '2026',
      categoryId: '11111111-1111-4111-8111-111111111111',
      reason: 'SALE',
    })
    expect(parsed).toEqual({
      year: 2026,
      categoryId: '11111111-1111-4111-8111-111111111111',
      reason: 'SALE',
    })
  })
})


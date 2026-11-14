import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import type { WorkspaceContext } from '@/src/lib/permissions/workspace'
import type { AppDatabase } from './helpers'
import { ReportService } from './report.service'

const OWNER_CTX: WorkspaceContext = {
  userId: 'user-owner',
  workspaceId: '11111111-1111-4111-8111-111111111111',
  role: 'OWNER',
}

const WAREHOUSE_ID = '22222222-2222-4222-8222-222222222222'

function createChainResult<T>(rows: T) {
  const result = Promise.resolve(rows) as Promise<T> & {
    innerJoin: ReturnType<typeof vi.fn>
    leftJoin: ReturnType<typeof vi.fn>
    where: ReturnType<typeof vi.fn>
    groupBy: ReturnType<typeof vi.fn>
    orderBy: ReturnType<typeof vi.fn>
    limit: ReturnType<typeof vi.fn>
    offset: ReturnType<typeof vi.fn>
  }

  result.innerJoin = vi.fn(() => result)
  result.leftJoin = vi.fn(() => result)
  result.where = vi.fn(() => result)
  result.groupBy = vi.fn(() => result)
  result.orderBy = vi.fn(() => result)
  result.limit = vi.fn(() => result)
  result.offset = vi.fn(() => result)

  return result
}

describe('ReportService', () => {
  it('blocks unauthorized users before querying the database', async () => {
    const fakeDb = { select: vi.fn() } as unknown as AppDatabase

    await expect(
      ReportService.getDashboardSummary(
        { userId: '', workspaceId: OWNER_CTX.workspaceId, role: 'OWNER' },
        {},
        fakeDb,
      ),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' })

    expect(fakeDb.select).not.toHaveBeenCalled()
  })

  it('returns dashboard KPIs, movement summary, and attention products for the workspace', async () => {
    const responses = [
      [{ id: WAREHOUSE_ID, name: 'Gudang Utama' }],
      [
        {
          totalActiveProducts: 12,
          totalStockUnits: 145,
          lowStockProducts: 3,
          outOfStockProducts: 1,
        },
      ],
      [
        {
          totalMovements: 9,
          stockInCount: 4,
          stockInUnits: 50,
          stockOutCount: 4,
          stockOutUnits: 20,
          adjustmentCount: 1,
          netDelta: 28,
        },
      ],
      [
        {
          id: 'm-1',
          productId: 'p-1',
          productName: 'Kopi Arabika',
          productSku: 'KOPI-01',
          productUnit: 'pcs',
          actorName: 'Budi',
          type: 'IN',
          quantityDelta: 10,
          quantityBefore: 5,
          quantityAfter: 15,
          reason: 'PURCHASE',
          createdAt: new Date('2026-11-12T03:00:00Z'),
        },
      ],
      [
        {
          id: 'p-2',
          name: 'Gula Pasir',
          sku: 'GULA-01',
          unit: 'kg',
          minimumStock: 5,
          currentStock: 0,
        },
      ],
    ]

    let idx = 0
    const select = vi.fn(() => ({
      from: vi.fn(() => createChainResult(responses[idx++] ?? [])),
    }))
    const fakeDb = { select } as unknown as AppDatabase

    const summary = await ReportService.getDashboardSummary(
      OWNER_CTX,
      { dateFrom: '2026-11-06', dateTo: '2026-11-12' },
      fakeDb,
    )

    expect(summary.defaultWarehouse?.name).toBe('Gudang Utama')
    expect(summary.kpis).toEqual({
      totalActiveProducts: 12,
      totalStockUnits: 145,
      totalInventoryValue: 0,
      lowStockProducts: 3,
      outOfStockProducts: 1,
    })
    expect(summary.movementSummary.stockInUnits).toBe(50)
    expect(summary.attentionProducts[0].status).toBe('OUT')
  })

  it('exports current stock CSV with workspace data and formula-safe headers/cells', async () => {
    const responses = [
      [{ id: WAREHOUSE_ID, name: 'Gudang Utama' }],
      [
        {
          id: 'p-1',
          name: 'Teh, Hijau',
          sku: 'TEH-01',
          barcode: null,
          categoryName: 'Minuman',
          unit: 'pcs',
          minimumStock: 10,
          currentStock: 4,
          costPrice: '5000.00',
          sellingPrice: '8000.00',
        },
      ],
      [{ total: 1, totalUnits: 4 }],
    ]

    let idx = 0
    const select = vi.fn(() => ({
      from: vi.fn(() => createChainResult(responses[idx++] ?? [])),
    }))
    const fakeDb = { select } as unknown as AppDatabase

    const exported = await ReportService.exportReportCsv(
      OWNER_CTX,
      { report: 'current-stock', stockStatus: 'low' },
      fakeDb,
    )

    expect(exported.filename).toBe('stockly-laporan-stok-saat-ini.csv')
    expect(exported.csv).toContain('"Teh, Hijau"')
    expect(exported.csv).toContain('Menipis')
  })

  it('returns monthly sales breakdown, available years, and peak month', async () => {
    const monthlyRows = [
      {
        month: 3,
        revenue: '15000000.00',
        profit: '5000000.00',
        units: 120,
        transactionCount: 15,
      },
      {
        month: 11,
        revenue: '25000000.00',
        profit: '8000000.00',
        units: 180,
        transactionCount: 22,
      },
    ]
    const yearRows = [{ year: 2026 }, { year: 2025 }]

    const responses = [monthlyRows, yearRows]
    let idx = 0
    const select = vi.fn(() => ({
      from: vi.fn(() => createChainResult(responses[idx++] ?? [])),
    }))
    const fakeDb = { select } as unknown as AppDatabase

    const sales = await ReportService.getMonthlySales(
      OWNER_CTX,
      { year: 2026, reason: 'SALE' },
      fakeDb,
    )

    expect(sales.year).toBe(2026)
    expect(sales.monthlyData).toHaveLength(12)
    expect(sales.monthlyData[2].revenue).toBe(15000000)
    expect(sales.monthlyData[10].revenue).toBe(25000000)
    expect(sales.annualSummary.totalRevenue).toBe(40000000)
    expect(sales.annualSummary.totalUnits).toBe(300)
    expect(sales.annualSummary.totalTransactions).toBe(37)
    expect(sales.annualSummary.peakMonth?.monthLabel).toBe('Nov')
    expect(sales.availableYears).toContain(2026)
    expect(sales.availableYears).toContain(2025)
  })
})


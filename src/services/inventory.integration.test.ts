import { randomUUID } from 'node:crypto'
import { PgDialect } from 'drizzle-orm/pg-core'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  inventoryMovements,
  inventoryStocks,
  products,
  suppliers,
  warehouses,
} from '@/src/db/schema'
import { escapeCsvCell } from '@/src/lib/csv'
import type { WorkspaceContext } from '@/src/lib/permissions/workspace'
import type { AppDatabase } from './helpers'
import { reconcileLedgerBalance } from './inventory-calculations'
import { InventoryService } from './inventory.service'

const dialect = new PgDialect()

function parsePgPredicates(whereSql: unknown): {
  columns: Record<string, unknown>
  isNullColumns: string[]
} {
  if (!whereSql) return { columns: {}, isNullColumns: [] }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { sql, params } = dialect.sqlToQuery(whereSql as any)
  const columns: Record<string, unknown> = {}
  const isNullColumns: string[] = []

  const eqRegex = /"([^"]+)"\s*=\s*\$(\d+)/g
  let match: RegExpExecArray | null
  while ((match = eqRegex.exec(sql)) !== null) {
    const colName = match[1]
    const paramIndex = Number(match[2]) - 1
    columns[colName] = params[paramIndex]
  }

  const isNullRegex = /"([^"]+)"\s+is null/gi
  while ((match = isNullRegex.exec(sql)) !== null) {
    isNullColumns.push(match[1])
  }

  return { columns, isNullColumns }
}

type FakeWarehouseRow = { id: string; workspaceId: string; name: string; isDefault: boolean }
type FakeProductRow = {
  id: string
  workspaceId: string
  name: string
  sku: string
  unit: string
  minimumStock: number
  isActive: boolean
  deletedAt: Date | null
}
type FakeSupplierRow = { id: string; workspaceId: string; name: string; deletedAt: Date | null }
type FakeStockRow = {
  id: string
  workspaceId: string
  productId: string
  warehouseId: string
  quantity: number
  updatedAt: Date
}
type FakeMovementRow = {
  id: string
  workspaceId: string
  productId: string
  warehouseId: string
  supplierId: string | null
  createdBy: string
  type: 'IN' | 'OUT' | 'ADJUSTMENT'
  quantityDelta: number
  quantityBefore: number
  quantityAfter: number
  reason: string | null
  referenceNumber: string | null
  notes: string | null
  createdAt: Date
}

function createTransactionalInventoryDb(
  seed: {
    warehouses?: FakeWarehouseRow[]
    products?: FakeProductRow[]
    suppliers?: FakeSupplierRow[]
    stocks?: FakeStockRow[]
    movements?: FakeMovementRow[]
  },
  options: { asyncIoDelayMs?: number } = {},
) {
  const state = {
    warehouses: [...(seed.warehouses ?? [])],
    products: [...(seed.products ?? [])],
    suppliers: [...(seed.suppliers ?? [])],
    stocks: [...(seed.stocks ?? [])],
    movements: [...(seed.movements ?? [])],
  }

  const rowLockTails = new Map<string, Promise<void>>()

  async function acquireRowLock(lockKey: string): Promise<() => void> {
    const previous = rowLockTails.get(lockKey) ?? Promise.resolve()
    let releaseCurrent!: () => void
    const current = new Promise<void>((resolve) => {
      releaseCurrent = resolve
    })
    const chained = previous.then(() => current)
    rowLockTails.set(lockKey, chained)

    await previous
    return () => {
      releaseCurrent()
    }
  }

  async function tick() {
    if (options.asyncIoDelayMs && options.asyncIoDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, options.asyncIoDelayMs))
    } else {
      await Promise.resolve()
    }
  }

  function makeExecutor(txLocks?: Array<() => void>, rollbackActions?: Array<() => void>) {
    const select = vi.fn(() => ({
      from: vi.fn((table: unknown) => {
        let predicates = { columns: {} as Record<string, unknown>, isNullColumns: [] as string[] }

        const resolveRows = async () => {
          if (table === warehouses) {
            return state.warehouses.filter((row) => {
              if (predicates.columns.id && row.id !== predicates.columns.id) return false
              if (
                predicates.columns.workspace_id &&
                row.workspaceId !== predicates.columns.workspace_id
              ) {
                return false
              }
              if (
                predicates.columns.is_default !== undefined &&
                row.isDefault !== predicates.columns.is_default
              ) {
                return false
              }
              return true
            })
          }

          if (table === products) {
            return state.products.filter((row) => {
              if (predicates.columns.id && row.id !== predicates.columns.id) return false
              if (
                predicates.columns.workspace_id &&
                row.workspaceId !== predicates.columns.workspace_id
              ) {
                return false
              }
              return true
            })
          }

          if (table === suppliers) {
            return state.suppliers.filter((row) => {
              if (predicates.columns.id && row.id !== predicates.columns.id) return false
              if (
                predicates.columns.workspace_id &&
                row.workspaceId !== predicates.columns.workspace_id
              ) {
                return false
              }
              if (predicates.isNullColumns.includes('deleted_at') && row.deletedAt !== null) {
                return false
              }
              return true
            })
          }

          if (table === inventoryStocks) {
            return state.stocks.filter((row) => {
              if (
                predicates.columns.workspace_id &&
                row.workspaceId !== predicates.columns.workspace_id
              ) {
                return false
              }
              if (
                predicates.columns.product_id &&
                row.productId !== predicates.columns.product_id
              ) {
                return false
              }
              if (
                predicates.columns.warehouse_id &&
                row.warehouseId !== predicates.columns.warehouse_id
              ) {
                return false
              }
              return true
            })
          }

          return []
        }

        const buildLimitResult = () => {
          const promise = resolveRows()
          return Object.assign(promise, {
            for: vi.fn(async () => {
              if (table === inventoryStocks && txLocks) {
                const lockKey = `${String(predicates.columns.workspace_id)}:${String(predicates.columns.product_id)}:${String(predicates.columns.warehouse_id)}`
                const release = await acquireRowLock(lockKey)
                txLocks.push(release)
              }
              await tick()
              return resolveRows()
            }),
          })
        }

        const where = vi.fn((whereSql: unknown) => {
          predicates = parsePgPredicates(whereSql)
          const limit = vi.fn(() => buildLimitResult())
          const orderBy = vi.fn(() => resolveRows())
          return Object.assign(resolveRows(), { limit, orderBy })
        })

        return { where }
      }),
    }))

    const insert = vi.fn((table: unknown) => ({
      values: vi.fn((vals: Record<string, unknown>) => {
        if (table === inventoryStocks) {
          return {
            onConflictDoNothing: vi.fn(async () => {
              const exists = state.stocks.some(
                (row) =>
                  row.workspaceId === vals.workspaceId &&
                  row.productId === vals.productId &&
                  row.warehouseId === vals.warehouseId,
              )
              if (!exists) {
                const newStockRow: FakeStockRow = {
                  id: randomUUID(),
                  workspaceId: String(vals.workspaceId),
                  productId: String(vals.productId),
                  warehouseId: String(vals.warehouseId),
                  quantity: Number(vals.quantity ?? 0),
                  updatedAt: new Date(),
                }
                state.stocks.push(newStockRow)
                rollbackActions?.push(() => {
                  const idx = state.stocks.indexOf(newStockRow)
                  if (idx !== -1) state.stocks.splice(idx, 1)
                })
              }
            }),
          }
        }

        if (table === inventoryMovements) {
          const row: FakeMovementRow = {
            id: randomUUID(),
            workspaceId: String(vals.workspaceId),
            productId: String(vals.productId),
            warehouseId: String(vals.warehouseId),
            supplierId: (vals.supplierId as string | null) ?? null,
            createdBy: String(vals.createdBy),
            type: vals.type as 'IN' | 'OUT' | 'ADJUSTMENT',
            quantityDelta: Number(vals.quantityDelta),
            quantityBefore: Number(vals.quantityBefore),
            quantityAfter: Number(vals.quantityAfter),
            reason: (vals.reason as string | null) ?? null,
            referenceNumber: (vals.referenceNumber as string | null) ?? null,
            notes: (vals.notes as string | null) ?? null,
            createdAt: new Date(),
          }

          return {
            returning: vi.fn(async () => {
              if (row.quantityAfter < 0) {
                throw { code: '23514', constraint: 'inventory_movements_quantity_after_non_negative_check' }
              }
              state.movements.push(row)
              rollbackActions?.push(() => {
                const idx = state.movements.indexOf(row)
                if (idx !== -1) state.movements.splice(idx, 1)
              })
              return [row]
            }),
          }
        }

        return { returning: vi.fn(async () => []) }
      }),
    }))

    const update = vi.fn((table: unknown) => ({
      set: vi.fn((patch: Record<string, unknown>) => ({
        where: vi.fn(async (whereSql: unknown) => {
          await tick()
          const predicates = parsePgPredicates(whereSql)
          if (table === inventoryStocks) {
            const target = state.stocks.find(
              (row) =>
                row.id === predicates.columns.id &&
                row.workspaceId === predicates.columns.workspace_id,
            )
            if (target) {
              const nextQuantity = Number(patch.quantity)
              if (nextQuantity < 0) {
                throw { code: '23514', constraint: 'inventory_stocks_quantity_non_negative_check' }
              }
              const prevQuantity = target.quantity
              const prevUpdatedAt = target.updatedAt
              rollbackActions?.push(() => {
                target.quantity = prevQuantity
                target.updatedAt = prevUpdatedAt
              })
              target.quantity = nextQuantity
              target.updatedAt = new Date()
            }
          }
        }),
      })),
    }))

    return { select, insert, update }
  }

  const rootExecutor = makeExecutor()

  const dbMock = {
    ...rootExecutor,
    transaction: vi.fn(async <T>(fn: (tx: ReturnType<typeof makeExecutor>) => Promise<T>): Promise<T> => {
      const txLocks: Array<() => void> = []
      const rollbackActions: Array<() => void> = []

      try {
        const tx = makeExecutor(txLocks, rollbackActions)
        return await fn(tx)
      } catch (error) {
        for (const undo of rollbackActions.reverse()) {
          undo()
        }
        throw error
      } finally {
        for (const release of txLocks.reverse()) {
          release()
        }
      }
    }),
  } as unknown as AppDatabase

  return { dbMock, state }
}

const WS_A = '11111111-1111-4111-8111-111111111111'
const WS_B = '99999999-9999-4999-8999-999999999999'
const WH_A = '22222222-2222-4222-8222-222222222222'
const WH_B = '88888888-8888-4888-8888-888888888888'
const PROD_A = '33333333-3333-4333-8333-333333333333'
const PROD_B = '77777777-7777-4777-8777-777777777777'
const SUP_A = '44444444-4444-4444-8444-444444444444'
const SUP_B = '66666666-6666-4666-8666-666666666666'

const OWNER_A: WorkspaceContext = {
  userId: 'user-owner-a',
  workspaceId: WS_A,
  role: 'OWNER',
}

const STAFF_A: WorkspaceContext = {
  userId: 'user-staff-a',
  workspaceId: WS_A,
  role: 'STAFF',
}

function buildSeedFixture(initialStockA = 0) {
  return {
    warehouses: [
      { id: WH_A, workspaceId: WS_A, name: 'Gudang Utama', isDefault: true },
      { id: WH_B, workspaceId: WS_B, name: 'Gudang Cabang B', isDefault: true },
    ],
    products: [
      {
        id: PROD_A,
        workspaceId: WS_A,
        name: 'Kopi Arabika 250g',
        sku: 'KOPI-01',
        unit: 'pack',
        minimumStock: 10,
        isActive: true,
        deletedAt: null,
      },
      {
        id: PROD_B,
        workspaceId: WS_B,
        name: 'Teh Hijau',
        sku: 'TEH-01',
        unit: 'pcs',
        minimumStock: 5,
        isActive: true,
        deletedAt: null,
      },
    ],
    suppliers: [
      { id: SUP_A, workspaceId: WS_A, name: 'PT Sumber Makmur', deletedAt: null },
      { id: SUP_B, workspaceId: WS_B, name: 'CV Lain Workspace', deletedAt: null },
    ],
    stocks:
      initialStockA > 0
        ? [
            {
              id: randomUUID(),
              workspaceId: WS_A,
              productId: PROD_A,
              warehouseId: WH_A,
              quantity: initialStockA,
              updatedAt: new Date(),
            },
          ]
        : [],
  }
}

describe('InventoryService transactional integration & reconciliation', () => {
  it('executes stock in -> out -> adjustments atomically and reconciles ledger sum with current balance', async () => {
    const { dbMock, state } = createTransactionalInventoryDb(buildSeedFixture(0))

    await InventoryService.createStockIn(
      OWNER_A,
      { productId: PROD_A, quantity: 25, supplierId: SUP_A, referenceNumber: 'PO-001' },
      dbMock,
    )
    await InventoryService.createStockOut(
      STAFF_A,
      { productId: PROD_A, quantity: 8, reason: 'SALE', referenceNumber: 'INV-001' },
      dbMock,
    )
    await InventoryService.createAdjustment(
      OWNER_A,
      { productId: PROD_A, countedQuantity: 22, reason: 'Opname positif' },
      dbMock,
    )
    await InventoryService.createAdjustment(
      STAFF_A,
      { productId: PROD_A, countedQuantity: 14, reason: 'Barang rusak' },
      dbMock,
    )

    const currentStock = await InventoryService.getProductStock(OWNER_A, PROD_A, WH_A, dbMock)
    expect(currentStock.quantity).toBe(14)
    expect(state.movements).toHaveLength(4)

    const reconciliation = reconcileLedgerBalance(state.movements)
    expect(reconciliation).toEqual({
      valid: true,
      computedBalance: 14,
    })

    // Simulates end-of-flow CSV row generation matching database ledger + stock state
    const prod = state.products[0]
    const statusLabel = currentStock.quantity === 0 ? 'Habis' : currentStock.quantity <= prod.minimumStock ? 'Menipis' : 'Normal'
    const csvLine = [prod.sku, prod.name, currentStock.quantity, statusLabel].map(escapeCsvCell).join(',')
    expect(csvLine).toBe('KOPI-01,Kopi Arabika 250g,14,Normal')
  })

  it('rejects negative stock attempts and rolls back without creating phantom movements', async () => {
    const { dbMock, state } = createTransactionalInventoryDb(buildSeedFixture(4))

    await expect(
      InventoryService.createStockOut(
        STAFF_A,
        { productId: PROD_A, quantity: 5, reason: 'SALE' },
        dbMock,
      ),
    ).rejects.toMatchObject({
      code: 'INSUFFICIENT_STOCK',
      message: 'Stok tidak mencukupi. Stok tersedia: 4.',
    })

    expect(state.stocks[0].quantity).toBe(4)
    expect(state.movements).toHaveLength(0)

    await expect(
      InventoryService.createAdjustment(
        OWNER_A,
        { productId: PROD_A, countedQuantity: -2, reason: 'Invalid negative' },
        dbMock,
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('prevents two concurrent stock-outs from overspending the same stock balance', async () => {
    const { dbMock, state } = createTransactionalInventoryDb(buildSeedFixture(10), {
      asyncIoDelayMs: 12,
    })

    const results = await Promise.allSettled([
      InventoryService.createStockOut(
        OWNER_A,
        { productId: PROD_A, quantity: 7, reason: 'SALE', referenceNumber: 'ORD-1' },
        dbMock,
      ),
      InventoryService.createStockOut(
        STAFF_A,
        { productId: PROD_A, quantity: 7, reason: 'SALE', referenceNumber: 'ORD-2' },
        dbMock,
      ),
    ])

    const fulfilled = results.filter((r) => r.status === 'fulfilled')
    const rejected = results.filter((r) => r.status === 'rejected')

    expect(fulfilled).toHaveLength(1)
    expect(rejected).toHaveLength(1)
    if (rejected[0].status === 'rejected') {
      expect(rejected[0].reason).toMatchObject({
        code: 'INSUFFICIENT_STOCK',
        message: 'Stok tidak mencukupi. Stok tersedia: 3.',
      })
    }

    expect(state.stocks[0].quantity).toBe(3)
    expect(state.movements).toHaveLength(1)
    expect(reconcileLedgerBalance(state.movements, 10)).toEqual({
      valid: true,
      computedBalance: 3,
    })
  })

  it('keeps stock balance and ledger consistent under concurrent mixed IN and OUT mutations', async () => {
    const { dbMock, state } = createTransactionalInventoryDb(buildSeedFixture(20), {
      asyncIoDelayMs: 5,
    })

    await Promise.all([
      InventoryService.createStockIn(OWNER_A, { productId: PROD_A, quantity: 10 }, dbMock),
      InventoryService.createStockOut(STAFF_A, { productId: PROD_A, quantity: 6, reason: 'SALE' }, dbMock),
      InventoryService.createStockOut(OWNER_A, { productId: PROD_A, quantity: 4, reason: 'SALE' }, dbMock),
      InventoryService.createStockIn(STAFF_A, { productId: PROD_A, quantity: 5 }, dbMock),
    ])

    expect(state.stocks[0].quantity).toBe(25)
    expect(state.movements).toHaveLength(4)
    expect(reconcileLedgerBalance(state.movements, 20)).toEqual({
      valid: true,
      computedBalance: 25,
    })
  })

  it('rejects cross-workspace product, supplier, and warehouse references', async () => {
    const { dbMock, state } = createTransactionalInventoryDb(buildSeedFixture(10))

    await expect(
      InventoryService.createStockIn(
        OWNER_A,
        { productId: PROD_B, quantity: 5 },
        dbMock,
      ),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })

    await expect(
      InventoryService.createStockIn(
        OWNER_A,
        { productId: PROD_A, quantity: 5, supplierId: SUP_B },
        dbMock,
      ),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })

    await expect(
      InventoryService.createStockOut(
        OWNER_A,
        { productId: PROD_A, warehouseId: WH_B, quantity: 2, reason: 'SALE' },
        dbMock,
      ),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })

    expect(state.movements).toHaveLength(0)
    expect(state.stocks[0].quantity).toBe(10)
  })
})

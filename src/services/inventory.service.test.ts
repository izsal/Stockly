import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import type { WorkspaceContext } from '@/src/lib/permissions/workspace'
import type { AppDatabase } from './helpers'
import { InventoryService } from './inventory.service'
import { SupplierService } from './supplier.service'

const OWNER_CTX: WorkspaceContext = {
  userId: 'user-owner',
  workspaceId: '11111111-1111-4111-8111-111111111111',
  role: 'OWNER',
}

const STAFF_CTX: WorkspaceContext = {
  userId: 'user-staff',
  workspaceId: '11111111-1111-4111-8111-111111111111',
  role: 'STAFF',
}

const PRODUCT_ID = '22222222-2222-4222-8222-222222222222'
const WAREHOUSE_ID = '33333333-3333-4333-8333-333333333333'
const SUPPLIER_ID = '44444444-4444-4444-8444-444444444444'
const STOCK_ID = '55555555-5555-4555-8555-555555555555'

function createFakeInventoryTx(options: {
  warehouseFound?: boolean
  product?: { id: string; isActive: boolean; deletedAt: Date | null } | null
  supplierFound?: boolean
  currentStock?: number
}) {
  const warehouseRows = options.warehouseFound === false ? [] : [{ id: WAREHOUSE_ID }]
  const productRows = options.product === undefined
    ? [{ id: PRODUCT_ID, isActive: true, deletedAt: null }]
    : options.product
      ? [options.product]
      : []
  const supplierRows = options.supplierFound === false ? [] : [{ id: SUPPLIER_ID }]
  const stockRows = [{ id: STOCK_ID, quantity: options.currentStock ?? 0 }]

  let selectCallIndex = 0
  const selectQueue = [warehouseRows, productRows]
  if (options.supplierFound !== undefined) {
    selectQueue.push(supplierRows)
  }

  const forUpdate = vi.fn().mockResolvedValue(stockRows)
  const select = vi.fn(() => {
    const idx = selectCallIndex++
    const limit = vi.fn(() => {
      if (idx < selectQueue.length) {
        return Promise.resolve(selectQueue[idx])
      }
      return { for: forUpdate }
    })
    const where = vi.fn(() => ({ limit }))
    const from = vi.fn(() => ({ where }))
    return { from }
  })

  const onConflictDoNothing = vi.fn().mockResolvedValue(undefined)
  const returning = vi.fn().mockImplementation(async () => [lastInsertedMovement])
  let lastInsertedMovement: Record<string, unknown> = {}

  const insert = vi.fn(() => ({
    values: vi.fn((vals: Record<string, unknown>) => {
      if ('quantityDelta' in vals) {
        lastInsertedMovement = {
          id: '66666666-6666-4666-8666-666666666666',
          ...vals,
          createdAt: new Date(),
        }
        return { returning }
      }
      return { onConflictDoNothing }
    }),
  }))

  const updateWhere = vi.fn().mockResolvedValue(undefined)
  const updateSet = vi.fn(() => ({ where: updateWhere }))
  const update = vi.fn(() => ({ set: updateSet }))

  const tx = { select, insert, update }
  const dbMock = {
    transaction: vi.fn(async (fn: (txArg: typeof tx) => Promise<unknown>) => fn(tx)),
  } as unknown as AppDatabase

  return { dbMock, updateSet, forUpdate }
}

describe('SupplierService', () => {
  it('forbids STAFF from creating a supplier before touching database', async () => {
    const fakeDb = {} as AppDatabase

    await expect(
      SupplierService.createSupplier(STAFF_CTX, { name: 'PT Maju' }, fakeDb),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
  })

  it('maps duplicate supplier name within workspace to CONFLICT', async () => {
    const returning = vi.fn().mockRejectedValue({
      code: '23505',
      constraint: 'suppliers_workspace_name_unique_idx',
    })
    const values = vi.fn(() => ({ returning }))
    const insert = vi.fn(() => ({ values }))
    const fakeDb = { insert } as unknown as AppDatabase

    await expect(
      SupplierService.createSupplier(OWNER_CTX, { name: 'PT Maju' }, fakeDb),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'Nama supplier sudah terdaftar di ruang kerja ini.',
    })
  })
})

describe('InventoryService', () => {
  it('allows STAFF to record stock in and updates stock + movement atomically', async () => {
    const { dbMock, updateSet, forUpdate } = createFakeInventoryTx({
      currentStock: 10,
      supplierFound: true,
    })

    const movement = (await InventoryService.createStockIn(
      STAFF_CTX,
      {
        productId: PRODUCT_ID,
        quantity: 5,
        supplierId: SUPPLIER_ID,
        referenceNumber: 'PO-2026-001',
      },
      dbMock,
    )) as Record<string, unknown>

    expect(forUpdate).toHaveBeenCalledWith('update')
    expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({ quantity: 15 }))
    expect(movement).toMatchObject({
      type: 'IN',
      quantityBefore: 10,
      quantityDelta: 5,
      quantityAfter: 15,
      supplierId: SUPPLIER_ID,
      createdBy: STAFF_CTX.userId,
    })
  })

  it('rejects cross-workspace supplier reference on stock in', async () => {
    const { dbMock } = createFakeInventoryTx({
      currentStock: 10,
      supplierFound: false,
    })

    await expect(
      InventoryService.createStockIn(
        OWNER_CTX,
        {
          productId: PRODUCT_ID,
          quantity: 5,
          supplierId: SUPPLIER_ID,
        },
        dbMock,
      ),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Supplier tidak ditemukan di ruang kerja ini.',
    })
  })

  it('decreases stock on valid stock out', async () => {
    const { dbMock, updateSet } = createFakeInventoryTx({ currentStock: 12 })

    const movement = (await InventoryService.createStockOut(
      OWNER_CTX,
      {
        productId: PRODUCT_ID,
        quantity: 4,
        reason: 'SALE',
      },
      dbMock,
    )) as Record<string, unknown>

    expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({ quantity: 8 }))
    expect(movement).toMatchObject({
      type: 'OUT',
      quantityBefore: 12,
      quantityDelta: -4,
      quantityAfter: 8,
      reason: 'SALE',
    })
  })

  it('rejects stock out when requested quantity exceeds available stock', async () => {
    const { dbMock, updateSet } = createFakeInventoryTx({ currentStock: 3 })

    await expect(
      InventoryService.createStockOut(
        OWNER_CTX,
        {
          productId: PRODUCT_ID,
          quantity: 5,
          reason: 'SALE',
        },
        dbMock,
      ),
    ).rejects.toMatchObject({
      code: 'INSUFFICIENT_STOCK',
      message: 'Stok tidak mencukupi. Stok tersedia: 3.',
    })

    expect(updateSet).not.toHaveBeenCalled()
  })

  it('computes signed delta for stock adjustment (both positive and negative)', async () => {
    const { dbMock, updateSet } = createFakeInventoryTx({ currentStock: 20 })

    const movement = (await InventoryService.createAdjustment(
      OWNER_CTX,
      {
        productId: PRODUCT_ID,
        countedQuantity: 17,
        reason: 'Opname Stok',
      },
      dbMock,
    )) as Record<string, unknown>

    expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({ quantity: 17 }))
    expect(movement).toMatchObject({
      type: 'ADJUSTMENT',
      quantityBefore: 20,
      quantityDelta: -3,
      quantityAfter: 17,
      reason: 'Opname Stok',
    })
  })

  it('rejects zero-delta stock adjustment with VALIDATION_ERROR', async () => {
    const { dbMock, updateSet } = createFakeInventoryTx({ currentStock: 10 })

    await expect(
      InventoryService.createAdjustment(
        OWNER_CTX,
        {
          productId: PRODUCT_ID,
          countedQuantity: 10,
          reason: 'Opname Stok',
        },
        dbMock,
      ),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Jumlah fisik sama dengan stok saat ini. Tidak ada penyesuaian yang diperlukan.',
    })

    expect(updateSet).not.toHaveBeenCalled()
  })

  it('rejects stock mutation for archived products', async () => {
    const { dbMock } = createFakeInventoryTx({
      product: { id: PRODUCT_ID, isActive: false, deletedAt: new Date() },
    })

    await expect(
      InventoryService.createStockIn(
        OWNER_CTX,
        {
          productId: PRODUCT_ID,
          quantity: 5,
        },
        dbMock,
      ),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Produk yang sudah diarsipkan tidak dapat diubah stoknya.',
    })
  })

  it('rejects invalid input before opening transaction', async () => {
    const fakeDb = { transaction: vi.fn() } as unknown as AppDatabase

    await expect(
      InventoryService.createStockOut(
        OWNER_CTX,
        {
          productId: 'not-a-uuid',
          quantity: 0,
          reason: 'SALE',
        },
        fakeDb,
      ),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    })

    expect(fakeDb.transaction).not.toHaveBeenCalled()
  })
})


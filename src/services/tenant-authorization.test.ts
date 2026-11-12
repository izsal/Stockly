import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import type { WorkspaceContext } from '@/src/lib/permissions/workspace'
import { CategoryService } from './category.service'
import type { AppDatabase } from './helpers'
import { InventoryService } from './inventory.service'
import { ProductService } from './product.service'
import { ReportService } from './report.service'
import { SupplierService } from './supplier.service'

const WORKSPACE_A = '11111111-1111-4111-8111-111111111111'
const RECORD_IN_OTHER_WORKSPACE = '99999999-9999-4999-8999-999999999999'

const OWNER_A: WorkspaceContext = {
  userId: 'user-owner-a',
  workspaceId: WORKSPACE_A,
  role: 'OWNER',
}

const STAFF_A: WorkspaceContext = {
  userId: 'user-staff-a',
  workspaceId: WORKSPACE_A,
  role: 'STAFF',
}

function createEmptyDbMock() {
  const limit = vi.fn().mockResolvedValue([])
  const returning = vi.fn().mockResolvedValue([])
  const where = vi.fn(() => ({ limit, returning }))
  const leftJoin = vi.fn(() => ({ where }))
  const from = vi.fn(() => ({ where, leftJoin }))
  const select = vi.fn(() => ({ from }))
  const set = vi.fn(() => ({ where }))
  const update = vi.fn(() => ({ set }))
  const insert = vi.fn(() => ({
    values: vi.fn(() => ({ returning })),
  }))

  const tx = { select, update, insert }
  const transaction = vi.fn(async (fn: (arg: typeof tx) => Promise<unknown>) => fn(tx))

  return { select, update, insert, transaction } as unknown as AppDatabase
}

describe('Role authorization matrix across services', () => {
  it('forbids STAFF from all write operations on categories, products, and suppliers before DB access', async () => {
    const untouchedDb = {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      transaction: vi.fn(),
    } as unknown as AppDatabase

    await expect(
      CategoryService.createCategory(STAFF_A, { name: 'Minuman' }, untouchedDb),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })

    await expect(
      CategoryService.updateCategory(STAFF_A, RECORD_IN_OTHER_WORKSPACE, { name: 'Ubah' }, untouchedDb),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })

    await expect(
      CategoryService.deleteCategory(STAFF_A, RECORD_IN_OTHER_WORKSPACE, untouchedDb),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })

    await expect(
      ProductService.createProduct(STAFF_A, { name: 'Kopi', sku: 'KOPI-1' }, untouchedDb),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })

    await expect(
      ProductService.updateProduct(STAFF_A, RECORD_IN_OTHER_WORKSPACE, { name: 'Kopi 2' }, untouchedDb),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })

    await expect(
      ProductService.archiveProduct(STAFF_A, RECORD_IN_OTHER_WORKSPACE, untouchedDb),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })

    await expect(
      ProductService.restoreProduct(STAFF_A, RECORD_IN_OTHER_WORKSPACE, untouchedDb),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })

    await expect(
      SupplierService.createSupplier(STAFF_A, { name: 'PT Supplier' }, untouchedDb),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })

    await expect(
      SupplierService.updateSupplier(STAFF_A, RECORD_IN_OTHER_WORKSPACE, { name: 'PT 2' }, untouchedDb),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })

    await expect(
      SupplierService.deleteSupplier(STAFF_A, RECORD_IN_OTHER_WORKSPACE, untouchedDb),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })

    expect(untouchedDb.select).not.toHaveBeenCalled()
    expect(untouchedDb.insert).not.toHaveBeenCalled()
    expect(untouchedDb.update).not.toHaveBeenCalled()
    expect(untouchedDb.transaction).not.toHaveBeenCalled()
  })

  it('rejects unauthenticated or empty-workspace contexts across read and write services', async () => {
    const invalidCtx: WorkspaceContext = { userId: '', workspaceId: '', role: 'OWNER' }
    const untouchedDb = { select: vi.fn() } as unknown as AppDatabase

    await expect(ProductService.listProducts(invalidCtx, {}, untouchedDb)).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
    await expect(
      InventoryService.listMovements(invalidCtx, {}, untouchedDb),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    await expect(
      ReportService.getCurrentStockReport(invalidCtx, {}, untouchedDb),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })
})

describe('Cross-workspace tenant isolation across services', () => {
  it('returns NOT_FOUND when Workspace A OWNER tries to read, update, archive, or delete Workspace B records', async () => {
    const emptyDb = createEmptyDbMock()

    await expect(
      CategoryService.getCategoryById(OWNER_A, RECORD_IN_OTHER_WORKSPACE, emptyDb),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    await expect(
      CategoryService.updateCategory(OWNER_A, RECORD_IN_OTHER_WORKSPACE, { name: 'Hack' }, emptyDb),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    await expect(
      CategoryService.deleteCategory(OWNER_A, RECORD_IN_OTHER_WORKSPACE, emptyDb),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })

    await expect(
      ProductService.getProductById(OWNER_A, RECORD_IN_OTHER_WORKSPACE, emptyDb),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    await expect(
      ProductService.updateProduct(OWNER_A, RECORD_IN_OTHER_WORKSPACE, { name: 'Hack' }, emptyDb),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    await expect(
      ProductService.archiveProduct(OWNER_A, RECORD_IN_OTHER_WORKSPACE, emptyDb),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    await expect(
      ProductService.restoreProduct(OWNER_A, RECORD_IN_OTHER_WORKSPACE, emptyDb),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })

    await expect(
      SupplierService.getSupplierById(OWNER_A, RECORD_IN_OTHER_WORKSPACE, emptyDb),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    await expect(
      SupplierService.updateSupplier(OWNER_A, RECORD_IN_OTHER_WORKSPACE, { name: 'Hack' }, emptyDb),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    await expect(
      SupplierService.deleteSupplier(OWNER_A, RECORD_IN_OTHER_WORKSPACE, emptyDb),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })
})


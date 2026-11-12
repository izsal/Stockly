import 'server-only'

import { and, asc, count, desc, eq, gte, ilike, inArray, isNull, lte, or } from 'drizzle-orm'
import { db } from '@/src/db'
import {
  inventoryMovements,
  inventoryStocks,
  products,
  suppliers,
  users,
  warehouses,
} from '@/src/db/schema'
import { DomainError, mapDatabaseError } from '@/src/lib/errors'
import { assertWorkspacePermission, type WorkspaceContext } from '@/src/lib/permissions/workspace'
import {
  listMovementsQuerySchema,
  stockAdjustmentSchema,
  stockInSchema,
  stockOutSchema,
  type ListMovementsQuery,
  type StockAdjustmentInput,
  type StockInInput,
  type StockOutInput,
} from '@/src/lib/validation/inventory'
import {
  buildPaginationMeta,
  escapeLikePattern,
  parseInput,
  parseUuid,
  type AppDatabase,
} from './helpers'
import {
  computeAdjustmentResult,
  computeStockInResult,
  computeStockOutResult,
} from './inventory-calculations'

const INVENTORY_CONSTRAINT_MESSAGES: Record<string, string> = {
  inventory_stocks_quantity_non_negative_check: 'Stok tidak boleh bernilai negatif.',
  inventory_movements_workspace_product_fk: 'Produk tidak ditemukan di ruang kerja ini.',
  inventory_movements_workspace_warehouse_fk: 'Gudang tidak ditemukan di ruang kerja ini.',
  inventory_movements_workspace_supplier_fk: 'Supplier tidak ditemukan di ruang kerja ini.',
}

type DatabaseOrTransaction = Pick<AppDatabase, 'select' | 'insert' | 'update'>

async function resolveWarehouseId(
  workspaceId: string,
  warehouseId: string | null | undefined,
  database: DatabaseOrTransaction,
): Promise<string> {
  const filter = warehouseId
    ? and(eq(warehouses.id, warehouseId), eq(warehouses.workspaceId, workspaceId))
    : and(eq(warehouses.workspaceId, workspaceId), eq(warehouses.isDefault, true))

  const [warehouse] = await database
    .select({ id: warehouses.id })
    .from(warehouses)
    .where(filter)
    .limit(1)

  if (!warehouse) {
    throw new DomainError(
      'NOT_FOUND',
      warehouseId
        ? 'Gudang tidak ditemukan di ruang kerja ini.'
        : 'Gudang utama tidak ditemukan di ruang kerja ini.',
    )
  }

  return warehouse.id
}

async function assertActiveProductInWorkspace(
  workspaceId: string,
  productId: string,
  database: DatabaseOrTransaction,
) {
  const [product] = await database
    .select({
      id: products.id,
      isActive: products.isActive,
      deletedAt: products.deletedAt,
    })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.workspaceId, workspaceId)))
    .limit(1)

  if (!product) {
    throw new DomainError('NOT_FOUND', 'Produk tidak ditemukan di ruang kerja ini.')
  }

  if (!product.isActive || product.deletedAt) {
    throw new DomainError(
      'VALIDATION_ERROR',
      'Produk yang sudah diarsipkan tidak dapat diubah stoknya.',
    )
  }
}

async function assertSupplierInWorkspace(
  workspaceId: string,
  supplierId: string | null | undefined,
  database: DatabaseOrTransaction,
) {
  if (!supplierId) return

  const [supplier] = await database
    .select({ id: suppliers.id })
    .from(suppliers)
    .where(
      and(
        eq(suppliers.id, supplierId),
        eq(suppliers.workspaceId, workspaceId),
        isNull(suppliers.deletedAt),
      ),
    )
    .limit(1)

  if (!supplier) {
    throw new DomainError('NOT_FOUND', 'Supplier tidak ditemukan di ruang kerja ini.')
  }
}

async function lockOrCreateStockRow(
  workspaceId: string,
  productId: string,
  warehouseId: string,
  tx: DatabaseOrTransaction,
) {
  await tx
    .insert(inventoryStocks)
    .values({
      workspaceId,
      productId,
      warehouseId,
      quantity: 0,
    })
    .onConflictDoNothing({
      target: [inventoryStocks.workspaceId, inventoryStocks.productId, inventoryStocks.warehouseId],
    })

  const [stockRow] = await tx
    .select({
      id: inventoryStocks.id,
      quantity: inventoryStocks.quantity,
    })
    .from(inventoryStocks)
    .where(
      and(
        eq(inventoryStocks.workspaceId, workspaceId),
        eq(inventoryStocks.productId, productId),
        eq(inventoryStocks.warehouseId, warehouseId),
      ),
    )
    .limit(1)
    .for('update')

  if (!stockRow) {
    throw new DomainError('NOT_FOUND', 'Data stok produk tidak dapat dikunci.')
  }

  return stockRow
}

export async function createStockIn(
  ctx: WorkspaceContext,
  input: StockInInput,
  database: AppDatabase = db,
) {
  assertWorkspacePermission(ctx, 'inventory:write')
  const data = parseInput(stockInSchema, input)

  try {
    return await database.transaction(async (tx) => {
      const warehouseId = await resolveWarehouseId(ctx.workspaceId, data.warehouseId, tx)
      await assertActiveProductInWorkspace(ctx.workspaceId, data.productId, tx)
      await assertSupplierInWorkspace(ctx.workspaceId, data.supplierId, tx)

      const stockRow = await lockOrCreateStockRow(ctx.workspaceId, data.productId, warehouseId, tx)
      const { quantityBefore, quantityDelta, quantityAfter } = computeStockInResult(
        Number(stockRow.quantity),
        data.quantity,
      )

      await tx
        .update(inventoryStocks)
        .set({
          quantity: quantityAfter,
          updatedAt: new Date(),
        })
        .where(
          and(eq(inventoryStocks.id, stockRow.id), eq(inventoryStocks.workspaceId, ctx.workspaceId)),
        )

      const [movement] = await tx
        .insert(inventoryMovements)
        .values({
          workspaceId: ctx.workspaceId,
          productId: data.productId,
          warehouseId,
          supplierId: data.supplierId ?? null,
          createdBy: ctx.userId,
          type: 'IN',
          quantityDelta,
          quantityBefore,
          quantityAfter,
          reason: 'PURCHASE',
          referenceNumber: data.referenceNumber ?? null,
          notes: data.notes ?? null,
        })
        .returning()

      return movement
    })
  } catch (error) {
    mapDatabaseError(error, INVENTORY_CONSTRAINT_MESSAGES)
  }
}

export async function createStockOut(
  ctx: WorkspaceContext,
  input: StockOutInput,
  database: AppDatabase = db,
) {
  assertWorkspacePermission(ctx, 'inventory:write')
  const data = parseInput(stockOutSchema, input)

  try {
    return await database.transaction(async (tx) => {
      const warehouseId = await resolveWarehouseId(ctx.workspaceId, data.warehouseId, tx)
      await assertActiveProductInWorkspace(ctx.workspaceId, data.productId, tx)

      const stockRow = await lockOrCreateStockRow(ctx.workspaceId, data.productId, warehouseId, tx)
      const { quantityBefore, quantityDelta, quantityAfter } = computeStockOutResult(
        Number(stockRow.quantity),
        data.quantity,
      )

      await tx
        .update(inventoryStocks)
        .set({
          quantity: quantityAfter,
          updatedAt: new Date(),
        })
        .where(
          and(eq(inventoryStocks.id, stockRow.id), eq(inventoryStocks.workspaceId, ctx.workspaceId)),
        )

      const [movement] = await tx
        .insert(inventoryMovements)
        .values({
          workspaceId: ctx.workspaceId,
          productId: data.productId,
          warehouseId,
          supplierId: null,
          createdBy: ctx.userId,
          type: 'OUT',
          quantityDelta,
          quantityBefore,
          quantityAfter,
          reason: data.reason,
          referenceNumber: data.referenceNumber ?? null,
          notes: data.notes ?? null,
        })
        .returning()

      return movement
    })
  } catch (error) {
    mapDatabaseError(error, INVENTORY_CONSTRAINT_MESSAGES)
  }
}

export async function createAdjustment(
  ctx: WorkspaceContext,
  input: StockAdjustmentInput,
  database: AppDatabase = db,
) {
  assertWorkspacePermission(ctx, 'inventory:write')
  const data = parseInput(stockAdjustmentSchema, input)

  try {
    return await database.transaction(async (tx) => {
      const warehouseId = await resolveWarehouseId(ctx.workspaceId, data.warehouseId, tx)
      await assertActiveProductInWorkspace(ctx.workspaceId, data.productId, tx)

      const stockRow = await lockOrCreateStockRow(ctx.workspaceId, data.productId, warehouseId, tx)
      const { quantityBefore, quantityDelta, quantityAfter } = computeAdjustmentResult(
        Number(stockRow.quantity),
        data.countedQuantity,
      )

      await tx
        .update(inventoryStocks)
        .set({
          quantity: quantityAfter,
          updatedAt: new Date(),
        })
        .where(
          and(eq(inventoryStocks.id, stockRow.id), eq(inventoryStocks.workspaceId, ctx.workspaceId)),
        )

      const [movement] = await tx
        .insert(inventoryMovements)
        .values({
          workspaceId: ctx.workspaceId,
          productId: data.productId,
          warehouseId,
          supplierId: null,
          createdBy: ctx.userId,
          type: 'ADJUSTMENT',
          quantityDelta,
          quantityBefore,
          quantityAfter,
          reason: data.reason,
          referenceNumber: null,
          notes: data.notes ?? null,
        })
        .returning()

      return movement
    })
  } catch (error) {
    mapDatabaseError(error, INVENTORY_CONSTRAINT_MESSAGES)
  }
}

export async function getProductStock(
  ctx: WorkspaceContext,
  productId: string,
  warehouseId?: string,
  database: AppDatabase = db,
) {
  assertWorkspacePermission(ctx, 'inventory:read')
  const validProductId = parseUuid(productId, 'ID produk tidak valid.')
  const validWarehouseId = warehouseId
    ? parseUuid(warehouseId, 'ID gudang tidak valid.')
    : undefined

  const resolvedWarehouseId = await resolveWarehouseId(ctx.workspaceId, validWarehouseId, database)

  const [stockRow] = await database
    .select({ quantity: inventoryStocks.quantity })
    .from(inventoryStocks)
    .where(
      and(
        eq(inventoryStocks.workspaceId, ctx.workspaceId),
        eq(inventoryStocks.productId, validProductId),
        eq(inventoryStocks.warehouseId, resolvedWarehouseId),
      ),
    )
    .limit(1)

  return {
    productId: validProductId,
    warehouseId: resolvedWarehouseId,
    quantity: Number(stockRow?.quantity ?? 0),
  }
}

export async function listProductStocksMap(
  ctx: WorkspaceContext,
  productIds: string[],
  database: AppDatabase = db,
): Promise<Record<string, number>> {
  assertWorkspacePermission(ctx, 'inventory:read')
  if (productIds.length === 0) return {}

  const resolvedWarehouseId = await resolveWarehouseId(ctx.workspaceId, undefined, database)
  const rows = await database
    .select({
      productId: inventoryStocks.productId,
      quantity: inventoryStocks.quantity,
    })
    .from(inventoryStocks)
    .where(
      and(
        eq(inventoryStocks.workspaceId, ctx.workspaceId),
        eq(inventoryStocks.warehouseId, resolvedWarehouseId),
        inArray(inventoryStocks.productId, productIds),
      ),
    )

  const stockMap: Record<string, number> = {}
  for (const row of rows) {
    stockMap[row.productId] = Number(row.quantity)
  }
  return stockMap
}

export async function listActiveProductsWithStock(
  ctx: WorkspaceContext,
  database: AppDatabase = db,
) {
  assertWorkspacePermission(ctx, 'inventory:read')
  const resolvedWarehouseId = await resolveWarehouseId(ctx.workspaceId, undefined, database)

  const rows = await database
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      unit: products.unit,
      minimumStock: products.minimumStock,
      currentStock: inventoryStocks.quantity,
    })
    .from(products)
    .leftJoin(
      inventoryStocks,
      and(
        eq(inventoryStocks.productId, products.id),
        eq(inventoryStocks.workspaceId, ctx.workspaceId),
        eq(inventoryStocks.warehouseId, resolvedWarehouseId),
      ),
    )
    .where(
      and(
        eq(products.workspaceId, ctx.workspaceId),
        eq(products.isActive, true),
        isNull(products.deletedAt),
      ),
    )
    .orderBy(asc(products.name))

  return rows.map((row) => ({
    ...row,
    currentStock: Number(row.currentStock ?? 0),
  }))
}

export async function listMovements(
  ctx: WorkspaceContext,
  query: ListMovementsQuery = {},
  database: AppDatabase = db,
) {
  assertWorkspacePermission(ctx, 'movements:read')
  const { productId, warehouseId, type, dateFrom, dateTo, search, page, pageSize } = parseInput(
    listMovementsQuerySchema,
    query,
  )

  const filters = [eq(inventoryMovements.workspaceId, ctx.workspaceId)]

  if (productId) {
    filters.push(eq(inventoryMovements.productId, productId))
  }
  if (warehouseId) {
    filters.push(eq(inventoryMovements.warehouseId, warehouseId))
  }
  if (type) {
    filters.push(eq(inventoryMovements.type, type))
  }
  if (dateFrom) {
    const startDate = new Date(`${dateFrom}T00:00:00.000Z`)
    if (!Number.isNaN(startDate.getTime())) {
      filters.push(gte(inventoryMovements.createdAt, startDate))
    }
  }
  if (dateTo) {
    const endDate = new Date(`${dateTo}T23:59:59.999Z`)
    if (!Number.isNaN(endDate.getTime())) {
      filters.push(lte(inventoryMovements.createdAt, endDate))
    }
  }
  if (search) {
    const pattern = `%${escapeLikePattern(search)}%`
    const searchFilter = or(
      ilike(products.name, pattern),
      ilike(products.sku, pattern),
      ilike(inventoryMovements.referenceNumber, pattern),
      ilike(inventoryMovements.notes, pattern),
    )
    if (searchFilter) filters.push(searchFilter)
  }

  const whereClause = and(...filters)
  const offset = (page - 1) * pageSize

  const [items, totalRows] = await Promise.all([
    database
      .select({
        id: inventoryMovements.id,
        productId: inventoryMovements.productId,
        productName: products.name,
        productSku: products.sku,
        productUnit: products.unit,
        warehouseId: inventoryMovements.warehouseId,
        warehouseName: warehouses.name,
        supplierId: inventoryMovements.supplierId,
        supplierName: suppliers.name,
        createdBy: inventoryMovements.createdBy,
        actorName: users.name,
        type: inventoryMovements.type,
        quantityDelta: inventoryMovements.quantityDelta,
        quantityBefore: inventoryMovements.quantityBefore,
        quantityAfter: inventoryMovements.quantityAfter,
        reason: inventoryMovements.reason,
        referenceNumber: inventoryMovements.referenceNumber,
        notes: inventoryMovements.notes,
        createdAt: inventoryMovements.createdAt,
      })
      .from(inventoryMovements)
      .leftJoin(
        products,
        and(eq(inventoryMovements.productId, products.id), eq(products.workspaceId, ctx.workspaceId)),
      )
      .leftJoin(
        warehouses,
        and(
          eq(inventoryMovements.warehouseId, warehouses.id),
          eq(warehouses.workspaceId, ctx.workspaceId),
        ),
      )
      .leftJoin(
        suppliers,
        and(
          eq(inventoryMovements.supplierId, suppliers.id),
          eq(suppliers.workspaceId, ctx.workspaceId),
        ),
      )
      .leftJoin(users, eq(inventoryMovements.createdBy, users.id))
      .where(whereClause)
      .orderBy(desc(inventoryMovements.createdAt))
      .limit(pageSize)
      .offset(offset),
    database
      .select({ total: count() })
      .from(inventoryMovements)
      .leftJoin(
        products,
        and(eq(inventoryMovements.productId, products.id), eq(products.workspaceId, ctx.workspaceId)),
      )
      .where(whereClause),
  ])

  const total = Number(totalRows[0]?.total ?? 0)
  return {
    items,
    ...buildPaginationMeta(total, page, pageSize),
  }
}

export const InventoryService = {
  createStockIn,
  createStockOut,
  createAdjustment,
  getProductStock,
  listProductStocksMap,
  listActiveProductsWithStock,
  listMovements,
}


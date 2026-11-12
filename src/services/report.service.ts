import 'server-only'

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  isNull,
  lte,
  or,
  sql,
} from 'drizzle-orm'
import { db } from '@/src/db'
import {
  categories,
  inventoryMovements,
  inventoryStocks,
  products,
  suppliers,
  users,
  warehouses,
} from '@/src/db/schema'
import { serializeCsv, type CsvCell } from '@/src/lib/csv'
import { assertWorkspacePermission, type WorkspaceContext } from '@/src/lib/permissions/workspace'
import { STOCK_OUT_REASON_LABELS, type StockOutReason } from '@/src/lib/validation/inventory'
import {
  currentStockReportQuerySchema,
  dashboardSummaryQuerySchema,
  getDefaultDateRange,
  lowStockReportQuerySchema,
  movementReportQuerySchema,
  reportExportQuerySchema,
  resolveJakartaDateBounds,
  type CurrentStockReportQuery,
  type DashboardSummaryQuery,
  type LowStockReportQuery,
  type MovementReportQuery,
  type ReportExportQuery,
} from '@/src/lib/validation/reports'
import {
  buildPaginationMeta,
  escapeLikePattern,
  parseInput,
  type AppDatabase,
} from './helpers'

const MAX_EXPORT_ROWS = 10_000

const stockQtyExpr = sql<number>`coalesce(${inventoryStocks.quantity}, 0)::int`

async function getDefaultWarehouse(workspaceId: string, database: AppDatabase) {
  const [warehouse] = await database
    .select({ id: warehouses.id, name: warehouses.name })
    .from(warehouses)
    .where(and(eq(warehouses.workspaceId, workspaceId), eq(warehouses.isDefault, true)))
    .limit(1)

  return warehouse ?? null
}

function stockJoinCondition(workspaceId: string, warehouseId: string | null) {
  return warehouseId
    ? and(
        eq(inventoryStocks.productId, products.id),
        eq(inventoryStocks.workspaceId, workspaceId),
        eq(inventoryStocks.warehouseId, warehouseId),
      )
    : and(eq(inventoryStocks.productId, products.id), sql`false`)
}

function deriveStockStatus(currentStock: number, minimumStock: number): 'OUT' | 'LOW' | 'NORMAL' {
  if (currentStock === 0) return 'OUT'
  if (currentStock <= minimumStock) return 'LOW'
  return 'NORMAL'
}

function formatCsvDate(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function formatMovementTypeLabel(type: 'IN' | 'OUT' | 'ADJUSTMENT') {
  if (type === 'IN') return 'Stok Masuk'
  if (type === 'OUT') return 'Stok Keluar'
  return 'Penyesuaian'
}

function formatMovementReasonLabel(type: 'IN' | 'OUT' | 'ADJUSTMENT', reason: string | null) {
  if (!reason) return ''
  if (type === 'IN' && reason === 'PURCHASE') return 'Penerimaan / Pembelian'
  if (type === 'IN' && reason === 'OPENING_BALANCE') return 'Saldo Awal'
  if (type === 'OUT' && reason in STOCK_OUT_REASON_LABELS) {
    return STOCK_OUT_REASON_LABELS[reason as StockOutReason]
  }
  return reason
}

export async function getDashboardSummary(
  ctx: WorkspaceContext,
  query: DashboardSummaryQuery = {},
  database: AppDatabase = db,
) {
  assertWorkspacePermission(ctx, 'reports:read')
  const parsed = parseInput(dashboardSummaryQuerySchema, query)

  const fallbackRange = getDefaultDateRange(7)
  const bounds = resolveJakartaDateBounds(
    parsed.dateFrom ?? fallbackRange.dateFrom,
    parsed.dateTo ?? fallbackRange.dateTo,
  )

  const defaultWarehouse = await getDefaultWarehouse(ctx.workspaceId, database)
  const activeProductFilter = and(
    eq(products.workspaceId, ctx.workspaceId),
    eq(products.isActive, true),
    isNull(products.deletedAt),
  )

  const movementRangeFilters = [eq(inventoryMovements.workspaceId, ctx.workspaceId)]
  if (bounds.startDate) {
    movementRangeFilters.push(gte(inventoryMovements.createdAt, bounds.startDate))
  }
  if (bounds.endDate) {
    movementRangeFilters.push(lte(inventoryMovements.createdAt, bounds.endDate))
  }

  const [kpiRows, movementAggregateRows, recentMovements, attentionProducts] = await Promise.all([
    database
      .select({
        totalActiveProducts: count(products.id),
        totalStockUnits: sql<number>`coalesce(sum(${stockQtyExpr}), 0)::int`,
        totalInventoryValue: sql<string>`coalesce(sum(${stockQtyExpr} * coalesce(${products.costPrice}, 0)), 0)::numeric(14,2)::text`,
        lowStockProducts: sql<number>`count(*) filter (where ${stockQtyExpr} <= ${products.minimumStock})::int`,
        outOfStockProducts: sql<number>`count(*) filter (where ${stockQtyExpr} = 0)::int`,
      })
      .from(products)
      .leftJoin(inventoryStocks, stockJoinCondition(ctx.workspaceId, defaultWarehouse?.id ?? null))
      .where(activeProductFilter),

    database
      .select({
        totalMovements: count(inventoryMovements.id),
        stockInCount: sql<number>`count(*) filter (where ${inventoryMovements.type} = 'IN')::int`,
        stockInUnits: sql<number>`coalesce(sum(${inventoryMovements.quantityDelta}) filter (where ${inventoryMovements.type} = 'IN'), 0)::int`,
        stockOutCount: sql<number>`count(*) filter (where ${inventoryMovements.type} = 'OUT')::int`,
        stockOutUnits: sql<number>`coalesce(sum(abs(${inventoryMovements.quantityDelta})) filter (where ${inventoryMovements.type} = 'OUT'), 0)::int`,
        adjustmentCount: sql<number>`count(*) filter (where ${inventoryMovements.type} = 'ADJUSTMENT')::int`,
        netDelta: sql<number>`coalesce(sum(${inventoryMovements.quantityDelta}), 0)::int`,
      })
      .from(inventoryMovements)
      .where(and(...movementRangeFilters)),

    database
      .select({
        id: inventoryMovements.id,
        productId: inventoryMovements.productId,
        productName: products.name,
        productSku: products.sku,
        productUnit: products.unit,
        actorName: users.name,
        type: inventoryMovements.type,
        quantityDelta: inventoryMovements.quantityDelta,
        quantityBefore: inventoryMovements.quantityBefore,
        quantityAfter: inventoryMovements.quantityAfter,
        reason: inventoryMovements.reason,
        createdAt: inventoryMovements.createdAt,
      })
      .from(inventoryMovements)
      .leftJoin(
        products,
        and(eq(inventoryMovements.productId, products.id), eq(products.workspaceId, ctx.workspaceId)),
      )
      .leftJoin(users, eq(inventoryMovements.createdBy, users.id))
      .where(eq(inventoryMovements.workspaceId, ctx.workspaceId))
      .orderBy(desc(inventoryMovements.createdAt))
      .limit(6),

    database
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        unit: products.unit,
        minimumStock: products.minimumStock,
        currentStock: stockQtyExpr,
      })
      .from(products)
      .leftJoin(inventoryStocks, stockJoinCondition(ctx.workspaceId, defaultWarehouse?.id ?? null))
      .where(and(activeProductFilter, sql`${stockQtyExpr} <= ${products.minimumStock}`))
      .orderBy(asc(stockQtyExpr), asc(products.name))
      .limit(6),
  ])

  const kpis = kpiRows[0]
  const movAgg = movementAggregateRows[0]

  return {
    defaultWarehouse,
    dateRange: {
      dateFrom: bounds.dateFrom ?? fallbackRange.dateFrom,
      dateTo: bounds.dateTo ?? fallbackRange.dateTo,
    },
    kpis: {
      totalActiveProducts: Number(kpis?.totalActiveProducts ?? 0),
      totalStockUnits: Number(kpis?.totalStockUnits ?? 0),
      totalInventoryValue: Number(kpis?.totalInventoryValue ?? 0),
      lowStockProducts: Number(kpis?.lowStockProducts ?? 0),
      outOfStockProducts: Number(kpis?.outOfStockProducts ?? 0),
    },
    movementSummary: {
      totalMovements: Number(movAgg?.totalMovements ?? 0),
      stockInCount: Number(movAgg?.stockInCount ?? 0),
      stockInUnits: Number(movAgg?.stockInUnits ?? 0),
      stockOutCount: Number(movAgg?.stockOutCount ?? 0),
      stockOutUnits: Number(movAgg?.stockOutUnits ?? 0),
      adjustmentCount: Number(movAgg?.adjustmentCount ?? 0),
      netDelta: Number(movAgg?.netDelta ?? 0),
    },
    recentMovements,
    attentionProducts: attentionProducts.map((item) => ({
      ...item,
      currentStock: Number(item.currentStock ?? 0),
      status: deriveStockStatus(Number(item.currentStock ?? 0), item.minimumStock),
    })),
  }
}

async function fetchCurrentStockRows(
  ctx: WorkspaceContext,
  filtersInput: {
    search?: string | null
    categoryId?: string | null
    stockStatus: 'all' | 'normal' | 'low' | 'out'
  },
  pagination: { limit: number; offset: number },
  database: AppDatabase,
) {
  const defaultWarehouse = await getDefaultWarehouse(ctx.workspaceId, database)
  const joinCond = stockJoinCondition(ctx.workspaceId, defaultWarehouse?.id ?? null)

  const filters = [
    eq(products.workspaceId, ctx.workspaceId),
    eq(products.isActive, true),
    isNull(products.deletedAt),
  ]

  if (filtersInput.categoryId) {
    filters.push(eq(products.categoryId, filtersInput.categoryId))
  }
  if (filtersInput.stockStatus === 'out') {
    filters.push(sql`${stockQtyExpr} = 0`)
  } else if (filtersInput.stockStatus === 'low') {
    filters.push(sql`${stockQtyExpr} <= ${products.minimumStock}`)
  } else if (filtersInput.stockStatus === 'normal') {
    filters.push(sql`${stockQtyExpr} > ${products.minimumStock}`)
  }
  if (filtersInput.search) {
    const pattern = `%${escapeLikePattern(filtersInput.search)}%`
    const searchFilter = or(
      ilike(products.name, pattern),
      ilike(products.sku, pattern),
      ilike(products.barcode, pattern),
    )
    if (searchFilter) filters.push(searchFilter)
  }

  const whereClause = and(...filters)

  const [rows, summaryRows] = await Promise.all([
    database
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        barcode: products.barcode,
        categoryName: categories.name,
        unit: products.unit,
        minimumStock: products.minimumStock,
        currentStock: stockQtyExpr,
        costPrice: products.costPrice,
        sellingPrice: products.sellingPrice,
      })
      .from(products)
      .leftJoin(
        categories,
        and(eq(products.categoryId, categories.id), eq(categories.workspaceId, ctx.workspaceId)),
      )
      .leftJoin(inventoryStocks, joinCond)
      .where(whereClause)
      .orderBy(asc(products.name))
      .limit(pagination.limit)
      .offset(pagination.offset),

    database
      .select({
        total: count(products.id),
        totalUnits: sql<number>`coalesce(sum(${stockQtyExpr}), 0)::int`,
      })
      .from(products)
      .leftJoin(inventoryStocks, joinCond)
      .where(whereClause),
  ])

  const total = Number(summaryRows[0]?.total ?? 0)
  const totalUnits = Number(summaryRows[0]?.totalUnits ?? 0)

  return {
    items: rows.map((row) => {
      const currentStock = Number(row.currentStock ?? 0)
      return {
        ...row,
        currentStock,
        status: deriveStockStatus(currentStock, row.minimumStock),
      }
    }),
    total,
    totalUnits,
  }
}

export async function getCurrentStockReport(
  ctx: WorkspaceContext,
  query: CurrentStockReportQuery = {},
  database: AppDatabase = db,
) {
  assertWorkspacePermission(ctx, 'reports:read')
  const { search, categoryId, stockStatus, page, pageSize } = parseInput(
    currentStockReportQuerySchema,
    query,
  )

  const data = await fetchCurrentStockRows(
    ctx,
    { search, categoryId, stockStatus },
    { limit: pageSize, offset: (page - 1) * pageSize },
    database,
  )

  return {
    items: data.items,
    totalUnits: data.totalUnits,
    ...buildPaginationMeta(data.total, page, pageSize),
  }
}

async function fetchLowStockRows(
  ctx: WorkspaceContext,
  filtersInput: { search?: string | null; categoryId?: string | null },
  pagination: { limit: number; offset: number },
  database: AppDatabase,
) {
  const defaultWarehouse = await getDefaultWarehouse(ctx.workspaceId, database)
  const joinCond = stockJoinCondition(ctx.workspaceId, defaultWarehouse?.id ?? null)

  const filters = [
    eq(products.workspaceId, ctx.workspaceId),
    eq(products.isActive, true),
    isNull(products.deletedAt),
    sql`${stockQtyExpr} <= ${products.minimumStock}`,
  ]

  if (filtersInput.categoryId) {
    filters.push(eq(products.categoryId, filtersInput.categoryId))
  }
  if (filtersInput.search) {
    const pattern = `%${escapeLikePattern(filtersInput.search)}%`
    const searchFilter = or(
      ilike(products.name, pattern),
      ilike(products.sku, pattern),
      ilike(products.barcode, pattern),
    )
    if (searchFilter) filters.push(searchFilter)
  }

  const whereClause = and(...filters)

  const [rows, totalRows] = await Promise.all([
    database
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        categoryName: categories.name,
        unit: products.unit,
        minimumStock: products.minimumStock,
        currentStock: stockQtyExpr,
      })
      .from(products)
      .leftJoin(
        categories,
        and(eq(products.categoryId, categories.id), eq(categories.workspaceId, ctx.workspaceId)),
      )
      .leftJoin(inventoryStocks, joinCond)
      .where(whereClause)
      .orderBy(asc(stockQtyExpr), asc(products.name))
      .limit(pagination.limit)
      .offset(pagination.offset),

    database
      .select({ total: count(products.id) })
      .from(products)
      .leftJoin(inventoryStocks, joinCond)
      .where(whereClause),
  ])

  const total = Number(totalRows[0]?.total ?? 0)
  return {
    items: rows.map((row) => {
      const currentStock = Number(row.currentStock ?? 0)
      return {
        ...row,
        currentStock,
        deficit: Math.max(0, row.minimumStock - currentStock),
        status: deriveStockStatus(currentStock, row.minimumStock),
      }
    }),
    total,
  }
}

export async function getLowStockReport(
  ctx: WorkspaceContext,
  query: LowStockReportQuery = {},
  database: AppDatabase = db,
) {
  assertWorkspacePermission(ctx, 'reports:read')
  const { search, categoryId, page, pageSize } = parseInput(lowStockReportQuerySchema, query)

  const data = await fetchLowStockRows(
    ctx,
    { search, categoryId },
    { limit: pageSize, offset: (page - 1) * pageSize },
    database,
  )

  return {
    items: data.items,
    ...buildPaginationMeta(data.total, page, pageSize),
  }
}

async function fetchMovementReportRows(
  ctx: WorkspaceContext,
  filtersInput: {
    productId?: string | null
    type?: 'IN' | 'OUT' | 'ADJUSTMENT' | null
    dateFrom?: string | null
    dateTo?: string | null
    search?: string | null
  },
  pagination: { limit: number; offset: number },
  database: AppDatabase,
) {
  const fallbackRange = getDefaultDateRange(30)
  const bounds = resolveJakartaDateBounds(
    filtersInput.dateFrom ?? fallbackRange.dateFrom,
    filtersInput.dateTo ?? fallbackRange.dateTo,
  )

  const filters = [eq(inventoryMovements.workspaceId, ctx.workspaceId)]
  if (filtersInput.productId) filters.push(eq(inventoryMovements.productId, filtersInput.productId))
  if (filtersInput.type) filters.push(eq(inventoryMovements.type, filtersInput.type))
  if (bounds.startDate) filters.push(gte(inventoryMovements.createdAt, bounds.startDate))
  if (bounds.endDate) filters.push(lte(inventoryMovements.createdAt, bounds.endDate))
  if (filtersInput.search) {
    const pattern = `%${escapeLikePattern(filtersInput.search)}%`
    const searchFilter = or(
      ilike(products.name, pattern),
      ilike(products.sku, pattern),
      ilike(inventoryMovements.referenceNumber, pattern),
      ilike(inventoryMovements.notes, pattern),
    )
    if (searchFilter) filters.push(searchFilter)
  }

  const whereClause = and(...filters)

  const [items, summaryRows] = await Promise.all([
    database
      .select({
        id: inventoryMovements.id,
        productId: inventoryMovements.productId,
        productName: products.name,
        productSku: products.sku,
        productUnit: products.unit,
        supplierName: suppliers.name,
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
        suppliers,
        and(
          eq(inventoryMovements.supplierId, suppliers.id),
          eq(suppliers.workspaceId, ctx.workspaceId),
        ),
      )
      .leftJoin(users, eq(inventoryMovements.createdBy, users.id))
      .where(whereClause)
      .orderBy(desc(inventoryMovements.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset),

    database
      .select({
        total: count(inventoryMovements.id),
        stockInUnits: sql<number>`coalesce(sum(${inventoryMovements.quantityDelta}) filter (where ${inventoryMovements.type} = 'IN'), 0)::int`,
        stockOutUnits: sql<number>`coalesce(sum(abs(${inventoryMovements.quantityDelta})) filter (where ${inventoryMovements.type} = 'OUT'), 0)::int`,
        adjustmentNetDelta: sql<number>`coalesce(sum(${inventoryMovements.quantityDelta}) filter (where ${inventoryMovements.type} = 'ADJUSTMENT'), 0)::int`,
        netDelta: sql<number>`coalesce(sum(${inventoryMovements.quantityDelta}), 0)::int`,
      })
      .from(inventoryMovements)
      .leftJoin(
        products,
        and(eq(inventoryMovements.productId, products.id), eq(products.workspaceId, ctx.workspaceId)),
      )
      .where(whereClause),
  ])

  const summary = summaryRows[0]
  const total = Number(summary?.total ?? 0)

  return {
    dateRange: {
      dateFrom: bounds.dateFrom ?? fallbackRange.dateFrom,
      dateTo: bounds.dateTo ?? fallbackRange.dateTo,
    },
    summary: {
      totalMovements: total,
      stockInUnits: Number(summary?.stockInUnits ?? 0),
      stockOutUnits: Number(summary?.stockOutUnits ?? 0),
      adjustmentNetDelta: Number(summary?.adjustmentNetDelta ?? 0),
      netDelta: Number(summary?.netDelta ?? 0),
    },
    items,
    total,
  }
}

export async function getMovementReport(
  ctx: WorkspaceContext,
  query: MovementReportQuery = {},
  database: AppDatabase = db,
) {
  assertWorkspacePermission(ctx, 'reports:read')
  const { productId, type, dateFrom, dateTo, search, page, pageSize } = parseInput(
    movementReportQuerySchema,
    query,
  )

  const data = await fetchMovementReportRows(
    ctx,
    { productId, type, dateFrom, dateTo, search },
    { limit: pageSize, offset: (page - 1) * pageSize },
    database,
  )

  return {
    dateRange: data.dateRange,
    summary: data.summary,
    items: data.items,
    ...buildPaginationMeta(data.total, page, pageSize),
  }
}

export async function exportReportCsv(
  ctx: WorkspaceContext,
  query: ReportExportQuery,
  database: AppDatabase = db,
) {
  assertWorkspacePermission(ctx, 'reports:read')
  const parsed = parseInput(reportExportQuerySchema, query)

  if (parsed.report === 'current-stock') {
    const data = await fetchCurrentStockRows(
      ctx,
      {
        search: parsed.search ?? null,
        categoryId: parsed.categoryId ?? null,
        stockStatus: parsed.stockStatus,
      },
      { limit: MAX_EXPORT_ROWS, offset: 0 },
      database,
    )

    const headers = [
      'SKU',
      'Nama Produk',
      'Barcode',
      'Kategori',
      'Satuan',
      'Stok Saat Ini',
      'Stok Minimum',
      'Status Stok',
      'Harga Modal',
      'Harga Jual',
    ]

    const rows: CsvCell[][] = data.items.map((item) => [
      item.sku,
      item.name,
      item.barcode ?? '',
      item.categoryName ?? 'Tanpa kategori',
      item.unit,
      item.currentStock,
      item.minimumStock,
      item.status === 'OUT' ? 'Habis' : item.status === 'LOW' ? 'Menipis' : 'Normal',
      item.costPrice,
      item.sellingPrice,
    ])

    return {
      filename: `stockly-laporan-stok-saat-ini.csv`,
      csv: serializeCsv(headers, rows),
    }
  }

  if (parsed.report === 'low-stock') {
    const data = await fetchLowStockRows(
      ctx,
      {
        search: parsed.search ?? null,
        categoryId: parsed.categoryId ?? null,
      },
      { limit: MAX_EXPORT_ROWS, offset: 0 },
      database,
    )

    const headers = [
      'SKU',
      'Nama Produk',
      'Kategori',
      'Satuan',
      'Stok Saat Ini',
      'Stok Minimum',
      'Selisih Kekurangan',
      'Status',
    ]

    const rows: CsvCell[][] = data.items.map((item) => [
      item.sku,
      item.name,
      item.categoryName ?? 'Tanpa kategori',
      item.unit,
      item.currentStock,
      item.minimumStock,
      item.deficit,
      item.status === 'OUT' ? 'Habis' : 'Menipis',
    ])

    return {
      filename: `stockly-laporan-stok-menipis.csv`,
      csv: serializeCsv(headers, rows),
    }
  }

  const data = await fetchMovementReportRows(
    ctx,
    {
      search: parsed.search ?? null,
      productId: parsed.productId ?? null,
      type: parsed.type ?? null,
      dateFrom: parsed.dateFrom ?? null,
      dateTo: parsed.dateTo ?? null,
    },
    { limit: MAX_EXPORT_ROWS, offset: 0 },
    database,
  )

  const headers = [
    'Waktu (WIB)',
    'SKU',
    'Produk',
    'Tipe',
    'Perubahan',
    'Stok Sebelum',
    'Stok Sesudah',
    'Satuan',
    'Alasan',
    'Supplier',
    'No. Referensi',
    'Catatan',
    'Petugas',
  ]

  const rows: CsvCell[][] = data.items.map((item) => [
    formatCsvDate(item.createdAt),
    item.productSku ?? '',
    item.productName ?? 'Produk dihapus',
    formatMovementTypeLabel(item.type),
    item.quantityDelta,
    item.quantityBefore,
    item.quantityAfter,
    item.productUnit ?? 'pcs',
    formatMovementReasonLabel(item.type, item.reason),
    item.supplierName ?? '',
    item.referenceNumber ?? '',
    item.notes ?? '',
    item.actorName ?? '',
  ])

  return {
    filename: `stockly-laporan-pergerakan-${data.dateRange.dateFrom}-sd-${data.dateRange.dateTo}.csv`,
    csv: serializeCsv(headers, rows),
  }
}

export const ReportService = {
  getDashboardSummary,
  getCurrentStockReport,
  getLowStockReport,
  getMovementReport,
  exportReportCsv,
}

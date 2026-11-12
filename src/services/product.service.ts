import 'server-only'

import { and, asc, count, eq, ilike, isNotNull, isNull, or } from 'drizzle-orm'
import { db } from '@/src/db'
import { categories, products } from '@/src/db/schema'
import { DomainError, mapDatabaseError } from '@/src/lib/errors'
import { assertWorkspacePermission, type WorkspaceContext } from '@/src/lib/permissions/workspace'
import {
  createProductSchema,
  listProductsQuerySchema,
  updateProductSchema,
  type CreateProductInput,
  type ListProductsQuery,
  type UpdateProductInput,
} from '@/src/lib/validation/catalog'
import {
  buildPaginationMeta,
  escapeLikePattern,
  parseInput,
  parseUuid,
  type AppDatabase,
} from './helpers'

const PRODUCT_CONSTRAINT_MESSAGES: Record<string, string> = {
  products_workspace_sku_unique: 'SKU sudah digunakan oleh produk lain di ruang kerja ini.',
  products_workspace_barcode_unique_idx:
    'Barcode sudah digunakan oleh produk lain di ruang kerja ini.',
  products_workspace_category_fk: 'Kategori tidak ditemukan di ruang kerja ini.',
}

async function assertCategoryInWorkspace(
  workspaceId: string,
  categoryId: string | null | undefined,
  database: AppDatabase,
) {
  if (!categoryId) return

  const [category] = await database
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.workspaceId, workspaceId)))
    .limit(1)

  if (!category) {
    throw new DomainError('NOT_FOUND', 'Kategori tidak ditemukan di ruang kerja ini.')
  }
}

export async function listProducts(
  ctx: WorkspaceContext,
  query: ListProductsQuery = {},
  database: AppDatabase = db,
) {
  assertWorkspacePermission(ctx, 'products:read')
  const { search, categoryId, status, page, pageSize } = parseInput(listProductsQuerySchema, query)

  const filters = [eq(products.workspaceId, ctx.workspaceId)]

  if (status === 'active') {
    filters.push(eq(products.isActive, true), isNull(products.deletedAt))
  } else if (status === 'archived') {
    const archivedFilter = or(eq(products.isActive, false), isNotNull(products.deletedAt))
    if (archivedFilter) filters.push(archivedFilter)
  }

  if (categoryId) {
    filters.push(eq(products.categoryId, categoryId))
  }

  if (search) {
    const pattern = `%${escapeLikePattern(search)}%`
    const searchFilter = or(
      ilike(products.name, pattern),
      ilike(products.sku, pattern),
      ilike(products.barcode, pattern),
    )
    if (searchFilter) filters.push(searchFilter)
  }

  const whereClause = and(...filters)
  const offset = (page - 1) * pageSize

  const [items, totalRows] = await Promise.all([
    database
      .select({
        id: products.id,
        workspaceId: products.workspaceId,
        categoryId: products.categoryId,
        categoryName: categories.name,
        name: products.name,
        sku: products.sku,
        barcode: products.barcode,
        description: products.description,
        unit: products.unit,
        costPrice: products.costPrice,
        sellingPrice: products.sellingPrice,
        minimumStock: products.minimumStock,
        isActive: products.isActive,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        deletedAt: products.deletedAt,
      })
      .from(products)
      .leftJoin(
        categories,
        and(eq(products.categoryId, categories.id), eq(categories.workspaceId, ctx.workspaceId)),
      )
      .where(whereClause)
      .orderBy(asc(products.name))
      .limit(pageSize)
      .offset(offset),
    database.select({ total: count() }).from(products).where(whereClause),
  ])

  const total = Number(totalRows[0]?.total ?? 0)
  return {
    items,
    ...buildPaginationMeta(total, page, pageSize),
  }
}

export async function getProductById(
  ctx: WorkspaceContext,
  productId: string,
  database: AppDatabase = db,
) {
  assertWorkspacePermission(ctx, 'products:read')
  const validId = parseUuid(productId, 'ID produk tidak valid.')

  const [product] = await database
    .select({
      id: products.id,
      workspaceId: products.workspaceId,
      categoryId: products.categoryId,
      categoryName: categories.name,
      name: products.name,
      sku: products.sku,
      barcode: products.barcode,
      description: products.description,
      unit: products.unit,
      costPrice: products.costPrice,
      sellingPrice: products.sellingPrice,
      minimumStock: products.minimumStock,
      isActive: products.isActive,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      deletedAt: products.deletedAt,
    })
    .from(products)
    .leftJoin(
      categories,
      and(eq(products.categoryId, categories.id), eq(categories.workspaceId, ctx.workspaceId)),
    )
    .where(and(eq(products.id, validId), eq(products.workspaceId, ctx.workspaceId)))
    .limit(1)

  if (!product) {
    throw new DomainError('NOT_FOUND', 'Produk tidak ditemukan.')
  }

  return product
}

export async function createProduct(
  ctx: WorkspaceContext,
  input: CreateProductInput,
  database: AppDatabase = db,
) {
  assertWorkspacePermission(ctx, 'products:write')
  const data = parseInput(createProductSchema, input)

  await assertCategoryInWorkspace(ctx.workspaceId, data.categoryId, database)

  try {
    const [created] = await database
      .insert(products)
      .values({
        workspaceId: ctx.workspaceId,
        categoryId: data.categoryId ?? null,
        name: data.name,
        sku: data.sku,
        barcode: data.barcode ?? null,
        description: data.description ?? null,
        unit: data.unit,
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
        minimumStock: data.minimumStock,
      })
      .returning()

    return created
  } catch (error) {
    mapDatabaseError(error, PRODUCT_CONSTRAINT_MESSAGES)
  }
}

export async function updateProduct(
  ctx: WorkspaceContext,
  productId: string,
  input: UpdateProductInput,
  database: AppDatabase = db,
) {
  assertWorkspacePermission(ctx, 'products:write')
  const validId = parseUuid(productId, 'ID produk tidak valid.')
  const data = parseInput(updateProductSchema, input)

  const patch: Partial<typeof products.$inferInsert> = {}
  if (data.name !== undefined) patch.name = data.name
  if (data.sku !== undefined) patch.sku = data.sku
  if (data.barcode !== undefined) patch.barcode = data.barcode
  if (data.categoryId !== undefined) patch.categoryId = data.categoryId
  if (data.description !== undefined) patch.description = data.description
  if (data.unit !== undefined) patch.unit = data.unit
  if (data.costPrice !== undefined) patch.costPrice = data.costPrice
  if (data.sellingPrice !== undefined) patch.sellingPrice = data.sellingPrice
  if (data.minimumStock !== undefined) patch.minimumStock = data.minimumStock

  if (Object.keys(patch).length === 0) {
    throw new DomainError('VALIDATION_ERROR', 'Tidak ada perubahan data produk yang dikirim.')
  }

  await assertCategoryInWorkspace(ctx.workspaceId, data.categoryId, database)

  try {
    const [updated] = await database
      .update(products)
      .set({
        ...patch,
        updatedAt: new Date(),
      })
      .where(and(eq(products.id, validId), eq(products.workspaceId, ctx.workspaceId)))
      .returning()

    if (!updated) {
      throw new DomainError('NOT_FOUND', 'Produk tidak ditemukan.')
    }

    return updated
  } catch (error) {
    mapDatabaseError(error, PRODUCT_CONSTRAINT_MESSAGES)
  }
}

export async function archiveProduct(
  ctx: WorkspaceContext,
  productId: string,
  database: AppDatabase = db,
) {
  assertWorkspacePermission(ctx, 'products:write')
  const validId = parseUuid(productId, 'ID produk tidak valid.')

  const now = new Date()
  const [archived] = await database
    .update(products)
    .set({
      isActive: false,
      deletedAt: now,
      updatedAt: now,
    })
    .where(and(eq(products.id, validId), eq(products.workspaceId, ctx.workspaceId)))
    .returning()

  if (!archived) {
    throw new DomainError('NOT_FOUND', 'Produk tidak ditemukan.')
  }

  return archived
}

export async function restoreProduct(
  ctx: WorkspaceContext,
  productId: string,
  database: AppDatabase = db,
) {
  assertWorkspacePermission(ctx, 'products:write')
  const validId = parseUuid(productId, 'ID produk tidak valid.')

  const [restored] = await database
    .update(products)
    .set({
      isActive: true,
      deletedAt: null,
      updatedAt: new Date(),
    })
    .where(and(eq(products.id, validId), eq(products.workspaceId, ctx.workspaceId)))
    .returning()

  if (!restored) {
    throw new DomainError('NOT_FOUND', 'Produk tidak ditemukan.')
  }

  return restored
}

export const ProductService = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  archiveProduct,
  restoreProduct,
}


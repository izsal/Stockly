import 'server-only'

import { and, asc, count, eq, ilike, or } from 'drizzle-orm'
import { db } from '@/src/db'
import { categories, products } from '@/src/db/schema'
import { DomainError, mapDatabaseError } from '@/src/lib/errors'
import { assertWorkspacePermission, type WorkspaceContext } from '@/src/lib/permissions/workspace'
import {
  categoryInputSchema,
  listCategoriesQuerySchema,
  type CategoryInput,
  type ListCategoriesQuery,
} from '@/src/lib/validation/catalog'
import {
  buildPaginationMeta,
  escapeLikePattern,
  parseInput,
  parseUuid,
  type AppDatabase,
} from './helpers'

const CATEGORY_CONSTRAINT_MESSAGES: Record<string, string> = {
  categories_workspace_name_unique: 'Nama kategori sudah digunakan di ruang kerja ini.',
}

export async function listCategories(
  ctx: WorkspaceContext,
  query: ListCategoriesQuery = {},
  database: AppDatabase = db,
) {
  assertWorkspacePermission(ctx, 'categories:read')
  const { search, page, pageSize } = parseInput(listCategoriesQuerySchema, query)

  const filters = [eq(categories.workspaceId, ctx.workspaceId)]
  if (search) {
    const pattern = `%${escapeLikePattern(search)}%`
    const searchFilter = or(ilike(categories.name, pattern), ilike(categories.description, pattern))
    if (searchFilter) filters.push(searchFilter)
  }

  const whereClause = and(...filters)
  const offset = (page - 1) * pageSize

  const [items, totalRows] = await Promise.all([
    database
      .select()
      .from(categories)
      .where(whereClause)
      .orderBy(asc(categories.name))
      .limit(pageSize)
      .offset(offset),
    database.select({ total: count() }).from(categories).where(whereClause),
  ])

  const total = Number(totalRows[0]?.total ?? 0)
  return {
    items,
    ...buildPaginationMeta(total, page, pageSize),
  }
}

export async function getCategoryById(
  ctx: WorkspaceContext,
  categoryId: string,
  database: AppDatabase = db,
) {
  assertWorkspacePermission(ctx, 'categories:read')
  const validId = parseUuid(categoryId, 'ID kategori tidak valid.')

  const [category] = await database
    .select()
    .from(categories)
    .where(and(eq(categories.id, validId), eq(categories.workspaceId, ctx.workspaceId)))
    .limit(1)

  if (!category) {
    throw new DomainError('NOT_FOUND', 'Kategori tidak ditemukan.')
  }

  return category
}

export async function createCategory(
  ctx: WorkspaceContext,
  input: CategoryInput,
  database: AppDatabase = db,
) {
  assertWorkspacePermission(ctx, 'categories:write')
  const data = parseInput(categoryInputSchema, input)

  try {
    const [created] = await database
      .insert(categories)
      .values({
        workspaceId: ctx.workspaceId,
        name: data.name,
        description: data.description ?? null,
      })
      .returning()

    return created
  } catch (error) {
    mapDatabaseError(error, CATEGORY_CONSTRAINT_MESSAGES)
  }
}

export async function updateCategory(
  ctx: WorkspaceContext,
  categoryId: string,
  input: CategoryInput,
  database: AppDatabase = db,
) {
  assertWorkspacePermission(ctx, 'categories:write')
  const validId = parseUuid(categoryId, 'ID kategori tidak valid.')
  const data = parseInput(categoryInputSchema, input)

  try {
    const [updated] = await database
      .update(categories)
      .set({
        name: data.name,
        description: data.description ?? null,
        updatedAt: new Date(),
      })
      .where(and(eq(categories.id, validId), eq(categories.workspaceId, ctx.workspaceId)))
      .returning()

    if (!updated) {
      throw new DomainError('NOT_FOUND', 'Kategori tidak ditemukan.')
    }

    return updated
  } catch (error) {
    mapDatabaseError(error, CATEGORY_CONSTRAINT_MESSAGES)
  }
}

export async function deleteCategory(
  ctx: WorkspaceContext,
  categoryId: string,
  database: AppDatabase = db,
) {
  assertWorkspacePermission(ctx, 'categories:write')
  const validId = parseUuid(categoryId, 'ID kategori tidak valid.')

  return database.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.id, validId), eq(categories.workspaceId, ctx.workspaceId)))
      .limit(1)

    if (!existing) {
      throw new DomainError('NOT_FOUND', 'Kategori tidak ditemukan.')
    }

    await tx
      .update(products)
      .set({ categoryId: null, updatedAt: new Date() })
      .where(and(eq(products.workspaceId, ctx.workspaceId), eq(products.categoryId, validId)))

    const [deleted] = await tx
      .delete(categories)
      .where(and(eq(categories.id, validId), eq(categories.workspaceId, ctx.workspaceId)))
      .returning()

    return deleted
  })
}

export const CategoryService = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
}


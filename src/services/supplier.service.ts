import 'server-only'

import { and, asc, count, eq, ilike, isNull, or } from 'drizzle-orm'
import { db } from '@/src/db'
import { suppliers } from '@/src/db/schema'
import { DomainError, mapDatabaseError } from '@/src/lib/errors'
import { assertWorkspacePermission, type WorkspaceContext } from '@/src/lib/permissions/workspace'
import {
  listSuppliersQuerySchema,
  supplierInputSchema,
  type ListSuppliersQuery,
  type SupplierInput,
} from '@/src/lib/validation/inventory'
import {
  buildPaginationMeta,
  escapeLikePattern,
  parseInput,
  parseUuid,
  type AppDatabase,
} from './helpers'

const SUPPLIER_CONSTRAINT_MESSAGES: Record<string, string> = {
  suppliers_workspace_name_unique_idx: 'Nama supplier sudah terdaftar di ruang kerja ini.',
}

export async function listSuppliers(
  ctx: WorkspaceContext,
  query: ListSuppliersQuery = {},
  database: AppDatabase = db,
) {
  assertWorkspacePermission(ctx, 'suppliers:read')
  const { search, page, pageSize } = parseInput(listSuppliersQuerySchema, query)

  const filters = [eq(suppliers.workspaceId, ctx.workspaceId), isNull(suppliers.deletedAt)]
  if (search) {
    const pattern = `%${escapeLikePattern(search)}%`
    const searchFilter = or(
      ilike(suppliers.name, pattern),
      ilike(suppliers.phone, pattern),
      ilike(suppliers.email, pattern),
    )
    if (searchFilter) filters.push(searchFilter)
  }

  const whereClause = and(...filters)
  const offset = (page - 1) * pageSize

  const [items, totalRows] = await Promise.all([
    database
      .select()
      .from(suppliers)
      .where(whereClause)
      .orderBy(asc(suppliers.name))
      .limit(pageSize)
      .offset(offset),
    database.select({ total: count() }).from(suppliers).where(whereClause),
  ])

  const total = Number(totalRows[0]?.total ?? 0)
  return {
    items,
    ...buildPaginationMeta(total, page, pageSize),
  }
}

export async function getSupplierById(
  ctx: WorkspaceContext,
  supplierId: string,
  database: AppDatabase = db,
) {
  assertWorkspacePermission(ctx, 'suppliers:read')
  const validId = parseUuid(supplierId, 'ID supplier tidak valid.')

  const [supplier] = await database
    .select()
    .from(suppliers)
    .where(
      and(
        eq(suppliers.id, validId),
        eq(suppliers.workspaceId, ctx.workspaceId),
        isNull(suppliers.deletedAt),
      ),
    )
    .limit(1)

  if (!supplier) {
    throw new DomainError('NOT_FOUND', 'Supplier tidak ditemukan.')
  }

  return supplier
}

export async function createSupplier(
  ctx: WorkspaceContext,
  input: SupplierInput,
  database: AppDatabase = db,
) {
  assertWorkspacePermission(ctx, 'suppliers:write')
  const data = parseInput(supplierInputSchema, input)

  try {
    const [created] = await database
      .insert(suppliers)
      .values({
        workspaceId: ctx.workspaceId,
        name: data.name,
        phone: data.phone ?? null,
        email: data.email ?? null,
        address: data.address ?? null,
        notes: data.notes ?? null,
      })
      .returning()

    return created
  } catch (error) {
    mapDatabaseError(error, SUPPLIER_CONSTRAINT_MESSAGES)
  }
}

export async function updateSupplier(
  ctx: WorkspaceContext,
  supplierId: string,
  input: SupplierInput,
  database: AppDatabase = db,
) {
  assertWorkspacePermission(ctx, 'suppliers:write')
  const validId = parseUuid(supplierId, 'ID supplier tidak valid.')
  const data = parseInput(supplierInputSchema, input)

  try {
    const [updated] = await database
      .update(suppliers)
      .set({
        name: data.name,
        phone: data.phone ?? null,
        email: data.email ?? null,
        address: data.address ?? null,
        notes: data.notes ?? null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(suppliers.id, validId),
          eq(suppliers.workspaceId, ctx.workspaceId),
          isNull(suppliers.deletedAt),
        ),
      )
      .returning()

    if (!updated) {
      throw new DomainError('NOT_FOUND', 'Supplier tidak ditemukan.')
    }

    return updated
  } catch (error) {
    mapDatabaseError(error, SUPPLIER_CONSTRAINT_MESSAGES)
  }
}

export async function deleteSupplier(
  ctx: WorkspaceContext,
  supplierId: string,
  database: AppDatabase = db,
) {
  assertWorkspacePermission(ctx, 'suppliers:write')
  const validId = parseUuid(supplierId, 'ID supplier tidak valid.')

  const now = new Date()
  const [deleted] = await database
    .update(suppliers)
    .set({
      deletedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(suppliers.id, validId),
        eq(suppliers.workspaceId, ctx.workspaceId),
        isNull(suppliers.deletedAt),
      ),
    )
    .returning()

  if (!deleted) {
    throw new DomainError('NOT_FOUND', 'Supplier tidak ditemukan.')
  }

  return deleted
}

export const SupplierService = {
  listSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
}


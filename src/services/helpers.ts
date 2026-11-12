import type { ZodType } from 'zod'
import type { db } from '@/src/db'
import { DomainError, validationErrorFromZod } from '@/src/lib/errors'
import { uuidSchema } from '@/src/lib/validation/catalog'

export type AppDatabase = typeof db

export function parseInput<TSchema extends ZodType>(
  schema: TSchema,
  input: unknown,
  message?: string,
) {
  const result = schema.safeParse(input)
  if (!result.success) {
    throw validationErrorFromZod(result.error, message)
  }
  return result.data
}

export function parseUuid(id: string, message = 'ID tidak valid.'): string {
  const result = uuidSchema.safeParse(id)
  if (!result.success) {
    throw new DomainError('VALIDATION_ERROR', message)
  }
  return result.data
}

export function escapeLikePattern(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')
}

export function buildPaginationMeta(total: number, page: number, pageSize: number) {
  return {
    total,
    page,
    pageSize,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
  }
}


'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { isDomainError, type DomainErrorCode } from '@/src/lib/errors'
import type {
  CategoryInput,
  CreateProductInput,
  UpdateProductInput,
} from '@/src/lib/validation/catalog'
import { requireWorkspaceContext } from '@/src/lib/workspaces/context'
import { CategoryService } from '@/src/services/category.service'
import { ProductService } from '@/src/services/product.service'

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | {
      ok: false
      message: string
      code?: DomainErrorCode
      fieldErrors?: Record<string, string[] | undefined>
    }

async function runCatalogAction<T>(
  operation: () => Promise<T>,
  pathsToRevalidate: string[],
): Promise<ActionResult<T>> {
  try {
    const data = await operation()
    for (const path of pathsToRevalidate) {
      revalidatePath(path)
    }
    return { ok: true, data }
  } catch (error) {
    if (isDomainError(error)) {
      return {
        ok: false,
        code: error.code,
        message: error.message,
        fieldErrors: error.fieldErrors,
      }
    }

    const correlationId = randomUUID()
    console.error(`[catalog-action:${correlationId}]`, error)
    return {
      ok: false,
      message: 'Terjadi kendala pada server. Silakan coba lagi.',
    }
  }
}

export async function createCategoryAction(input: CategoryInput) {
  return runCatalogAction(async () => {
    const ctx = await requireWorkspaceContext('categories:write')
    return CategoryService.createCategory(ctx, input)
  }, ['/categories', '/products'])
}

export async function updateCategoryAction(categoryId: string, input: CategoryInput) {
  return runCatalogAction(async () => {
    const ctx = await requireWorkspaceContext('categories:write')
    return CategoryService.updateCategory(ctx, categoryId, input)
  }, ['/categories', '/products'])
}

export async function deleteCategoryAction(categoryId: string) {
  return runCatalogAction(async () => {
    const ctx = await requireWorkspaceContext('categories:write')
    return CategoryService.deleteCategory(ctx, categoryId)
  }, ['/categories', '/products'])
}

export async function createProductAction(input: CreateProductInput) {
  return runCatalogAction(async () => {
    const ctx = await requireWorkspaceContext('products:write')
    return ProductService.createProduct(ctx, input)
  }, ['/products', '/dashboard'])
}

export async function updateProductAction(productId: string, input: UpdateProductInput) {
  return runCatalogAction(async () => {
    const ctx = await requireWorkspaceContext('products:write')
    return ProductService.updateProduct(ctx, productId, input)
  }, ['/products', '/dashboard'])
}

export async function archiveProductAction(productId: string) {
  return runCatalogAction(async () => {
    const ctx = await requireWorkspaceContext('products:write')
    return ProductService.archiveProduct(ctx, productId)
  }, ['/products', '/dashboard'])
}

export async function restoreProductAction(productId: string) {
  return runCatalogAction(async () => {
    const ctx = await requireWorkspaceContext('products:write')
    return ProductService.restoreProduct(ctx, productId)
  }, ['/products', '/dashboard'])
}


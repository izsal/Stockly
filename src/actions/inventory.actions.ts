'use server'

import { revalidatePath } from 'next/cache'
import { isDomainError, type DomainErrorCode } from '@/src/lib/errors'
import { logServerError } from '@/src/lib/logger'
import type {
  StockAdjustmentInput,
  StockInInput,
  StockOutInput,
  SupplierInput,
} from '@/src/lib/validation/inventory'
import { requireWorkspaceContext } from '@/src/lib/workspaces/context'
import { InventoryService } from '@/src/services/inventory.service'
import { SupplierService } from '@/src/services/supplier.service'

export type InventoryActionResult<T = void> =
  | { ok: true; data: T }
  | {
      ok: false
      message: string
      code?: DomainErrorCode
      fieldErrors?: Record<string, string[] | undefined>
    }

async function runInventoryAction<T>(
  operation: () => Promise<T>,
  pathsToRevalidate: string[],
): Promise<InventoryActionResult<T>> {
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

    logServerError('inventory-action', error)
    return {
      ok: false,
      message: 'Terjadi kendala pada server. Silakan coba lagi.',
    }
  }
}

export async function createSupplierAction(input: SupplierInput) {
  return runInventoryAction(async () => {
    const ctx = await requireWorkspaceContext('suppliers:write')
    return SupplierService.createSupplier(ctx, input)
  }, ['/suppliers', '/inventory/stock-in'])
}

export async function updateSupplierAction(supplierId: string, input: SupplierInput) {
  return runInventoryAction(async () => {
    const ctx = await requireWorkspaceContext('suppliers:write')
    return SupplierService.updateSupplier(ctx, supplierId, input)
  }, ['/suppliers', '/inventory/stock-in', '/movements'])
}

export async function deleteSupplierAction(supplierId: string) {
  return runInventoryAction(async () => {
    const ctx = await requireWorkspaceContext('suppliers:write')
    return SupplierService.deleteSupplier(ctx, supplierId)
  }, ['/suppliers', '/inventory/stock-in'])
}

export async function createStockInAction(input: StockInInput) {
  return runInventoryAction(async () => {
    const ctx = await requireWorkspaceContext('inventory:write')
    return InventoryService.createStockIn(ctx, input)
  }, ['/inventory/stock-in', '/inventory/stock-out', '/inventory/adjustment', '/movements', '/products', '/dashboard'])
}

export async function createStockOutAction(input: StockOutInput) {
  return runInventoryAction(async () => {
    const ctx = await requireWorkspaceContext('inventory:write')
    return InventoryService.createStockOut(ctx, input)
  }, ['/inventory/stock-in', '/inventory/stock-out', '/inventory/adjustment', '/movements', '/products', '/dashboard'])
}

export async function createStockAdjustmentAction(input: StockAdjustmentInput) {
  return runInventoryAction(async () => {
    const ctx = await requireWorkspaceContext('inventory:write')
    return InventoryService.createAdjustment(ctx, input)
  }, ['/inventory/stock-in', '/inventory/stock-out', '/inventory/adjustment', '/movements', '/products', '/dashboard'])
}


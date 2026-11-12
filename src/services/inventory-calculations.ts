import { DomainError } from '@/src/lib/errors'

export type MovementCalculationResult = {
  quantityBefore: number
  quantityDelta: number
  quantityAfter: number
}

export type LedgerMovementEntry = {
  quantityBefore: number
  quantityDelta: number
  quantityAfter: number
}

export function computeStockInResult(
  currentStock: number,
  quantity: number,
): MovementCalculationResult {
  if (!Number.isInteger(currentStock) || currentStock < 0) {
    throw new DomainError('VALIDATION_ERROR', 'Stok awal produk tidak valid.')
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new DomainError('VALIDATION_ERROR', 'Jumlah stok masuk harus bilangan bulat positif.')
  }

  return {
    quantityBefore: currentStock,
    quantityDelta: quantity,
    quantityAfter: currentStock + quantity,
  }
}

export function computeStockOutResult(
  currentStock: number,
  quantity: number,
): MovementCalculationResult {
  if (!Number.isInteger(currentStock) || currentStock < 0) {
    throw new DomainError('VALIDATION_ERROR', 'Stok awal produk tidak valid.')
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new DomainError('VALIDATION_ERROR', 'Jumlah stok keluar harus bilangan bulat positif.')
  }

  const quantityAfter = currentStock - quantity
  if (quantityAfter < 0) {
    throw new DomainError(
      'INSUFFICIENT_STOCK',
      `Stok tidak mencukupi. Stok tersedia: ${currentStock}.`,
    )
  }

  return {
    quantityBefore: currentStock,
    quantityDelta: -quantity,
    quantityAfter,
  }
}

export function computeAdjustmentResult(
  currentStock: number,
  countedQuantity: number,
): MovementCalculationResult {
  if (!Number.isInteger(currentStock) || currentStock < 0) {
    throw new DomainError('VALIDATION_ERROR', 'Stok awal produk tidak valid.')
  }
  if (!Number.isInteger(countedQuantity) || countedQuantity < 0) {
    throw new DomainError('VALIDATION_ERROR', 'Jumlah stok fisik tidak boleh bernilai negatif.')
  }

  const quantityDelta = countedQuantity - currentStock
  if (quantityDelta === 0) {
    throw new DomainError(
      'VALIDATION_ERROR',
      'Jumlah fisik sama dengan stok saat ini. Tidak ada penyesuaian yang diperlukan.',
    )
  }

  return {
    quantityBefore: currentStock,
    quantityDelta,
    quantityAfter: countedQuantity,
  }
}

export function reconcileLedgerBalance(
  movements: readonly LedgerMovementEntry[],
  openingStock = 0,
): {
  valid: boolean
  computedBalance: number
  mismatchReason?: string
} {
  let runningBalance = openingStock

  for (let i = 0; i < movements.length; i++) {
    const entry = movements[i]
    if (entry.quantityBefore !== runningBalance) {
      return {
        valid: false,
        computedBalance: runningBalance,
        mismatchReason: `Movement #${i} before (${entry.quantityBefore}) !== running (${runningBalance})`,
      }
    }

    if (entry.quantityBefore + entry.quantityDelta !== entry.quantityAfter) {
      return {
        valid: false,
        computedBalance: runningBalance,
        mismatchReason: `Movement #${i} delta mismatch`,
      }
    }

    if (entry.quantityAfter < 0) {
      return {
        valid: false,
        computedBalance: runningBalance,
        mismatchReason: `Movement #${i} produced negative balance (${entry.quantityAfter})`,
      }
    }

    runningBalance = entry.quantityAfter
  }

  const sumOfDeltas = movements.reduce((sum, entry) => sum + entry.quantityDelta, openingStock)
  if (sumOfDeltas !== runningBalance) {
    return {
      valid: false,
      computedBalance: runningBalance,
      mismatchReason: 'Ledger delta sum does not equal closing balance',
    }
  }

  return {
    valid: true,
    computedBalance: runningBalance,
  }
}


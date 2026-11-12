import { describe, expect, it } from 'vitest'
import {
  computeAdjustmentResult,
  computeStockInResult,
  computeStockOutResult,
  reconcileLedgerBalance,
} from './inventory-calculations'

describe('inventory movement calculations', () => {
  it('computes positive delta for stock in', () => {
    expect(computeStockInResult(0, 25)).toEqual({
      quantityBefore: 0,
      quantityDelta: 25,
      quantityAfter: 25,
    })
    expect(computeStockInResult(25, 10)).toEqual({
      quantityBefore: 25,
      quantityDelta: 10,
      quantityAfter: 35,
    })
  })

  it('computes negative delta for stock out and allows emptying stock to zero', () => {
    expect(computeStockOutResult(12, 4)).toEqual({
      quantityBefore: 12,
      quantityDelta: -4,
      quantityAfter: 8,
    })
    expect(computeStockOutResult(8, 8)).toEqual({
      quantityBefore: 8,
      quantityDelta: -8,
      quantityAfter: 0,
    })
  })

  it('rejects negative resulting stock on stock out with INSUFFICIENT_STOCK', () => {
    expect(() => computeStockOutResult(3, 5)).toThrowError(
      'Stok tidak mencukupi. Stok tersedia: 3.',
    )
    expect(() => computeStockOutResult(0, 1)).toThrowError(
      'Stok tidak mencukupi. Stok tersedia: 0.',
    )
  })

  it('computes positive and negative deltas for stock adjustments and rejects zero delta', () => {
    expect(computeAdjustmentResult(10, 15)).toEqual({
      quantityBefore: 10,
      quantityDelta: 5,
      quantityAfter: 15,
    })
    expect(computeAdjustmentResult(15, 7)).toEqual({
      quantityBefore: 15,
      quantityDelta: -8,
      quantityAfter: 7,
    })
    expect(computeAdjustmentResult(7, 0)).toEqual({
      quantityBefore: 7,
      quantityDelta: -7,
      quantityAfter: 0,
    })
    expect(() => computeAdjustmentResult(10, 10)).toThrowError(
      'Jumlah fisik sama dengan stok saat ini.',
    )
    expect(() => computeAdjustmentResult(10, -1)).toThrowError(
      'Jumlah stok fisik tidak boleh bernilai negatif.',
    )
  })

  it('reconciles a sequence of movements against running and closing balances', () => {
    const m1 = computeStockInResult(0, 50)
    const m2 = computeStockOutResult(m1.quantityAfter, 18)
    const m3 = computeAdjustmentResult(m2.quantityAfter, 25)
    const m4 = computeStockInResult(m3.quantityAfter, 5)

    expect(reconcileLedgerBalance([m1, m2, m3, m4])).toEqual({
      valid: true,
      computedBalance: 30,
    })

    expect(
      reconcileLedgerBalance([
        m1,
        { quantityBefore: 49, quantityDelta: -5, quantityAfter: 44 },
      ]).valid,
    ).toBe(false)
  })
})


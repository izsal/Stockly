import { describe, expect, it } from 'vitest'
import { buildDemoMovementsForProduct, DEMO_PRODUCTS } from './seed-data'

describe('Demo seed fixture integrity', () => {
  it('builds reconciled ledger movements with normal, low-stock, and out-of-stock coverage', () => {
    let normalCount = 0
    let lowCount = 0
    let outCount = 0

    for (const product of DEMO_PRODUCTS) {
      const movements = buildDemoMovementsForProduct(product)
      const finalBalance = movements[movements.length - 1]?.quantityAfter ?? 0
      const deltaSum = movements.reduce((sum, item) => sum + item.quantityDelta, 0)

      expect(deltaSum).toBe(finalBalance)
      expect(finalBalance).toBeGreaterThanOrEqual(0)

      if (finalBalance === 0) outCount += 1
      else if (finalBalance <= product.minimumStock) lowCount += 1
      else normalCount += 1
    }

    expect(normalCount).toBeGreaterThanOrEqual(1)
    expect(lowCount).toBeGreaterThanOrEqual(1)
    expect(outCount).toBeGreaterThanOrEqual(1)
  })
})


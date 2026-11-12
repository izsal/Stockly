import { describe, expect, it } from 'vitest'
import {
  listMovementsQuerySchema,
  stockAdjustmentSchema,
  stockInSchema,
  stockOutSchema,
  supplierInputSchema,
} from './inventory'

const VALID_PRODUCT_ID = '11111111-1111-4111-8111-111111111111'
const VALID_SUPPLIER_ID = '22222222-2222-4222-8222-222222222222'

describe('supplierInputSchema', () => {
  it('accepts valid supplier input and normalizes optional fields', () => {
    const result = supplierInputSchema.parse({
      name: '  PT Sumber Makmur  ',
      phone: '  08123456789 ',
      email: '  SALES@Makmur.ID ',
      address: ' ',
      notes: '',
    })

    expect(result).toEqual({
      name: 'PT Sumber Makmur',
      phone: '08123456789',
      email: 'sales@makmur.id',
      address: null,
      notes: null,
    })
  })

  it('rejects empty name and invalid email format', () => {
    const emptyName = supplierInputSchema.safeParse({ name: '   ' })
    expect(emptyName.success).toBe(false)

    const badEmail = supplierInputSchema.safeParse({
      name: 'CV Jaya',
      email: 'bukan-email',
    })
    expect(badEmail.success).toBe(false)
  })
})

describe('stockInSchema', () => {
  it('validates positive integer quantity and optional supplier/reference', () => {
    const parsed = stockInSchema.parse({
      productId: VALID_PRODUCT_ID,
      quantity: '15',
      supplierId: VALID_SUPPLIER_ID,
      referenceNumber: '  PO-001 ',
      notes: '',
    })

    expect(parsed).toEqual({
      productId: VALID_PRODUCT_ID,
      quantity: 15,
      supplierId: VALID_SUPPLIER_ID,
      referenceNumber: 'PO-001',
      notes: null,
    })
  })

  it('rejects zero, negative, or fractional quantities', () => {
    expect(stockInSchema.safeParse({ productId: VALID_PRODUCT_ID, quantity: 0 }).success).toBe(false)
    expect(stockInSchema.safeParse({ productId: VALID_PRODUCT_ID, quantity: -5 }).success).toBe(false)
    expect(stockInSchema.safeParse({ productId: VALID_PRODUCT_ID, quantity: 2.5 }).success).toBe(false)
  })
})

describe('stockOutSchema', () => {
  it('validates reason enum and positive quantity', () => {
    const parsed = stockOutSchema.parse({
      productId: VALID_PRODUCT_ID,
      quantity: 4,
      reason: 'DAMAGE',
      referenceNumber: '',
    })

    expect(parsed.quantity).toBe(4)
    expect(parsed.reason).toBe('DAMAGE')
    expect(parsed.referenceNumber).toBeNull()
  })

  it('rejects unknown reasons', () => {
    const res = stockOutSchema.safeParse({
      productId: VALID_PRODUCT_ID,
      quantity: 1,
      reason: 'UNKNOWN_REASON',
    })
    expect(res.success).toBe(false)
  })
})

describe('stockAdjustmentSchema', () => {
  it('allows countedQuantity of 0 with non-empty reason', () => {
    const parsed = stockAdjustmentSchema.parse({
      productId: VALID_PRODUCT_ID,
      countedQuantity: '0',
      reason: '  Opname Stok Bulanan  ',
    })

    expect(parsed.countedQuantity).toBe(0)
    expect(parsed.reason).toBe('Opname Stok Bulanan')
  })

  it('rejects negative countedQuantity or blank reason', () => {
    expect(
      stockAdjustmentSchema.safeParse({
        productId: VALID_PRODUCT_ID,
        countedQuantity: -1,
        reason: 'Opname',
      }).success,
    ).toBe(false)

    expect(
      stockAdjustmentSchema.safeParse({
        productId: VALID_PRODUCT_ID,
        countedQuantity: 5,
        reason: '   ',
      }).success,
    ).toBe(false)
  })
})

describe('listMovementsQuerySchema', () => {
  it('normalizes empty filters to null and defaults pagination', () => {
    const parsed = listMovementsQuerySchema.parse({
      productId: '',
      type: '',
      dateFrom: '',
      dateTo: '2026-11-12',
      search: '  INV-123 ',
    })

    expect(parsed).toEqual({
      productId: null,
      type: null,
      dateFrom: null,
      dateTo: '2026-11-12',
      search: 'INV-123',
      page: 1,
      pageSize: 10,
    })
  })
})


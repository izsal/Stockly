import { describe, expect, it } from 'vitest'
import {
  categoryInputSchema,
  createProductSchema,
  listProductsQuerySchema,
  normalizeBarcode,
  normalizeMoneyDecimal,
  normalizeSku,
  updateProductSchema,
} from './catalog'

describe('catalog normalization helpers', () => {
  it('normalizes SKU by trimming and uppercasing', () => {
    expect(normalizeSku('  kopi-arabika-01  ')).toBe('KOPI-ARABIKA-01')
  })

  it('normalizes barcode to trimmed value or null when empty', () => {
    expect(normalizeBarcode('  8991234567890  ')).toBe('8991234567890')
    expect(normalizeBarcode('   ')).toBeNull()
    expect(normalizeBarcode(null)).toBeNull()
    expect(normalizeBarcode(undefined)).toBeNull()
  })

  it('normalizes decimal money values without floating point drift', () => {
    expect(normalizeMoneyDecimal('0015000')).toBe('15000.00')
    expect(normalizeMoneyDecimal('12500.5')).toBe('12500.50')
    expect(normalizeMoneyDecimal(25000)).toBe('25000.00')
    expect(normalizeMoneyDecimal('-100')).toBeNull()
    expect(normalizeMoneyDecimal('10.123')).toBeNull()
    expect(normalizeMoneyDecimal('abc')).toBeNull()
  })
})

describe('categoryInputSchema', () => {
  it('trims category name and normalizes empty description to null', () => {
    const result = categoryInputSchema.safeParse({
      name: '  Minuman Kemasan  ',
      description: '   ',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Minuman Kemasan')
      expect(result.data.description).toBeNull()
    }
  })

  it('rejects blank category names', () => {
    const result = categoryInputSchema.safeParse({ name: '   ' })
    expect(result.success).toBe(false)
  })
})

describe('createProductSchema and updateProductSchema', () => {
  it('normalizes sku, barcode, prices, and defaults while ignoring stock fields', () => {
    const input = {
      name: '  Kopi Susu Gula Aren  ',
      sku: '  ksga-250  ',
      barcode: '   ',
      costPrice: 12000,
      sellingPrice: '18500.5',
      minimumStock: 5,
      quantity: 999,
    }

    const result = createProductSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Kopi Susu Gula Aren')
      expect(result.data.sku).toBe('KSGA-250')
      expect(result.data.barcode).toBeNull()
      expect(result.data.unit).toBe('pcs')
      expect(result.data.costPrice).toBe('12000.00')
      expect(result.data.sellingPrice).toBe('18500.50')
      expect(result.data.minimumStock).toBe(5)
      expect('quantity' in result.data).toBe(false)
    }
  })

  it('rejects negative prices and negative minimumStock', () => {
    const result = createProductSchema.safeParse({
      name: 'Teh Botol',
      sku: 'TB-01',
      costPrice: '-1',
      sellingPrice: '5000',
      minimumStock: -2,
    })

    expect(result.success).toBe(false)
  })

  it('supports partial updates without mutating omitted fields or injecting defaults', () => {
    const result = updateProductSchema.safeParse({
      sku: '  baru-01 ',
      sellingPrice: '21000',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.sku).toBe('BARU-01')
      expect(result.data.sellingPrice).toBe('21000.00')
      expect(result.data.name).toBeUndefined()
      expect(result.data.unit).toBeUndefined()
      expect(result.data.costPrice).toBeUndefined()
      expect(result.data.minimumStock).toBeUndefined()
    }
  })

  it('parses list filter defaults cleanly', () => {
    const result = listProductsQuerySchema.parse({ search: '  kopi  ', categoryId: '' })
    expect(result.search).toBe('kopi')
    expect(result.categoryId).toBeNull()
    expect(result.status).toBe('active')
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
  })
})

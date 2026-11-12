import { describe, expect, it } from 'vitest'
import { formatDecimalInputValue, formatRupiah } from './format'

describe('formatRupiah', () => {
  it('formats whole rupiah amounts with dot thousand separators', () => {
    expect(formatRupiah('0.00')).toBe('Rp 0')
    expect(formatRupiah('15000.00')).toBe('Rp 15.000')
    expect(formatRupiah('1250000')).toBe('Rp 1.250.000')
  })

  it('keeps non-zero cents formatted with comma separator', () => {
    expect(formatRupiah('18500.50')).toBe('Rp 18.500,50')
  })
})

describe('formatDecimalInputValue', () => {
  it('strips trailing .00 for cleaner form inputs', () => {
    expect(formatDecimalInputValue('15000.00')).toBe('15000')
    expect(formatDecimalInputValue('15000.50')).toBe('15000.50')
  })
})


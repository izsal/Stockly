import { describe, expect, it } from 'vitest'
import {
  formatDecimalInputValue,
  formatDecimalToRupiahInput,
  formatRupiah,
  formatRupiahTyping,
  parseRupiahInputToDecimal,
} from './format'

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

describe('Rupiah input conversion helpers', () => {
  it('converts stored decimal strings into Rupiah input strings', () => {
    expect(formatDecimalToRupiahInput('0.00')).toBe('0')
    expect(formatDecimalToRupiahInput('15000.00')).toBe('15.000')
    expect(formatDecimalToRupiahInput('18500.50')).toBe('18.500,50')
    expect(formatDecimalToRupiahInput('1250000')).toBe('1.250.000')
  })

  it('formats user typing live with thousand dots and optional comma decimals', () => {
    expect(formatRupiahTyping('')).toBe('')
    expect(formatRupiahTyping('05')).toBe('5')
    expect(formatRupiahTyping('15000')).toBe('15.000')
    expect(formatRupiahTyping('Rp 1.250.000')).toBe('1.250.000')
    expect(formatRupiahTyping('18500,')).toBe('18.500,')
    expect(formatRupiahTyping('18500,525')).toBe('18.500,52')
    expect(formatRupiahTyping(',5')).toBe('0,5')
    expect(formatRupiahTyping('12345678901234')).toBe('123.456.789.012')
  })

  it('parses Rupiah input strings back into normalized decimal strings', () => {
    expect(parseRupiahInputToDecimal('')).toBe('0')
    expect(parseRupiahInputToDecimal('0')).toBe('0')
    expect(parseRupiahInputToDecimal('15.000')).toBe('15000')
    expect(parseRupiahInputToDecimal('Rp 1.250.000')).toBe('1250000')
    expect(parseRupiahInputToDecimal('18.500,50')).toBe('18500.50')
    expect(parseRupiahInputToDecimal('18.500,')).toBe('18500')
  })
})


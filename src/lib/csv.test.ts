import { describe, expect, it } from 'vitest'
import { escapeCsvCell, serializeCsv } from './csv'

describe('csv utilities', () => {
  it('escapes commas, quotes, and newlines safely', () => {
    expect(escapeCsvCell('Kopi, Susu')).toBe('"Kopi, Susu"')
    expect(escapeCsvCell('Produk "Unggulan"')).toBe('"Produk ""Unggulan"""')
    expect(escapeCsvCell('Baris 1\nBaris 2')).toBe('"Baris 1\nBaris 2"')
  })

  it('neutralizes formula injection in string cells while preserving numeric negatives', () => {
    expect(escapeCsvCell('=SUM(A1:A2)')).toBe("'=SUM(A1:A2)")
    expect(escapeCsvCell('+cmd|calc')).toBe("'+cmd|calc")
    expect(escapeCsvCell('@evil')).toBe("'@evil")
    expect(escapeCsvCell(-12)).toBe('-12')
  })

  it('serializes headers and rows with optional UTF-8 BOM', () => {
    const csv = serializeCsv(['Nama', 'Stok'], [['Teh Botol', 15]], { includeBom: true })
    expect(csv).toBe('\uFEFFNama,Stok\r\nTeh Botol,15')
  })
})


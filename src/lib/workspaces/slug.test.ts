import { describe, expect, it } from 'vitest'
import { slugifyWorkspaceName } from './slug'

describe('slugifyWorkspaceName', () => {
  it('normalizes case, accents, and separators', () => {
    expect(slugifyWorkspaceName('  Toko Sari & Co.  ')).toBe('toko-sari-co')
    expect(slugifyWorkspaceName('Kopi Càfé')).toBe('kopi-cafe')
  })

  it('returns a safe fallback for names without latin characters', () => {
    expect(slugifyWorkspaceName('東京')).toBe('ruang-kerja')
  })
})

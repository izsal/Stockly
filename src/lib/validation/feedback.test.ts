import { describe, expect, it } from 'vitest'
import { betaFeedbackSchema } from './feedback'

describe('betaFeedbackSchema', () => {
  it('validates and trims valid beta usability feedback', () => {
    const parsed = betaFeedbackSchema.safeParse({
      type: 'USABILITY',
      rating: '4',
      pagePath: ' /products ',
      summary: 'Input harga Rupiah sangat membantu',
      details: 'Ketika menambah produk baru, pemisah ribuan langsung muncul sehingga mudah dicek.',
      viewportWidth: 375,
    })

    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.rating).toBe(4)
      expect(parsed.data.pagePath).toBe('/products')
    }
  })

  it('rejects out-of-range ratings and too-short details', () => {
    const parsed = betaFeedbackSchema.safeParse({
      type: 'BUG',
      rating: 6,
      pagePath: '/inventory/stock-out',
      summary: 'Err',
      details: 'Pendek',
    })

    expect(parsed.success).toBe(false)
  })
})


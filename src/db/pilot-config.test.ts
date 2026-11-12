import { describe, expect, it } from 'vitest'
import {
  buildPilotWorkspaceSlug,
  pilotBatchSchema,
  SAMPLE_PILOT_BUSINESSES,
} from './pilot-config'

describe('Pilot business onboarding config', () => {
  it('validates the built-in 3 pilot businesses sample batch', () => {
    const parsed = pilotBatchSchema.safeParse(SAMPLE_PILOT_BUSINESSES)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data).toHaveLength(3)
      expect(parsed.data[0].starterCategories).toContain('Sembako')
    }
  })

  it('rejects duplicate owner or staff emails across pilot businesses', () => {
    const parsed = pilotBatchSchema.safeParse([
      {
        businessName: 'Toko A',
        ownerName: 'Pemilik A',
        ownerEmail: 'same@pilot.id',
      },
      {
        businessName: 'Toko B',
        ownerName: 'Pemilik B',
        ownerEmail: 'other@pilot.id',
        staffName: 'Staf B',
        staffEmail: 'same@pilot.id',
      },
    ])

    expect(parsed.success).toBe(false)
  })

  it('generates clean workspace slugs from business names', () => {
    expect(buildPilotWorkspaceSlug('Toko Berkah & Jaya!')).toBe('toko-berkah-jaya')
    expect(buildPilotWorkspaceSlug('Toko ABC', 'custom-slug')).toBe('custom-slug')
  })
})


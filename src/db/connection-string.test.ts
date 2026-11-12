import { describe, expect, it } from 'vitest'
import { normalizeDatabaseUrl } from './connection-string'

describe('normalizeDatabaseUrl', () => {
  it('upgrades sslmode=require to sslmode=verify-full', () => {
    const result = normalizeDatabaseUrl(
      'postgresql://user:pass@ep-demo.aws.neon.tech/neondb?sslmode=require',
    )
    expect(result).toBe(
      'postgresql://user:pass@ep-demo.aws.neon.tech/neondb?sslmode=verify-full',
    )
  })

  it('preserves uselibpqcompat=true&sslmode=require', () => {
    const raw =
      'postgresql://user:pass@ep-demo.aws.neon.tech/neondb?uselibpqcompat=true&sslmode=require'
    expect(normalizeDatabaseUrl(raw)).toBe(raw)
  })

  it('leaves strings without legacy sslmode or undefined untouched', () => {
    expect(normalizeDatabaseUrl(undefined)).toBeUndefined()
    const local = 'postgresql://postgres:postgres@localhost:5432/stockly'
    expect(normalizeDatabaseUrl(local)).toBe(local)
  })
})


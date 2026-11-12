import { describe, expect, it } from 'vitest'
import { registerInputSchema, signInInputSchema, signUpFormSchema } from './auth'

describe('registration validation', () => {
  it('normalizes names and email addresses before account creation', () => {
    const result = registerInputSchema.safeParse({
      name: '  Rani Putri  ',
      email: '  RANI@BISNIS.ID  ',
      password: 'password-aman',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Rani Putri')
      expect(result.data.email).toBe('rani@bisnis.id')
    }
  })

  it('rejects a password confirmation mismatch', () => {
    const result = signUpFormSchema.safeParse({
      name: 'Rani Putri',
      email: 'rani@bisnis.id',
      password: 'password-aman',
      confirmPassword: 'password-lain',
    })

    expect(result.success).toBe(false)
  })

  it('rejects short passwords on the server-facing schema', () => {
    const result = registerInputSchema.safeParse({
      name: 'Rani Putri',
      email: 'rani@bisnis.id',
      password: 'short',
    })

    expect(result.success).toBe(false)
  })
})

describe('sign-in validation', () => {
  it('rejects malformed email before authentication', () => {
    const result = signInInputSchema.safeParse({ email: 'invalid', password: 'anything' })
    expect(result.success).toBe(false)
  })
})

import { describe, it, expect } from 'vitest'
import { passwordIssue, passwordStrength } from './password'

describe('passwordIssue', () => {
  it('rejects short passwords (< 12)', () => {
    expect(passwordIssue('Abc123!')).toMatch(/12 caractères/)
    expect(passwordIssue('short')).toMatch(/12 caractères/)
  })

  it('accepts a long pass-phrase without symbols', () => {
    expect(passwordIssue('correcthorsebatterystaple')).toBeNull() // 25 chars
    expect(passwordIssue('jaime les vieilles voitures')).toBeNull()
  })

  it('requires ≥ 3 classes for medium-length passwords (12–15)', () => {
    expect(passwordIssue('azertyuiopqs')).toMatch(/majuscules/) // 12 lowercase only
    expect(passwordIssue('Azerty123456')).toBeNull() // upper+lower+digit
  })
})

describe('passwordStrength', () => {
  it('labels weak / medium / strong', () => {
    expect(passwordStrength('')).toBe('faible')
    expect(passwordStrength('short')).toBe('faible')
    expect(passwordStrength('Azerty123456')).toBe('moyen')
    expect(passwordStrength('correcthorsebatterystaple')).toBe('fort')
    expect(passwordStrength('Azerty123456!!')).toBe('fort') // 14 chars, 4 classes
  })
})

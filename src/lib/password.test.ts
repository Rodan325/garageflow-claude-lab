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
    expect(passwordIssue('lmvbncxzqwpo')).toMatch(/majuscules/) // 12 lowercase only
    expect(passwordIssue('Trokman472xz')).toBeNull() // upper+lower+digit
  })

  it('rejects obvious / common passwords even when long enough', () => {
    expect(passwordIssue('password1234')).toMatch(/courants/i)
    expect(passwordIssue('azertyazerty')).toMatch(/courants/i)
    expect(passwordIssue('QwertyQwerty1')).toMatch(/courants/i)
    expect(passwordIssue('Garageflow2026')).toMatch(/courants/i)
    expect(passwordIssue('abc123456789')).toMatch(/courants/i)
  })

  it('rejects a password that contains the email local-part', () => {
    expect(passwordIssue('JulieDurand99x', 'julie.durand@example.fr')).toBeNull() // no overlap
    expect(passwordIssue('julie.durand99', 'julie.durand@example.fr')).toMatch(/adresse email/i)
  })
})

describe('passwordStrength', () => {
  it('labels weak / medium / strong', () => {
    expect(passwordStrength('')).toBe('faible')
    expect(passwordStrength('short')).toBe('faible')
    expect(passwordStrength('password1234')).toBe('faible') // obvious → weak
    expect(passwordStrength('Trokman472xz')).toBe('moyen')
    expect(passwordStrength('correcthorsebatterystaple')).toBe('fort')
    expect(passwordStrength('Trokman472xz!!')).toBe('fort') // 14 chars, 4 classes
  })
})

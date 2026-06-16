import { describe, expect, it } from 'vitest'
import { normEmail, normPhone, normPlate } from './normalize'

describe('normalize helpers', () => {
  it('normalizes phones regardless of formatting', () => {
    expect(normPhone('+33 6 12 34 56 78')).toBe('+33612345678')
    expect(normPhone('06.12.34.56.78')).toBe('0612345678')
    expect(normPhone('06-12-34-56-78')).toBe('0612345678')
    expect(normPhone('(06) 12 34 56 78')).toBe('0612345678')
    expect(normPhone('06 12 34 56 78')).toBe(normPhone('0612345678'))
  })

  it('normalizes emails (trim + lowercase)', () => {
    expect(normEmail('  Julie.Durand@Example.FR ')).toBe('julie.durand@example.fr')
    expect(normEmail('CLIENT@DEMO.fr')).toBe(normEmail('client@demo.fr'))
  })

  it('normalizes plates (uppercase, no spaces/dashes)', () => {
    expect(normPlate('ab-123-cd')).toBe('AB123CD')
    expect(normPlate('AB 123 CD')).toBe('AB123CD')
    expect(normPlate('ab 123-cd')).toBe(normPlate('AB-123-CD'))
  })

  it('handles nullish input', () => {
    expect(normPhone(null)).toBe('')
    expect(normEmail(undefined)).toBe('')
    expect(normPlate(null)).toBe('')
  })
})

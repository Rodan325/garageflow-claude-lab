import { describe, expect, it } from 'vitest'
import { euro, percent, shortTime, shortDate } from './format'

describe('format helpers', () => {
  it('formats euros in fr-FR', () => {
    expect(euro(149)).toMatch(/149/)
    expect(euro(149)).toMatch(/€/)
  })

  it('returns a dash for nullish money', () => {
    expect(euro(null)).toBe('—')
    expect(euro(undefined)).toBe('—')
  })

  it('formats percentages with the active locale', () => {
    expect(percent(0.5, 'en')).toContain('50')
    expect(percent(0.5, 'ar')).toContain('50')
  })

  it('trims db time to HH:MM', () => {
    expect(shortTime('09:00:00')).toBe('09:00')
    expect(shortTime('14:30')).toBe('14:30')
    expect(shortTime(null)).toBe('—')
  })

  it('handles invalid dates gracefully', () => {
    expect(shortDate(null)).toBe('—')
  })
})

import { describe, it, expect } from 'vitest'
import {
  matchBrand, isKnownBrand, modelsForBrand, normalizeBrand, titleCaseVehicle, yearError, MIN_YEAR, MAX_YEAR,
} from './vehicleCatalog'

describe('vehicleCatalog brand matching', () => {
  it('suggests a brand from a prefix (case-insensitive)', () => {
    expect(matchBrand('jag')).toBe('Jaguar')
    expect(matchBrand('peug')).toBe('Peugeot')
    expect(matchBrand('PEUGEOT')).toBe('Peugeot')
    expect(matchBrand('renault')).toBe('Renault')
  })
  it('returns null for unknown / empty', () => {
    expect(matchBrand('zzz-unknown')).toBeNull()
    expect(matchBrand('')).toBeNull()
  })
  it('isKnownBrand is exact-only', () => {
    expect(isKnownBrand('Peugeot')).toBe(true)
    expect(isKnownBrand('peug')).toBe(false)
    expect(isKnownBrand('DeLorean')).toBe(false)
  })
  it('lists models for a fuzzy brand', () => {
    expect(modelsForBrand('peug')).toContain('208')
    expect(modelsForBrand('unknown')).toEqual([])
  })
})

describe('normalization', () => {
  it('title-cases free text', () => {
    expect(titleCaseVehicle('PEUGEOT 208')).toBe('Peugeot 208')
    expect(titleCaseVehicle('  clio   iv ')).toBe('Clio Iv')
  })
  it('normalizeBrand prefers a known canonical brand', () => {
    expect(normalizeBrand('peugeot')).toBe('Peugeot')
    expect(normalizeBrand('delorean')).toBe('Delorean') // unknown → title-cased
  })
})

describe('yearError', () => {
  it('accepts empty (optional) and valid years', () => {
    expect(yearError('')).toBeNull()
    expect(yearError(null)).toBeNull()
    expect(yearError(2018)).toBeNull()
    expect(yearError(MIN_YEAR)).toBeNull()
    expect(yearError(MAX_YEAR)).toBeNull()
  })
  it('rejects out-of-range / absurd years', () => {
    expect(yearError(1800)).toMatch(/Année entre/)
    expect(yearError(MAX_YEAR + 5)).toMatch(/Année entre/)
    expect(yearError(20)).toMatch(/Année entre/)
  })
})

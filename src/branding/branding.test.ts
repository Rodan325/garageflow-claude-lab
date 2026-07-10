import { describe, it, expect, afterEach } from 'vitest'
import { resolveBrandId, getActiveBrand } from './index'
import { defaultBrand } from './default'
import { speedyBrand } from './speedy'

afterEach(() => {
  localStorage.clear()
})

describe('brand resolution', () => {
  it('defaults to the official GarageFlow brand when nothing is set', () => {
    expect(resolveBrandId()).toBe('default')
    expect(getActiveBrand()).toBe(defaultBrand)
    expect(defaultBrand.official).toBe(true)
    // Default brand sets no color override → the app stays visually unchanged.
    expect(defaultBrand.primaryColor).toBeUndefined()
  })

  it('activates a brand persisted in localStorage', () => {
    localStorage.setItem('gf-brand', 'speedy')
    expect(resolveBrandId()).toBe('speedy')
    expect(getActiveBrand()).toBe(speedyBrand)
  })

  it('ignores an unknown brand id and falls back to default', () => {
    localStorage.setItem('gf-brand', 'nope')
    expect(resolveBrandId()).toBe('default')
  })
})

describe('speedy demo brand', () => {
  it('is non-official and carries the required disclaimer', () => {
    expect(speedyBrand.official).toBe(false)
    expect(speedyBrand.demoNotice).toMatch(/non officielle/i)
  })

  it('brands via config only (name + color set, placeholder logo zone)', () => {
    expect(speedyBrand.appName).toBe('Speedy')
    expect(speedyBrand.primaryColor).toBeTruthy()
    expect(speedyBrand.logoComponent).toBeTypeOf('function')
  })
})

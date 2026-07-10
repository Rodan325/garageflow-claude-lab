import { describe, it, expect, afterEach } from 'vitest'
import { resolveBrandId, getActiveBrand, exitBrandDemo } from './index'
import { defaultBrand } from './default'
import { speedyBrand } from './speedy'

afterEach(() => {
  localStorage.clear()
  window.history.replaceState({}, '', '/')
})

describe('brand resolution', () => {
  it('defaults to the official GarageFlow brand when nothing is set', () => {
    expect(resolveBrandId()).toBe('default')
    expect(getActiveBrand()).toBe(defaultBrand)
    expect(defaultBrand.official).toBe(true)
    // No color override → the default app is visually unchanged.
    expect(defaultBrand.primaryColor).toBeUndefined()
  })

  it('activates a brand persisted in localStorage', () => {
    localStorage.setItem('gf-brand', 'speedy')
    expect(resolveBrandId()).toBe('speedy')
    expect(getActiveBrand()).toBe(speedyBrand)
  })

  it('activates via ?brand=speedy (hash-router friendly query param)', () => {
    window.history.replaceState({}, '', '/?brand=speedy#/login')
    expect(resolveBrandId()).toBe('speedy')
  })

  it('ignores an unknown brand id and falls back to default', () => {
    localStorage.setItem('gf-brand', 'nope')
    expect(resolveBrandId()).toBe('default')
  })
})

describe('exitBrandDemo — single centralized reset', () => {
  it('removes gf-brand and the selected center, back to default', () => {
    localStorage.setItem('gf-brand', 'speedy')
    localStorage.setItem('gf-selected-center', 'ctr-1')
    exitBrandDemo()
    expect(localStorage.getItem('gf-brand')).toBeNull()
    expect(localStorage.getItem('gf-selected-center')).toBeNull()
    expect(resolveBrandId()).toBe('default')
  })

  it('strips ?brand so a refresh cannot re-activate Speedy', () => {
    window.history.replaceState({}, '', '/?brand=speedy#/app')
    expect(resolveBrandId()).toBe('speedy')
    exitBrandDemo()
    expect(window.location.search).not.toContain('brand=speedy')
    // Simulates the state a refresh would resolve from.
    expect(resolveBrandId()).toBe('default')
  })
})

describe('speedy demo brand', () => {
  it('is non-official and carries the required disclaimer', () => {
    expect(speedyBrand.official).toBe(false)
    expect(speedyBrand.demoNotice).toMatch(/non officielle/i)
  })

  it('brands via config only: name, color, placeholder logo, non-official PDF footer', () => {
    expect(speedyBrand.appName).toBe('Speedy')
    expect(speedyBrand.primaryColor).toBeTruthy()
    expect(speedyBrand.logoComponent).toBeTypeOf('function')
    // PDF footer: default keeps GarageFlow; Speedy is explicitly non-official.
    expect(defaultBrand.quoteFooterBranding).toMatch(/GarageFlow/)
    expect(speedyBrand.quoteFooterBranding).not.toMatch(/GarageFlow/)
    expect(speedyBrand.quoteFooterBranding).toMatch(/non officiel/i)
  })
})

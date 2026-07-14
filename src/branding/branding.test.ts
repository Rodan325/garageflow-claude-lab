import { describe, it, expect, afterEach } from 'vitest'
import { resolveBrandId, getActiveBrand, exitBrandDemo } from './index'
import { defaultBrand } from './default'
import { speedyBrand } from './speedy'

afterEach(() => {
  localStorage.clear()
  window.history.replaceState({}, '', '/')
})

describe('brand resolution', () => {
  it('defaults to the official Clikarage brand when nothing is set', () => {
    expect(resolveBrandId()).toBe('default')
    expect(getActiveBrand()).toBe(defaultBrand)
    expect(defaultBrand.official).toBe(true)
    expect(defaultBrand.appName).toBe('Clikarage')
    expect(defaultBrand.logoLightUrl).toBe('/branding/clikarage-logo-light.svg')
    expect(defaultBrand.logoDarkUrl).toBe('/branding/clikarage-logo-dark.svg')
    expect(defaultBrand.logoIconUrl).toBe('/branding/clikarage-icon.svg')
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
    localStorage.setItem('gf-lang', 'ar')
    exitBrandDemo()
    expect(localStorage.getItem('gf-brand')).toBeNull()
    expect(localStorage.getItem('gf-selected-center')).toBeNull()
    expect(resolveBrandId()).toBe('default')
    expect(localStorage.getItem('gf-lang')).toBe('ar')
  })

  it('strips ?brand so a refresh cannot re-activate Speedy', () => {
    window.history.replaceState({}, '', '/?brand=speedy#/app')
    expect(resolveBrandId()).toBe('speedy')
    exitBrandDemo()
    expect(window.location.search).not.toContain('brand=speedy')
    // Simulates the state a refresh would resolve from.
    expect(resolveBrandId()).toBe('default')
  })

  it('restores the Clikarage title and favicon after Speedy', () => {
    const icon = document.createElement('link')
    icon.rel = 'icon'
    icon.href = speedyBrand.favicon!
    document.head.appendChild(icon)
    document.title = speedyBrand.publicAppTitle
    localStorage.setItem('gf-brand', 'speedy')

    exitBrandDemo()

    expect(document.title).toBe('Clikarage')
    expect(icon.getAttribute('href')).toContain('/branding/clikarage-logo.png')
    icon.remove()
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
    // PDF footer: default uses Clikarage; Speedy remains explicitly non-official.
    expect(defaultBrand.quoteFooterBranding).toMatch(/Clikarage/)
    expect(defaultBrand.quoteFooterBranding).toMatch(/RODANBTECH/)
    expect(speedyBrand.quoteFooterBranding).not.toMatch(/Clikarage/)
    expect(speedyBrand.quoteFooterBranding).toMatch(/non officiel/i)
  })
})

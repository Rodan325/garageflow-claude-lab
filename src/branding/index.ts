import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { env } from '@/lib/env'
import { defaultBrand } from './default'
import { speedyBrand } from './speedy'
import type { Brand, BrandId } from './types'

export type { Brand, BrandId }

const BRANDS: Record<BrandId, Brand> = {
  default: defaultBrand,
  speedy: speedyBrand,
}

const STORAGE_KEY = 'gf-brand'
const SELECTED_CENTER_KEY = 'gf-selected-center'
// Fallback theme-color (matches index.html) restored under the default brand.
const DEFAULT_THEME_COLOR = '#0f766e'

function isBrandId(v: unknown): v is BrandId {
  return v === 'default' || v === 'speedy'
}

/** Read ?brand= from the real query string OR the hash query (HashRouter-safe). */
function brandFromUrl(): BrandId | null {
  if (typeof window === 'undefined') return null
  try {
    const q = new URLSearchParams(window.location.search).get('brand')
    if (isBrandId(q)) return q
    const hash = window.location.hash
    const i = hash.indexOf('?')
    if (i >= 0) {
      const h = new URLSearchParams(hash.slice(i + 1)).get('brand')
      if (isBrandId(h)) return h
    }
  } catch {
    /* ignore */
  }
  return null
}

/** Active brand id: URL param → localStorage → env (VITE_BRAND) → default. */
export function resolveBrandId(): BrandId {
  const url = brandFromUrl()
  if (url) return url
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isBrandId(stored)) return stored
  } catch {
    /* ignore */
  }
  if (isBrandId(env.brand)) return env.brand
  return 'default'
}

/** Imperative accessor for non-React contexts (e.g. PDF generation). */
export function getActiveBrand(): Brand {
  return BRANDS[resolveBrandId()]
}

/** Remove the `brand` param from BOTH the query string and the hash query, in
 *  place (history.replaceState) — so a refresh never re-activates a brand. */
function stripBrandParam() {
  if (typeof window === 'undefined') return
  try {
    const url = new URL(window.location.href)
    let changed = false
    if (url.searchParams.has('brand')) {
      url.searchParams.delete('brand')
      changed = true
    }
    const hash = url.hash
    const qi = hash.indexOf('?')
    if (qi >= 0) {
      const params = new URLSearchParams(hash.slice(qi + 1))
      if (params.has('brand')) {
        params.delete('brand')
        const rest = params.toString()
        url.hash = hash.slice(0, qi) + (rest ? `?${rest}` : '')
        changed = true
      }
    }
    if (changed) window.history.replaceState(window.history.state, '', url.toString())
  } catch {
    /* ignore */
  }
}

/** Drop the persisted client-selected center (it is brand/garage specific). */
function clearSelectedCenter() {
  try {
    localStorage.removeItem(SELECTED_CENTER_KEY)
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('gf-center-change'))
}

/** Apply brand overrides to <html>: CSS color vars, title, favicon, theme-color. */
function applyBrand(brand: Brand) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const setVar = (k: string, v?: string) => (v ? root.style.setProperty(k, v) : root.style.removeProperty(k))
  // Undefined values REMOVE the inline override → the theme's native CSS wins.
  setVar('--primary', brand.primaryColor)
  setVar('--ring', brand.primaryColor)
  setVar('--accent', brand.accentColor)
  setVar('--primary-foreground', brand.primaryForeground)
  document.title = brand.publicAppTitle
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (link && brand.favicon) link.href = brand.favicon
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) meta.content = brand.primaryColor ? `hsl(${brand.primaryColor})` : DEFAULT_THEME_COLOR
}

/**
 * THE single, centralized way to leave a demo brand. Used by BrandDemoEntry,
 * the /demo/reset route, the "Revenir à GarageFlow" button and the DemoBanner.
 * Removes gf-brand, strips the URL param, clears the selected center and
 * restores the default title/favicon/CSS/theme-color. Imperative (no React) so
 * it also works outside the provider; the context `exitDemo` additionally syncs
 * React state.
 */
export function exitBrandDemo() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  stripBrandParam()
  clearSelectedCenter()
  applyBrand(defaultBrand)
}

interface BrandContextValue {
  brand: Brand
  setBrand: (id: BrandId) => void
  /** Centralized exit to the default GarageFlow brand (see exitBrandDemo). */
  exitDemo: () => void
}

const BrandContext = createContext<BrandContextValue | null>(null)

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brandId, setBrandId] = useState<BrandId>(() => resolveBrandId())
  const brand = BRANDS[brandId]

  useEffect(() => {
    applyBrand(brand)
  }, [brand])

  const setBrand = useCallback((id: BrandId) => {
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      /* persistence best-effort */
    }
    setBrandId(id)
    // Demo data is brand-scoped → refresh it when the brand changes.
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('gf-demo-data'))
  }, [])

  const exitDemo = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    stripBrandParam()
    clearSelectedCenter()
    setBrandId('default') // triggers applyBrand(default) via the effect
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('gf-demo-data'))
  }, [])

  const value = useMemo<BrandContextValue>(() => ({ brand, setBrand, exitDemo }), [brand, setBrand, exitDemo])
  return createElement(BrandContext.Provider, { value }, children)
}

/** Active brand + setters. Tolerant of a missing provider (returns the default brand). */
export function useBrand(): BrandContextValue {
  const ctx = useContext(BrandContext)
  return ctx ?? { brand: defaultBrand, setBrand: () => {}, exitDemo: () => {} }
}

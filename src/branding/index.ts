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

/** Apply brand overrides to <html>: CSS color vars, document title, favicon. */
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
}

interface BrandContextValue {
  brand: Brand
  setBrand: (id: BrandId) => void
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
  }, [])

  const value = useMemo<BrandContextValue>(() => ({ brand, setBrand }), [brand, setBrand])
  return createElement(BrandContext.Provider, { value }, children)
}

/** Active brand + setter. Tolerant of a missing provider (returns the default brand). */
export function useBrand(): BrandContextValue {
  const ctx = useContext(BrandContext)
  return ctx ?? { brand: defaultBrand, setBrand: () => {} }
}

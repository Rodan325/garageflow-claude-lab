import { describe, it, expect, afterEach } from 'vitest'
import { exitBrandDemo } from '@/branding'
import {
  demo,
  reloadDemoCache,
  resetDemoData,
  SPEEDY_STORE_KEY,
  STORE_KEY,
} from './demo'

afterEach(() => {
  localStorage.clear()
  reloadDemoCache()
})

function withBrand(brand: 'default' | 'speedy', fn: () => void) {
  if (brand === 'default') localStorage.removeItem('gf-brand')
  else localStorage.setItem('gf-brand', brand)
  reloadDemoCache() // brand-scoped store → re-hydrate under the new brand
  fn()
}

describe('demo data is brand-scoped', () => {
  it('the default GarageFlow demo has NO centers and the original catalog', () => {
    withBrand('default', () => {
      expect(demo.centers()).toHaveLength(0)
      const names = demo.services().map((s) => s.name)
      expect(names).toContain('Révision constructeur')
      expect(names).not.toContain('Amortisseurs') // car-service-only
    })
  })

  it('the Speedy demo has centers and the car-service catalog', () => {
    withBrand('speedy', () => {
      expect(demo.centers().length).toBeGreaterThan(0)
      const names = demo.services().map((s) => s.name)
      expect(names).toContain('Amortisseurs')
      expect(names).not.toContain('Révision constructeur')
    })
  })

  it('keeps the two datasets isolated (separate storage keys)', () => {
    withBrand('speedy', () => { void demo.centers() }) // seeds + persists speedy store
    withBrand('default', () => {
      expect(demo.centers()).toHaveLength(0) // default store untouched by speedy
    })
  })
})

describe('brand-scoped demo reset', () => {
  it('resets the Speedy store without clearing the GarageFlow store', () => {
    withBrand('default', () => {
      demo.createService({ name: 'GarageFlow custom service' })
    })
    const defaultBefore = localStorage.getItem(STORE_KEY)

    withBrand('speedy', () => {
      demo.createService({ name: 'Speedy custom service' })
      expect(demo.services().some((service) => service.name === 'Speedy custom service')).toBe(true)
    })

    resetDemoData('speedy')

    expect(localStorage.getItem(STORE_KEY)).toBe(defaultBefore)
    expect(localStorage.getItem(SPEEDY_STORE_KEY)).not.toContain('Speedy custom service')
  })

  it('reloads the initial Speedy seeds after reset and reactivation', () => {
    withBrand('speedy', () => {
      demo.createService({ name: 'Temporary Speedy service' })
      expect(demo.centers()).toHaveLength(3)
    })

    resetDemoData('speedy')
    exitBrandDemo()
    expect(localStorage.getItem('gf-brand')).toBeNull()

    withBrand('speedy', () => {
      const names = demo.services().map((service) => service.name)
      expect(names).toContain('Amortisseurs')
      expect(names).not.toContain('Temporary Speedy service')
      expect(demo.centers()).toHaveLength(3)
    })
  })

  it('leaves the Speedy store untouched when merely leaving the demo', () => {
    withBrand('speedy', () => {
      demo.createService({ name: 'Persistent Speedy service' })
    })
    const speedyBefore = localStorage.getItem(SPEEDY_STORE_KEY)

    exitBrandDemo()

    expect(localStorage.getItem('gf-brand')).toBeNull()
    expect(localStorage.getItem(SPEEDY_STORE_KEY)).toBe(speedyBefore)
  })

  it('keeps the existing GarageFlow reset behavior', () => {
    withBrand('speedy', () => {
      demo.createService({ name: 'Persistent Speedy service' })
    })
    const speedyBefore = localStorage.getItem(SPEEDY_STORE_KEY)

    withBrand('default', () => {
      demo.createService({ name: 'Temporary GarageFlow service' })
      resetDemoData('default')
      expect(demo.services().some((service) => service.name === 'Temporary GarageFlow service')).toBe(false)
      expect(demo.services().map((service) => service.name)).toContain('Révision constructeur')
    })

    expect(localStorage.getItem(SPEEDY_STORE_KEY)).toBe(speedyBefore)
  })
})

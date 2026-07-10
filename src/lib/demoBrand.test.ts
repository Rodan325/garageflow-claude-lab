import { describe, it, expect, afterEach } from 'vitest'
import { demo, reloadDemoCache } from './demo'

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

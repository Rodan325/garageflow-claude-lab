import { describe, it, expect, afterEach } from 'vitest'
import { centersEnabled, integrationsEnabled, isMissingSchemaError, networkDashboardEnabled } from './features'
import { setDemoKind, clearDemo, setDemoOrganizationKind } from './demo'

afterEach(() => {
  clearDemo()
  localStorage.clear()
})

describe('isMissingSchemaError', () => {
  it('treats missing table / column errors as soft (true)', () => {
    expect(isMissingSchemaError({ code: '42P01' })).toBe(true) // undefined_table
    expect(isMissingSchemaError({ code: '42703' })).toBe(true) // undefined_column
    expect(isMissingSchemaError({ code: 'PGRST205' })).toBe(true)
    expect(isMissingSchemaError({ code: 'PGRST204' })).toBe(true)
    expect(isMissingSchemaError({ message: 'relation "garage_centers" does not exist' })).toBe(true)
    expect(isMissingSchemaError({ message: "Could not find the table 'public.garage_centers'" })).toBe(true)
  })

  it('does NOT swallow a permission error (42501 stays a real error)', () => {
    expect(isMissingSchemaError({ code: '42501', message: 'permission denied for table garage_centers' })).toBe(false)
    expect(isMissingSchemaError({ code: '23505', message: 'duplicate key' })).toBe(false)
    expect(isMissingSchemaError(null)).toBe(false)
    expect(isMissingSchemaError('boom')).toBe(false)
  })
})

describe('centersEnabled', () => {
  it('is off with the default brand and no flag', () => {
    expect(centersEnabled()).toBe(false)
  })

  it('stays off in the plain Clikarage demo (default brand)', () => {
    // Entering demo mode must NOT enable centers on its own anymore.
    setDemoKind('client')
    expect(centersEnabled()).toBe(false)
  })

  it('does not derive business capabilities from the Speedy branding', () => {
    localStorage.setItem('gf-brand', 'speedy')
    expect(centersEnabled()).toBe(false)
  })

  it('is on for a generic network demo account', () => {
    setDemoOrganizationKind('network')
    setDemoKind('garage')
    expect(centersEnabled()).toBe(true)
    expect(networkDashboardEnabled()).toBe(true)
  })
})

describe('integrationsEnabled', () => {
  it('is opt-in outside demo and available in the local demo', () => {
    expect(integrationsEnabled()).toBe(false)
    setDemoKind('garage')
    expect(integrationsEnabled()).toBe(true)
  })
})

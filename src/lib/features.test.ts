import { describe, it, expect, afterEach } from 'vitest'
import { centersEnabled, isMissingSchemaError } from './features'
import { setDemoKind, clearDemo } from './demo'

afterEach(() => clearDemo())

describe('isMissingSchemaError', () => {
  it('treats missing table / column errors as soft (true)', () => {
    expect(isMissingSchemaError({ code: '42P01' })).toBe(true) // undefined_table
    expect(isMissingSchemaError({ code: '42703' })).toBe(true) // undefined_column
    expect(isMissingSchemaError({ code: 'PGRST205' })).toBe(true)
    expect(isMissingSchemaError({ code: 'PGRST204' })).toBe(true)
    expect(isMissingSchemaError({ message: 'relation "garage_centers" does not exist' })).toBe(true)
    expect(isMissingSchemaError({ message: "Could not find the table 'public.garage_centers'" })).toBe(true)
  })

  it('does not swallow unrelated errors (false)', () => {
    expect(isMissingSchemaError({ code: '23505', message: 'duplicate key' })).toBe(false)
    expect(isMissingSchemaError({ message: 'permission denied for table service_requests' })).toBe(false)
    expect(isMissingSchemaError(null)).toBe(false)
    expect(isMissingSchemaError('boom')).toBe(false)
  })
})

describe('centersEnabled', () => {
  it('is off by default in real mode (flag unset)', () => {
    // No demo kind + VITE_ENABLE_CENTERS unset in the test env → feature off,
    // so prod without migrations is never queried.
    expect(centersEnabled()).toBe(false)
  })

  it('is always on in demo mode (in-memory store, no Supabase schema)', () => {
    setDemoKind('client')
    expect(centersEnabled()).toBe(true)
  })
})

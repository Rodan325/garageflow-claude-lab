import { describe, expect, it } from 'vitest'
import { isAllowedSupabaseUrl, isExplicitlyEnabled } from './env'

describe('isAllowedSupabaseUrl', () => {
  it('accepts HTTPS projects and local Supabase CLI URLs', () => {
    expect(isAllowedSupabaseUrl('https://project.supabase.co')).toBe(true)
    expect(isAllowedSupabaseUrl('http://127.0.0.1:54321')).toBe(true)
    expect(isAllowedSupabaseUrl('http://localhost:54321')).toBe(true)
    expect(isAllowedSupabaseUrl('http://[::1]:54321')).toBe(true)
  })

  it('rejects insecure remote and malformed URLs', () => {
    expect(isAllowedSupabaseUrl('http://project.supabase.co')).toBe(false)
    expect(isAllowedSupabaseUrl('http://192.168.1.20:54321')).toBe(false)
    expect(isAllowedSupabaseUrl('not-a-url')).toBe(false)
  })
})

describe('isExplicitlyEnabled', () => {
  it('fails closed when a flag is absent or not exactly enabled', () => {
    expect(isExplicitlyEnabled()).toBe(false)
    expect(isExplicitlyEnabled('')).toBe(false)
    expect(isExplicitlyEnabled('false')).toBe(false)
    expect(isExplicitlyEnabled('TRUE')).toBe(false)
    expect(isExplicitlyEnabled('1')).toBe(false)
  })

  it('accepts only an explicit true value, including trimmed or quoted values', () => {
    expect(isExplicitlyEnabled('true')).toBe(true)
    expect(isExplicitlyEnabled('  true  ')).toBe(true)
    expect(isExplicitlyEnabled('"true"')).toBe(true)
  })
})

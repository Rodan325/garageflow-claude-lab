import { describe, expect, it } from 'vitest'
import { isAllowedSupabaseUrl } from './env'

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

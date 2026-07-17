import { describe, expect, it } from 'vitest'
import {
  APPROVED_STAGING_REF,
  FORBIDDEN_PRODUCTION_REF,
  assertPublishableKey,
  assertSupabaseTestTarget,
} from '../../scripts/rls-target-guard.mjs'

describe('Supabase RLS target guard', () => {
  it('accepts the standard local CLI target', () => {
    expect(assertSupabaseTestTarget('http://127.0.0.1:54321').origin).toBe('http://127.0.0.1:54321')
  })

  it('accepts only the explicitly approved staging project', () => {
    const target = assertSupabaseTestTarget(`https://${APPROVED_STAGING_REF}.supabase.co`, {
      mode: 'staging',
      expectedRef: APPROVED_STAGING_REF,
      forbiddenRef: FORBIDDEN_PRODUCTION_REF,
    })
    expect(target.hostname).toBe(`${APPROVED_STAGING_REF}.supabase.co`)
  })

  it('always rejects the production project', () => {
    expect(() => assertSupabaseTestTarget(`https://${FORBIDDEN_PRODUCTION_REF}.supabase.co`, {
      mode: 'staging',
      expectedRef: APPROVED_STAGING_REF,
      forbiddenRef: FORBIDDEN_PRODUCTION_REF,
    })).toThrow(/forbidden production/i)
  })

  it('rejects another remote project and a mismatched expected ref', () => {
    expect(() => assertSupabaseTestTarget('https://another-project.supabase.co', {
      mode: 'staging',
      expectedRef: APPROVED_STAGING_REF,
    })).toThrow(/unapproved staging/i)
    expect(() => assertSupabaseTestTarget(`https://${APPROVED_STAGING_REF}.supabase.co`, {
      mode: 'staging',
      expectedRef: 'another-project',
    })).toThrow(/approved project ref/i)
  })

  it('rejects server-side keys and accepts a publishable key', () => {
    expect(assertPublishableKey('sb_publishable_fictitious_test_key')).toMatch(/^sb_publishable_/)
    expect(() => assertPublishableKey('sb_secret_fictitious_test_key')).toThrow(/server-side/i)
    const serviceRole = `eyJ.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.signature`
    expect(() => assertPublishableKey(serviceRole)).toThrow(/service_role/i)
  })
})

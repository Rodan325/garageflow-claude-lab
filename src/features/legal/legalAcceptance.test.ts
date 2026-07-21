import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LEGAL_V2_DOCUMENTS } from '@/config/legalV2'

const state = vi.hoisted(() => ({
  existing: [] as Array<{ id: string }>,
  inserted: [] as Array<Record<string, unknown>>,
  listRows: [] as Array<Record<string, unknown>>,
  getUser: vi.fn(),
}))

vi.mock('@/lib/demo', () => ({ isDemo: () => false }))
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: state.getUser },
    from: vi.fn(() => {
      const builder = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        in: vi.fn(() => builder),
        limit: vi.fn(async () => ({ data: state.existing, error: null })),
        order: vi.fn(async () => ({ data: state.listRows, error: null })),
        insert: vi.fn(async (payload: Record<string, unknown>) => {
          state.inserted.push(payload)
          return { error: null }
        }),
      }
      return builder
    }),
  },
}))

import {
  isCurrentLegalV2Acceptance,
  listOwnLegalAcceptances,
  recordLegalAcceptance,
  recordLegalV2Acceptance,
  requiredLegalV2Documents,
  type LegalV2AcceptanceCandidate,
} from './legalAcceptance'

beforeEach(() => {
  state.existing = []
  state.inserted = []
  state.listRows = []
  state.getUser.mockReset()
  state.getUser.mockResolvedValue({ data: { user: { id: 'user-legal-test' } } })
})

describe('legal acceptance evidence', () => {
  it('cannot record V2 evidence while the acceptance flag and documents are not effective', async () => {
    await expect(recordLegalV2Acceptance('terms_client', 'client', 'signup', {
      displayedLanguage: 'fr',
      organizationId: null,
    })).rejects.toThrow(/disabled|not effective/i)
    expect(state.inserted).toHaveLength(0)
  })

  it('records legacy evidence without claiming organization authority', async () => {
    await recordLegalAcceptance('terms', 'terms-2026-01', 'garage', 'legal_gate', {
      displayedLanguage: 'ar',
      organizationId: 'garage-legal-test',
    })

    expect(state.inserted).toHaveLength(1)
    expect(state.inserted[0]).toMatchObject({
      user_id: 'user-legal-test',
      document_type: 'terms',
      document_version: 'terms-2026-01',
      document_id: 'terms:terms-2026-01',
      displayed_language: 'ar',
      organization_id: null,
    })
  })

  it('keeps rolling-deployment fields nullable for older callers', async () => {
    await recordLegalAcceptance('privacy', 'privacy-2026-01', 'client', 'signup')

    expect(state.inserted[0]).toMatchObject({
      document_id: 'privacy:privacy-2026-01',
      displayed_language: null,
      organization_id: null,
    })
  })

  it('remains idempotent for an already accepted document version', async () => {
    state.existing = [{ id: 'existing-acceptance' }]

    await recordLegalAcceptance('dpa', '2026-07-02', 'garage', 'legal_gate', {
      displayedLanguage: 'fr',
      organizationId: null,
    })

    expect(state.inserted).toHaveLength(0)
  })

  it('preserves historical rows whose new evidence fields are null', async () => {
    state.listRows = [{
      id: 'historical-acceptance',
      user_id: 'user-legal-test',
      role: 'garage',
      document_type: 'pilot_agreement',
      document_version: '2026-07-02',
      accepted_at: '2026-07-02T00:00:00Z',
      acceptance_context: 'legal_gate',
      displayed_language: null,
      document_id: null,
      organization_id: null,
    }]

    await expect(listOwnLegalAcceptances('user-legal-test')).resolves.toEqual(state.listRows)
  })
})

describe('V2 evidence matching', () => {
  const effectiveTerms = {
    ...LEGAL_V2_DOCUMENTS.terms_client,
    status: 'effective' as const,
    effectiveAt: '2026-08-01T00:00:00Z',
  }
  const correctRow: LegalV2AcceptanceCandidate = {
    user_id: 'user-legal-test',
    document_type: 'terms_client',
    document_id: 'terms_client',
    document_version: effectiveTerms.version,
    displayed_language: 'fr',
    organization_id: null,
    document_sha256: effectiveTerms.sha256.fr,
    document_status: 'effective',
    acceptance_scope: 'user',
  }

  it('requires evidence when none exists and accepts the exact user proof', () => {
    expect(isCurrentLegalV2Acceptance(correctRow, effectiveTerms, 'user-legal-test', null)).toBe(true)
  })

  it.each([
    ['wrong document key', { document_id: 'terms' }],
    ['wrong version', { document_version: 'terms-older' }],
    ['wrong hash', { document_sha256: '0'.repeat(64) }],
    ['wrong user', { user_id: 'other-user' }],
    ['wrong scope', { acceptance_scope: 'organization' }],
  ])('rejects a %s', (_label, override) => {
    expect(isCurrentLegalV2Acceptance(
      { ...correctRow, ...override },
      effectiveTerms,
      'user-legal-test',
      null,
    )).toBe(false)
  })

  it('requires a new acceptance when the configured version or hash changes', () => {
    expect(isCurrentLegalV2Acceptance(correctRow, {
      ...effectiveTerms,
      version: 'terms-2026-02',
    }, 'user-legal-test', null)).toBe(false)
    expect(isCurrentLegalV2Acceptance(correctRow, {
      ...effectiveTerms,
      sha256: { ...effectiveTerms.sha256, fr: '1'.repeat(64) },
    }, 'user-legal-test', null)).toBe(false)
  })

  it('matches organization evidence only inside the exact tenant', () => {
    const document = {
      ...LEGAL_V2_DOCUMENTS.dpa,
      status: 'effective' as const,
      effectiveAt: '2026-08-01T00:00:00Z',
    }
    const row: LegalV2AcceptanceCandidate = {
      ...correctRow,
      user_id: 'organization-owner',
      document_type: 'dpa',
      document_id: 'dpa',
      document_version: document.version,
      document_sha256: document.sha256.fr,
      organization_id: 'organization-a',
      acceptance_scope: 'organization',
    }
    expect(isCurrentLegalV2Acceptance(row, document, 'different-member', 'organization-a')).toBe(true)
    expect(isCurrentLegalV2Acceptance(row, document, 'organization-owner', 'organization-b')).toBe(false)
  })

  it('includes DPA only when its dedicated self-service capability is enabled', () => {
    expect(requiredLegalV2Documents('garage', false)).toEqual(['terms_pro'])
    expect(requiredLegalV2Documents('garage', true)).toEqual(['terms_pro', 'dpa'])
    expect(requiredLegalV2Documents('client', true)).toEqual(['terms_client'])
  })
})

describe('legal acceptance migration contract', () => {
  const migration = readFileSync(
    join(process.cwd(), 'supabase/migrations/20260719111617_add_legal_acceptance_versioning_contracts.sql'),
    'utf8',
  )

  it('is additive and never rewrites historical acceptances', () => {
    expect(migration).toContain('add column if not exists displayed_language text')
    expect(migration).toContain('add column if not exists document_id text')
    expect(migration).toContain('add column if not exists organization_id uuid')
    expect(migration).not.toMatch(/update\s+(?:public\.)?legal_acceptances/i)
    expect(migration).not.toMatch(/delete\s+from\s+(?:public\.)?legal_acceptances/i)
  })

  it('prevents a cross-organization evidence claim', () => {
    expect(migration).toContain('member.user_id = (select auth.uid())')
    expect(migration).toContain('member.garage_id = organization_id')
    expect(migration).toContain("member.status = 'active'")
  })
})

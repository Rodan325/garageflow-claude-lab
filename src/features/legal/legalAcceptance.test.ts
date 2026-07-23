import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LEGAL_V2_DOCUMENTS } from '@/config/legalV2'
import { hashCanonicalLegalDocumentById } from './legalCanonicalDocument'

const state = vi.hoisted(() => ({
  inserted: [] as Array<Record<string, unknown>>,
  listRows: [] as Array<Record<string, unknown>>,
  rpc: vi.fn(),
  acceptanceEnabled: true,
  dpaEnabled: true,
}))

vi.mock('@/lib/demo', () => ({ isDemo: () => false }))
vi.mock('@/lib/features', () => ({
  legalAcceptanceV2Enabled: () => state.acceptanceEnabled,
  dpaSelfServiceEnabled: () => state.dpaEnabled,
}))
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: state.rpc,
    from: vi.fn(() => {
      const builder = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        in: vi.fn(() => builder),
        limit: vi.fn(async () => ({ data: [], error: null })),
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
  getLegalV2AcceptanceStatus,
  isCurrentLegalV2Acceptance,
  listOwnLegalAcceptances,
  recordLegalAcceptance,
  recordLegalV2Acceptance,
  requiredLegalV2Documents,
  type LegalV2AcceptanceCandidate,
} from './legalAcceptance'

beforeEach(() => {
  state.inserted = []
  state.listRows = []
  state.rpc.mockReset()
  state.acceptanceEnabled = true
  state.dpaEnabled = true
})

describe('legal acceptance evidence', () => {
  it('cannot record V2 evidence while the acceptance flag and documents are not effective', async () => {
    await expect(recordLegalV2Acceptance('terms_client', {
      displayedLanguage: 'fr',
      organizationId: null,
    })).rejects.toThrow(/disabled|not effective/i)
    expect(state.inserted).toHaveLength(0)
    expect(state.rpc).not.toHaveBeenCalled()
  })

  it('does not attempt a direct Data API write for legacy evidence', async () => {
    await expect(recordLegalAcceptance('terms', 'terms-2026-01', 'garage', 'legal_gate', {
      displayedLanguage: 'ar',
      organizationId: 'garage-legal-test',
    })).rejects.toThrow(/read-only/i)
    expect(state.inserted).toHaveLength(0)
  })

  it('routes current V2 acceptance through the server without client evidence fields', async () => {
    const document = LEGAL_V2_DOCUMENTS.terms_client
    const previous = {
      status: document.status,
      effectiveAt: document.effectiveAt,
      hash: document.sha256.fr,
    }
    document.status = 'effective'
    document.effectiveAt = '2026-08-01T00:00:00Z'
    document.sha256.fr = await hashCanonicalLegalDocumentById('terms_client', 'fr')
    state.rpc.mockImplementation(async (name: string) => {
      if (name === 'get_current_legal_acceptance_status_v2') {
        return {
          data: [{
            accepted: false,
            current: true,
            can_accept: true,
            reason: 'acceptance_available',
            document_key: 'terms_client',
            document_version: document.version,
            document_sha256: document.sha256.fr,
            organization_id: null,
            acceptance_scope: 'user',
            accepted_at: null,
          }],
          error: null,
        }
      }
      return { data: 'acceptance-id', error: null }
    })

    try {
      await recordLegalV2Acceptance('terms_client', {
        displayedLanguage: 'fr',
        organizationId: null,
      })
    } finally {
      document.status = previous.status
      document.effectiveAt = previous.effectiveAt
      document.sha256.fr = previous.hash
    }

    expect(state.rpc).toHaveBeenNthCalledWith(1, 'get_current_legal_acceptance_status_v2', {
      p_document_key: 'terms_client',
      p_language: 'fr',
      p_organization_id: null,
    })
    expect(state.rpc).toHaveBeenNthCalledWith(2, 'accept_current_legal_document_v2', {
      p_document_key: 'terms_client',
      p_language: 'fr',
      p_organization_id: null,
    })
    expect(state.rpc.mock.calls[1][1]).not.toHaveProperty('actor_id')
    expect(state.rpc.mock.calls[1][1]).not.toHaveProperty('accepted_at')
    expect(state.rpc.mock.calls[1][1]).not.toHaveProperty('document_version')
    expect(state.rpc.mock.calls[1][1]).not.toHaveProperty('document_sha256')
    expect(state.inserted).toHaveLength(0)
  })

  it('fails closed before any RPC when DPA self-service is disabled', async () => {
    state.dpaEnabled = false

    await expect(recordLegalV2Acceptance('dpa', {
      displayedLanguage: 'fr',
      organizationId: 'organization-a',
    })).rejects.toThrow(/self-service acceptance is disabled/i)

    expect(state.rpc).not.toHaveBeenCalled()
    expect(state.inserted).toHaveLength(0)
  })

  it('reports no DPA acceptance action when self-service is disabled', async () => {
    const document = LEGAL_V2_DOCUMENTS.dpa
    const previous = {
      status: document.status,
      effectiveAt: document.effectiveAt,
      hash: document.sha256.fr,
    }
    document.status = 'effective'
    document.effectiveAt = '2026-08-01T00:00:00Z'
    document.sha256.fr = await hashCanonicalLegalDocumentById('dpa', 'fr')
    state.dpaEnabled = false
    state.rpc.mockResolvedValue({
      data: [{
        accepted: false,
        current: true,
        can_accept: true,
        reason: 'acceptance_available',
        document_key: 'dpa',
        document_version: document.version,
        document_sha256: document.sha256.fr,
        organization_id: 'organization-a',
        acceptance_scope: 'organization',
        accepted_at: null,
      }],
      error: null,
    })

    try {
      await expect(getLegalV2AcceptanceStatus('dpa', 'fr', 'organization-a')).resolves.toMatchObject({
        accepted: false,
        current: true,
        can_accept: false,
        reason: 'dpa_self_service_disabled',
      })
    } finally {
      document.status = previous.status
      document.effectiveAt = previous.effectiveAt
      document.sha256.fr = previous.hash
    }
  })

  it('never creates a new acceptance for a historical document version', async () => {
    await expect(recordLegalAcceptance('dpa', '2026-07-02', 'garage', 'legal_gate', {
      displayedLanguage: 'fr',
      organizationId: null,
    })).rejects.toThrow(/historical/i)

    expect(state.inserted).toHaveLength(0)
  })

  it('never creates a new pilot agreement acceptance', async () => {
    await expect(recordLegalAcceptance('pilot_agreement', 'future-version', 'garage', 'legal_gate'))
      .rejects.toThrow(/historical/i)
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
    ['wrong locale', { displayed_language: 'ar' }],
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
  const writeRestrictionMigration = readFileSync(
    join(process.cwd(), 'supabase/migrations/20260723185453_restrict_legal_acceptance_writes_to_current_document_rpc.sql'),
    'utf8',
  )
  const exactLocaleMigration = readFileSync(
    join(process.cwd(), 'supabase/migrations/20260723220125_bind_legal_acceptance_evidence_to_exact_locale_hash.sql'),
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

  it('revokes direct writes and exposes only current-document RPC inputs', () => {
    expect(writeRestrictionMigration).toContain(
      'revoke insert, update, delete on table public.legal_acceptances from anon, authenticated',
    )
    expect(writeRestrictionMigration).toContain('accept_current_legal_document_v2')
    expect(writeRestrictionMigration).toContain("set search_path = ''")
    expect(writeRestrictionMigration).toContain('v_actor_id uuid := auth.uid()')
    expect(writeRestrictionMigration).not.toMatch(/p_(?:actor_id|accepted_at|document_version|document_sha256)/)
  })

  it('preserves all existing evidence and refuses historical acceptance keys', () => {
    expect(writeRestrictionMigration).toContain("p_document_key = 'pilot_agreement'")
    expect(writeRestrictionMigration).toContain("document.document_version = '2026-07-02'")
    expect(writeRestrictionMigration).not.toMatch(/update\s+(?:public\.)?legal_acceptances/i)
    expect(writeRestrictionMigration).not.toMatch(/delete\s+from\s+(?:public\.)?legal_acceptances/i)
  })

  it('binds status, idempotence, and concurrent lookup to the exact locale hash', () => {
    expect(exactLocaleMigration).toContain('acceptance.displayed_language = v_document.language')
    expect(exactLocaleMigration).toContain('acceptance.document_sha256 = v_document.sha256')
    expect(exactLocaleMigration).toContain('legal_acceptances_v2_user_locale_unique')
    expect(exactLocaleMigration).toContain('legal_acceptances_v2_organization_locale_unique')
    expect(exactLocaleMigration).toMatch(
      /user_id,\s*document_id,\s*document_version,\s*displayed_language,\s*document_sha256/s,
    )
    expect(exactLocaleMigration).toMatch(
      /organization_id,\s*document_id,\s*document_version,\s*displayed_language,\s*document_sha256/s,
    )
    expect(exactLocaleMigration).toContain('document.requires_acceptance is true')
    expect(exactLocaleMigration).toContain('v_document.language,')
    expect(exactLocaleMigration).toContain('v_document.sha256')
    expect(exactLocaleMigration).not.toMatch(/p_(?:actor_id|accepted_at|document_version|document_sha256)/)
  })

  it('keeps the locale-hash migration forward-only and historical evidence immutable', () => {
    expect(exactLocaleMigration).toContain("p_document_key = 'pilot_agreement'")
    expect(exactLocaleMigration).toContain("document.document_version = '2026-07-02'")
    expect(exactLocaleMigration).not.toMatch(/\bupdate\s+(?:public\.)?legal_acceptances\b/i)
    expect(exactLocaleMigration).not.toMatch(/\bdelete\s+from\s+(?:public\.)?legal_acceptances\b/i)
    expect(exactLocaleMigration).not.toMatch(/\btruncate\s+(?:table\s+)?(?:public\.)?legal_acceptances\b/i)
  })
})

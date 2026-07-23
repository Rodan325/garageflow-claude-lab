import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LanguageProvider, type Lang } from '@/i18n'
import {
  LEGAL_V2_DOCUMENTS,
  LEGAL_V2_FLAG_NAMES,
} from '@/config/legalV2'
import {
  CLIENT_LEGAL_V2_DOCUMENT_IDS,
  getLegalV2Document,
  type ClientLegalV2DocumentId,
} from './legalV2Content'
import {
  getCanonicalLegalDocument,
  serializeCanonicalLegalDocumentById,
} from './legalCanonicalDocument'
import { LegalV2DocumentPage } from './LegalV2DocumentPage'
import { HistoricalLegalArchivePage } from './HistoricalLegalArchivePage'

const clientDocumentIds = CLIENT_LEGAL_V2_DOCUMENT_IDS
const languages: Lang[] = ['fr', 'en', 'ar']

function renderV2(documentId: ClientLegalV2DocumentId, lang: Lang) {
  localStorage.setItem('gf-lang', lang)
  return render(
    <LanguageProvider>
      <MemoryRouter><LegalV2DocumentPage documentId={documentId} /></MemoryRouter>
    </LanguageProvider>,
  )
}

afterEach(() => {
  localStorage.clear()
  document.head.querySelector('meta[name="robots"]')?.remove()
  document.documentElement.lang = 'fr'
  document.documentElement.dir = 'ltr'
})

describe('legal V2 registry and content', () => {
  it('keeps every document staged or draft with no invented effective date', () => {
    for (const document of Object.values(LEGAL_V2_DOCUMENTS)) {
      expect(['staged', 'draft']).toContain(document.status)
      expect(document.publishedAt).toBeNull()
      expect(document.effectiveAt).toBeNull()
    }
  })

  it('keeps the nine production flags explicitly off by default', () => {
    const example = readFileSync(resolve(process.cwd(), '.env.example'), 'utf8')
    for (const flag of LEGAL_V2_FLAG_NAMES) {
      expect(example).toContain(`VITE_${flag}=false`)
    }
  })

  it.each(clientDocumentIds)('%s has clause parity in French, English and Arabic', (documentId) => {
    const reference = getLegalV2Document(documentId, 'fr')
    for (const lang of languages) {
      const document = getLegalV2Document(documentId, lang)
      expect(document.title.trim()).not.toBe('')
      expect(document.sections.map((entry) => entry.id)).toEqual(reference.sections.map((entry) => entry.id))
      expect(document.sections.every((entry) => entry.title.trim() && entry.paragraphs.every((text) => text.trim()))).toBe(true)
    }
  })

  it('contains no visible pilot, prototype, placeholder or historical product branding', () => {
    const visible = clientDocumentIds.flatMap((documentId) => languages.map((lang) => (
      serializeCanonicalLegalDocumentById(documentId, lang)
    ))).join('\n')
    expect(visible).not.toMatch(/programme pilote|offre pilote|version pilote|\bpilot\b|\bbeta\b|expérimental|test version|version d'essai|placeholder|GarageFlow/i)
  })

  it('does not leak reference French legal headings into English or Arabic', () => {
    for (const lang of ['en', 'ar'] as const) {
      const visible = clientDocumentIds.map((documentId) => serializeCanonicalLegalDocumentById(documentId, lang)).join('\n')
      expect(visible).not.toMatch(/Mentions légales|Politique de confidentialité|Conditions d’accès|Conditions générales de services|Accord de sous-traitance/)
    }
  })

  it('binds every localized document to its configured SHA-256', () => {
    for (const documentId of clientDocumentIds) {
      for (const lang of languages) {
        const actual = createHash('sha256').update(serializeCanonicalLegalDocumentById(documentId, lang)).digest('hex')
        expect(actual, `${documentId}/${lang}`).toBe(LEGAL_V2_DOCUMENTS[documentId].sha256[lang])
      }
    }
  })

  it('renders the exact canonical identity and presentation payload', () => {
    const canonical = getCanonicalLegalDocument('legal', 'fr')
    const { container } = renderV2('legal', 'fr')
    for (const entry of canonical.identity.entries) expect(container).toHaveTextContent(entry.value)
    expect(container).toHaveTextContent(canonical.presentation.reviewNotice!.body)
    expect(container.querySelector('[data-legal-sha256]')).toHaveAttribute(
      'data-legal-sha256',
      LEGAL_V2_DOCUMENTS.legal.sha256.fr,
    )
  })

  it.each(languages)('renders staged identity and direction correctly in %s', (lang) => {
    const { container } = renderV2('legal', lang)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(container).toHaveTextContent('RODANBTECH')
    expect(container).toHaveTextContent('Anas RODRIGUEZ BENKARROUM')
    expect(container).toHaveTextContent('103 878 187 00014')
    expect(container).toHaveTextContent('Clikarage')
    expect(document.documentElement.dir).toBe(lang === 'ar' ? 'rtl' : 'ltr')
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow')
    if (lang !== 'fr') {
      expect(container).not.toHaveTextContent('Entrepreneur individuel')
      expect(container).not.toHaveTextContent('TVA non applicable')
    }
  })

  it('contains no external Google Fonts request in the application shell', () => {
    const index = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')
    expect(index).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/)
  })
})

describe('historical legal archive', () => {
  it('keeps the pilot archive reachable, explicit, non-acceptable and noindex', () => {
    localStorage.setItem('gf-lang', 'fr')
    const { container } = render(
      <LanguageProvider>
        <MemoryRouter initialEntries={['/legal/archive/pilot_agreement/2026-07-02']}>
          <Routes>
            <Route path="/legal/archive/:documentId/:version" element={<HistoricalLegalArchivePage />} />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>,
    )

    expect(screen.getByRole('note')).toHaveTextContent('Archive historique — document non applicable aux nouveaux contrats')
    expect(container).toHaveTextContent('Conditions du pilote garage')
    expect(screen.queryByRole('button', { name: /accepte/i })).toBeNull()
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow,noarchive')
  })

  it('rejects an unknown archive version', () => {
    localStorage.setItem('gf-lang', 'fr')
    render(
      <LanguageProvider>
        <MemoryRouter initialEntries={['/legal/archive/terms/unknown']}>
          <Routes>
            <Route path="/legal/archive/:documentId/:version" element={<HistoricalLegalArchivePage />} />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>,
    )
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('Cette page n’existe pas ou a été déplacée.')).toBeInTheDocument()
  })
})

describe('legal acceptance V2 migration contract', () => {
  const migration = readFileSync(
    resolve(process.cwd(), 'supabase/migrations/20260719235753_harden_legal_acceptance_v2.sql'),
    'utf8',
  )
  const failClosedMigration = readFileSync(
    resolve(process.cwd(), 'supabase/migrations/20260720151800_preserve_legacy_legal_acceptance_fail_closed.sql'),
    'utf8',
  )
  const canonicalHashMigration = readFileSync(
    resolve(process.cwd(), 'supabase/migrations/20260723110428_refresh_legal_canonical_document_hashes.sql'),
    'utf8',
  )

  it('preserves historical rows and adds only nullable evidence columns', () => {
    expect(migration).toContain('add column if not exists document_sha256 text')
    expect(migration).toContain('add column if not exists authority_role text')
    expect(migration).not.toMatch(/update\s+(?:public\.)?legal_acceptances/i)
    expect(migration).not.toMatch(/delete\s+from\s+(?:public\.)?legal_acceptances/i)
  })

  it('keeps document metadata private and every new version non-effective', () => {
    expect(migration).toContain('alter table private.legal_document_versions enable row level security')
    expect(migration).toContain('revoke all on table private.legal_document_versions from public, anon, authenticated')
    expect(migration).not.toMatch(/'effective',\s*null/i)
    expect((migration.match(/'staged', null, null/g) ?? []).length).toBeGreaterThanOrEqual(27)
  })

  it('validates effective status, hash, identity and organization authority server-side', () => {
    expect(migration).toContain("v_document.status <> 'effective'")
    expect(migration).toContain('v_document.sha256 <> new.document_sha256')
    expect(migration).toContain('new.user_id <> auth.uid()')
    expect(migration).toContain("member.organization_role in ('organization_owner', 'network_admin')")
    expect(migration).toContain("member.role in ('owner', 'admin')")
    expect(migration).toContain("errcode = '42501'")
  })

  it('prevents duplicate user and organization acceptances', () => {
    expect(migration).toContain('legal_acceptances_v2_user_unique')
    expect(migration).toContain('legal_acceptances_v2_organization_unique')
  })

  it('keeps every configured content hash aligned with the database registry', () => {
    for (const documentId of clientDocumentIds) {
      for (const hash of Object.values(LEGAL_V2_DOCUMENTS[documentId].sha256)) {
        expect(canonicalHashMigration).toContain(hash)
      }
    }
    for (const documentId of ['service_levels', 'ai_policy'] as const) {
      for (const hash of Object.values(LEGAL_V2_DOCUMENTS[documentId].sha256)) {
        expect(migration).toContain(hash)
      }
    }
  })

  it('updates only non-effective registry metadata and never acceptance evidence', () => {
    expect(canonicalHashMigration).toContain("document.status in ('staged', 'draft')")
    expect(canonicalHashMigration).toContain('document.effective_at is null')
    expect(canonicalHashMigration).not.toMatch(/update\s+(?:public\.)?legal_acceptances/i)
    expect(canonicalHashMigration).not.toMatch(/delete\s+from\s+(?:public\.)?legal_acceptances/i)
  })

  it('preserves only user-scoped legacy DPA evidence while V2 remains disabled', () => {
    expect(failClosedMigration).toContain("new.document_version = '2026-07-02'")
    expect(failClosedMigration).toContain('new.organization_id is not null or new.document_sha256 is not null')
    expect(failClosedMigration).not.toMatch(/update\s+(?:public\.)?legal_acceptances/i)
    expect(failClosedMigration).not.toMatch(/delete\s+from\s+(?:public\.)?legal_acceptances/i)
  })

  it('records the authority role that actually authorized an organization acceptance', () => {
    expect(failClosedMigration).toContain("when member.organization_role in ('organization_owner', 'network_admin')")
    expect(failClosedMigration).toContain('member.center_id is null')
    expect(failClosedMigration).toContain("and member.role in ('owner', 'admin') then member.role")
    expect(failClosedMigration).not.toContain('coalesce(member.organization_role, member.role)')
  })

  it('keeps non-public legal documents unreachable from the generic route', () => {
    const route = readFileSync(resolve(process.cwd(), 'src/features/legal/LegalV2Route.tsx'), 'utf8')
    const runtimeContent = readFileSync(resolve(process.cwd(), 'src/features/legal/legalV2Content.ts'), 'utf8')
    expect(route).toContain('!LEGAL_V2_DOCUMENTS[documentId].public')
    expect(runtimeContent).not.toContain('Annexe de service et support')
    expect(runtimeContent).not.toContain('Document interne préparatoire')
    expect(runtimeContent).not.toContain('serviceLevels')
    expect(runtimeContent).not.toContain('aiPolicy')
    expect(LEGAL_V2_DOCUMENTS.service_levels.public).toBe(false)
    expect(LEGAL_V2_DOCUMENTS.ai_policy.public).toBe(false)
  })
})

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider, type Lang } from '@/i18n'
import { LEGAL_DOCUMENT_VERSIONS, REQUIRED_LEGAL_DOCS } from '@/config/legal'
import { getCommercialLegalDocument, type CommercialLegalDocumentKey } from './commercialLegalContent'
import { LegalPage } from './LegalPage'
import { PrivacyPage } from './PrivacyPage'
import { TermsPage } from './TermsPage'
import { PilotAgreementPage } from './PilotAgreementPage'
import { DpaPage } from './DpaPage'

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    ready: true,
    authed: true,
    accountType: 'staff',
    membership: {
      garage_id: 'organization-test',
      role: 'owner',
      organization_role: 'organization_owner',
      center_id: null,
    },
  }),
}))

const currentDocuments: Array<[CommercialLegalDocumentKey, () => React.ReactNode]> = [
  ['legal', LegalPage],
  ['privacy', PrivacyPage],
  ['terms', TermsPage],
  ['dpa', DpaPage],
]

const historicalHashes: Record<string, string> = {
  'HistoricalLegalNotice20260702Page.tsx': 'cef0e102374c318eb64848741223bbfdf3c317ed0efe7e9cdc711793f8da722e',
  'HistoricalPrivacy20260702Page.tsx': '6da9102b1eb8e08211f810932faaa4968b18cd76cffc96ec557e55c82c86b86e',
  'HistoricalTerms20260702Page.tsx': '1a02e722478d9259786fde5f4188cef6cadd6ea29b106cd6cc1a15a21965300c',
  'HistoricalDpa20260702Page.tsx': '2c5fdba1c6c97f753cd2839c5f73b6e002827638727c9d6ec68b63f97b8be1aa',
  'HistoricalPilotAgreement20260702Page.tsx': 'cbbe35e40ada60422664ee44c7d04bf96d14225a924647574e9f476bc83b9dbe',
  'legalContent.ts': 'e5b802f70935f436a1e204d063def3c96194cffafc84054cfa9233a0448f126c',
  'historicalLegal20260702.ts': '642493149cc917db180b4069d123df59dc18a7eb8005cb9d6ac1a74b9858da5d',
}

function renderPage(Page: () => React.ReactNode, lang: Lang, entry = '/') {
  localStorage.setItem('gf-lang', lang)
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={[entry]}><Page /></MemoryRouter>
    </LanguageProvider>,
  )
}

afterEach(() => {
  localStorage.clear()
  document.documentElement.lang = 'fr'
  document.documentElement.dir = 'ltr'
})

describe('commercial legal corpus', () => {
  it.each(['fr', 'en', 'ar'] as const)('contains the same complete section structure in %s', (lang) => {
    for (const [key] of currentDocuments) {
      const document = getCommercialLegalDocument(key, lang)
      const reference = getCommercialLegalDocument(key, 'fr')
      expect(document.sections.map((section) => section.id)).toEqual(reference.sections.map((section) => section.id))
      expect(document.sections.every((section) => section.title.trim() && section.paragraphs.every(Boolean))).toBe(true)
    }
  })

  it.each(['en', 'ar'] as const)('does not leak common French legal headings into %s', (lang) => {
    const visible = currentDocuments
      .map(([key]) => JSON.stringify(getCommercialLegalDocument(key, lang)))
      .join(' ')

    expect(visible).not.toMatch(/Mentions légales|Politique de confidentialité|Conditions d’utilisation|Accord de sous-traitance des données/)
  })

  it('contains no pilot, beta, experimental or visible GarageFlow wording', () => {
    for (const lang of ['fr', 'en', 'ar'] as const) {
      for (const [key] of currentDocuments) {
        const visible = JSON.stringify(getCommercialLegalDocument(key, lang))
        expect(visible).not.toMatch(/pilote|pilot|beta|version d'essai|test version|expérimental|GarageFlow/i)
      }
    }
  })

  it('does not assert an unverified Supabase contracting entity', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/features/legal/commercialLegalContent.ts'), 'utf8')
    expect(source).not.toContain('Supabase, Inc.')
  })

  it.each(currentDocuments)('keeps the flags-off %s route canonical, staged and non-acceptable', (_key, Page) => {
    const { container } = renderPage(Page, 'fr')
    expect(container).toHaveTextContent('RODANBTECH')
    expect(container).toHaveTextContent('Projet — non encore en vigueur')
    expect(container).not.toHaveTextContent('2026-07-02')
    expect(container).not.toHaveTextContent(/pilote|prototype|beta/i)
    expect(container.querySelector('[data-legal-v2="true"]')).not.toBeNull()
    expect(container.querySelector('[data-legal-status="staged"]')).not.toBeNull()
  })

  it.each(currentDocuments)('uses the canonical model for the %s review page', (key, Page) => {
    const canonicalKey = key === 'terms' ? 'terms_client' : key
    const { container } = renderPage(Page, 'en')
    expect(container.querySelector('[data-legal-document]')).toHaveAttribute(
      'data-legal-document',
      canonicalKey,
    )
    expect(container.querySelector('[data-legal-sha256]')).not.toBeNull()
  })

  it('keeps the official publisher identity on the flags-off legal notice', () => {
    const { container } = renderPage(LegalPage, 'fr')
    expect(container).toHaveTextContent('Anas RODRIGUEZ BENKARROUM')
    expect(container).toHaveTextContent('103 878 187 00014')
    expect(container.querySelector('a[href="mailto:anas.rodriguez@rodanbtech.com"]')).not.toBeNull()
  })

  it('keeps every public and professional legal route registered', () => {
    const appSource = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf8')
    for (const route of ['/legal', '/privacy', '/terms', '/pilot-agreement', '/dpa']) {
      expect(appSource).toContain(`path="${route}"`)
    }
    expect(appSource).toContain('path="legal-status"')
  })

  it('fails closed on historical versions and excludes the pilot agreement from new acceptance', () => {
    expect(LEGAL_DOCUMENT_VERSIONS.terms).toBe('2026-07-02')
    expect(LEGAL_DOCUMENT_VERSIONS.privacy).toBe('2026-07-02')
    expect(LEGAL_DOCUMENT_VERSIONS.dpa).toBe('2026-07-02')
    expect(REQUIRED_LEGAL_DOCS.garage).toEqual(['terms', 'privacy', 'dpa'])
  })
})

describe('historical legal corpus', () => {
  it('keeps the 2026-07-02 source snapshots immutable', () => {
    for (const [file, expected] of Object.entries(historicalHashes)) {
      const source = readFileSync(resolve(process.cwd(), 'src/features/legal', file), 'utf8').replace(/\r\n/g, '\n')
      expect(createHash('sha256').update(source).digest('hex'), file).toBe(expected)
    }
  })

  it('keeps the pilot agreement route but identifies it as historical', () => {
    const { container } = renderPage(PilotAgreementPage, 'fr', '/pilot-agreement')
    expect(screen.getByRole('note')).toHaveTextContent('Document historique')
    expect(container).toHaveTextContent('Conditions du pilote garage')
    expect(screen.getByRole('link', { name: 'Consulter les conditions actuelles' })).toHaveAttribute('href', '/terms')
  })

  it('can render an accepted historical terms version without replacing the current route', () => {
    const { container } = renderPage(TermsPage, 'fr', '/terms?version=2026-07-02')
    expect(screen.getByRole('note')).toHaveTextContent('Document historique')
    expect(container).toHaveTextContent('Conditions générales d’utilisation')
    expect(container).toHaveTextContent('Version du document : 2026-07-02')
    expect(container).toHaveTextContent('2026-07-02')
  })
})

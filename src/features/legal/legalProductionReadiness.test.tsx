import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider, type Lang } from '@/i18n'
import { LEGAL_DOCUMENT_VERSIONS, REQUIRED_LEGAL_DOCS } from '@/config/legal'
import { getCommercialLegalDocument, type CommercialLegalDocumentKey } from './commercialLegalContent'
import { LegalPage } from './LegalPage'
import { PrivacyPage } from './PrivacyPage'
import { TermsPage } from './TermsPage'
import { PilotAgreementPage } from './PilotAgreementPage'
import { DpaPage } from './DpaPage'

const currentDocuments: Array<[CommercialLegalDocumentKey, () => React.ReactNode]> = [
  ['legal', LegalPage],
  ['privacy', PrivacyPage],
  ['terms', TermsPage],
  ['dpa', DpaPage],
]

const historicalHashes: Record<string, string> = {
  'HistoricalLegalNotice20260702Page.tsx': '4c9a1526b30f205c156beda186c7887d06229a4c2b389a3298b5e2a8dace2e8d',
  'HistoricalPrivacy20260702Page.tsx': '813cfe744d7adc2a779e717d8bfc51db9ad7e6889a2423a74a5af2314c3a442c',
  'HistoricalTerms20260702Page.tsx': 'e4a22c67ca4a5b0044d121183e334a37da82f12bac050926d320fa618f0dbb17',
  'HistoricalDpa20260702Page.tsx': '70d98a78ea0a44943ea691a8a51c47d15b8a5f904b3ead0577a3fabb0e7c2f1d',
  'HistoricalPilotAgreement20260702Page.tsx': 'd3b9a9dcce289d270f11ea77683df22b4fa385a56f38331ce651e9d5235adc66',
  'legalContent.ts': 'e5b802f70935f436a1e204d063def3c96194cffafc84054cfa9233a0448f126c',
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

  it('contains no pilot, beta, experimental or visible GarageFlow wording', () => {
    for (const lang of ['fr', 'en', 'ar'] as const) {
      for (const [key] of currentDocuments) {
        const visible = JSON.stringify(getCommercialLegalDocument(key, lang))
        expect(visible).not.toMatch(/pilote|pilot|beta|version d'essai|test version|expérimental|GarageFlow/i)
      }
    }
  })

  it.each(currentDocuments)('renders the current %s route with official publisher and contact details', (_key, Page) => {
    const { container } = renderPage(Page, 'fr')
    expect(container).toHaveTextContent('Anas RODRIGUEZ BENKARROUM')
    expect(container).toHaveTextContent('RODANBTECH')
    expect(container).toHaveTextContent('103 878 187 00014')
    expect(container.querySelector('a[href="mailto:anas.rodriguez@rodanbtech.com"]')).not.toBeNull()
  })

  it('uses explicit commercial versions and excludes pilot terms from new garage acceptance', () => {
    expect(LEGAL_DOCUMENT_VERSIONS.terms).toBe('terms-2026-01')
    expect(LEGAL_DOCUMENT_VERSIONS.privacy).toBe('privacy-2026-01')
    expect(LEGAL_DOCUMENT_VERSIONS.dpa).toBe('dpa-2026-01')
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
    expect(container).toHaveTextContent('2026-07-02')
  })
})

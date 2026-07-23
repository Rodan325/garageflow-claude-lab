import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider, type Lang } from '@/i18n'
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

const documents = [
  ['legal', LegalPage, 'Mentions légales'],
  ['privacy', PrivacyPage, 'Politique de confidentialité'],
  ['terms', TermsPage, "Conditions d’utilisation et de service"],
  ['pilot', PilotAgreementPage, 'Conditions du pilote garage'],
  ['dpa', DpaPage, 'Accord de sous-traitance des données'],
] as const

function renderLegal(Page: () => React.ReactNode, lang: Lang) {
  localStorage.setItem('gf-lang', lang)
  return render(
    <LanguageProvider>
      <MemoryRouter><Page /></MemoryRouter>
    </LanguageProvider>,
  )
}

afterEach(() => {
  localStorage.clear()
  document.documentElement.lang = 'fr'
  document.documentElement.dir = 'ltr'
})

describe.each(documents)('%s legal localization', (_key, Page, frenchTitle) => {
  it('renders an English informational translation and preserves the legal publisher identity', () => {
    const { container } = renderLegal(Page, 'en')

    expect(document.documentElement.dir).toBe('ltr')
    expect(screen.getByText('This translation is provided for information purposes. In the event of a discrepancy, the French version prevails.')).toBeInTheDocument()
    expect(container).toHaveTextContent('RODANBTECH')
    expect(container).toHaveTextContent('Anas RODRIGUEZ BENKARROUM')
    expect(container).toHaveTextContent('Clikarage')
    expect(screen.getByRole('heading', { level: 1 })).not.toHaveTextContent(frenchTitle)
  })

  it('renders an Arabic informational translation in RTL with no French reference title', () => {
    const { container } = renderLegal(Page, 'ar')

    expect(document.documentElement.dir).toBe('rtl')
    expect(screen.getByText('تُقدَّم هذه الترجمة لأغراض إعلامية. وفي حال وجود اختلاف، تكون النسخة الفرنسية هي المرجع.')).toBeInTheDocument()
    expect(container).toHaveTextContent('RODANBTECH')
    expect(container).toHaveTextContent('Anas RODRIGUEZ BENKARROUM')
    expect(screen.getByRole('heading', { level: 1 })).not.toHaveTextContent(frenchTitle)
  })
})

describe('French legal reference', () => {
  it('can be restored directly from a translated page', () => {
    renderLegal(LegalPage, 'en')

    fireEvent.click(screen.getByRole('button', { name: /reference French version/i }))

    expect(document.documentElement.lang).toBe('fr')
    expect(document.documentElement.dir).toBe('ltr')
    expect(screen.getByRole('heading', { level: 1, name: 'Mentions légales' })).toBeInTheDocument()
    expect(screen.queryByText(/provided for information purposes/)).toBeNull()
  })
})

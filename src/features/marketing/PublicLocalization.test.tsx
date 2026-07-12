import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { MarketingShell } from '@/components/shells/MarketingShell'
import { LanguageProvider, type Lang } from '@/i18n'
import { HomePage } from './HomePage'

beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
})

afterAll(() => vi.unstubAllGlobals())

function LocationProbe() {
  return <span data-testid="location">{useLocation().pathname}</span>
}

function renderPublic(lang: Lang) {
  localStorage.setItem('gf-lang', lang)
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<MarketingShell><HomePage /></MarketingShell>} />
          <Route path="/login" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  )
}

afterEach(() => {
  localStorage.clear()
  document.documentElement.lang = 'fr'
  document.documentElement.dir = 'ltr'
})

describe('public navigation and localization', () => {
  it('shows one French account action in the public header and routes it to /login', () => {
    renderPublic('fr')
    const header = screen.getByRole('banner')
    const accountButton = within(header).getByRole('button', { name: 'Accéder à votre espace' })

    expect(within(header).queryByText('Espace garage')).toBeNull()
    expect(within(header).queryByText('Espace client')).toBeNull()
    expect(screen.queryByText('Voir l’app client')).toBeNull()
    expect(document.body.textContent).not.toMatch(/GarageFlow/i)

    fireEvent.click(accountButton)
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
  })

  it('renders the complete Arabic landing in RTL without known French copy', () => {
    const { container } = renderPublic('ar')

    expect(document.documentElement.lang).toBe('ar')
    expect(document.documentElement.dir).toBe('rtl')
    expect(screen.getAllByText('الدخول إلى حسابك').length).toBeGreaterThan(0)
    expect(screen.getByText('ما الذي يبطئ عمل الورشة اليوم؟')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/Réservation en ligne|Ce qui ralentit|Accéder à votre espace|Espace garage|Espace client/)
  })

  it('renders the English landing in LTR without mixed French navigation', () => {
    const { container } = renderPublic('en')

    expect(document.documentElement.lang).toBe('en')
    expect(document.documentElement.dir).toBe('ltr')
    expect(screen.getAllByText('Access your account').length).toBeGreaterThan(0)
    expect(screen.getByText('What slows a garage down today')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/Problèmes|Parcours|Offre pilote|Accéder à votre espace/)
  })
})

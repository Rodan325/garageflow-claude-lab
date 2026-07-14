import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LanguageProvider, type Lang } from '@/i18n'
import { ClientShell } from './ClientShell'
import { ProShell } from './ProShell'

const mocks = vi.hoisted(() => ({ signOut: vi.fn(), setMode: vi.fn() }))

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    garage: { id: 'garage-demo', name: 'Garage Démo', city: 'Lyon' },
    profile: { full_name: 'Alex Martin' },
    role: 'advisor',
    signOut: mocks.signOut,
  }),
}))
vi.mock('@/data/requests', () => ({
  useGarageRequests: () => ({ data: [{ id: 'request-1', status: 'pending' }] }),
}))
vi.mock('@/features/pro/useProMode', () => ({
  useProMode: () => ({ mode: 'avance', set: mocks.setMode }),
}))

function renderShell(kind: 'client' | 'pro', lang: Lang) {
  localStorage.setItem('gf-lang', lang)
  const path = kind === 'client' ? '/app' : '/pro'
  const Shell = kind === 'client' ? ClientShell : ProShell
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={path} element={<Shell />}><Route index element={<div data-testid="route-content" />}/></Route>
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  )
}

function switchFromHeader(name: 'English' | 'العربية') {
  const trigger = screen.getAllByRole('button', { name: /Langue active|Active language|اللغة النشطة/ })[0]
  fireEvent.click(trigger)
  fireEvent.click(screen.getByRole('menuitemradio', { name }))
}

afterEach(() => {
  localStorage.clear()
  document.documentElement.lang = 'fr'
  document.documentElement.dir = 'ltr'
  vi.clearAllMocks()
})

describe('authenticated shell localization', () => {
  it('changes the complete client navigation to English from its header', () => {
    const { container } = renderShell('client', 'fr')

    switchFromHeader('English')

    expect(document.documentElement.lang).toBe('en')
    expect(container).toHaveTextContent('Home')
    expect(container).toHaveTextContent('Book')
    expect(container).toHaveTextContent('Requests')
    expect(container).toHaveTextContent('Vehicles')
    expect(container).not.toHaveTextContent('Accueil')
    expect(container).not.toHaveTextContent('Réserver')
  })

  it('renders the complete client navigation in Arabic without known French labels', () => {
    const { container } = renderShell('client', 'ar')

    expect(document.documentElement.dir).toBe('rtl')
    expect(container).toHaveTextContent('الرئيسية')
    expect(container).toHaveTextContent('الحجز')
    expect(container).toHaveTextContent('الطلبات')
    expect(container).toHaveTextContent('المركبات')
    expect(container.textContent).not.toMatch(/Accueil|Réserver|Demandes|Véhicules|Profil/)
  })

  it('changes the garage navigation to English from its authenticated header', () => {
    const { container } = renderShell('pro', 'fr')

    switchFromHeader('English')

    expect(document.documentElement.dir).toBe('ltr')
    expect(container).toHaveTextContent('Dashboard')
    expect(container).toHaveTextContent('Bookings')
    expect(container).toHaveTextContent('Workshop')
    expect(container).toHaveTextContent('Services')
    expect(container).toHaveTextContent('Advisor')
    expect(container.textContent).not.toMatch(/Tableau de bord|Réservations|Prestations|Équipe/)
  })

  it('renders garage navigation, controls and roles in Arabic', () => {
    const { container } = renderShell('pro', 'ar')

    expect(document.documentElement.dir).toBe('rtl')
    expect(container).toHaveTextContent('لوحة التحكم')
    expect(container).toHaveTextContent('الحجوزات')
    expect(container).toHaveTextContent('الورشة')
    expect(container).toHaveTextContent('الخدمات')
    expect(container).toHaveTextContent('مستشار')
    expect(container.textContent).not.toMatch(/Tableau de bord|Réservations|Prestations|Équipe|Conseiller/)
  })
})

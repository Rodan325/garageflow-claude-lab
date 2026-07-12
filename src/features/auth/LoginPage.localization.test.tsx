import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider, type Lang } from '@/i18n'
import { LoginPage } from './LoginPage'

const mocks = vi.hoisted(() => ({
  enterDemo: vi.fn(),
  signIn: vi.fn(async () => ({ error: null })),
}))

vi.mock('./AuthProvider', () => ({
  useAuth: () => ({
    signIn: mocks.signIn,
    enterDemo: mocks.enterDemo,
    ready: true,
    session: null,
    accountType: null,
    isStaff: false,
    configured: false,
  }),
}))
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))

function renderLogin(lang: Lang) {
  localStorage.setItem('gf-lang', lang)
  return render(
    <LanguageProvider>
      <MemoryRouter><LoginPage /></MemoryRouter>
    </LanguageProvider>,
  )
}

afterEach(() => {
  localStorage.clear()
  document.documentElement.lang = 'fr'
  document.documentElement.dir = 'ltr'
})

describe('LoginPage localization', () => {
  it('renders the complete Arabic login in RTL', () => {
    const { container } = renderLogin('ar')

    expect(document.documentElement.dir).toBe('rtl')
    expect(screen.getByRole('heading', { name: 'تسجيل الدخول' })).toBeInTheDocument()
    expect(screen.getByText('إعداد Supabase غير مكتمل')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /تجربة الورشة/ })).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/Se connecter|Configuration Supabase manquante|Démo garage|Pas encore de compte/)
  })

  it('renders the complete English login in LTR', () => {
    const { container } = renderLogin('en')

    expect(document.documentElement.dir).toBe('ltr')
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByText('Supabase configuration is missing')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Garage demo/ })).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/Se connecter|Configuration Supabase manquante|Démo garage|Pas encore de compte/)
  })
})

import { fireEvent, render, screen } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { LanguageProvider, type Lang } from '@/i18n'
import { LoginPage } from './LoginPage'

const appStyles = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')

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

let appStyleElement: HTMLStyleElement

beforeAll(() => {
  const technicalInputRule = appStyles.match(
    /html\[dir=(?:['"])?rtl(?:['"])?\]\s*input\[type=(?:['"])?email(?:['"])?\],[\s\S]*?\{[^}]*direction:\s*ltr;[^}]*text-align:\s*left;[^}]*\}/,
  )?.[0]

  if (!technicalInputRule) throw new Error('RTL technical input rule is missing from index.css')

  appStyleElement = document.createElement('style')
  appStyleElement.textContent = technicalInputRule
  document.head.appendChild(appStyleElement)
})

afterAll(() => {
  appStyleElement?.remove()
})

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

  it('keeps technical inputs LTR and left-aligned without leaking RTL styles', () => {
    renderLogin('ar')
    const email = screen.getByLabelText('البريد الإلكتروني')

    expect(document.documentElement.lang).toBe('ar')
    expect(document.documentElement.dir).toBe('rtl')
    expect(getComputedStyle(email).direction).toBe('ltr')
    expect(getComputedStyle(email).textAlign).toBe('left')

    const language = screen.getByRole('combobox')
    fireEvent.change(language, { target: { value: 'fr' } })
    expect(document.documentElement.lang).toBe('fr')
    expect(document.documentElement.dir).toBe('ltr')
    expect(email).toHaveAttribute('dir', 'ltr')
    expect(getComputedStyle(email).direction).not.toBe('rtl')
    expect(getComputedStyle(email).textAlign).not.toBe('right')

    fireEvent.change(language, { target: { value: 'ar' } })
    fireEvent.change(language, { target: { value: 'en' } })
    expect(document.documentElement.lang).toBe('en')
    expect(document.documentElement.dir).toBe('ltr')
    expect(email).toHaveAttribute('dir', 'ltr')
    expect(getComputedStyle(email).direction).not.toBe('rtl')
    expect(getComputedStyle(email).textAlign).not.toBe('right')
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

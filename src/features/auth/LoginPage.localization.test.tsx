import { fireEvent, render, screen } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { LanguageProvider, type Lang } from '@/i18n'
import { LoginPage } from './LoginPage'

const appStyles = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')

const mocks = vi.hoisted(() => ({
  enterDemoAccount: vi.fn(),
  signIn: vi.fn(async () => ({ error: null })),
}))

vi.mock('./AuthProvider', () => ({
  useAuth: () => ({
    signIn: mocks.signIn,
    enterDemoAccount: mocks.enterDemoAccount,
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

function chooseLanguage(name: 'Français' | 'English' | 'العربية') {
  fireEvent.click(screen.getByRole('button', { name: /Langue active|Active language|اللغة النشطة/ }))
  fireEvent.click(screen.getByRole('menuitemradio', { name }))
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
  it('offers all four product presentation accounts', () => {
    renderLogin('fr')
    expect(screen.getByRole('button', { name: /Client Parcours et historique/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Garage indépendant Pilotage quotidien/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Organisation multi-centres Activité des établissements/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Responsable réseau Comparaison et supervision/ }))
    expect(mocks.enterDemoAccount).toHaveBeenCalledWith('network_manager')
  })

  it('renders the complete Arabic login in RTL', () => {
    const { container } = renderLogin('ar')

    expect(document.documentElement.dir).toBe('rtl')
    expect(screen.getByRole('heading', { name: 'تسجيل الدخول' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ورشة مستقلة الإدارة اليومية/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /مسؤول الشبكة المقارنة والإشراف/ })).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/Supabase|Se connecter|Configuration Supabase manquante|Démo garage|Pas encore de compte/)
  })

  it('keeps technical inputs LTR and left-aligned without leaking RTL styles', () => {
    renderLogin('ar')
    const email = screen.getByLabelText('البريد الإلكتروني')

    expect(document.documentElement.lang).toBe('ar')
    expect(document.documentElement.dir).toBe('rtl')
    expect(getComputedStyle(email).direction).toBe('ltr')
    expect(getComputedStyle(email).textAlign).toBe('left')

    chooseLanguage('Français')
    expect(document.documentElement.lang).toBe('fr')
    expect(document.documentElement.dir).toBe('ltr')
    expect(email).toHaveAttribute('dir', 'ltr')
    expect(getComputedStyle(email).direction).not.toBe('rtl')
    expect(getComputedStyle(email).textAlign).not.toBe('right')

    chooseLanguage('العربية')
    chooseLanguage('English')
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
    expect(screen.getByRole('button', { name: /Independent garage Daily operations/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Network manager Comparison and oversight/ })).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/Supabase|Se connecter|Configuration Supabase manquante|Démo garage|Pas encore de compte/)
  })
})

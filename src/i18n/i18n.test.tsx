import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { LanguageProvider } from './index'

function chooseLanguage(name: 'Français' | 'English' | 'العربية') {
  fireEvent.click(screen.getByRole('button', { name: /Langue active|Active language|اللغة النشطة/ }))
  fireEvent.click(screen.getByRole('menuitemradio', { name }))
}

afterEach(() => {
  localStorage.clear()
  document.documentElement.lang = 'fr'
  document.documentElement.dir = 'ltr'
  vi.restoreAllMocks()
})

describe('global language', () => {
  it('uses LTR for French, RTL for Arabic, then restores LTR for French and English', () => {
    localStorage.setItem('gf-lang', 'fr')
    render(<LanguageProvider><LanguageSwitcher /></LanguageProvider>)

    expect(document.documentElement.lang).toBe('fr')
    expect(document.documentElement.dir).toBe('ltr')

    chooseLanguage('العربية')
    expect(document.documentElement.lang).toBe('ar')
    expect(document.documentElement.dir).toBe('rtl')

    chooseLanguage('Français')
    expect(document.documentElement.lang).toBe('fr')
    expect(document.documentElement.dir).toBe('ltr')

    chooseLanguage('العربية')
    chooseLanguage('English')
    expect(document.documentElement.lang).toBe('en')
    expect(document.documentElement.dir).toBe('ltr')
  })

  it('persists the selected language across a provider remount', () => {
    localStorage.setItem('gf-lang', 'fr')
    const first = render(<LanguageProvider><LanguageSwitcher /></LanguageProvider>)

    chooseLanguage('العربية')
    expect(localStorage.getItem('gf-lang')).toBe('ar')
    first.unmount()

    render(<LanguageProvider><LanguageSwitcher /></LanguageProvider>)
    expect(document.documentElement.lang).toBe('ar')
    expect(document.documentElement.dir).toBe('rtl')
    expect(screen.getByRole('button', { name: /اللغة النشطة/ })).toHaveTextContent('AR')
  })

  it('uses a supported browser language only when no preference is stored', () => {
    vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue(['en-GB'])
    vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('en-GB')

    render(<LanguageProvider><LanguageSwitcher /></LanguageProvider>)

    expect(document.documentElement.lang).toBe('en')
    expect(document.documentElement.dir).toBe('ltr')
    expect(localStorage.getItem('gf-lang')).toBe('en')
  })

  it('closes the language menu with Escape and restores focus', () => {
    localStorage.setItem('gf-lang', 'fr')
    render(<LanguageProvider><LanguageSwitcher /></LanguageProvider>)
    const trigger = screen.getByRole('button', { name: /Langue active/ })

    fireEvent.click(trigger)
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('menu')).toBeNull()
    expect(trigger).toHaveFocus()
  })
})

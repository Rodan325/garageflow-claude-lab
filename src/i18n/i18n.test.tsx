import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { LanguageProvider } from './index'

afterEach(() => {
  localStorage.clear()
  document.documentElement.lang = 'fr'
  document.documentElement.dir = 'ltr'
})

describe('document language direction', () => {
  it('uses LTR for French, RTL for Arabic, then restores LTR for French and English', () => {
    render(<LanguageProvider><LanguageSwitcher /></LanguageProvider>)
    const select = screen.getByRole('combobox')

    expect(document.documentElement.lang).toBe('fr')
    expect(document.documentElement.dir).toBe('ltr')

    fireEvent.change(select, { target: { value: 'ar' } })
    expect(document.documentElement.lang).toBe('ar')
    expect(document.documentElement.dir).toBe('rtl')

    fireEvent.change(select, { target: { value: 'fr' } })
    expect(document.documentElement.lang).toBe('fr')
    expect(document.documentElement.dir).toBe('ltr')

    fireEvent.change(select, { target: { value: 'ar' } })
    fireEvent.change(select, { target: { value: 'en' } })
    expect(document.documentElement.lang).toBe('en')
    expect(document.documentElement.dir).toBe('ltr')
  })
})

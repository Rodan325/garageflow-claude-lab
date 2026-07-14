import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { BrandProvider } from '@/branding'
import { LanguageProvider } from '@/i18n'
import { LanguageSwitcher } from './LanguageSwitcher'
import { DemoNotice } from './DemoNotice'

afterEach(() => {
  localStorage.clear()
  document.documentElement.lang = 'fr'
  document.documentElement.dir = 'ltr'
  document.title = ''
})

describe('Speedy demo localization', () => {
  it('keeps the unofficial disclaimer visible and changes its language without a reload', () => {
    localStorage.setItem('gf-brand', 'speedy')
    localStorage.setItem('gf-lang', 'ar')
    render(
      <LanguageProvider>
        <BrandProvider>
          <MemoryRouter>
            <DemoNotice />
            <LanguageSwitcher />
          </MemoryRouter>
        </BrandProvider>
      </LanguageProvider>,
    )

    expect(screen.getByRole('note')).toHaveTextContent('عرض توضيحي مخصص — غير رسمي')
    expect(document.title).toBe('Speedy — عرض تجريبي')
    expect(document.documentElement.dir).toBe('rtl')

    fireEvent.click(screen.getByRole('button', { name: /اللغة النشطة/ }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'English' }))

    expect(screen.getByRole('note')).toHaveTextContent('Custom presentation demo — unofficial')
    expect(document.title).toBe('Speedy — Demo')
    expect(document.documentElement.dir).toBe('ltr')
    expect(localStorage.getItem('gf-brand')).toBe('speedy')
  })
})

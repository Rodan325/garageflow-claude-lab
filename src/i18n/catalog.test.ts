import { afterEach, describe, expect, it, vi } from 'vitest'

import { translate } from './catalog'

const missingSource = 'Chaîne française absente du catalogue'

describe('translate', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns an existing English translation', () => {
    expect(translate('en', 'Accueil')).toBe('Home')
  })

  it('returns an existing Arabic translation', () => {
    expect(translate('ar', 'Accueil')).toBe('الرئيسية')
  })

  it('falls back to the French source when the English translation is missing', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    expect(translate('en', missingSource)).toBe(missingSource)
    expect(warning).toHaveBeenCalledWith('[i18n] Missing translation', {
      lang: 'en',
      source: missingSource,
    })
  })

  it('falls back to the French source when the Arabic translation is missing', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    expect(translate('ar', missingSource)).toBe(missingSource)
    expect(warning).toHaveBeenCalledWith('[i18n] Missing translation', {
      lang: 'ar',
      source: missingSource,
    })
  })

  it('returns the French source in French', () => {
    expect(translate('fr', missingSource)).toBe(missingSource)
  })
})

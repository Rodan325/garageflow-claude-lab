import { describe, it, expect } from 'vitest'
import { legalConfig } from './legal'

/** Termes qui ne doivent JAMAIS apparaître dans une valeur légale publique. */
const FORBIDDEN = [
  'à compléter',
  'todo',
  'lorem',
  'placeholder',
  'xxx',
  'your_',
  'example.com',
  'en cours d’immatriculation',
  "en cours d'immatriculation",
]

function collectStrings(value: unknown, path: string, out: { path: string; value: string }[]) {
  if (typeof value === 'string') out.push({ path, value })
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      collectStrings(v, path ? `${path}.${k}` : k, out)
    }
  }
}

describe('legalConfig — informations réelles RODANBTECH', () => {
  it('contient les identifiants exacts de l’éditeur', () => {
    expect(legalConfig.editorName.trim().length).toBeGreaterThan(0)
    expect(legalConfig.tradingName).toBe('RODANBTECH')
    expect(legalConfig.siren).toBe('103 878 187')
    expect(legalConfig.siret).toBe('103 878 187 00014')
    expect(legalConfig.contactEmail).toBe('anas.rodriguez@rodanbtech.com')
    expect(legalConfig.contactPhone).toBe('+33 7 81 18 93 65')
    expect(legalConfig.editorAddress).toBe('47 RUE VIVIENNE, 75002 PARIS, France')
    expect(legalConfig.lastUpdated.trim().length).toBeGreaterThan(0)
  })

  it('la cohérence interne est respectée (SIRET commence par le SIREN)', () => {
    expect(legalConfig.siret.startsWith(legalConfig.siren)).toBe(true)
    expect(legalConfig.legalBusinessName).toContain(legalConfig.tradingName)
    expect(legalConfig.privacyContactEmail).toBe(legalConfig.contactEmail)
  })

  it('aucune valeur publique ne contient de placeholder', () => {
    const strings: { path: string; value: string }[] = []
    collectStrings(legalConfig, '', strings)
    expect(strings.length).toBeGreaterThan(20) // le config est bien rempli
    for (const { path, value } of strings) {
      const low = value.toLowerCase()
      for (const bad of FORBIDDEN) {
        expect(low.includes(bad), `"${path}" contient le placeholder interdit "${bad}" : ${value}`).toBe(false)
      }
      expect(value.trim().length, `"${path}" est vide`).toBeGreaterThan(0)
    }
  })

  it('le périmètre pilote est verrouillé (pas de paiement, pas de documents sensibles)', () => {
    expect(legalConfig.documentsSensitiveDisabled).toBe(true)
    expect(legalConfig.analyticsEnabled).toBe(false)
    expect(legalConfig.marketingCookiesEnabled).toBe(false)
    expect(legalConfig.commercialOffer.paymentEnabledInApp).toBe(false)
    expect(legalConfig.commercialOffer.onlinePaymentEnabled).toBe(false)
    expect(legalConfig.commercialOffer.sensitiveDocumentsEnabled).toBe(false)
    expect(legalConfig.commercialOffer.pilotDurationDays).toBe(30)
  })
})

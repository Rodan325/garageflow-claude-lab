import { describe, it, expect } from 'vitest'
import { mapAuthError } from './authErrors'

describe('mapAuthError', () => {
  it('maps an already-registered error to a clear, actionable message', () => {
    expect(mapAuthError({ message: 'User already registered' })).toMatch(/compte existe peut-être déjà/i)
    expect(mapAuthError({ message: 'Email address has already been registered' })).toMatch(/compte existe peut-être déjà/i)
  })

  it('maps a network / api-key error to a retry message (never raw technical text)', () => {
    const net = mapAuthError({ message: 'Failed to fetch' })
    expect(net).toMatch(/Connexion au service impossible/i)
    expect(net).not.toMatch(/failed to fetch/i)
    expect(mapAuthError(new TypeError('NetworkError when attempting to fetch resource'))).toMatch(/Connexion au service impossible/i)
    const key = mapAuthError({ message: 'Invalid API key' })
    expect(key).toMatch(/Connexion au service impossible/i)
    expect(key).not.toMatch(/api key/i)
  })

  it('maps an unconfirmed-email error to a clear instruction', () => {
    expect(mapAuthError({ message: 'Email not confirmed' })).toMatch(/Vérifiez votre email avant de vous connecter/i)
  })

  it('never exposes unknown raw messages and falls back when empty', () => {
    expect(mapAuthError({ message: 'Something specific went wrong' })).toMatch(/une erreur est survenue/i)
    expect(mapAuthError(null)).toMatch(/une erreur est survenue/i)
    expect(mapAuthError('')).toMatch(/une erreur est survenue/i)
  })

  it('returns localized English and Arabic fallbacks', () => {
    expect(mapAuthError({ message: 'Something specific went wrong' }, 'en')).toMatch(/something went wrong/i)
    expect(mapAuthError({ message: 'Something specific went wrong' }, 'ar')).toMatch(/حدث خطأ/)
  })
})

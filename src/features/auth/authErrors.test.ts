import { describe, it, expect } from 'vitest'
import { mapAuthError } from './authErrors'

describe('mapAuthError', () => {
  it('maps an already-registered error to a clear, actionable message', () => {
    expect(mapAuthError({ message: 'User already registered' })).toMatch(/compte existe peut-être déjà/i)
    expect(mapAuthError({ message: 'Email address has already been registered' })).toMatch(/compte existe peut-être déjà/i)
  })

  it('maps a network error to a retry message (never raw "Failed to fetch")', () => {
    const msg = mapAuthError({ message: 'Failed to fetch' })
    expect(msg).toMatch(/Connexion au service impossible/i)
    expect(msg).not.toMatch(/failed to fetch/i)
    expect(mapAuthError(new TypeError('NetworkError when attempting to fetch resource'))).toMatch(/Connexion au service impossible/i)
  })

  it('passes through unknown messages and falls back when empty', () => {
    expect(mapAuthError({ message: 'Something specific went wrong' })).toBe('Something specific went wrong')
    expect(mapAuthError(null)).toMatch(/une erreur est survenue/i)
    expect(mapAuthError('')).toMatch(/une erreur est survenue/i)
  })
})

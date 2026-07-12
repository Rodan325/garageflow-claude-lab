import { describe, it, expect } from 'vitest'
import { ar } from '@/i18n/ar'
import { en } from '@/i18n/en'
import { createSignupSchema, signupSchema } from './signupSchema'

const valid = {
  fullName: 'Julie Durand',
  email: 'julie@example.fr',
  emailConfirm: 'julie@example.fr',
  phone: '',
  password: 'Trokman472xz!!',
  passwordConfirm: 'Trokman472xz!!',
  website: '',
  consent: true as const,
  legalConsent: true as const,
}

/** Collect the messages for a given field path from a failed parse. */
function errorsFor(field: string, input: unknown): string[] {
  const res = signupSchema.safeParse(input)
  if (res.success) return []
  return res.error.issues.filter((i) => i.path[0] === field).map((i) => i.message)
}

describe('signupSchema', () => {
  it('accepts a valid, matching submission', () => {
    expect(signupSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects mismatched email confirmation', () => {
    const errs = errorsFor('emailConfirm', { ...valid, emailConfirm: 'autre@example.fr' })
    expect(errs).toContain('Les adresses email ne correspondent pas.')
  })

  it('rejects mismatched password confirmation', () => {
    const errs = errorsFor('passwordConfirm', { ...valid, passwordConfirm: 'Autrechose472xz' })
    expect(errs).toContain('Les mots de passe ne correspondent pas.')
  })

  it('blocks the submission when the honeypot is filled', () => {
    expect(signupSchema.safeParse({ ...valid, website: 'http://spam.example' }).success).toBe(false)
  })

  it('rejects a weak / obvious password', () => {
    expect(signupSchema.safeParse({ ...valid, password: 'password1234', passwordConfirm: 'password1234' }).success).toBe(false)
    expect(signupSchema.safeParse({ ...valid, password: 'short', passwordConfirm: 'short' }).success).toBe(false)
  })

  it('localizes validation messages in English and Arabic', () => {
    const invalid = { ...valid, emailConfirm: 'other@example.com' }
    const english = createSignupSchema(en.validation).safeParse(invalid)
    const arabic = createSignupSchema(ar.validation).safeParse(invalid)

    expect(english.success ? [] : english.error.issues.map((issue) => issue.message)).toContain(en.validation.emailMismatch)
    expect(arabic.success ? [] : arabic.error.issues.map((issue) => issue.message)).toContain(ar.validation.emailMismatch)
  })
})

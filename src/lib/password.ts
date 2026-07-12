/**
 * Password policy for Clikarage sign-up. Encourages long pass-phrases rather
 * than absurd composition rules: ≥ 16 chars is strong on its own; 12–15 chars
 * need a mix of character classes. Real breach protection (leaked-password
 * check) is done by Supabase Auth — see PASSWORD_SECURITY.md.
 */
const CLASSES = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/]
const classCount = (v: string) => CLASSES.reduce((n, r) => n + (r.test(v) ? 1 : 0), 0)

/** Obvious sequences we never accept, even inside a longer string. */
const OBVIOUS = ['password', 'motdepasse', 'azerty', 'qwerty', 'garageflow', 'clikarage', '123456', '12345678', '000000', 'aaaaaa']

export type PasswordIssueCode = 'tooShort' | 'common' | 'containsEmail' | 'composition'

export function passwordIssueCode(pw: string, email?: string): PasswordIssueCode | null {
  const v = pw ?? ''
  if (v.length < 12) return 'tooShort'
  const low = v.toLowerCase()
  if (OBVIOUS.some((bad) => low.includes(bad))) return 'common'
  const local = (email ?? '').split('@')[0]?.trim().toLowerCase()
  if (local && local.length >= 3 && low.includes(local)) return 'containsEmail'
  if (v.length >= 16) return null
  if (classCount(v) < 3) return 'composition'
  return null
}

/**
 * A human-readable reason the password is too weak, or `null` if acceptable.
 * Pass the `email` to also reject a password that contains its local-part.
 */
export function passwordIssue(pw: string, email?: string): string | null {
  const code = passwordIssueCode(pw, email)
  if (!code) return null
  return {
    tooShort: 'Utilisez au moins 12 caractères. Une phrase de passe longue est idéale.',
    common: 'Évitez les mots de passe trop courants (par ex. « password », « azerty », « 123456 »).',
    containsEmail: 'Votre mot de passe ne doit pas contenir votre adresse email.',
    composition: 'Ajoutez majuscules, minuscules, chiffres ou symboles — ou allongez la phrase de passe.',
  }[code]
}

export type PwStrength = 'faible' | 'moyen' | 'fort'

/** Coarse strength label for the sign-up hint. */
export function passwordStrength(pw: string): PwStrength {
  const v = pw ?? ''
  if (!v) return 'faible'
  if (passwordIssueCode(v)) return 'faible'
  if (v.length >= 16 || (v.length >= 14 && classCount(v) >= 3)) return 'fort'
  return 'moyen'
}

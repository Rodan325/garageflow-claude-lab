/** Normalisation helpers for robust client/vehicle matching & dedup. */

/**
 * Phone → comparable form. Strips spaces/dots/dashes/parentheses, then folds
 * French international prefixes to the national 0 form so the same number
 * matches whatever the input style:
 *   +33 6 12 34 56 78  →  0612345678
 *   0033 6 12 34 56 78 →  0612345678
 *   +33 7 …            →  07 …
 * Non-French international numbers are left untouched.
 */
export function normPhone(value?: string | null): string {
  let s = (value ?? '').replace(/[\s.\-()]/g, '')
  if (s.startsWith('+33')) s = '0' + s.slice(3)
  else if (s.startsWith('0033')) s = '0' + s.slice(4)
  return s
}

/** Email → trimmed lowercase. */
export function normEmail(value?: string | null): string {
  return (value ?? '').trim().toLowerCase()
}

/** Registration plate → uppercase, no spaces/dashes (AB-123-CD == ab 123 cd). */
export function normPlate(value?: string | null): string {
  return (value ?? '').toUpperCase().replace(/[\s-]/g, '')
}

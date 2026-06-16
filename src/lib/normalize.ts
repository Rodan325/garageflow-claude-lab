/** Normalisation helpers for robust client/vehicle matching & dedup. */

/** Phone → digits/plus only (strip spaces, dots, dashes, parentheses). */
export function normPhone(value?: string | null): string {
  return (value ?? '').replace(/[\s.\-()]/g, '')
}

/** Email → trimmed lowercase. */
export function normEmail(value?: string | null): string {
  return (value ?? '').trim().toLowerCase()
}

/** Registration plate → uppercase, no spaces/dashes (AB-123-CD == ab 123 cd). */
export function normPlate(value?: string | null): string {
  return (value ?? '').toUpperCase().replace(/[\s-]/g, '')
}

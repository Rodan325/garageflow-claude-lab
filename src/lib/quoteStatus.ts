import type { QuoteStatus } from '@/types/domain'

/** Minimal shape needed to reason about a quote's life-cycle. */
export interface QuoteLifecycle {
  status: string
  valid_until?: string | null
}

const KNOWN: QuoteStatus[] = ['draft', 'sent', 'accepted', 'declined', 'expired']
const isKnown = (s: string): s is QuoteStatus => (KNOWN as string[]).includes(s)

/** Local date as YYYY-MM-DD (ISO date strings compare correctly lexicographically). */
function todayISO(now: Date): string {
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

/**
 * Display status: a SENT quote whose validity date has passed reads as EXPIRED.
 * The stored DB status stays `sent` (expiry is lazy / display-only and enforced
 * on accept) until an optional maintenance pass flips it — see expire_quotes().
 */
export function effectiveQuoteStatus(q: QuoteLifecycle, now: Date = new Date()): QuoteStatus {
  const base = isKnown(q.status) ? q.status : 'draft'
  if (base === 'sent' && q.valid_until && q.valid_until < todayISO(now)) return 'expired'
  return base
}

/** Only a draft is directly editable (server enforces this too). */
export const isQuoteEditable = (status: string) => status === 'draft'

/** A draft with lines can be sent to the client. */
export const canSendQuote = (status: string) => status === 'draft'

/** A sent / declined / expired quote can spawn a fresh draft revision. */
export const canReviseQuote = (effective: QuoteStatus) =>
  effective === 'sent' || effective === 'declined' || effective === 'expired'

/** The client can accept/decline only while the quote is live (sent, not expired). */
export const clientCanRespond = (effective: QuoteStatus) => effective === 'sent'

/** Shareable client consultation link (HashRouter-safe, sub-path aware). */
export function clientQuoteLink(token: string | null | undefined): string | null {
  if (!token || typeof window === 'undefined') return null
  const { origin, pathname } = window.location
  return `${origin}${pathname}#/devis/${token}`
}

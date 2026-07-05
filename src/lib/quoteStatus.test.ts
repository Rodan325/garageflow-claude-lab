import { describe, it, expect } from 'vitest'
import {
  effectiveQuoteStatus,
  isQuoteEditable,
  canSendQuote,
  canReviseQuote,
  clientCanRespond,
  quoteSendBlockReason,
  clientQuoteLink,
} from './quoteStatus'

const NOW = new Date('2026-06-17T10:00:00Z')

describe('effectiveQuoteStatus', () => {
  it('keeps draft/accepted/declined as-is', () => {
    expect(effectiveQuoteStatus({ status: 'draft' }, NOW)).toBe('draft')
    expect(effectiveQuoteStatus({ status: 'accepted' }, NOW)).toBe('accepted')
    expect(effectiveQuoteStatus({ status: 'declined' }, NOW)).toBe('declined')
  })

  it('marks a sent quote past its validity as expired', () => {
    expect(effectiveQuoteStatus({ status: 'sent', valid_until: '2026-06-10' }, NOW)).toBe('expired')
  })

  it('keeps a sent quote within validity as sent', () => {
    expect(effectiveQuoteStatus({ status: 'sent', valid_until: '2026-07-01' }, NOW)).toBe('sent')
    expect(effectiveQuoteStatus({ status: 'sent', valid_until: null }, NOW)).toBe('sent')
  })

  it('never expires an accepted quote even past validity', () => {
    expect(effectiveQuoteStatus({ status: 'accepted', valid_until: '2026-01-01' }, NOW)).toBe('accepted')
  })

  it('falls back to draft for unknown status', () => {
    expect(effectiveQuoteStatus({ status: 'weird' }, NOW)).toBe('draft')
  })
})

describe('lifecycle predicates', () => {
  it('only a draft is editable / sendable', () => {
    expect(isQuoteEditable('draft')).toBe(true)
    expect(isQuoteEditable('sent')).toBe(false)
    expect(canSendQuote('draft')).toBe(true)
    expect(canSendQuote('accepted')).toBe(false)
  })

  it('revision is allowed for any non-draft quote (incl. accepted)', () => {
    expect(canReviseQuote('sent')).toBe(true)
    expect(canReviseQuote('declined')).toBe(true)
    expect(canReviseQuote('expired')).toBe(true)
    expect(canReviseQuote('accepted')).toBe(true)
    expect(canReviseQuote('draft')).toBe(false)
  })

  it('client can respond only while live (sent)', () => {
    expect(clientCanRespond('sent')).toBe(true)
    expect(clientCanRespond('expired')).toBe(false)
    expect(clientCanRespond('accepted')).toBe(false)
  })
})

describe('quoteSendBlockReason', () => {
  it('blocks a missing validity date', () => {
    expect(quoteSendBlockReason(null, NOW)).toMatch(/Renseignez une date de validité/)
    expect(quoteSendBlockReason(undefined, NOW)).toMatch(/Renseignez une date de validité/)
    expect(quoteSendBlockReason('', NOW)).toMatch(/Renseignez une date de validité/)
  })

  it('blocks a past validity date', () => {
    expect(quoteSendBlockReason('2026-06-10', NOW)).toMatch(/aujourd’hui ou une date future/)
  })

  it('allows today or a future validity date', () => {
    expect(quoteSendBlockReason('2026-06-17', NOW)).toBeNull() // today
    expect(quoteSendBlockReason('2026-07-01', NOW)).toBeNull()
  })
})

describe('clientQuoteLink', () => {
  it('builds a HashRouter-safe share link from a token', () => {
    const link = clientQuoteLink('demotoken123')
    expect(link).not.toBeNull()
    expect(link).toContain('#/devis/demotoken123')
    expect(link!.startsWith(window.location.origin)).toBe(true)
  })

  it('returns null without a token', () => {
    expect(clientQuoteLink(null)).toBeNull()
    expect(clientQuoteLink(undefined)).toBeNull()
    expect(clientQuoteLink('')).toBeNull()
  })
})

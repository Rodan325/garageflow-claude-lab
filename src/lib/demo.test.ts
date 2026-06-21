import { describe, it, expect } from 'vitest'
import { ensureStoreShape } from './demo'

describe('ensureStoreShape — demo store migration', () => {
  it('backfills missing array keys + quoteSeq from a legacy store (no quotes)', () => {
    // An old store saved before the quote module existed.
    const legacy = { garages: [{ id: 'g' }], customers: [], requests: [] }
    const s = ensureStoreShape(legacy)
    expect(Array.isArray(s.quotes)).toBe(true)
    expect(Array.isArray(s.quoteLines)).toBe(true)
    expect(Array.isArray(s.messages)).toBe(true)
    expect(Array.isArray(s.appointments)).toBe(true)
    expect(s.quoteSeq).toBe(0)
    expect(typeof s.reqSeq).toBe('number')
    // unshift must be safe now
    expect(() => s.quotes.unshift({ id: 'x' } as never)).not.toThrow()
  })

  it('backfills new lifecycle columns onto legacy quotes', () => {
    const legacy = { quotes: [{ id: 'q1', number: 'DV-2025-0001', status: 'draft', total: 10 }] }
    const s = ensureStoreShape(legacy)
    expect(s.quotes[0].id).toBe('q1')
    expect(s.quotes[0].client_token).toBeNull()
    expect(s.quotes[0].sent_at).toBeNull()
    expect(s.quotes[0].accepted_at).toBeNull()
    expect(s.quotes[0].declined_at).toBeNull()
    expect(s.quotes[0].decline_reason).toBeNull()
    expect(s.quotes[0].revised_from).toBeNull()
  })

  it('preserves existing lifecycle values when present', () => {
    const legacy = { quotes: [{ id: 'q2', status: 'sent', client_token: 'tok', sent_at: '2026-01-01' }] }
    const s = ensureStoreShape(legacy)
    expect(s.quotes[0].client_token).toBe('tok')
    expect(s.quotes[0].sent_at).toBe('2026-01-01')
  })

  it('reseeds when the payload is corrupt / not an object', () => {
    const s = ensureStoreShape('not-json-an-object')
    expect(s.garages.length).toBeGreaterThan(0)
    expect(Array.isArray(s.quotes)).toBe(true)
    // a full reseed carries the seed's demo quotes, so quoteSeq matches their count
    expect(typeof s.quoteSeq).toBe('number')
    expect(s.quoteSeq).toBe(s.quotes.length)
  })
})

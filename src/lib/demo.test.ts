import { describe, it, expect } from 'vitest'
import { ensureStoreShape, isDemoQuoteToken, canResolveDemoPublicQuote, STORE_KEY } from './demo'

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

describe('demo centers — multi-center foundation', () => {
  it('backfills a centers array on a legacy store that predates centers', () => {
    const legacy = { garages: [{ id: 'g' }], requests: [] }
    const s = ensureStoreShape(legacy)
    expect(Array.isArray(s.centers)).toBe(true)
  })

  it('the DEFAULT demo seeds NO centers (plain GarageFlow demo unchanged)', () => {
    const s = ensureStoreShape('force-reseed') // default brand
    expect(s.centers.length).toBe(0)
    expect(s.requests[0].center_id).toBeNull()
    expect(s.requests[0].client_stage).toBeNull()
  })

  it('the SPEEDY demo seeds centers and links the request to a center + client stage', () => {
    const s = ensureStoreShape('force-reseed', 'speedy')
    expect(s.centers.length).toBe(3)
    expect(s.centers.every((c) => c.garage_id && c.slug && c.name)).toBe(true)
    const req = s.requests[0]
    expect(req.center_id).toBeTruthy()
    // the linked center actually exists in the store (referential integrity)
    expect(s.centers.some((c) => c.id === req.center_id)).toBe(true)
    expect(req.client_stage).toBe('request_sent')
  })
})

describe('demo quote token detection', () => {
  it('detects demo tokens by the "demo" prefix', () => {
    expect(isDemoQuoteToken('demoquoteacc123')).toBe(true)
    expect(isDemoQuoteToken('demo' + 'abcdef')).toBe(true)
    expect(isDemoQuoteToken(null)).toBe(false)
    expect(isDemoQuoteToken(undefined)).toBe(false)
    expect(isDemoQuoteToken('')).toBe(false)
    // a real 64-hex Supabase token can never start with "demo" (no 'm'/'o' in hex)
    expect(isDemoQuoteToken('a1b2c3d4e5f6a7b8c9d0')).toBe(false)
  })

  it('resolves a demo token only when a local store exists in this browser', () => {
    localStorage.removeItem(STORE_KEY)
    expect(canResolveDemoPublicQuote('demoquotesent123')).toBe(false)
    localStorage.setItem(STORE_KEY, JSON.stringify({ quotes: [] }))
    expect(canResolveDemoPublicQuote('demoquotesent123')).toBe(true)
    // real tokens never resolve locally, even with a store present
    expect(canResolveDemoPublicQuote('a1b2c3d4e5f6a7b8c9d0')).toBe(false)
    localStorage.removeItem(STORE_KEY)
  })
})

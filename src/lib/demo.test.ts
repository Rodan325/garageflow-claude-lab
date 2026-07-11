import { afterEach, describe, it, expect } from 'vitest'
import {
  canResolveDemoPublicQuote,
  demo,
  ensureStoreShape,
  isDemoQuoteToken,
  reloadDemoCache,
  SPEEDY_STORE_KEY,
  STORE_KEY,
  type DemoBrand,
} from './demo'

afterEach(() => {
  localStorage.clear()
  reloadDemoCache()
})

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
  function saveQuoteStore(brand: DemoBrand, key: string, token: string) {
    const store = ensureStoreShape('force-reseed', brand)
    store.quotes.forEach((quote) => { quote.client_token = null })
    store.quotes[0].client_token = token
    localStorage.setItem(key, JSON.stringify(store))
  }

  it('detects demo tokens by the "demo" prefix', () => {
    expect(isDemoQuoteToken('demoquoteacc123')).toBe(true)
    expect(isDemoQuoteToken('demo' + 'abcdef')).toBe(true)
    expect(isDemoQuoteToken(null)).toBe(false)
    expect(isDemoQuoteToken(undefined)).toBe(false)
    expect(isDemoQuoteToken('')).toBe(false)
    // a real 64-hex Supabase token can never start with "demo" (no 'm'/'o' in hex)
    expect(isDemoQuoteToken('a1b2c3d4e5f6a7b8c9d0')).toBe(false)
  })

  it('finds a GarageFlow quote in the default store', () => {
    const token = 'demogarageflowquote123'
    saveQuoteStore('default', STORE_KEY, token)

    expect(canResolveDemoPublicQuote(token)).toBe(true)
    expect(demo.getPublicQuote(token)?.garage.name).toBe('Garage Central Lyon')
  })

  it('finds a Speedy quote without any active branding in the new tab', () => {
    const token = 'demospeedyquote123'
    saveQuoteStore('speedy', SPEEDY_STORE_KEY, token)
    localStorage.removeItem('gf-brand')

    expect(canResolveDemoPublicQuote(token)).toBe(true)
    expect(demo.getPublicQuote(token)?.garage.name).toBe('Speedy Lyon')
  })

  it('does not resolve a token absent from both stores', () => {
    saveQuoteStore('default', STORE_KEY, 'demodefaultonly')
    saveQuoteStore('speedy', SPEEDY_STORE_KEY, 'demospeedyonly')

    expect(canResolveDemoPublicQuote('demomissing')).toBe(false)
    expect(demo.getPublicQuote('demomissing')).toBeNull()
  })

  it('keeps quote resolution isolated between the two stores', () => {
    const defaultToken = 'demodefaultisolated'
    const speedyToken = 'demospeedyisolated'
    saveQuoteStore('default', STORE_KEY, defaultToken)
    saveQuoteStore('speedy', SPEEDY_STORE_KEY, speedyToken)
    const defaultBefore = localStorage.getItem(STORE_KEY)
    const speedyBefore = localStorage.getItem(SPEEDY_STORE_KEY)

    expect(demo.getPublicQuote(defaultToken)?.garage.name).toBe('Garage Central Lyon')
    expect(demo.getPublicQuote(speedyToken)?.garage.name).toBe('Speedy Lyon')
    expect(localStorage.getItem(STORE_KEY)).toBe(defaultBefore)
    expect(localStorage.getItem(SPEEDY_STORE_KEY)).toBe(speedyBefore)
    expect(canResolveDemoPublicQuote('a1b2c3d4e5f6a7b8c9d0')).toBe(false)
  })

  it('keeps seeded tokens compatible and unique across brands', () => {
    const defaultTokens = ensureStoreShape('force-reseed', 'default').quotes
      .map((quote) => quote.client_token)
      .filter((token): token is string => token !== null)
    const speedyTokens = ensureStoreShape('force-reseed', 'speedy').quotes
      .map((quote) => quote.client_token)
      .filter((token): token is string => token !== null)

    expect(defaultTokens).toContain('demoquoteacca1b2c3d4e5f6a7b8')
    expect(speedyTokens.every((token) => token.startsWith('demo'))).toBe(true)
    expect(defaultTokens.filter((token) => speedyTokens.includes(token))).toHaveLength(0)
  })
})

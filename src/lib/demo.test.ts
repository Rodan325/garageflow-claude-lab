import { afterEach, describe, it, expect } from 'vitest'
import {
  canResolveDemoPublicQuote,
  demoPublicQuoteBrand,
  demo,
  ensureStoreShape,
  isDemoQuoteToken,
  reloadDemoCache,
  getDemoAccount,
  getDemoKind,
  getDemoOrganizationKind,
  demoMembership,
  demoProfile,
  setDemoAccount,
  setDemoOrganizationKind,
  SPEEDY_STORE_KEY,
  STORE_KEY,
  type DemoBrand,
} from './demo'

afterEach(() => {
  localStorage.clear()
  sessionStorage.clear()
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

  it('keeps generic center data hidden from an independent default account', () => {
    const s = ensureStoreShape('force-reseed') // default brand
    expect(s.centers.length).toBe(3)
    expect(s.requests[0].center_id).toBeTruthy()
    expect(s.requests[0].client_stage).toBe('in_progress')
  })

  it('does not activate multi-center business logic from Speedy branding', () => {
    const s = ensureStoreShape('force-reseed', 'speedy')
    expect(s.centers.length).toBe(3)
    expect(s.centers.every((c) => c.garage_id && c.slug && c.name)).toBe(true)
    expect(s.requests[0].center_id).toBeTruthy()
    expect(s.requests[0].client_stage).toBe('in_progress')
  })

  it('links requests to an establishment for a generic network account', () => {
    setDemoOrganizationKind('network')
    const s = ensureStoreShape('force-reseed')
    expect(s.requests[0].center_id).toBeTruthy()
    expect(s.centers.some((center) => center.id === s.requests[0].center_id)).toBe(true)
    expect(s.requests[0].client_stage).toBe('in_progress')
  })
})

describe('demo workshop timeline', () => {
  it('persists a valid transition and appends a history event', () => {
    const store = ensureStoreShape('force-reseed', 'default')
    localStorage.setItem(STORE_KEY, JSON.stringify(store))
    reloadDemoCache()
    const request = demo.garageRequests()[0]
    const before = demo.workshopTimeline(request.id)

    const event = demo.transitionWorkshopStage({
      requestId: request.id,
      newStage: 'customer_approval_required',
      customerMessage: 'Votre accord est requis.',
    })

    expect(event.previous_stage).toBe('diagnosis_in_progress')
    expect(event.new_stage).toBe('customer_approval_required')
    expect(event.notification_status).toBe('simulated')
    expect(demo.workshopTimeline(request.id)).toHaveLength(before.length + 1)
    expect(demo.garageRequests()[0].workshop_stage).toBe('customer_approval_required')
  })

  it('rejects an invalid transition without changing request or timeline', () => {
    const store = ensureStoreShape('force-reseed', 'default')
    localStorage.setItem(STORE_KEY, JSON.stringify(store))
    reloadDemoCache()
    const request = demo.garageRequests()[0]
    const before = demo.workshopTimeline(request.id)

    expect(() => demo.transitionWorkshopStage({ requestId: request.id, newStage: 'vehicle_ready' })).toThrow()
    expect(demo.garageRequests()[0].workshop_stage).toBe('diagnosis_in_progress')
    expect(demo.workshopTimeline(request.id)).toEqual(before)
  })
})

describe('realistic demo accounts and scenarios', () => {
  it('exposes client, independent, multi-center and network-manager identities', () => {
    setDemoAccount('client')
    expect([getDemoAccount(), getDemoKind(), getDemoOrganizationKind()]).toEqual(['client', 'client', 'independent'])
    expect(demoMembership()).toBeNull()

    setDemoAccount('independent_garage')
    expect([getDemoAccount(), getDemoKind(), getDemoOrganizationKind()]).toEqual(['independent_garage', 'garage', 'independent'])
    expect(demoProfile('garage').full_name).toBe('Sophie Martin')

    setDemoAccount('network_garage')
    expect(getDemoOrganizationKind()).toBe('network')
    expect(demoMembership()?.organization_role).toBe('organization_owner')

    setDemoAccount('network_manager')
    expect(demoProfile('garage').full_name).toBe('Amina El Mansouri')
    expect(demoMembership()?.organization_role).toBe('regional_manager')
  })

  it('covers the full presentation journey with linked product records', () => {
    setDemoAccount('network_manager')
    const requests = demo.garageRequests()
    for (const stage of [
      'appointment_confirmed', 'vehicle_received', 'diagnosis_in_progress', 'customer_approval_required',
      'work_in_progress', 'quality_control', 'vehicle_ready', 'vehicle_delivered',
    ]) expect(requests.some((request) => request.workshop_stage === stage)).toBe(true)
    expect(requests.every((request) => !!request.center_id)).toBe(true)

    const accepted = requests.find((request) => demo.recommendations(request.id).some((item) => item.status === 'accepted'))
    expect(accepted).toBeDefined()
    expect(demo.attachments(accepted!.id, true).some((item) => item.document_type === 'photo')).toBe(true)
    const delivered = requests.find((request) => request.workshop_stage === 'vehicle_delivered')!
    expect(demo.deliveryReport(delivered.id, true)?.status).toBe('finalized')
    expect(demo.maintenanceReminders(delivered.garage_id).some((reminder) => reminder.service_request_id === delivered.id)).toBe(true)
    expect(demo.appointments().length).toBeGreaterThan(0)
  })
})

describe('demo diagnostic recommendations', () => {
  function loadFreshDemo() {
    const store = ensureStoreShape('force-reseed', 'default')
    localStorage.setItem(STORE_KEY, JSON.stringify(store))
    reloadDemoCache()
    return demo.garageRequests()[0]
  }

  it('records an accepted customer decision with legal versions and language', () => {
    const request = loadFreshDemo()
    const recommendation = demo.recommendations(request.id, true)[0]

    const decided = demo.decideRecommendation({
      recommendationId: recommendation.id,
      action: 'accepted',
      language: 'en',
    })

    expect(decided.status).toBe('accepted')
    expect(decided.decided_at).toBeTruthy()
    const event = demo.recommendationDecisions(recommendation.id, true).at(-1)
    expect(event?.action).toBe('accepted')
    expect(event?.displayed_language).toBe('en')
    expect(event?.legal_terms_version).toBeTruthy()
    expect(event?.legal_privacy_version).toBeTruthy()
  })

  it('keeps a proposed recommendation open when the customer asks a question', () => {
    const request = loadFreshDemo()
    const recommendation = demo.recommendations(request.id, true)[0]

    const decided = demo.decideRecommendation({
      recommendationId: recommendation.id,
      action: 'question',
      note: 'Pouvez-vous me rappeler avec le détail ?',
      language: 'fr',
    })

    expect(decided.status).toBe('proposed')
    expect(decided.decided_at).toBeNull()
    expect(demo.recommendationDecisions(recommendation.id, true).at(-1)?.action).toBe('question')
  })

  it('links a supplemental quote to its recommendation without changing existing quotes', () => {
    const request = loadFreshDemo()
    const recommendation = demo.recommendations(request.id)[0]
    const existingIds = demo.quotes().map((quote) => quote.id)
    const quote = demo.createQuote({
      garage_id: request.garage_id,
      title: recommendation.title,
      service_request_id: request.id,
    }, [{ label: recommendation.title, quantity: 1, unit_price: 289, tax_rate: 20 }])

    const linked = demo.linkRecommendationQuote(recommendation.id, quote.id)

    expect(linked.recommendation_id).toBe(recommendation.id)
    expect(linked.supplemental_to_quote_id).toBeNull()
    expect(demo.quotes().filter((item) => existingIds.includes(item.id)).every((item) => item.recommendation_id === null)).toBe(true)
  })
})

describe('demo attachments and notifications', () => {
  function loadFreshDemo() {
    const store = ensureStoreShape('force-reseed', 'default')
    localStorage.setItem(STORE_KEY, JSON.stringify(store))
    reloadDemoCache()
    return demo.garageRequests()[0]
  }

  it('keeps internal files hidden from the customer while exposing shared files', () => {
    const request = loadFreshDemo()
    demo.addAttachment({
      requestId: request.id,
      fileName: 'controle-interne.pdf',
      mimeType: 'application/pdf',
      fileSize: 1200,
      visibility: 'internal',
      documentType: 'diagnostic',
    })

    expect(demo.attachments(request.id).map((item) => item.file_name)).toContain('controle-interne.pdf')
    expect(demo.attachments(request.id, true).map((item) => item.file_name)).not.toContain('controle-interne.pdf')
    expect(demo.attachments(request.id, true).some((item) => item.visibility === 'both')).toBe(true)
  })

  it('queues a simulated notification without an external provider call', () => {
    const request = loadFreshDemo()
    const before = demo.notificationOutbox(request.garage_id).length

    demo.transitionWorkshopStage({
      requestId: request.id,
      newStage: 'customer_approval_required',
      customerMessage: 'Votre accord est requis.',
    })

    const outbox = demo.notificationOutbox(request.garage_id)
    expect(outbox).toHaveLength(before + 1)
    expect(outbox[0]).toMatchObject({
      template_key: 'approval_required', status: 'simulated', provider: 'demo-simulator', attempts: 1,
    })
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

  it('finds a Clikarage quote in the default store', () => {
    const token = 'demogarageflowquote123'
    saveQuoteStore('default', STORE_KEY, token)

    expect(canResolveDemoPublicQuote(token)).toBe(true)
    expect(demoPublicQuoteBrand(token)).toBe('default')
    expect(demo.getPublicQuote(token)?.garage.name).toBe('Garage Central Lyon')
  })

  it('finds a Speedy quote without any active branding in the new tab', () => {
    const token = 'demospeedyquote123'
    saveQuoteStore('speedy', SPEEDY_STORE_KEY, token)
    localStorage.removeItem('gf-brand')

    expect(canResolveDemoPublicQuote(token)).toBe(true)
    expect(demoPublicQuoteBrand(token)).toBe('speedy')
    expect(demo.getPublicQuote(token)?.garage.name).toBe('Speedy Lyon')
  })

  it('does not resolve a token absent from both stores', () => {
    saveQuoteStore('default', STORE_KEY, 'demodefaultonly')
    saveQuoteStore('speedy', SPEEDY_STORE_KEY, 'demospeedyonly')

    expect(canResolveDemoPublicQuote('demomissing')).toBe(false)
    expect(demoPublicQuoteBrand('demomissing')).toBeNull()
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

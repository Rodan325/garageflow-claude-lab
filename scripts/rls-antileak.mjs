/**
 * Local-only Supabase RLS, RPC, Storage, and concurrency validation.
 *
 * This script intentionally refuses every non-loopback URL before creating a
 * client. It uses only the publishable key and password authentication, just
 * like the browser. Run it after a fresh local `supabase db reset`.
 */
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const publishableKey = process.env.VITE_SUPABASE_ANON_KEY
const expectedPort = '54321'

function assertLocalTarget(rawUrl) {
  if (!rawUrl) throw new Error('VITE_SUPABASE_URL is required in .env.local')
  const target = new URL(rawUrl)
  const localHost = target.hostname === '127.0.0.1' || target.hostname === 'localhost'
  if (target.protocol !== 'http:' || !localHost || target.port !== expectedPort) {
    throw new Error(`Refusing non-local Supabase target: ${target.origin}`)
  }
  return target
}

let target
try {
  target = assertLocalTarget(url)
} catch (error) {
  console.error(`LOCAL SAFETY GUARD: ${error.message}`)
  process.exit(2)
}

if (!publishableKey) {
  console.error('VITE_SUPABASE_ANON_KEY is required in .env.local')
  process.exit(2)
}

const IDS = {
  garageA: '11111111-1111-4111-8111-111111111111',
  centerA: '11111111-1111-4111-8111-11111111c001',
  garageB: '22222222-2222-4222-8222-222222222222',
  centerB1: '22222222-2222-4222-8222-22222222c001',
  centerB2: '22222222-2222-4222-8222-22222222c002',
  centerB3: '22222222-2222-4222-8222-22222222c003',
  clientA1: 'c0000000-0000-4000-8000-000000000001',
  clientA2: 'c0000000-0000-4000-8000-000000000002',
  clientB1: 'c2000000-0000-4000-8000-000000000001',
  clientB2: 'c2000000-0000-4000-8000-000000000002',
  requestBApproval: 'f2222222-0000-4000-8000-000000000001',
  requestBClosed: 'f2222222-0000-4000-8000-000000000007',
}

const PASSWORD = 'LocalDemo1234!'
const ACCOUNTS = {
  ownerA: ['owner@demo-garage.fr', 'Demo1234!'],
  frontDeskA: ['frontdesk.independent@example.test', PASSWORD],
  clientA1: ['client@demo.fr', 'Demo1234!'],
  clientA2: ['client.independent.two@example.test', PASSWORD],
  ownerB: ['owner.network@example.test', PASSWORD],
  networkManager: ['manager.network@example.test', PASSWORD],
  centerNorth: ['manager.north@example.test', PASSWORD],
  centerCenter: ['manager.center@example.test', PASSWORD],
  technicianB: ['technician.network@example.test', PASSWORD],
  clientB1: ['client.network.one@example.test', PASSWORD],
  clientB2: ['client.network.two@example.test', PASSWORD],
}

let passed = 0
let failed = 0
const cleanup = { requests: [], storagePaths: [], quotes: [] }

function detail(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (value.message) return value.message
  return JSON.stringify(value)
}

function check(name, condition, extra = '') {
  if (condition) {
    passed += 1
    console.log(`  [PASS] ${name}`)
  } else {
    failed += 1
    console.error(`  [FAIL] ${name}${extra ? ` - ${detail(extra)}` : ''}`)
  }
  return condition
}

function countSuccess(results) {
  return results.filter((result) => !result.error).length
}

function client() {
  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

async function signedIn(accountName) {
  const [email, password] = ACCOUNTS[accountName]
  const supabase = client()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Local sign-in failed for ${accountName}: ${error.message}`)
  return supabase
}

async function createRequest(supabase, { garageId, centerId, clientId, label }) {
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('service_requests')
    .insert({
      garage_id: garageId,
      center_id: centerId,
      client_id: clientId,
      service_name: `Local validation ${label}`,
      vehicle_label: `Fictitious vehicle ${label}`,
      requested_date: tomorrow,
      requested_time: '09:00',
      contact_name: `Fixture ${label}`,
      contact_email: `${label.toLowerCase()}-${randomUUID()}@example.test`,
      status: 'pending',
    })
    .select()
    .single()
  if (error) throw new Error(`Unable to create local request ${label}: ${error.message}`)
  cleanup.requests.push({ id: data.id, garageId })
  return data
}

async function createRecommendation(staff, requestId, title = 'Local validation recommendation') {
  const { data, error } = await staff.rpc('create_workshop_recommendation', {
    p_request_id: requestId,
    p_title: title,
    p_description: 'Fictitious local-only recommendation.',
    p_category: 'validation',
    p_urgency: 'recommended',
    p_reason: 'Local automated security validation.',
    p_estimated_price: 42,
    p_estimated_duration_minutes: 30,
    p_affects_delivery_time: false,
    p_proposed_delivery_at: null,
  })
  if (error) throw new Error(`Unable to create local recommendation: ${error.message}`)
  return data
}

async function proposeRecommendation(staff, recommendationId) {
  const result = await staff.rpc('set_workshop_recommendation_status', {
    p_recommendation_id: recommendationId,
    p_new_status: 'proposed',
    p_note: 'Local automated proposal.',
  })
  if (result.error) throw new Error(`Unable to propose recommendation: ${result.error.message}`)
  return result.data
}

async function run() {
  console.log(`\nClikarage local security validation: ${target.origin}`)
  console.log('Safety: loopback URL, public key, fictitious accounts only.\n')

  const health = await fetch(`${target.origin}/auth/v1/health`, {
    headers: { apikey: publishableKey },
  })
  check('Local Auth health endpoint is reachable', health.ok, `${health.status}`)

  const [
    ownerA,
    frontDeskA,
    clientA1,
    clientA2,
    ownerB,
    networkManager,
    centerNorth,
    centerCenter,
    technicianB,
    clientB1,
    clientB2,
  ] = await Promise.all([
    signedIn('ownerA'),
    signedIn('frontDeskA'),
    signedIn('clientA1'),
    signedIn('clientA2'),
    signedIn('ownerB'),
    signedIn('networkManager'),
    signedIn('centerNorth'),
    signedIn('centerCenter'),
    signedIn('technicianB'),
    signedIn('clientB1'),
    signedIn('clientB2'),
  ])
  const anonymous = client()

  console.log('RLS isolation')
  const ownA = await clientA1.from('service_requests').select('id,client_id,garage_id')
  check('Client A reads only their own requests', !ownA.error && ownA.data.length > 0 && ownA.data.every((row) => row.client_id === IDS.clientA1), ownA.error)
  const crossClientA = await clientA1.from('service_requests').select('id').eq('client_id', IDS.clientA2)
  check('Client A cannot read client A2 requests', !crossClientA.error && crossClientA.data.length === 0, crossClientA.error)
  const ownB = await clientB1.from('service_requests').select('id,client_id,garage_id')
  check('Network client reads only their own requests', !ownB.error && ownB.data.length > 0 && ownB.data.every((row) => row.client_id === IDS.clientB1), ownB.error)
  const crossClientB = await clientB1.from('service_requests').select('id').eq('client_id', IDS.clientB2)
  check('Network client cannot read another client dossier', !crossClientB.error && crossClientB.data.length === 0, crossClientB.error)
  const ownerARequests = await ownerA.from('service_requests').select('garage_id')
  check('Independent garage cannot read network requests', !ownerARequests.error && ownerARequests.data.every((row) => row.garage_id === IDS.garageA), ownerARequests.error)
  const ownerBRequests = await ownerB.from('service_requests').select('garage_id')
  check('Network garage cannot read independent requests', !ownerBRequests.error && ownerBRequests.data.every((row) => row.garage_id === IDS.garageB), ownerBRequests.error)
  const anonPrivate = await anonymous.from('service_requests').select('id')
  check('Anonymous user cannot read service requests', Boolean(anonPrivate.error) || anonPrivate.data.length === 0, anonPrivate.error)

  console.log('\nNetwork authorization')
  const independentNetwork = await ownerA.rpc('can_view_network_dashboard', { p_garage_id: IDS.garageA })
  check('Independent organization does not expose network dashboard', !independentNetwork.error && independentNetwork.data === false, independentNetwork.error ?? independentNetwork.data)
  const ownerNetwork = await ownerB.rpc('get_network_dashboard', { p_garage_id: IDS.garageB, p_start: null, p_end: null })
  check('Network owner sees all three centers', !ownerNetwork.error && ownerNetwork.data.length === 3, ownerNetwork.error)
  const managerNetwork = await networkManager.rpc('can_view_network_dashboard', { p_garage_id: IDS.garageB })
  check('Network manager can view network dashboard', !managerNetwork.error && managerNetwork.data === true, managerNetwork.error)
  const centerNetwork = await centerNorth.rpc('can_view_network_dashboard', { p_garage_id: IDS.garageB })
  check('Center manager cannot use organization dashboard', !centerNetwork.error && centerNetwork.data === false, centerNetwork.error ?? centerNetwork.data)
  const technicianNetwork = await technicianB.rpc('get_network_dashboard', { p_garage_id: IDS.garageB, p_start: null, p_end: null })
  check('Technician cannot use network management RPC', Boolean(technicianNetwork.error), technicianNetwork.data)

  console.log('\nWorkshop timeline and transitions')
  const timelineRequest = await createRequest(clientB1, {
    garageId: IDS.garageB,
    centerId: IDS.centerB1,
    clientId: IDS.clientB1,
    label: 'TIMELINE',
  })
  const directTimelineInsert = await ownerB.from('service_request_timeline').insert({
    request_id: timelineRequest.id,
    garage_id: IDS.garageB,
    center_id: IDS.centerB1,
    new_stage: 'appointment_confirmed',
  })
  check('Direct timeline insertion is denied', Boolean(directTimelineInsert.error))

  const concurrentTransitions = await Promise.all([
    ownerB.rpc('transition_workshop_stage', {
      p_request_id: timelineRequest.id,
      p_new_stage: 'appointment_confirmed',
      p_internal_note: 'Internal local note.',
      p_customer_message: 'Visible local message.',
      p_estimated_completion_at: null,
      p_visible_to_customer: true,
    }),
    networkManager.rpc('transition_workshop_stage', {
      p_request_id: timelineRequest.id,
      p_new_stage: 'appointment_confirmed',
      p_internal_note: 'Concurrent local note.',
      p_customer_message: 'Concurrent local message.',
      p_estimated_completion_at: null,
      p_visible_to_customer: true,
    }),
  ])
  check('Two simultaneous identical transitions produce one success', countSuccess(concurrentTransitions) === 1, concurrentTransitions.map((result) => result.error?.message))

  const skipTransition = await ownerB.rpc('transition_workshop_stage', {
    p_request_id: timelineRequest.id,
    p_new_stage: 'work_in_progress',
    p_internal_note: null,
    p_customer_message: null,
    p_estimated_completion_at: null,
    p_visible_to_customer: true,
  })
  check('Invalid workshop stage skip is rejected', Boolean(skipTransition.error))
  const closedTransition = await ownerB.rpc('transition_workshop_stage', {
    p_request_id: IDS.requestBClosed,
    p_new_stage: 'vehicle_ready',
    p_internal_note: null,
    p_customer_message: null,
    p_estimated_completion_at: null,
    p_visible_to_customer: true,
  })
  check('Closed stage is terminal', Boolean(closedTransition.error))

  const staffTimeline = await ownerB.rpc('get_workshop_timeline', { p_request_id: timelineRequest.id })
  const customerTimeline = await clientB1.rpc('get_workshop_timeline', { p_request_id: timelineRequest.id })
  check('Staff timeline includes internal notes', !staffTimeline.error && staffTimeline.data.some((row) => row.internal_note), staffTimeline.error)
  check('Customer timeline redacts internal notes', !customerTimeline.error && customerTimeline.data.length > 0 && customerTimeline.data.every((row) => row.internal_note === null), customerTimeline.error)
  const foreignTimeline = await clientB2.rpc('get_workshop_timeline', { p_request_id: timelineRequest.id })
  check('Another client cannot read the timeline', Boolean(foreignTimeline.error), foreignTimeline.data)
  const anonTimeline = await anonymous.rpc('get_workshop_timeline', { p_request_id: timelineRequest.id })
  check('Anonymous timeline access is denied', Boolean(anonTimeline.error), anonTimeline.data)
  const timelineId = staffTimeline.data?.[0]?.id
  if (timelineId) {
    const directUpdate = await ownerB.from('service_request_timeline').update({ customer_message: 'tampered' }).eq('id', timelineId)
    const directDelete = await ownerB.from('service_request_timeline').delete().eq('id', timelineId)
    check('Direct timeline update is denied', Boolean(directUpdate.error))
    check('Direct timeline deletion is denied', Boolean(directDelete.error))
  }

  const centerScopedRequest = await createRequest(clientB1, {
    garageId: IDS.garageB,
    centerId: IDS.centerB2,
    clientId: IDS.clientB1,
    label: 'CENTER-SCOPE',
  })
  const crossCenterTransition = await centerNorth.rpc('transition_workshop_stage', {
    p_request_id: centerScopedRequest.id,
    p_new_stage: 'appointment_confirmed',
    p_internal_note: null,
    p_customer_message: null,
    p_estimated_completion_at: null,
    p_visible_to_customer: true,
  })
  check('Center manager cannot administer another center workflow', Boolean(crossCenterTransition.error), crossCenterTransition.data)

  console.log('\nRecommendations and customer decisions')
  const recommendationRequest = await createRequest(clientB1, {
    garageId: IDS.garageB,
    centerId: IDS.centerB1,
    clientId: IDS.clientB1,
    label: 'RECOMMENDATION',
  })
  const recommendation = await createRecommendation(ownerB, recommendationRequest.id)
  await proposeRecommendation(ownerB, recommendation.id)
  const ownRecommendation = await clientB1.from('workshop_recommendations').select('id,status').eq('id', recommendation.id)
  check('Customer can read a proposed recommendation for their dossier', !ownRecommendation.error && ownRecommendation.data.length === 1, ownRecommendation.error)
  const otherRecommendation = await clientB2.from('workshop_recommendations').select('id').eq('id', recommendation.id)
  check('Other customer cannot read the recommendation', !otherRecommendation.error && otherRecommendation.data.length === 0, otherRecommendation.error)
  const directRecommendationUpdate = await clientB1.from('workshop_recommendations').update({ status: 'accepted' }).eq('id', recommendation.id)
  check('Customer cannot update recommendation rows directly', Boolean(directRecommendationUpdate.error))
  const foreignDecision = await clientB2.rpc('decide_workshop_recommendation', {
    p_recommendation_id: recommendation.id,
    p_action: 'accepted',
    p_note: null,
    p_terms_version: 'local-test',
    p_privacy_version: 'local-test',
    p_displayed_language: 'en',
  })
  check('Another customer cannot decide the recommendation', Boolean(foreignDecision.error), foreignDecision.data)
  const anonymousDecision = await anonymous.rpc('decide_workshop_recommendation', {
    p_recommendation_id: recommendation.id,
    p_action: 'accepted',
    p_note: null,
    p_terms_version: 'local-test',
    p_privacy_version: 'local-test',
    p_displayed_language: 'en',
  })
  check('Anonymous recommendation decision is denied', Boolean(anonymousDecision.error), anonymousDecision.data)
  const simultaneousDecisions = await Promise.all([
    clientB1.rpc('decide_workshop_recommendation', {
      p_recommendation_id: recommendation.id,
      p_action: 'accepted',
      p_note: 'Accepted locally.',
      p_terms_version: 'local-test',
      p_privacy_version: 'local-test',
      p_displayed_language: 'en',
    }),
    clientB1.rpc('decide_workshop_recommendation', {
      p_recommendation_id: recommendation.id,
      p_action: 'declined',
      p_note: 'Declined concurrently.',
      p_terms_version: 'local-test',
      p_privacy_version: 'local-test',
      p_displayed_language: 'en',
    }),
  ])
  check('Two simultaneous customer decisions produce one success', countSuccess(simultaneousDecisions) === 1, simultaneousDecisions.map((result) => result.error?.message))
  const decisionRows = await ownerB.from('recommendation_decisions').select('action').eq('recommendation_id', recommendation.id).in('action', ['accepted', 'declined'])
  check('Exactly one terminal customer decision is journaled', !decisionRows.error && decisionRows.data.length === 1, decisionRows.error)

  const raceRecommendation = await createRecommendation(ownerB, recommendationRequest.id, 'Decision revision race')
  await proposeRecommendation(ownerB, raceRecommendation.id)
  const recommendationRace = await Promise.all([
    ownerB.rpc('set_workshop_recommendation_status', {
      p_recommendation_id: raceRecommendation.id,
      p_new_status: 'cancelled',
      p_note: 'Concurrent staff cancellation.',
    }),
    clientB1.rpc('decide_workshop_recommendation', {
      p_recommendation_id: raceRecommendation.id,
      p_action: 'accepted',
      p_note: 'Concurrent customer acceptance.',
      p_terms_version: 'local-test',
      p_privacy_version: 'local-test',
      p_displayed_language: 'en',
    }),
  ])
  check('Recommendation revision racing a decision produces one terminal result', countSuccess(recommendationRace) === 1, recommendationRace.map((result) => result.error?.message))

  const quotePayload = (garageId, requestId, title) => ({
    garage_id: garageId,
    service_request_id: requestId,
    title,
    client_name: 'Fictitious local client',
    subtotal: 1,
    tax_total: 1,
    total: 1,
  })
  const quoteLines = [{ label: 'Local line', quantity: 1, unit_price: 42, tax_rate: 20 }]
  const parentQuote = await ownerB.rpc('create_quote_with_lines', {
    p_quote: quotePayload(IDS.garageB, recommendationRequest.id, 'Local parent quote'),
    p_lines: quoteLines,
  })
  const supplementalQuote = await ownerB.rpc('create_quote_with_lines', {
    p_quote: quotePayload(IDS.garageB, recommendationRequest.id, 'Local supplemental quote'),
    p_lines: quoteLines,
  })
  check('Parent and supplemental quotes can be created for the dossier', !parentQuote.error && !supplementalQuote.error, parentQuote.error ?? supplementalQuote.error)
  if (!parentQuote.error && !supplementalQuote.error) {
    cleanup.quotes.push({ id: parentQuote.data.id, client: ownerB }, { id: supplementalQuote.data.id, client: ownerB })
    const linkedQuote = await ownerB.rpc('link_recommendation_quote', {
      p_recommendation_id: recommendation.id,
      p_quote_id: supplementalQuote.data.id,
      p_supplemental_to_quote_id: parentQuote.data.id,
    })
    check(
      'Supplemental quote is linked to the correct recommendation and parent',
      !linkedQuote.error
        && linkedQuote.data?.recommendation_id === recommendation.id
        && linkedQuote.data?.supplemental_to_quote_id === parentQuote.data.id,
      linkedQuote.error,
    )
  }

  const garageARequestForQuote = await createRequest(clientA2, {
    garageId: IDS.garageA,
    centerId: IDS.centerA,
    clientId: IDS.clientA2,
    label: 'CROSS-TENANT-QUOTE',
  })
  const garageAQuote = await ownerA.rpc('create_quote_with_lines', {
    p_quote: quotePayload(IDS.garageA, garageARequestForQuote.id, 'Other tenant quote'),
    p_lines: quoteLines,
  })
  if (!garageAQuote.error) {
    cleanup.quotes.push({ id: garageAQuote.data.id, client: ownerA })
    const crossTenantQuoteLink = await ownerB.rpc('link_recommendation_quote', {
      p_recommendation_id: recommendation.id,
      p_quote_id: garageAQuote.data.id,
      p_supplemental_to_quote_id: null,
    })
    check('Cross-tenant recommendation quote link is rejected', Boolean(crossTenantQuoteLink.error), crossTenantQuoteLink.data)
  } else {
    check('Independent quote fixture is created for cross-tenant test', false, garageAQuote.error)
  }

  const crossCenterRecommendation = await createRecommendation(centerNorth, centerScopedRequest.id, 'Forbidden cross-center recommendation').catch((error) => ({ error }))
  check('Center manager cannot create recommendation for another center', Boolean(crossCenterRecommendation.error), crossCenterRecommendation)

  console.log('\nTransfers and cross-tenant integrity')
  const transferRequest = await createRequest(clientB2, {
    garageId: IDS.garageB,
    centerId: IDS.centerB1,
    clientId: IDS.clientB2,
    label: 'TRANSFER',
  })
  const crossOrganizationTransfer = await ownerB.rpc('propose_center_transfer', {
    p_request_id: transferRequest.id,
    p_to_center_id: IDS.centerA,
    p_reason: 'Must fail across organizations.',
  })
  check('Cross-organization destination is rejected', Boolean(crossOrganizationTransfer.error), crossOrganizationTransfer.data)
  const proposedTransfer = await ownerB.rpc('propose_center_transfer', {
    p_request_id: transferRequest.id,
    p_to_center_id: IDS.centerB2,
    p_reason: 'Fictitious local transfer.',
  })
  check('Network owner can propose an intra-organization transfer', !proposedTransfer.error && proposedTransfer.data?.status === 'proposed', proposedTransfer.error)
  if (!proposedTransfer.error) {
    const wrongClientDecision = await clientB1.rpc('decide_center_transfer', {
      p_transfer_id: proposedTransfer.data.id,
      p_accept: true,
      p_note: 'Wrong client.',
    })
    check('Unrelated client cannot confirm a transfer', Boolean(wrongClientDecision.error), wrongClientDecision.data)
    const acceptedTransfer = await clientB2.rpc('decide_center_transfer', {
      p_transfer_id: proposedTransfer.data.id,
      p_accept: true,
      p_note: 'Accepted locally.',
    })
    check('Owning client can confirm the transfer', !acceptedTransfer.error && acceptedTransfer.data?.status === 'customer_confirmed', acceptedTransfer.error)
    const concurrentCompletion = await Promise.all([
      ownerB.rpc('complete_center_transfer', { p_transfer_id: proposedTransfer.data.id }),
      networkManager.rpc('complete_center_transfer', { p_transfer_id: proposedTransfer.data.id }),
    ])
    check('Two simultaneous transfer completions produce one success', countSuccess(concurrentCompletion) === 1, concurrentCompletion.map((result) => result.error?.message))
    const movedRequest = await ownerB.from('service_requests').select('center_id').eq('id', transferRequest.id).single()
    check('Completed transfer moves the request to the destination center', !movedRequest.error && movedRequest.data.center_id === IDS.centerB2, movedRequest.error)
  }

  const concurrentTransferRequest = await createRequest(clientB1, {
    garageId: IDS.garageB,
    centerId: IDS.centerB1,
    clientId: IDS.clientB1,
    label: 'TRANSFER-RACE',
  })
  const simultaneousTransfers = await Promise.all([
    ownerB.rpc('propose_center_transfer', { p_request_id: concurrentTransferRequest.id, p_to_center_id: IDS.centerB2, p_reason: 'Race A' }),
    networkManager.rpc('propose_center_transfer', { p_request_id: concurrentTransferRequest.id, p_to_center_id: IDS.centerB3, p_reason: 'Race B' }),
  ])
  check('Only one open transfer can be created concurrently', countSuccess(simultaneousTransfers) === 1, simultaneousTransfers.map((result) => result.error?.message))
  const forbiddenCenterTransfer = await centerNorth.rpc('propose_center_transfer', {
    p_request_id: centerScopedRequest.id,
    p_to_center_id: IDS.centerB3,
    p_reason: 'Cross-center administration must fail.',
  })
  check('Center manager cannot transfer a dossier outside their scope', Boolean(forbiddenCenterTransfer.error), forbiddenCenterTransfer.data)

  const transferStageRequest = await createRequest(clientB1, {
    garageId: IDS.garageB,
    centerId: IDS.centerB1,
    clientId: IDS.clientB1,
    label: 'TRANSFER-STAGE-RACE',
  })
  await ownerB.rpc('transition_workshop_stage', {
    p_request_id: transferStageRequest.id,
    p_new_stage: 'appointment_confirmed',
    p_internal_note: null,
    p_customer_message: null,
    p_estimated_completion_at: null,
    p_visible_to_customer: true,
  })
  const stagedTransfer = await ownerB.rpc('propose_center_transfer', {
    p_request_id: transferStageRequest.id,
    p_to_center_id: IDS.centerB2,
    p_reason: 'Concurrent transfer-stage validation.',
  })
  if (!stagedTransfer.error) {
    await clientB1.rpc('decide_center_transfer', {
      p_transfer_id: stagedTransfer.data.id,
      p_accept: true,
      p_note: 'Local concurrent confirmation.',
    })
    const transferStageRace = await Promise.all([
      ownerB.rpc('complete_center_transfer', { p_transfer_id: stagedTransfer.data.id }),
      networkManager.rpc('transition_workshop_stage', {
        p_request_id: transferStageRequest.id,
        p_new_stage: 'vehicle_expected',
        p_internal_note: null,
        p_customer_message: null,
        p_estimated_completion_at: null,
        p_visible_to_customer: true,
      }),
    ])
    const transferStageState = await ownerB.from('service_requests').select('center_id,workshop_stage').eq('id', transferStageRequest.id).single()
    check(
      'Concurrent transfer and stage transition leave a consistent dossier',
      countSuccess(transferStageRace) === 2
        && !transferStageState.error
        && transferStageState.data.center_id === IDS.centerB2
        && transferStageState.data.workshop_stage === 'vehicle_expected',
      transferStageRace.map((result) => result.error?.message),
    )
  } else {
    check('Transfer fixture is created for stage concurrency test', false, stagedTransfer.error)
  }
  const directTransferEvent = await ownerB.from('service_request_transfer_events').insert({
    transfer_id: proposedTransfer.data?.id ?? '86000000-0000-4000-8000-000000000001',
    garage_id: IDS.garageB,
    new_status: 'cancelled',
    changed_by: IDS.clientB1,
  })
  check('Transfer event insertion is restricted to RPCs', Boolean(directTransferEvent.error))

  console.log('\nDelivery reports, reminders, and notification idempotence')
  const reportRequest = await createRequest(clientA2, {
    garageId: IDS.garageA,
    centerId: IDS.centerA,
    clientId: IDS.clientA2,
    label: 'REPORT',
  })
  const reportPayload = {
    customer_snapshot: { name: 'Fictitious local customer' },
    vehicle_snapshot: { registration: 'LOCAL-TEST' },
    entry_mileage: 1000,
    exit_mileage: 1001,
    requested_work: [{ label: 'Local validation' }],
    completed_work: [{ label: 'Local validation complete' }],
    accepted_recommendations: [],
    deferred_recommendations: [],
    parts: [],
    authorized_attachment_ids: [],
    final_validation: 'Local-only validation.',
  }
  const crossTenantReport = await ownerB.rpc('save_delivery_report', { p_request_id: reportRequest.id, p_report: reportPayload, p_finalize: true })
  check('Another organization cannot generate a delivery report', Boolean(crossTenantReport.error), crossTenantReport.data)
  const finalReport = await ownerA.rpc('save_delivery_report', { p_request_id: reportRequest.id, p_report: reportPayload, p_finalize: true })
  check('Authorized garage can finalize a delivery report', !finalReport.error && finalReport.data?.status === 'finalized', finalReport.error)
  const immutableReport = await ownerA.rpc('save_delivery_report', { p_request_id: reportRequest.id, p_report: reportPayload, p_finalize: false })
  check('Finalized delivery report is immutable', Boolean(immutableReport.error), immutableReport.data)
  const customerReport = await clientA2.from('delivery_reports').select('id,status').eq('service_request_id', reportRequest.id)
  check('Customer can read their finalized report', !customerReport.error && customerReport.data.length === 1, customerReport.error)
  const otherCustomerReport = await clientA1.from('delivery_reports').select('id').eq('service_request_id', reportRequest.id)
  check('Another customer cannot read the report', !otherCustomerReport.error && otherCustomerReport.data.length === 0, otherCustomerReport.error)

  const reminderArgs = {
    p_garage_id: IDS.garageA,
    p_center_id: IDS.centerA,
    p_client_id: IDS.clientA2,
    p_vehicle_id: null,
    p_client_vehicle_id: null,
    p_service_request_id: reportRequest.id,
    p_reminder_type: 'fixed_date',
    p_title: `Local reminder ${randomUUID()}`,
    p_due_date: new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10),
    p_due_mileage: null,
    p_scheduled_at: new Date().toISOString(),
    p_source: 'local_validation',
    p_language: 'en',
  }
  const simultaneousReminders = await Promise.all([
    frontDeskA.rpc('create_maintenance_reminder', reminderArgs),
    ownerA.rpc('create_maintenance_reminder', reminderArgs),
  ])
  check('Duplicate reminder creation is idempotent or rejected', countSuccess(simultaneousReminders) === 1, simultaneousReminders.map((result) => result.error?.message))
  const reminder = simultaneousReminders.find((result) => !result.error)?.data
  if (reminder) {
    const simultaneousConversions = await Promise.all([
      ownerA.rpc('mark_maintenance_reminder_converted', { p_reminder_id: reminder.id, p_request_id: reportRequest.id }),
      clientA2.rpc('mark_maintenance_reminder_converted', { p_reminder_id: reminder.id, p_request_id: reportRequest.id }),
    ])
    check('Concurrent reminder conversion is idempotent or rejected cleanly', countSuccess(simultaneousConversions) >= 1 && simultaneousConversions.every((result) => result.error || result.data?.status === 'converted'), simultaneousConversions.map((result) => result.error?.message))
  }
  const requestNotifications = await ownerB.from('notification_outbox').select('id,template_key').eq('service_request_id', timelineRequest.id).eq('template_key', 'appointment_confirmed')
  check('Concurrent stage transition emits one notification', !requestNotifications.error && requestNotifications.data.length === 1, requestNotifications.error ?? requestNotifications.data)

  console.log('\nStorage policies and attachment metadata')
  const bucket = 'service-request-attachments'
  const visiblePath = `${IDS.garageB}/${recommendationRequest.id}/${randomUUID()}-visible.txt`
  const internalPath = `${IDS.garageB}/${recommendationRequest.id}/${randomUUID()}-internal.txt`
  cleanup.storagePaths.push({ client: ownerB, bucket, paths: [visiblePath, internalPath] })
  const visibleBytes = Buffer.from('Fictitious customer-visible local attachment.')
  const uploadVisible = await ownerB.storage.from(bucket).upload(visiblePath, visibleBytes, { contentType: 'text/plain', upsert: false })
  check('Authorized professional can upload to their request path', !uploadVisible.error, uploadVisible.error)
  const registerVisible = await ownerB.rpc('register_service_request_attachment', {
    p_request_id: recommendationRequest.id,
    p_recommendation_id: null,
    p_file_name: 'visible.txt',
    p_mime_type: 'text/plain',
    p_file_size: visibleBytes.length,
    p_storage_path: visiblePath,
    p_visibility: 'customer',
    p_document_type: 'other',
  })
  check('Uploaded object can be registered with matching metadata', !registerVisible.error, registerVisible.error)
  const customerDownload = await clientB1.storage.from(bucket).download(visiblePath)
  check('Owning customer can read a customer-visible attachment', !customerDownload.error && customerDownload.data.size === visibleBytes.length, customerDownload.error)
  const otherCustomerDownload = await clientB2.storage.from(bucket).download(visiblePath)
  check('Another customer cannot read the attachment', Boolean(otherCustomerDownload.error), otherCustomerDownload.data)
  const uploadInternal = await ownerB.storage.from(bucket).upload(internalPath, Buffer.from('Internal local attachment.'), { contentType: 'text/plain', upsert: false })
  check('Professional can upload an internal attachment', !uploadInternal.error, uploadInternal.error)
  const registerInternal = await ownerB.rpc('register_service_request_attachment', {
    p_request_id: recommendationRequest.id,
    p_recommendation_id: null,
    p_file_name: 'internal.txt',
    p_mime_type: 'text/plain',
    p_file_size: 26,
    p_storage_path: internalPath,
    p_visibility: 'internal',
    p_document_type: 'diagnostic',
  })
  check('Internal attachment metadata can be registered', !registerInternal.error, registerInternal.error)
  const internalCustomerDownload = await clientB1.storage.from(bucket).download(internalPath)
  check('Customer cannot read an internal attachment', Boolean(internalCustomerDownload.error), internalCustomerDownload.data)

  const spoofedPath = `${IDS.garageB}/${recommendationRequest.id}/${randomUUID()}-spoof.txt`
  const crossTenantUpload = await ownerA.storage.from(bucket).upload(spoofedPath, Buffer.from('spoof'), { contentType: 'text/plain' })
  check('Professional cannot forge another garage id in Storage path', Boolean(crossTenantUpload.error), crossTenantUpload.data)
  const wrongRequestPath = `${IDS.garageB}/${randomUUID()}/${randomUUID()}-missing.txt`
  const wrongPathUpload = await ownerB.storage.from(bucket).upload(wrongRequestPath, Buffer.from('bad path'), { contentType: 'text/plain' })
  check('Upload to a nonexistent request path is denied', Boolean(wrongPathUpload.error), wrongPathUpload.data)
  const badMimePath = `${IDS.garageB}/${recommendationRequest.id}/${randomUUID()}-blocked.exe`
  const badMimeUpload = await ownerB.storage.from(bucket).upload(badMimePath, Buffer.from('blocked'), { contentType: 'application/x-msdownload' })
  check('Forbidden MIME type is rejected', Boolean(badMimeUpload.error), badMimeUpload.data)
  const zeroPath = `${IDS.garageB}/${recommendationRequest.id}/${randomUUID()}-empty.txt`
  const zeroUpload = await ownerB.storage.from(bucket).upload(zeroPath, Buffer.alloc(0), { contentType: 'text/plain' })
  check('Zero-byte upload is rejected', Boolean(zeroUpload.error), zeroUpload.data)
  if (!zeroUpload.error) cleanup.storagePaths.push({ client: ownerB, bucket, paths: [zeroPath] })
  const largePath = `${IDS.garageB}/${recommendationRequest.id}/${randomUUID()}-large.txt`
  const largeUpload = await ownerB.storage.from(bucket).upload(largePath, Buffer.alloc(25 * 1024 * 1024 + 1, 65), { contentType: 'text/plain' })
  check('Upload larger than 25 MiB is rejected', Boolean(largeUpload.error), largeUpload.data)
  if (!largeUpload.error) cleanup.storagePaths.push({ client: ownerB, bucket, paths: [largePath] })
  const anonList = await anonymous.storage.from(bucket).list('', { limit: 100 })
  check('Anonymous global Storage listing exposes no objects', Boolean(anonList.error) || anonList.data.length === 0, anonList.data)

  const signedUrl = await clientB1.storage.from(bucket).createSignedUrl(visiblePath, 1)
  check('Authorized customer can create a signed URL', !signedUrl.error && Boolean(signedUrl.data?.signedUrl), signedUrl.error)
  if (signedUrl.data?.signedUrl) {
    const signedFetch = await fetch(signedUrl.data.signedUrl)
    check('Signed URL works before expiry', signedFetch.ok, `${signedFetch.status}`)
    await new Promise((resolve) => setTimeout(resolve, 2100))
    const expiredFetch = await fetch(signedUrl.data.signedUrl)
    check('Signed URL is rejected after expiry', !expiredFetch.ok, `${expiredFetch.status}`)
  }
  const unauthorizedDelete = await centerCenter.storage.from(bucket).remove([visiblePath])
  const stillPresentAfterDelete = await ownerB.storage.from(bucket).download(visiblePath)
  check(
    'Unrelated center manager cannot delete another center attachment',
    Boolean(unauthorizedDelete.error) || (!stillPresentAfterDelete.error && stillPresentAfterDelete.data.size === visibleBytes.length),
    unauthorizedDelete.data,
  )
  const authorizedDelete = await ownerB.storage.from(bucket).remove([visiblePath])
  check('Authorized uploader can delete their attachment', !authorizedDelete.error, authorizedDelete.error)
  cleanup.storagePaths[0].paths = cleanup.storagePaths[0].paths.filter((path) => path !== visiblePath)

  console.log('\nCleanup')
  for (const item of cleanup.storagePaths) {
    if (item.paths.length) await item.client.storage.from(item.bucket).remove(item.paths)
  }
  for (const item of cleanup.quotes) {
    await item.client.from('quotes').delete().eq('id', item.id)
  }
  for (const item of cleanup.requests.reverse()) {
    const remover = item.garageId === IDS.garageA ? ownerA : ownerB
    await remover.from('service_requests').delete().eq('id', item.id)
  }
  console.log(`\nResult: ${passed} passed, ${failed} failed.`)
  if (failed > 0) process.exitCode = 1
}

run().catch((error) => {
  console.error(`\nFatal local validation error: ${error.message}`)
  process.exitCode = 1
})

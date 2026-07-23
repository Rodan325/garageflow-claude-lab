/**
 * Supabase RLS, RPC, Storage, and concurrency validation.
 *
 * The safety guard accepts the local CLI by default. Remote execution requires
 * the explicitly approved staging ref and always rejects production.
 */
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { assertPublishableKey, assertSupabaseTestTarget } from './rls-target-guard.mjs'

const url = process.env.VITE_SUPABASE_URL
const publishableKey = process.env.VITE_SUPABASE_ANON_KEY
const testTarget = process.env.SUPABASE_TEST_TARGET || 'local'
const fixtureRunId = process.env.RLS_FIXTURE_RUN_ID

if (!fixtureRunId || !/^[0-9a-f-]{36}$/.test(fixtureRunId)) {
  console.error('RLS SAFETY GUARD: RLS_FIXTURE_RUN_ID must be a generated UUID')
  process.exit(2)
}

let target
try {
  target = assertSupabaseTestTarget(url, {
    mode: testTarget,
    expectedRef: process.env.SUPABASE_EXPECTED_PROJECT_REF,
    forbiddenRef: process.env.SUPABASE_FORBIDDEN_PROJECT_REF,
  })
  assertPublishableKey(publishableKey)
} catch (error) {
  console.error(`RLS SAFETY GUARD: ${error.message}`)
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
const cleanupOwners = new Map()

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
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const supabase = client()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) return supabase
    const transientNetworkError = /fetch failed|connect timeout|network/i.test(error.message)
    if (!transientNetworkError || attempt === 3) {
      throw new Error(`${testTarget} sign-in failed for ${accountName}: ${error.message}`)
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 1000))
  }
  throw new Error(`${testTarget} sign-in failed for ${accountName}`)
}

async function createRequest(supabase, { garageId, centerId, clientId, label }) {
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('service_requests')
    .insert({
      garage_id: garageId,
      center_id: centerId,
      client_id: clientId,
      service_name: `Local validation ${fixtureRunId} ${label}`,
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

async function cleanupRunArtifacts() {
  console.log('\nCleanup')
  const cleanupErrors = []
  for (const item of cleanup.storagePaths) {
    if (item.paths.length) {
      const { error } = await item.client.storage.from(item.bucket).remove(item.paths)
      if (error) cleanupErrors.push(`storage: ${error.message}`)
    }
  }
  for (const item of cleanup.quotes) {
    const { error } = await item.client.from('quotes').delete().eq('id', item.id)
    if (error) cleanupErrors.push(`quote: ${error.message}`)
  }
  for (const item of cleanup.requests.reverse()) {
    const remover = cleanupOwners.get(item.garageId)
    if (!remover) {
      cleanupErrors.push(`request: no authorized cleanup owner for garage ${item.garageId}`)
      continue
    }
    const { error } = await remover.from('service_requests').delete().eq('id', item.id)
    if (error) cleanupErrors.push(`request: ${error.message}`)
  }
  check('Request, quote, and Storage validation artifacts are removed cleanly', cleanupErrors.length === 0, cleanupErrors)
}

async function run() {
  console.log(`\nClikarage ${testTarget} security validation: ${target.origin}`)
  console.log('Safety: approved target, publishable key, fictitious accounts only.\n')

  try {
  const health = await fetch(`${target.origin}/auth/v1/health`, {
    headers: { apikey: publishableKey },
  })
  check('Auth health endpoint is reachable', health.ok, `${health.status}`)

  const accountNames = [
    'ownerA',
    'frontDeskA',
    'clientA1',
    'clientA2',
    'ownerB',
    'networkManager',
    'centerNorth',
    'centerCenter',
    'technicianB',
    'clientB1',
    'clientB2',
  ]
  const sessions = testTarget === 'staging'
    ? await accountNames.reduce(async (pending, accountName) => [
        ...await pending,
        await signedIn(accountName),
      ], Promise.resolve([]))
    : await Promise.all(accountNames.map(signedIn))
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
  ] = sessions
  cleanupOwners.set(IDS.garageA, ownerA)
  cleanupOwners.set(IDS.garageB, ownerB)
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
  const clientDefaultGarage = await clientB1.from('garages').select('id').eq('id', IDS.garageB)
  check('Network client can resolve their private default organization', !clientDefaultGarage.error && clientDefaultGarage.data.length === 1, clientDefaultGarage.error)
  const unrelatedPrivateGarage = await clientA1.from('garages').select('id').eq('id', IDS.garageB)
  check('Unrelated client cannot resolve a private organization', !unrelatedPrivateGarage.error && unrelatedPrivateGarage.data.length === 0, unrelatedPrivateGarage.error)
  const anonymousCenters = await anonymous.from('garage_centers').select('garage_id')
  check('Anonymous catalog excludes private organization centers', !anonymousCenters.error && anonymousCenters.data.length > 0 && anonymousCenters.data.every((row) => row.garage_id === IDS.garageA), anonymousCenters.error ?? anonymousCenters.data)
  const anonymousWrite = await anonymous.from('client_profiles').insert({ id: randomUUID() })
  check('Anonymous table writes fail with insufficient privilege', anonymousWrite.error?.code === '42501', anonymousWrite.error)

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

  console.log('\nIntegrated garage-client journey')
  const journeyRequest = await createRequest(clientB1, {
    garageId: IDS.garageB,
    centerId: IDS.centerB1,
    clientId: IDS.clientB1,
    label: 'TWO-SESSION-JOURNEY',
  })
  const journeyEstimatedDelivery = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
  const journeyOpeningStages = [
    'appointment_confirmed',
    'vehicle_expected',
    'vehicle_checked_in',
    'vehicle_received',
    'diagnosis_in_progress',
  ]
  const journeyOpeningResults = []
  for (const stage of journeyOpeningStages) {
    journeyOpeningResults.push(await ownerB.rpc('transition_workshop_stage', {
      p_request_id: journeyRequest.id,
      p_new_stage: stage,
      p_internal_note: stage === 'diagnosis_in_progress' ? 'Fictitious internal diagnostic note.' : null,
      p_customer_message: `Journey stage: ${stage}`,
      p_estimated_completion_at: journeyEstimatedDelivery,
      p_visible_to_customer: true,
    }))
  }
  check('Garage session records check-in through diagnosis in order', countSuccess(journeyOpeningResults) === journeyOpeningStages.length, journeyOpeningResults.map((result) => result.error?.message))

  const journeyRecommendation = await createRecommendation(ownerB, journeyRequest.id, 'Fictitious two-session brake recommendation')
  const journeyProposal = await proposeRecommendation(ownerB, journeyRecommendation.id)
  check('Garage session proposes a recommendation', journeyProposal?.status === 'proposed', journeyProposal)

  const journeyPhotoPath = `${IDS.garageB}/${journeyRequest.id}/${randomUUID()}-journey.png`
  const journeyPhoto = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
  )
  cleanup.storagePaths.push({ client: ownerB, bucket: 'service-request-attachments', paths: [journeyPhotoPath] })
  const journeyPhotoUpload = await ownerB.storage.from('service-request-attachments').upload(journeyPhotoPath, journeyPhoto, {
    contentType: 'image/png',
    upsert: false,
  })
  const journeyPhotoMetadata = await ownerB.rpc('register_service_request_attachment', {
    p_request_id: journeyRequest.id,
    p_recommendation_id: journeyRecommendation.id,
    p_file_name: 'journey.png',
    p_mime_type: 'image/png',
    p_file_size: journeyPhoto.length,
    p_storage_path: journeyPhotoPath,
    p_visibility: 'customer',
    p_document_type: 'photo',
  })
  check('Garage session adds a customer-visible diagnostic photo', !journeyPhotoUpload.error && !journeyPhotoMetadata.error, journeyPhotoUpload.error ?? journeyPhotoMetadata.error)

  const journeyApprovalStage = await ownerB.rpc('transition_workshop_stage', {
    p_request_id: journeyRequest.id,
    p_new_stage: 'customer_approval_required',
    p_internal_note: 'Awaiting the fictitious customer decision.',
    p_customer_message: 'Your approval is required.',
    p_estimated_completion_at: journeyEstimatedDelivery,
    p_visible_to_customer: true,
  })
  check('Garage session requests customer approval with an estimated delivery time', !journeyApprovalStage.error, journeyApprovalStage.error)

  const journeyClientTimeline = await clientB1.rpc('get_workshop_timeline', { p_request_id: journeyRequest.id })
  const journeyClientPhoto = await clientB1.storage.from('service-request-attachments').download(journeyPhotoPath)
  check(
    'Client session sees the timeline and customer photo but no internal note',
    !journeyClientTimeline.error
      && journeyClientTimeline.data.some((event) => event.new_stage === 'customer_approval_required')
      && journeyClientTimeline.data.every((event) => event.internal_note === null)
      && !journeyClientPhoto.error,
    journeyClientTimeline.error ?? journeyClientPhoto.error,
  )

  const journeyQuestion = await clientB1.rpc('decide_workshop_recommendation', {
    p_recommendation_id: journeyRecommendation.id,
    p_action: 'question',
    p_note: 'Fictitious question from the customer session.',
    p_terms_version: 'staging-validation',
    p_privacy_version: 'staging-validation',
    p_displayed_language: 'ar',
  })
  const journeyAcceptance = await clientB1.rpc('decide_workshop_recommendation', {
    p_recommendation_id: journeyRecommendation.id,
    p_action: 'accepted',
    p_note: 'Accepted in the isolated customer session.',
    p_terms_version: 'staging-validation',
    p_privacy_version: 'staging-validation',
    p_displayed_language: 'ar',
  })
  check('Client session can ask a question and then accept once', !journeyQuestion.error && !journeyAcceptance.error && journeyAcceptance.data?.status === 'accepted', journeyQuestion.error ?? journeyAcceptance.error)

  const journeyGarageDecision = await ownerB.from('workshop_recommendations').select('status,customer_decision_note').eq('id', journeyRecommendation.id).single()
  check('Garage session sees the customer decision', !journeyGarageDecision.error && journeyGarageDecision.data.status === 'accepted', journeyGarageDecision.error)

  const journeyClosingStages = ['work_authorized', 'work_in_progress', 'quality_control', 'vehicle_ready']
  const journeyClosingResults = []
  for (const stage of journeyClosingStages) {
    journeyClosingResults.push(await ownerB.rpc('transition_workshop_stage', {
      p_request_id: journeyRequest.id,
      p_new_stage: stage,
      p_internal_note: null,
      p_customer_message: `Journey stage: ${stage}`,
      p_estimated_completion_at: journeyEstimatedDelivery,
      p_visible_to_customer: true,
    }))
  }
  check('Garage session completes work and quality control to vehicle ready', countSuccess(journeyClosingResults) === journeyClosingStages.length, journeyClosingResults.map((result) => result.error?.message))

  const journeyReportPayload = {
    customer_snapshot: { name: 'Fictitious staging customer' },
    vehicle_snapshot: { registration: 'STAGING-JOURNEY' },
    entry_mileage: 12000,
    exit_mileage: 12002,
    requested_work: ['Fictitious scheduled service'],
    diagnostic_summary: 'Fictitious diagnostic summary.',
    completed_work: ['Fictitious completed work'],
    accepted_recommendations: [journeyRecommendation.title],
    deferred_recommendations: [],
    parts: [],
    authorized_attachment_ids: journeyPhotoMetadata.data ? [journeyPhotoMetadata.data.id] : [],
    final_validation: 'Fictitious quality control passed.',
  }
  const journeyReport = await ownerB.rpc('save_delivery_report', {
    p_request_id: journeyRequest.id,
    p_report: journeyReportPayload,
    p_finalize: true,
  })
  const journeyClientReport = await clientB1.from('delivery_reports').select('id,status').eq('service_request_id', journeyRequest.id).single()
  check('Garage finalizes a report that the owning client can read', !journeyReport.error && !journeyClientReport.error && journeyClientReport.data.status === 'finalized', journeyReport.error ?? journeyClientReport.error)

  const journeyFinalStages = ['vehicle_delivered', 'closed']
  const journeyFinalResults = []
  for (const stage of journeyFinalStages) {
    journeyFinalResults.push(await ownerB.rpc('transition_workshop_stage', {
      p_request_id: journeyRequest.id,
      p_new_stage: stage,
      p_internal_note: null,
      p_customer_message: `Journey stage: ${stage}`,
      p_estimated_completion_at: journeyEstimatedDelivery,
      p_visible_to_customer: true,
    }))
  }
  check('Garage session delivers and closes the dossier', countSuccess(journeyFinalResults) === journeyFinalStages.length, journeyFinalResults.map((result) => result.error?.message))

  const journeyReminder = await ownerB.rpc('create_maintenance_reminder', {
    p_garage_id: IDS.garageB,
    p_center_id: IDS.centerB1,
    p_client_id: IDS.clientB1,
    p_vehicle_id: null,
    p_client_vehicle_id: null,
    p_service_request_id: journeyRequest.id,
    p_reminder_type: 'after_service',
    p_title: `Fictitious journey reminder ${randomUUID()}`,
    p_due_date: new Date(Date.now() + 180 * 86_400_000).toISOString().slice(0, 10),
    p_due_mileage: null,
    p_scheduled_at: new Date().toISOString(),
    p_source: `rls_validation:${fixtureRunId}:journey`,
    p_language: 'en',
  })
  check('Closed journey creates one maintenance reminder', !journeyReminder.error && journeyReminder.data?.status === 'scheduled', journeyReminder.error)

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
    requested_work: ['Local validation'],
    completed_work: ['Local validation complete'],
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
    p_source: `rls_validation:${fixtureRunId}:reminder`,
    p_language: 'en',
  }
  const simultaneousReminders = await Promise.all([
    frontDeskA.rpc('create_maintenance_reminder', reminderArgs),
    ownerA.rpc('create_maintenance_reminder', reminderArgs),
  ])
  check('Duplicate reminder creation is idempotent or rejected', countSuccess(simultaneousReminders) === 1, simultaneousReminders.map((result) => result.error?.message))
  const reminder = simultaneousReminders.find((result) => !result.error)?.data
  if (reminder) {
    const applicationDelete = await ownerA
      .from('maintenance_reminders')
      .delete()
      .eq('id', reminder.id)
    const reminderAfterDelete = await ownerA
      .from('maintenance_reminders')
      .select('id')
      .eq('id', reminder.id)
    check(
      'Application roles cannot delete reminder fixtures directly',
      Boolean(applicationDelete.error)
        && !reminderAfterDelete.error
        && reminderAfterDelete.data.length === 1,
      applicationDelete.error ?? reminderAfterDelete.error,
    )
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

  const signedUrlTtlSeconds = testTarget === 'staging' ? 10 : 5
  const signedUrl = await clientB1.storage.from(bucket).createSignedUrl(visiblePath, signedUrlTtlSeconds)
  check('Authorized customer can create a signed URL', !signedUrl.error && Boolean(signedUrl.data?.signedUrl), signedUrl.error)
  if (signedUrl.data?.signedUrl) {
    const signedFetch = await fetch(signedUrl.data.signedUrl)
    check('Signed URL works before expiry', signedFetch.ok, `${signedFetch.status}`)
    await new Promise((resolve) => setTimeout(resolve, (signedUrlTtlSeconds + 1.1) * 1000))
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

  console.log('\nPublic branding Storage hardening')
  const logoBucket = 'garage-logos'
  const logoAPath = `${IDS.garageA}/logo.png`
  const logoBPath = `${IDS.garageB}/logo.webp`
  cleanup.storagePaths.push({ client: ownerA, bucket: logoBucket, paths: [logoAPath] })
  cleanup.storagePaths.push({ client: ownerB, bucket: logoBucket, paths: [logoBPath] })
  const onePixelPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
  )
  const logoUpload = await ownerA.storage.from(logoBucket).upload(logoAPath, onePixelPng, {
    contentType: 'image/png',
    upsert: true,
  })
  check('Organization owner can upload a canonical public logo', !logoUpload.error, logoUpload.error)

  const publicLogoUrl = ownerA.storage.from(logoBucket).getPublicUrl(logoAPath).data.publicUrl
  const publicLogoFetch = await fetch(publicLogoUrl)
  check('Branding logo is readable through its public URL', publicLogoFetch.ok, `${publicLogoFetch.status}`)

  const logoReplace = await ownerA.storage.from(logoBucket).upload(logoAPath, onePixelPng, {
    contentType: 'image/png',
    upsert: true,
  })
  check('Organization owner can replace their own canonical logo', !logoReplace.error, logoReplace.error)

  const crossTenantLogo = await ownerB.storage.from(logoBucket).upload(logoAPath, onePixelPng, {
    contentType: 'image/png',
    upsert: true,
  })
  check('Another organization cannot overwrite a branding logo', Boolean(crossTenantLogo.error), crossTenantLogo.data)

  const invalidLogoPath = `${IDS.garageA}/document.png`
  const invalidPathUpload = await ownerA.storage.from(logoBucket).upload(invalidLogoPath, onePixelPng, {
    contentType: 'image/png',
  })
  check('Branding bucket rejects non-logo paths', Boolean(invalidPathUpload.error), invalidPathUpload.data)

  const forbiddenLogoMime = await ownerB.storage.from(logoBucket).upload(
    `${IDS.garageB}/logo.jpg`,
    Buffer.from('not an image'),
    { contentType: 'application/pdf' },
  )
  check('Branding bucket rejects forbidden MIME types', Boolean(forbiddenLogoMime.error), forbiddenLogoMime.data)

  const oversizedLogo = await ownerB.storage.from(logoBucket).upload(
    `${IDS.garageB}/logo.jpg`,
    Buffer.alloc(2 * 1024 * 1024 + 1, 65),
    { contentType: 'image/jpeg' },
  )
  check('Branding bucket rejects files larger than 2 MiB', Boolean(oversizedLogo.error), oversizedLogo.data)

  const ownerBLogo = await ownerB.storage.from(logoBucket).upload(logoBPath, onePixelPng, {
    contentType: 'image/webp',
    upsert: true,
  })
  check('Network owner can upload only in their organization path', !ownerBLogo.error, ownerBLogo.error)

  const technicianLogo = await technicianB.storage.from(logoBucket).upload(logoBPath, onePixelPng, {
    contentType: 'image/webp',
    upsert: true,
  })
  check('Technician cannot overwrite the organization logo', Boolean(technicianLogo.error), technicianLogo.data)

  const technicianLogoDelete = await technicianB.storage.from(logoBucket).remove([logoBPath])
  const logoBStillPresent = await fetch(ownerB.storage.from(logoBucket).getPublicUrl(logoBPath).data.publicUrl)
  check(
    'Technician cannot delete the organization logo',
    Boolean(technicianLogoDelete.error) || logoBStillPresent.ok,
    technicianLogoDelete.data,
  )

  const anonymousLogoList = await anonymous.storage.from(logoBucket).list('', { limit: 100 })
  check(
    'Anonymous users cannot list public branding objects',
    Boolean(anonymousLogoList.error) || anonymousLogoList.data.length === 0,
    anonymousLogoList.data,
  )
  const crossTenantLogoList = await ownerB.storage.from(logoBucket).list(IDS.garageA, { limit: 100 })
  check(
    'A manager cannot list another organization branding path',
    Boolean(crossTenantLogoList.error) || crossTenantLogoList.data.length === 0,
    crossTenantLogoList.data,
  )

  const deleteOwnLogo = await ownerA.storage.from(logoBucket).remove([logoAPath])
  check('Organization owner can delete their own logo', !deleteOwnLogo.error, deleteOwnLogo.error)
  cleanup.storagePaths.at(-2).paths = []

  } finally {
    await cleanupRunArtifacts()
  }

  console.log(`\nResult: ${passed} passed, ${failed} failed.`)
  if (failed > 0) process.exitCode = 1
}

run().catch((error) => {
  console.error(`\nFatal ${testTarget} validation error: ${error.message}`)
  process.exitCode = 1
})

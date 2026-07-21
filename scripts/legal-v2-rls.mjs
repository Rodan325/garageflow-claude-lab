/**
 * Behavioural validation for the additive legal-acceptance V2 migrations.
 *
 * A privileged setup step must first create the two temporary organizations
 * and the effective test-only registry versions. This script only uses normal
 * authenticated/anonymous Data API clients and never receives a server key.
 */
import { createClient } from '@supabase/supabase-js'
import { assertPublishableKey, assertSupabaseTestTarget } from './rls-target-guard.mjs'

const url = process.env.VITE_SUPABASE_URL
const publishableKey = process.env.VITE_SUPABASE_ANON_KEY
const testTarget = process.env.SUPABASE_TEST_TARGET || 'local'
const fixtureRunId = process.env.RLS_FIXTURE_RUN_ID

if (!fixtureRunId || !/^[0-9a-f-]{36}$/.test(fixtureRunId)) {
  console.error('LEGAL V2 RLS SAFETY GUARD: RLS_FIXTURE_RUN_ID must be a generated UUID')
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
  console.error(`LEGAL V2 RLS SAFETY GUARD: ${error.message}`)
  process.exit(2)
}

const IDS = {
  organizationA: process.env.LEGAL_V2_ORGANIZATION_A
    || '11111111-1111-4111-8111-111111111111',
  organizationB: process.env.LEGAL_V2_ORGANIZATION_B
    || '22222222-2222-4222-8222-222222222222',
}
const VERSION = 'rls-validation-20260720'
const CLIENT_HASH = '5b2d8b1500f446459d79ee22976a0f632db2cedf2329116961c99501e97b3640'
const DPA_HASH = '5c88474d7df764bf96ce8f90f2f83edc48429e47359aece2a740fce63782766e'
const BAD_HASH = '0'.repeat(64)
const APPLICATION_VERSION = `rls-validation:${fixtureRunId}`
const PASSWORD = 'LocalDemo1234!'
const ACCOUNTS = {
  ownerA: ['owner@demo-garage.fr', 'Demo1234!'],
  memberA: ['frontdesk.independent@example.test', PASSWORD],
  ownerB: ['owner.network@example.test', PASSWORD],
  centerManagerB: ['manager.north@example.test', PASSWORD],
  clientA: ['client@demo.fr', 'Demo1234!'],
}

let passed = 0
let failed = 0

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1
    console.log(`  [PASS] ${name}`)
  } else {
    failed += 1
    const message = detail?.message || detail || ''
    console.error(`  [FAIL] ${name}${message ? ` - ${message}` : ''}`)
  }
}

function client() {
  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

async function signedIn([email, password]) {
  const supabase = client()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`${testTarget} legal V2 sign-in failed: ${error.message}`)
  return supabase
}

function userEvidence(hash = CLIENT_HASH) {
  return {
    role: 'client',
    document_type: 'terms_client',
    document_version: VERSION,
    document_id: 'ignored-client-value',
    displayed_language: 'fr',
    organization_id: null,
    document_sha256: hash,
    document_status: 'effective',
    application_version: APPLICATION_VERSION,
    acceptance_scope: 'user',
    authority_role: null,
    evidence_source: 'legal_gate',
    acceptance_context: 'legal_gate',
  }
}

function organizationEvidence(organizationId, hash = DPA_HASH) {
  return {
    role: 'garage',
    document_type: 'dpa',
    document_version: VERSION,
    document_id: 'ignored-organization-value',
    displayed_language: 'fr',
    organization_id: organizationId,
    document_sha256: hash,
    document_status: 'effective',
    application_version: APPLICATION_VERSION,
    acceptance_scope: 'organization',
    authority_role: 'untrusted-frontend-value',
    evidence_source: 'contract_admin',
    acceptance_context: 'contract_admin',
  }
}

async function run() {
  console.log(`\nClikarage legal V2 RLS validation: ${target.origin}`)
  console.log('Safety: approved target, publishable key, temporary legal fixtures only.\n')

  const [ownerA, memberA, ownerB, centerManagerB, clientA] = await Promise.all([
    signedIn(ACCOUNTS.ownerA),
    signedIn(ACCOUNTS.memberA),
    signedIn(ACCOUNTS.ownerB),
    signedIn(ACCOUNTS.centerManagerB),
    signedIn(ACCOUNTS.clientA),
  ])
  const anonymous = client()
  const clientUser = await clientA.auth.getUser()
  const ownerAUser = await ownerA.auth.getUser()
  const ownerBUser = await ownerB.auth.getUser()
  const centerManagerBUser = await centerManagerB.auth.getUser()

  const legacyDpa = await ownerA
    .from('legal_acceptances')
    .insert({
      role: 'garage',
      user_id: ownerAUser.data.user.id,
      document_type: 'dpa',
      document_version: '2026-07-02',
      document_id: 'dpa:2026-07-02',
      displayed_language: 'fr',
      organization_id: null,
      acceptance_context: `rls_validation:${fixtureRunId}:legacy`,
    })
    .select('id,document_version,organization_id,document_sha256')
    .single()
  check(
    'The flags-off legacy DPA remains user scoped and acceptable',
    !legacyDpa.error
      && legacyDpa.data.document_version === '2026-07-02'
      && legacyDpa.data.organization_id === null
      && legacyDpa.data.document_sha256 === null,
    legacyDpa.error,
  )

  const forgedLegacyDpa = await ownerB.from('legal_acceptances').insert({
    role: 'garage',
    user_id: ownerBUser.data.user.id,
    document_type: 'dpa',
    document_version: '2026-07-02',
    document_id: 'dpa:2026-07-02',
    displayed_language: 'fr',
    organization_id: IDS.organizationB,
    acceptance_context: 'legal_gate',
  })
  check('Legacy DPA evidence cannot claim organization authority', Boolean(forgedLegacyDpa.error), forgedLegacyDpa.error)

  const stagedAttempt = await clientA.from('legal_acceptances').insert({
    ...userEvidence(CLIENT_HASH),
    user_id: clientUser.data.user.id,
    document_version: 'terms-2026-01',
  })
  check('A staged commercial document cannot be accepted', Boolean(stagedAttempt.error), stagedAttempt.error)

  const badHashAttempt = await clientA.from('legal_acceptances').insert({
    ...userEvidence(BAD_HASH),
    user_id: clientUser.data.user.id,
  })
  check('A hash different from the rendered document is rejected', Boolean(badHashAttempt.error), badHashAttempt.error)

  const clientAcceptance = await clientA
    .from('legal_acceptances')
    .insert({ ...userEvidence(), user_id: clientUser.data.user.id })
    .select('id,user_id,document_id,document_version,document_sha256,document_status,acceptance_scope,authority_role')
    .single()
  check(
    'The owning user records the exact displayed-document hash',
    !clientAcceptance.error
      && clientAcceptance.data.document_id === 'terms_client'
      && clientAcceptance.data.document_sha256 === CLIENT_HASH
      && clientAcceptance.data.document_status === 'effective'
      && clientAcceptance.data.acceptance_scope === 'user'
      && clientAcceptance.data.authority_role === null,
    clientAcceptance.error,
  )

  const duplicateAcceptance = await clientA.from('legal_acceptances').insert({
    ...userEvidence(),
    user_id: clientUser.data.user.id,
  })
  check('A duplicate user acceptance is rejected', Boolean(duplicateAcceptance.error), duplicateAcceptance.error)

  const memberAttempt = await memberA.from('legal_acceptances').insert({
    ...organizationEvidence(IDS.organizationA),
    user_id: (await memberA.auth.getUser()).data.user.id,
  })
  check('A simple organization member cannot accept the DPA', Boolean(memberAttempt.error), memberAttempt.error)

  const centerManagerAttempt = await centerManagerB.from('legal_acceptances').insert({
    ...organizationEvidence(IDS.organizationB),
    user_id: centerManagerBUser.data.user.id,
  })
  check('A center-scoped legacy admin cannot accept the organization DPA', Boolean(centerManagerAttempt.error), centerManagerAttempt.error)

  const crossOrganizationAttempt = await ownerB.from('legal_acceptances').insert({
    ...organizationEvidence(IDS.organizationA),
    user_id: ownerBUser.data.user.id,
  })
  check('An owner cannot accept the DPA for another organization', Boolean(crossOrganizationAttempt.error), crossOrganizationAttempt.error)

  const ownerAAcceptance = await ownerA
    .from('legal_acceptances')
    .insert({ ...organizationEvidence(IDS.organizationA), user_id: ownerAUser.data.user.id })
    .select('id,user_id,organization_id,organization_name_snapshot,document_id,document_sha256,document_status,acceptance_scope,authority_role')
    .single()
  check(
    'An authorized organization owner can accept the DPA',
    !ownerAAcceptance.error
      && ownerAAcceptance.data.organization_id === IDS.organizationA
      && typeof ownerAAcceptance.data.organization_name_snapshot === 'string'
      && ownerAAcceptance.data.organization_name_snapshot.length > 0
      && ownerAAcceptance.data.document_id === 'dpa'
      && ownerAAcceptance.data.document_sha256 === DPA_HASH
      && ownerAAcceptance.data.document_status === 'effective'
      && ownerAAcceptance.data.acceptance_scope === 'organization'
      && ownerAAcceptance.data.authority_role === 'organization_owner',
    ownerAAcceptance.error,
  )

  const ownerBAcceptance = await ownerB
    .from('legal_acceptances')
    .insert({ ...organizationEvidence(IDS.organizationB), user_id: ownerBUser.data.user.id })
    .select('id,organization_id,authority_role')
    .single()
  check(
    'The second organization owner can accept only for their organization',
    !ownerBAcceptance.error
      && ownerBAcceptance.data.organization_id === IDS.organizationB
      && ownerBAcceptance.data.authority_role === 'organization_owner',
    ownerBAcceptance.error,
  )

  const ownerAOrganizationStatus = await ownerA.rpc('has_organization_legal_acceptance_v2', {
    p_organization_id: IDS.organizationA,
    p_document_id: 'dpa',
    p_document_version: VERSION,
    p_document_hashes: [DPA_HASH],
  })
  check('An organization member resolves only the exact organization acceptance hash', !ownerAOrganizationStatus.error && ownerAOrganizationStatus.data === true, ownerAOrganizationStatus.error)

  const wrongHashOrganizationStatus = await ownerA.rpc('has_organization_legal_acceptance_v2', {
    p_organization_id: IDS.organizationA,
    p_document_id: 'dpa',
    p_document_version: VERSION,
    p_document_hashes: [BAD_HASH],
  })
  check('An organization acceptance with another hash is treated as missing', !wrongHashOrganizationStatus.error && wrongHashOrganizationStatus.data === false, wrongHashOrganizationStatus.error)

  const crossOrganizationStatus = await ownerB.rpc('has_organization_legal_acceptance_v2', {
    p_organization_id: IDS.organizationA,
    p_document_id: 'dpa',
    p_document_version: VERSION,
    p_document_hashes: [DPA_HASH],
  })
  check('The organization acceptance RPC rejects a foreign organization', Boolean(crossOrganizationStatus.error), crossOrganizationStatus.error)

  const ownerBReadsOwnerA = await ownerB
    .from('legal_acceptances')
    .select('id')
    .eq('id', ownerAAcceptance.data?.id)
  check('Organization B cannot read organization A evidence', !ownerBReadsOwnerA.error && ownerBReadsOwnerA.data.length === 0, ownerBReadsOwnerA.error)

  const clientReadsDpa = await clientA
    .from('legal_acceptances')
    .select('id')
    .eq('id', ownerAAcceptance.data?.id)
  check('A client cannot read organization DPA evidence', !clientReadsDpa.error && clientReadsDpa.data.length === 0, clientReadsDpa.error)

  const privateRegistry = await ownerA.from('legal_document_versions').select('document_id')
  check('The private document registry is not exposed through the Data API', Boolean(privateRegistry.error) || privateRegistry.data.length === 0, privateRegistry.error)

  const anonymousEvidence = await anonymous.from('legal_acceptances').select('id')
  check('Anonymous users cannot read legal evidence', Boolean(anonymousEvidence.error) || anonymousEvidence.data.length === 0, anonymousEvidence.error)

  const updateAttempt = await ownerA
    .from('legal_acceptances')
    .update({ application_version: 'mutated' })
    .eq('id', ownerAAcceptance.data?.id)
    .select('id')
  const deleteAttempt = await ownerA
    .from('legal_acceptances')
    .delete()
    .eq('id', ownerAAcceptance.data?.id)
    .select('id')
  const immutableRow = await ownerA
    .from('legal_acceptances')
    .select('id,application_version,document_sha256')
    .eq('id', ownerAAcceptance.data?.id)
    .single()
  check(
    'Legal evidence remains immutable without UPDATE or DELETE policies',
    (Boolean(updateAttempt.error) || updateAttempt.data.length === 0)
      && (Boolean(deleteAttempt.error) || deleteAttempt.data.length === 0)
      && !immutableRow.error
      && immutableRow.data.application_version === APPLICATION_VERSION
      && immutableRow.data.document_sha256 === DPA_HASH,
    immutableRow.error,
  )

  console.log(`\nLegal V2 result: ${passed} passed, ${failed} failed.`)
  if (failed > 0) process.exitCode = 1
}

run().catch((error) => {
  console.error(`\nFatal ${testTarget} legal V2 validation error: ${error.message}`)
  process.exitCode = 1
})

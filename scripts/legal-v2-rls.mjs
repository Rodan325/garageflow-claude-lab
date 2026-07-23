/**
 * Behavioural validation for current-document legal acceptance RPCs.
 *
 * A privileged local-only helper creates effective registry fixtures. Every
 * assertion below uses anonymous or ordinary authenticated Data API clients.
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
const CLIENT_HASH = '75148cb8161fa94a561ce55528d2fd9184ea2ad91f5e3a8619016f38fc6d31a7'
const TERMS_PRO_HASH = 'bfb31cbfcb840155475d8ae6ad236893730de4558d1a3564143b4097dcadf170'
const TERMS_PRO_EN_HASH = 'b1e9e013d85d1c6d38f15b3bc8aae3e1953a472040b130fa6dac41dbff3c561c'
const TERMS_PRO_AR_HASH = 'a98b4bd3d0a8a5f46c4744efe3417dcf6e8634a99d519e36652c975e8c77406a'
const DPA_HASH = '484d5bba3263046198fb04b4326b1b683a66c386d21dc26f1ce937dc17878120'
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

function rpcArgs(documentKey, organizationId = null, language = 'fr') {
  return {
    p_document_key: documentKey,
    p_language: language,
    p_organization_id: organizationId,
  }
}

function directEvidence(userId, documentType, version, organizationId = null) {
  return {
    user_id: userId,
    role: organizationId ? 'garage' : 'client',
    document_type: documentType,
    document_version: version,
    document_id: documentType,
    displayed_language: 'fr',
    organization_id: organizationId,
    document_sha256: CLIENT_HASH,
    document_status: 'effective',
    application_version: `rls-validation:${fixtureRunId}`,
    acceptance_scope: organizationId ? 'organization' : 'user',
    evidence_source: 'legal_gate',
    acceptance_context: 'legal_gate',
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
  const ownerAId = (await ownerA.auth.getUser()).data.user.id
  const ownerBId = (await ownerB.auth.getUser()).data.user.id
  const clientAId = (await clientA.auth.getUser()).data.user.id

  const directCurrent = await clientA.from('legal_acceptances').insert(
    directEvidence(clientAId, 'terms_client', VERSION),
  )
  check('Authenticated direct INSERT is denied', Boolean(directCurrent.error), directCurrent.error)

  const directPilot = await ownerA.from('legal_acceptances').insert({
    ...directEvidence(ownerAId, 'pilot_agreement', '2026-07-02'),
    document_sha256: null,
    document_status: null,
    application_version: null,
    acceptance_scope: null,
  })
  check('Direct pilot agreement acceptance is denied', Boolean(directPilot.error), directPilot.error)

  const directLegacyDpa = await ownerA.from('legal_acceptances').insert({
    ...directEvidence(ownerAId, 'dpa', '2026-07-02'),
    document_id: 'dpa:2026-07-02',
    document_sha256: null,
    document_status: null,
    application_version: null,
    acceptance_scope: null,
  })
  check('The historical DPA cannot be accepted', Boolean(directLegacyDpa.error), directLegacyDpa.error)

  const directOldTerms = await ownerA.from('legal_acceptances').insert({
    ...directEvidence(ownerAId, 'terms_pro', 'terms-2026-00', IDS.organizationA),
    document_sha256: '0'.repeat(64),
  })
  check('An old professional terms version cannot be accepted', Boolean(directOldTerms.error), directOldTerms.error)

  const pilotRpc = await ownerA.rpc(
    'accept_current_legal_document_v2',
    rpcArgs('pilot_agreement', IDS.organizationA),
  )
  check('The current-document RPC explicitly refuses pilot agreement', Boolean(pilotRpc.error), pilotRpc.error)

  const historicalParameters = await ownerA.rpc('accept_current_legal_document_v2', {
    ...rpcArgs('dpa', IDS.organizationA),
    p_document_version: '2026-07-02',
    p_document_sha256: '0'.repeat(64),
  })
  check(
    'A caller cannot supply an old version or hash to the RPC',
    Boolean(historicalParameters.error),
    historicalParameters.error,
  )

  const clientStatusBefore = await clientA.rpc(
    'get_current_legal_acceptance_status_v2',
    rpcArgs('terms_client'),
  )
  const clientBefore = clientStatusBefore.data?.[0]
  check(
    'The server resolves the current user-scoped version and hash',
    !clientStatusBefore.error
      && clientBefore.current === true
      && clientBefore.accepted === false
      && clientBefore.can_accept === true
      && clientBefore.document_version === VERSION
      && clientBefore.document_sha256 === CLIENT_HASH
      && clientBefore.acceptance_scope === 'user',
    clientStatusBefore.error,
  )

  const clientAcceptance = await clientA.rpc(
    'accept_current_legal_document_v2',
    rpcArgs('terms_client'),
  )
  check(
    'A current user-scoped acceptance succeeds through the RPC',
    !clientAcceptance.error && /^[0-9a-f-]{36}$/.test(clientAcceptance.data),
    clientAcceptance.error,
  )

  const duplicateClientAcceptance = await clientA.rpc(
    'accept_current_legal_document_v2',
    rpcArgs('terms_client'),
  )
  check(
    'A repeated current acceptance is idempotent',
    !duplicateClientAcceptance.error && duplicateClientAcceptance.data === clientAcceptance.data,
    duplicateClientAcceptance.error,
  )

  const clientEvidence = await clientA
    .from('legal_acceptances')
    .select('id,user_id,document_id,document_version,document_sha256,document_status,acceptance_scope,application_version')
    .eq('id', clientAcceptance.data)
    .single()
  check(
    'The RPC stores only the server-resolved current evidence',
    !clientEvidence.error
      && clientEvidence.data.user_id === clientAId
      && clientEvidence.data.document_id === 'terms_client'
      && clientEvidence.data.document_version === VERSION
      && clientEvidence.data.document_sha256 === CLIENT_HASH
      && clientEvidence.data.document_status === 'effective'
      && clientEvidence.data.acceptance_scope === 'user'
      && clientEvidence.data.application_version === 'legal-current-document-rpc-v2',
    clientEvidence.error,
  )

  const ownerTermsStatus = await ownerA.rpc(
    'get_current_legal_acceptance_status_v2',
    rpcArgs('terms_pro', IDS.organizationA),
  )
  const ownerTerms = ownerTermsStatus.data?.[0]
  check(
    'Professional terms use organization scope and owner authority',
    !ownerTermsStatus.error
      && ownerTerms.acceptance_scope === 'organization'
      && ownerTerms.can_accept === true
      && ownerTerms.document_sha256 === TERMS_PRO_HASH,
    ownerTermsStatus.error,
  )

  const memberTermsStatus = await memberA.rpc(
    'get_current_legal_acceptance_status_v2',
    rpcArgs('terms_pro', IDS.organizationA),
  )
  const memberTerms = memberTermsStatus.data?.[0]
  check(
    'A simple member sees status without receiving an acceptance action',
    !memberTermsStatus.error
      && memberTerms.current === true
      && memberTerms.can_accept === false
      && memberTerms.reason === 'authorized_representative_required',
    memberTermsStatus.error,
  )

  const memberTermsAttempt = await memberA.rpc(
    'accept_current_legal_document_v2',
    rpcArgs('terms_pro', IDS.organizationA),
  )
  check('SQL rejects a manual simple-member acceptance call', Boolean(memberTermsAttempt.error), memberTermsAttempt.error)

  const centerManagerAttempt = await centerManagerB.rpc(
    'accept_current_legal_document_v2',
    rpcArgs('dpa', IDS.organizationB),
  )
  check('A center-scoped manager cannot bind the organization', Boolean(centerManagerAttempt.error), centerManagerAttempt.error)

  const crossOrganizationStatus = await ownerB.rpc(
    'get_current_legal_acceptance_status_v2',
    rpcArgs('terms_pro', IDS.organizationA),
  )
  check('Status lookup rejects another tenant', Boolean(crossOrganizationStatus.error), crossOrganizationStatus.error)

  const crossOrganizationAcceptance = await ownerB.rpc(
    'accept_current_legal_document_v2',
    rpcArgs('terms_pro', IDS.organizationA),
  )
  check('Acceptance RPC rejects another tenant', Boolean(crossOrganizationAcceptance.error), crossOrganizationAcceptance.error)

  const termsAcceptance = await ownerA.rpc(
    'accept_current_legal_document_v2',
    rpcArgs('terms_pro', IDS.organizationA),
  )
  const dpaAcceptance = await ownerA.rpc(
    'accept_current_legal_document_v2',
    rpcArgs('dpa', IDS.organizationA),
  )
  check(
    'An authorized owner accepts current professional terms',
    !termsAcceptance.error && /^[0-9a-f-]{36}$/.test(termsAcceptance.data),
    termsAcceptance.error,
  )
  check(
    'An authorized owner accepts the current DPA',
    !dpaAcceptance.error && /^[0-9a-f-]{36}$/.test(dpaAcceptance.data),
    dpaAcceptance.error,
  )

  const frenchTermsStatus = await ownerA.rpc(
    'get_current_legal_acceptance_status_v2',
    rpcArgs('terms_pro', IDS.organizationA, 'fr'),
  )
  const arabicTermsBefore = await ownerA.rpc(
    'get_current_legal_acceptance_status_v2',
    rpcArgs('terms_pro', IDS.organizationA, 'ar'),
  )
  const englishTermsBefore = await ownerA.rpc(
    'get_current_legal_acceptance_status_v2',
    rpcArgs('terms_pro', IDS.organizationA, 'en'),
  )
  check(
    'A French professional-terms proof satisfies only the French current document',
    !frenchTermsStatus.error
      && frenchTermsStatus.data?.[0]?.accepted === true
      && frenchTermsStatus.data?.[0]?.document_sha256 === TERMS_PRO_HASH,
    frenchTermsStatus.error,
  )
  check(
    'A French professional-terms proof does not satisfy Arabic',
    !arabicTermsBefore.error
      && arabicTermsBefore.data?.[0]?.accepted === false
      && arabicTermsBefore.data?.[0]?.document_sha256 === TERMS_PRO_AR_HASH,
    arabicTermsBefore.error,
  )
  check(
    'A French professional-terms proof does not satisfy English',
    !englishTermsBefore.error
      && englishTermsBefore.data?.[0]?.accepted === false
      && englishTermsBefore.data?.[0]?.document_sha256 === TERMS_PRO_EN_HASH,
    englishTermsBefore.error,
  )

  const arabicTermsAcceptance = await ownerA.rpc(
    'accept_current_legal_document_v2',
    rpcArgs('terms_pro', IDS.organizationA, 'ar'),
  )
  const arabicEvidence = await ownerA
    .from('legal_acceptances')
    .select('displayed_language,document_sha256,document_version,organization_id')
    .eq('id', arabicTermsAcceptance.data)
    .single()
  check(
    'Arabic acceptance stores the exact Arabic locale and canonical hash',
    !arabicTermsAcceptance.error
      && !arabicEvidence.error
      && arabicEvidence.data.displayed_language === 'ar'
      && arabicEvidence.data.document_sha256 === TERMS_PRO_AR_HASH
      && arabicEvidence.data.document_version === VERSION
      && arabicEvidence.data.organization_id === IDS.organizationA,
    arabicTermsAcceptance.error ?? arabicEvidence.error,
  )
  check(
    'The Arabic acceptance is distinct from the French proof',
    !arabicTermsAcceptance.error && arabicTermsAcceptance.data !== termsAcceptance.data,
    arabicTermsAcceptance.error,
  )

  const organizationEvidence = await ownerA
    .from('legal_acceptances')
    .select('id,user_id,organization_id,organization_name_snapshot,document_id,document_version,document_sha256,acceptance_scope,authority_role')
    .in('id', [termsAcceptance.data, dpaAcceptance.data])
  check(
    'Organization proofs contain server-derived tenant, hashes and authority',
    !organizationEvidence.error
      && organizationEvidence.data.length === 2
      && organizationEvidence.data.every((row) => (
        row.user_id === ownerAId
        && row.organization_id === IDS.organizationA
        && typeof row.organization_name_snapshot === 'string'
        && row.organization_name_snapshot.length > 0
        && row.document_version === VERSION
        && row.acceptance_scope === 'organization'
        && row.authority_role === 'organization_owner'
      ))
      && organizationEvidence.data.some((row) => row.document_id === 'terms_pro' && row.document_sha256 === TERMS_PRO_HASH)
      && organizationEvidence.data.some((row) => row.document_id === 'dpa' && row.document_sha256 === DPA_HASH),
    organizationEvidence.error,
  )

  const memberStatusAfter = await memberA.rpc(
    'get_current_legal_acceptance_status_v2',
    rpcArgs('terms_pro', IDS.organizationA),
  )
  check(
    'A member can see that the organization proof is current but still cannot accept',
    !memberStatusAfter.error
      && memberStatusAfter.data?.[0]?.accepted === true
      && memberStatusAfter.data?.[0]?.can_accept === false,
    memberStatusAfter.error,
  )

  const ownerBReadsOwnerA = await ownerB
    .from('legal_acceptances')
    .select('id')
    .eq('id', termsAcceptance.data)
  check(
    'Organization B cannot read organization A evidence',
    !ownerBReadsOwnerA.error && ownerBReadsOwnerA.data.length === 0,
    ownerBReadsOwnerA.error,
  )

  const updateAttempt = await ownerA
    .from('legal_acceptances')
    .update({ application_version: 'mutated' })
    .eq('id', termsAcceptance.data)
  const deleteAttempt = await ownerA
    .from('legal_acceptances')
    .delete()
    .eq('id', termsAcceptance.data)
  const immutableRow = await ownerA
    .from('legal_acceptances')
    .select('id,application_version,document_sha256')
    .eq('id', termsAcceptance.data)
    .single()
  check(
    'Existing evidence cannot be updated or deleted through the Data API',
    Boolean(updateAttempt.error)
      && Boolean(deleteAttempt.error)
      && !immutableRow.error
      && immutableRow.data.application_version === 'legal-current-document-rpc-v2'
      && immutableRow.data.document_sha256 === TERMS_PRO_HASH,
    immutableRow.error,
  )

  const anonymousInsert = await anonymous.from('legal_acceptances').insert(
    directEvidence('00000000-0000-4000-8000-000000000000', 'terms_client', VERSION),
  )
  const anonymousRpc = await anonymous.rpc(
    'accept_current_legal_document_v2',
    rpcArgs('terms_client'),
  )
  check('Anonymous direct writes are denied', Boolean(anonymousInsert.error), anonymousInsert.error)
  check('Anonymous RPC calls are denied', Boolean(anonymousRpc.error), anonymousRpc.error)

  const privateRegistry = await ownerA.from('legal_document_versions').select('document_id')
  check(
    'The private document registry stays outside the Data API',
    Boolean(privateRegistry.error) || privateRegistry.data.length === 0,
    privateRegistry.error,
  )

  console.log(`\nLegal V2 result: ${passed} passed, ${failed} failed.`)
  if (failed > 0) process.exitCode = 1
}

run().catch((error) => {
  console.error(`\nFatal ${testTarget} legal V2 validation error: ${error.message}`)
  process.exitCode = 1
})

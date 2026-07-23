/**
 * Journal d'acceptation des documents légaux (preuve opposable).
 * Chaque acceptation est enregistrée dans `public.legal_acceptances` avec :
 * user_id, rôle, type de document, VERSION acceptée, horodatage, user-agent
 * et contexte. RLS : un utilisateur ne lit/écrit QUE ses propres acceptations.
 * Aucune adresse IP n'est collectée côté frontend.
 *
 * Dans les comptes de présentation, tout est considéré comme accepté et
 * rien n'est enregistré — la démo ne doit jamais être bloquée par la gate.
 */
import { supabase } from '@/lib/supabase'
import { isDemo } from '@/lib/demo'
import {
  LEGAL_DOCUMENT_VERSIONS,
  HISTORICAL_LEGAL_VERSION,
  REQUIRED_LEGAL_DOCS,
  type LegalDocumentType,
  type LegalRole,
} from '@/config/legal'
import type { Lang } from '@/i18n'
import {
  LEGAL_EVIDENCE_APP_VERSION,
  LEGAL_V2_DOCUMENTS,
  type LegalDocumentDefinition,
  type LegalV2DocumentId,
} from '@/config/legalV2'
import { dpaSelfServiceEnabled, legalAcceptanceV2Enabled } from '@/lib/features'

export type AcceptanceContext = 'signup' | 'legal_gate' | 'garage_onboarding' | 'quote_acceptance'

export interface LegalAcceptanceRow {
  id: string
  user_id: string
  role: string
  document_type: string
  document_version: string
  accepted_at: string
  acceptance_context: string
  displayed_language: Lang | null
  document_id: string | null
  organization_id: string | null
  organization_name_snapshot: string | null
  document_sha256: string | null
  document_status: string | null
  application_version: string | null
  acceptance_scope: string | null
  authority_role: string | null
  evidence_source: string | null
}

export interface LegalAcceptanceEvidence {
  displayedLanguage: Lang
  organizationId?: string | null
}

export type AcceptableLegalV2DocumentId = Extract<LegalV2DocumentId, 'terms_pro' | 'terms_client' | 'dpa'>

export interface LegalV2AcceptanceCandidate {
  user_id: string
  document_type: string
  document_id: string | null
  document_version: string
  displayed_language: string | null
  organization_id: string | null
  document_sha256: string | null
  document_status: string | null
  acceptance_scope: string | null
}

const userAgent = () => (typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 500) : null)

/** Enregistre UNE acceptation pour l'utilisateur connecté (idempotent par version). */
export async function recordLegalAcceptance(
  documentType: LegalDocumentType,
  version: string,
  role: LegalRole,
  context: AcceptanceContext,
  evidence?: LegalAcceptanceEvidence,
): Promise<void> {
  if (isDemo()) return
  if (version === HISTORICAL_LEGAL_VERSION || documentType === 'pilot_agreement') {
    throw new Error('Historical legal documents cannot receive new acceptances')
  }
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth?.user?.id
  if (!uid) throw new Error('Utilisateur non connecté')

  // Idempotence : une seule ligne par (user, document, version) suffit comme preuve.
  const { data: existing } = await supabase
    .from('legal_acceptances')
    .select('id')
    .eq('user_id', uid)
    .eq('document_type', documentType)
    .eq('document_version', version)
    .limit(1)
  if ((existing ?? []).length > 0) return

  const { error } = await supabase.from('legal_acceptances').insert({
    user_id: uid,
    role,
    document_type: documentType,
    document_version: version,
    document_id: `${documentType}:${version}`,
    displayed_language: evidence?.displayedLanguage ?? null,
    // Legacy evidence is always user-scoped. Organization-level authority is
    // recorded only by recordLegalV2Acceptance and validated by the database.
    organization_id: null,
    user_agent: userAgent(),
    acceptance_context: context,
  })
  if (error) throw error
}

/**
 * Records a V2 acceptance only after both frontend flags and the immutable
 * document registry mark the exact localized version effective. The database
 * independently verifies every field and derives organization authority.
 */
export async function recordLegalV2Acceptance(
  documentId: AcceptableLegalV2DocumentId,
  role: LegalRole,
  context: AcceptanceContext,
  evidence: LegalAcceptanceEvidence,
): Promise<void> {
  if (!legalAcceptanceV2Enabled()) throw new Error('Legal acceptance V2 is disabled')
  if (documentId === 'dpa' && !dpaSelfServiceEnabled()) {
    throw new Error('DPA self-service is disabled')
  }
  if (isDemo()) return

  const document = LEGAL_V2_DOCUMENTS[documentId]
  if (document.status !== 'effective' || !document.effectiveAt || !document.requiresAcceptance) {
    throw new Error('Legal document is not effective')
  }
  if (document.acceptanceScope === 'organization' && !evidence.organizationId) {
    throw new Error('Organization evidence is required')
  }
  if (document.acceptanceScope === 'user' && evidence.organizationId) {
    throw new Error('User acceptance cannot claim an organization')
  }

  const { data: auth } = await supabase.auth.getUser()
  const uid = auth?.user?.id
  if (!uid) throw new Error('Utilisateur non connecté')
  const sha256 = document.sha256[evidence.displayedLanguage]

  if (await hasCurrentLegalV2Acceptance(documentId, uid, evidence.organizationId ?? null)) return

  const { error } = await supabase.from('legal_acceptances').insert({
    user_id: uid,
    role,
    document_type: documentId,
    document_version: document.version,
    document_id: document.documentId,
    displayed_language: evidence.displayedLanguage,
    organization_id: evidence.organizationId ?? null,
    document_sha256: sha256,
    document_status: document.status,
    application_version: LEGAL_EVIDENCE_APP_VERSION,
    acceptance_scope: document.acceptanceScope,
    authority_role: null,
    evidence_source: context,
    user_agent: userAgent(),
    acceptance_context: context,
  })
  if (error) throw error
}

/** Enregistre plusieurs acceptations (échoue si l'une échoue). */
export function requiredLegalV2Documents(
  role: LegalRole,
  includeDpa = dpaSelfServiceEnabled(),
): AcceptableLegalV2DocumentId[] {
  if (role === 'garage') return includeDpa ? ['terms_pro', 'dpa'] : ['terms_pro']
  return ['terms_client']
}

export function isCurrentLegalV2Acceptance(
  row: LegalV2AcceptanceCandidate,
  document: LegalDocumentDefinition,
  userId: string,
  organizationId: string | null,
): boolean {
  const language = row.displayed_language as Lang | null
  const expectedHash = language && language in document.sha256 ? document.sha256[language] : null
  if (
    document.status !== 'effective'
    || !document.effectiveAt
    || !document.requiresAcceptance
    || row.document_type !== document.documentId
    || row.document_id !== document.documentId
    || row.document_version !== document.version
    || row.document_status !== 'effective'
    || row.acceptance_scope !== document.acceptanceScope
    || !expectedHash
    || row.document_sha256 !== expectedHash
  ) return false

  if (document.acceptanceScope === 'organization') {
    return Boolean(organizationId) && row.organization_id === organizationId
  }
  return row.user_id === userId && row.organization_id === null
}

async function hasCurrentUserLegalV2Acceptance(
  documentId: AcceptableLegalV2DocumentId,
  userId: string,
): Promise<boolean> {
  const document = LEGAL_V2_DOCUMENTS[documentId]
  const { data, error } = await supabase
    .from('legal_acceptances')
    .select('user_id,document_type,document_id,document_version,displayed_language,organization_id,document_sha256,document_status,acceptance_scope')
    .eq('user_id', userId)
    .eq('document_type', documentId)
    .eq('document_version', document.version)
  if (error) throw error
  return (data ?? []).some((row) => isCurrentLegalV2Acceptance(
    row as LegalV2AcceptanceCandidate,
    document,
    userId,
    null,
  ))
}

async function hasCurrentOrganizationLegalV2Acceptance(
  documentId: AcceptableLegalV2DocumentId,
  organizationId: string,
): Promise<boolean> {
  const document = LEGAL_V2_DOCUMENTS[documentId]
  const { data, error } = await supabase.rpc('has_organization_legal_acceptance_v2', {
    p_organization_id: organizationId,
    p_document_id: document.documentId,
    p_document_version: document.version,
    p_document_hashes: Object.values(document.sha256),
  })
  if (error) throw error
  return data === true
}

export async function hasCurrentLegalV2Acceptance(
  documentId: AcceptableLegalV2DocumentId,
  userId: string,
  organizationId: string | null,
): Promise<boolean> {
  const document = LEGAL_V2_DOCUMENTS[documentId]
  if (document.status !== 'effective' || !document.effectiveAt || !document.requiresAcceptance) return false
  if (document.acceptanceScope === 'organization') {
    if (!organizationId) return false
    return hasCurrentOrganizationLegalV2Acceptance(documentId, organizationId)
  }
  return hasCurrentUserLegalV2Acceptance(documentId, userId)
}

export async function getMissingLegalV2Documents(
  userId: string,
  role: LegalRole,
  organizationId: string | null,
): Promise<AcceptableLegalV2DocumentId[]> {
  if (isDemo()) return []
  const required = requiredLegalV2Documents(role)
  if (required.some((documentId) => LEGAL_V2_DOCUMENTS[documentId].acceptanceScope === 'organization') && !organizationId) {
    throw new Error('Organization context is required for legal acceptance V2')
  }

  const missing: AcceptableLegalV2DocumentId[] = []
  for (const documentId of required) {
    if (!await hasCurrentLegalV2Acceptance(documentId, userId, organizationId)) missing.push(documentId)
  }
  return missing
}

export async function recordMultipleLegalAcceptances(
  items: { documentType: LegalDocumentType; version: string }[],
  role: LegalRole,
  context: AcceptanceContext,
  evidence?: LegalAcceptanceEvidence,
): Promise<void> {
  for (const item of items) {
    await recordLegalAcceptance(item.documentType, item.version, role, context, evidence)
  }
}

/** Documents requis (selon le rôle) dont la VERSION COURANTE n'a pas été acceptée. */
export async function getMissingLegalDocuments(
  userId: string,
  role: LegalRole,
): Promise<LegalDocumentType[]> {
  if (isDemo()) return []
  const required = REQUIRED_LEGAL_DOCS[role]
  const { data, error } = await supabase
    .from('legal_acceptances')
    .select('document_type, document_version')
    .eq('user_id', userId)
    .in('document_type', required)
  if (error) throw error
  const accepted = new Set(
    (data ?? []).map((r) => `${r.document_type}@${r.document_version}`),
  )
  return required.filter((doc) => !accepted.has(`${doc}@${LEGAL_DOCUMENT_VERSIONS[doc]}`))
}

/** Vrai si tous les documents requis (version courante) sont acceptés. */
export async function hasAcceptedRequiredDocuments(userId: string, role: LegalRole): Promise<boolean> {
  return (await getMissingLegalDocuments(userId, role)).length === 0
}

/** Historique d'acceptation de l'utilisateur connecté (page de statut légal). */
export async function listOwnLegalAcceptances(userId: string): Promise<LegalAcceptanceRow[]> {
  if (isDemo()) return []
  const { data, error } = await supabase
    .from('legal_acceptances')
    .select('id, user_id, role, document_type, document_version, accepted_at, acceptance_context, displayed_language, document_id, organization_id, organization_name_snapshot, document_sha256, document_status, application_version, acceptance_scope, authority_role, evidence_source')
    .eq('user_id', userId)
    .order('accepted_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as LegalAcceptanceRow[]
}

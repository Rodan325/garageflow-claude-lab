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
  LEGAL_V2_DOCUMENTS,
  type LegalDocumentDefinition,
  type LegalV2DocumentId,
} from '@/config/legalV2'
import { dpaSelfServiceEnabled, legalAcceptanceV2Enabled } from '@/lib/features'
import { hashCanonicalLegalDocumentById } from './legalCanonicalDocument'

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

export interface LegalV2AcceptanceStatus {
  accepted: boolean
  current: boolean
  can_accept: boolean
  reason: string
  document_key: AcceptableLegalV2DocumentId
  document_version: string | null
  document_sha256: string | null
  organization_id: string | null
  acceptance_scope: 'user' | 'organization' | null
  accepted_at: string | null
}

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

/** Legacy evidence is now immutable and cannot be created from the browser. */
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
  void role
  void context
  void evidence
  throw new Error('Legacy legal acceptance is read-only')
}

/**
 * Records a V2 acceptance only after both frontend flags and the immutable
 * document registry mark the exact localized version effective. The database
 * independently verifies every field and derives organization authority.
 */
export async function recordLegalV2Acceptance(
  documentId: AcceptableLegalV2DocumentId,
  evidence: LegalAcceptanceEvidence,
): Promise<void> {
  if (!legalAcceptanceV2Enabled()) throw new Error('Legal acceptance V2 is disabled')
  if (documentId === 'dpa' && !dpaSelfServiceEnabled()) {
    throw new Error('DPA self-service acceptance is disabled')
  }
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

  const sha256 = await hashCanonicalLegalDocumentById(documentId, evidence.displayedLanguage)
  if (sha256 !== document.sha256[evidence.displayedLanguage]) {
    throw new Error('Canonical legal document hash mismatch')
  }

  const status = await getLegalV2AcceptanceStatus(
    documentId,
    evidence.displayedLanguage,
    evidence.organizationId ?? null,
  )
  if (status.accepted) return
  if (!status.current || !status.can_accept) {
    throw new Error(`Legal acceptance is unavailable: ${status.reason}`)
  }
  if (
    status.document_version !== document.version
    || status.document_sha256 !== sha256
    || status.acceptance_scope !== document.acceptanceScope
  ) {
    throw new Error('Current legal registry does not match the displayed document')
  }

  const { error } = await supabase.rpc('accept_current_legal_document_v2', {
    p_document_key: documentId,
    p_language: evidence.displayedLanguage,
    p_organization_id: evidence.organizationId ?? null,
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

export async function getLegalV2AcceptanceStatus(
  documentId: AcceptableLegalV2DocumentId,
  language: Lang,
  organizationId: string | null,
): Promise<LegalV2AcceptanceStatus> {
  const document = LEGAL_V2_DOCUMENTS[documentId]
  const scopedOrganizationId = document.acceptanceScope === 'organization' ? organizationId : null
  const { data, error } = await supabase.rpc('get_current_legal_acceptance_status_v2', {
    p_document_key: documentId,
    p_language: language,
    p_organization_id: scopedOrganizationId,
  })
  if (error) throw error

  const row = data?.[0]
  if (!row || row.document_key !== documentId) {
    throw new Error('Current legal acceptance status is unavailable')
  }

  const canonicalHash = await hashCanonicalLegalDocumentById(documentId, language)
  const clientMatchesRegistry = (
    document.status === 'effective'
    && Boolean(document.effectiveAt)
    && document.requiresAcceptance
    && row.current
    && row.document_version === document.version
    && row.document_sha256 === canonicalHash
    && canonicalHash === document.sha256[language]
    && row.acceptance_scope === document.acceptanceScope
  )
  const selfServiceEnabled = documentId !== 'dpa' || dpaSelfServiceEnabled()

  return {
    ...row,
    document_key: documentId,
    accepted: clientMatchesRegistry && row.accepted,
    current: clientMatchesRegistry,
    can_accept: clientMatchesRegistry && selfServiceEnabled && row.can_accept,
    reason: !clientMatchesRegistry
      ? 'client_registry_mismatch'
      : selfServiceEnabled
        ? row.reason
        : 'dpa_self_service_disabled',
  } as LegalV2AcceptanceStatus
}

export async function getLegalV2AcceptanceStatuses(
  role: LegalRole,
  organizationId: string | null,
  language: Lang,
): Promise<LegalV2AcceptanceStatus[]> {
  if (isDemo()) return []
  const required = requiredLegalV2Documents(role)
  if (
    required.some((documentId) => LEGAL_V2_DOCUMENTS[documentId].acceptanceScope === 'organization')
    && !organizationId
  ) {
    throw new Error('Organization context is required for legal acceptance V2')
  }
  return Promise.all(required.map((documentId) => getLegalV2AcceptanceStatus(
    documentId,
    language,
    organizationId,
  )))
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
  language: Lang = 'fr',
): Promise<AcceptableLegalV2DocumentId[]> {
  void userId
  const statuses = await getLegalV2AcceptanceStatuses(role, organizationId, language)
  return statuses.filter((status) => !status.accepted).map((status) => status.document_key)
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

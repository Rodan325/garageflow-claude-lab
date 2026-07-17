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
  REQUIRED_LEGAL_DOCS,
  type LegalDocumentType,
  type LegalRole,
} from '@/config/legal'

export type AcceptanceContext = 'signup' | 'legal_gate' | 'garage_onboarding' | 'quote_acceptance'

export interface LegalAcceptanceRow {
  id: string
  user_id: string
  role: string
  document_type: string
  document_version: string
  accepted_at: string
  acceptance_context: string
}

const userAgent = () => (typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 500) : null)

/** Enregistre UNE acceptation pour l'utilisateur connecté (idempotent par version). */
export async function recordLegalAcceptance(
  documentType: LegalDocumentType,
  version: string,
  role: LegalRole,
  context: AcceptanceContext,
): Promise<void> {
  if (isDemo()) return
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
    user_agent: userAgent(),
    acceptance_context: context,
  })
  if (error) throw error
}

/** Enregistre plusieurs acceptations (échoue si l'une échoue). */
export async function recordMultipleLegalAcceptances(
  items: { documentType: LegalDocumentType; version: string }[],
  role: LegalRole,
  context: AcceptanceContext,
): Promise<void> {
  for (const item of items) {
    await recordLegalAcceptance(item.documentType, item.version, role, context)
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
    .select('id, user_id, role, document_type, document_version, accepted_at, acceptance_context')
    .eq('user_id', userId)
    .order('accepted_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as LegalAcceptanceRow[]
}

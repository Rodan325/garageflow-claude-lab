import type { Lang } from '@/i18n'
import type { Tone } from '@/types/domain'

export type RecommendationUrgency = 'critical' | 'recommended' | 'preventive' | 'information'
export type RecommendationStatus =
  | 'draft'
  | 'proposed'
  | 'accepted'
  | 'declined'
  | 'callback_requested'
  | 'cancelled'
  | 'completed'
export type RecommendationDecision = 'accepted' | 'declined' | 'callback_requested' | 'question'

export interface WorkshopRecommendation {
  id: string
  garage_id: string
  center_id: string | null
  service_request_id: string
  title: string
  description: string | null
  category: string | null
  urgency: RecommendationUrgency
  reason: string | null
  estimated_price: number | null
  estimated_duration_minutes: number | null
  affects_delivery_time: boolean
  proposed_delivery_at: string | null
  status: RecommendationStatus
  created_by: string | null
  created_at: string
  decided_at: string | null
  customer_decision_note: string | null
}

export interface RecommendationDecisionEvent {
  id: string
  recommendation_id: string
  garage_id: string
  service_request_id: string
  action: RecommendationDecision | 'proposed' | 'cancelled' | 'completed'
  previous_status: RecommendationStatus
  new_status: RecommendationStatus
  decided_by: string | null
  occurred_at: string
  legal_terms_version: string | null
  legal_privacy_version: string | null
  displayed_language: string | null
  note: string | null
  visible_to_customer: boolean
}

const URGENCY_LABELS: Record<Lang, Record<RecommendationUrgency, string>> = {
  fr: { critical: 'Critique', recommended: 'Recommandé', preventive: 'Préventif', information: 'Information' },
  en: { critical: 'Critical', recommended: 'Recommended', preventive: 'Preventive', information: 'Information' },
  ar: { critical: 'حرج', recommended: 'موصى به', preventive: 'وقائي', information: 'معلومة' },
}

const STATUS_LABELS: Record<Lang, Record<RecommendationStatus, string>> = {
  fr: { draft: 'Brouillon', proposed: 'Proposée', accepted: 'Acceptée', declined: 'Refusée', callback_requested: 'Rappel demandé', cancelled: 'Annulée', completed: 'Réalisée' },
  en: { draft: 'Draft', proposed: 'Proposed', accepted: 'Accepted', declined: 'Declined', callback_requested: 'Callback requested', cancelled: 'Cancelled', completed: 'Completed' },
  ar: { draft: 'مسودة', proposed: 'مقترحة', accepted: 'مقبولة', declined: 'مرفوضة', callback_requested: 'طلب معاودة الاتصال', cancelled: 'ملغاة', completed: 'منجزة' },
}

const URGENCY_TONES: Record<RecommendationUrgency, Tone> = {
  critical: 'danger', recommended: 'warning', preventive: 'info', information: 'neutral',
}

const STATUS_TONES: Record<RecommendationStatus, Tone> = {
  draft: 'neutral', proposed: 'info', accepted: 'success', declined: 'danger',
  callback_requested: 'warning', cancelled: 'neutral', completed: 'success',
}

export function recommendationUrgencyMeta(urgency: RecommendationUrgency, lang: Lang) {
  return { label: URGENCY_LABELS[lang][urgency], tone: URGENCY_TONES[urgency] }
}

export function recommendationStatusMeta(status: RecommendationStatus, lang: Lang) {
  return { label: STATUS_LABELS[lang][status], tone: STATUS_TONES[status] }
}

export function customerDecisionStatus(action: RecommendationDecision, current: RecommendationStatus): RecommendationStatus {
  if (current !== 'proposed' && current !== 'callback_requested') {
    throw new Error(`Recommendation cannot be decided from ${current}`)
  }
  if (action === 'question') return current
  return action
}

export function canStaffTransitionRecommendation(previous: RecommendationStatus, next: RecommendationStatus) {
  return (
    (previous === 'draft' && (next === 'proposed' || next === 'cancelled'))
    || (previous === 'proposed' && next === 'cancelled')
    || (previous === 'callback_requested' && (next === 'proposed' || next === 'cancelled'))
    || (previous === 'accepted' && (next === 'completed' || next === 'cancelled'))
    || (previous === 'declined' && next === 'cancelled')
  )
}

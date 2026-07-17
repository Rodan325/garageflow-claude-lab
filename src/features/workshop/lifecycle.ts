import type { Lang } from '@/i18n'
import type { Tone, WorkshopStage } from '@/types/domain'

export const WORKSHOP_STAGES: WorkshopStage[] = [
  'appointment_confirmed',
  'vehicle_expected',
  'vehicle_checked_in',
  'vehicle_received',
  'diagnosis_in_progress',
  'customer_approval_required',
  'work_authorized',
  'work_in_progress',
  'quality_control',
  'vehicle_ready',
  'vehicle_delivered',
  'closed',
]

const NEXT_STAGES: Record<WorkshopStage, WorkshopStage[]> = {
  appointment_confirmed: ['vehicle_expected'],
  vehicle_expected: ['vehicle_checked_in'],
  vehicle_checked_in: ['vehicle_received'],
  vehicle_received: ['diagnosis_in_progress'],
  diagnosis_in_progress: ['customer_approval_required', 'work_authorized'],
  customer_approval_required: ['work_authorized'],
  work_authorized: ['work_in_progress'],
  work_in_progress: ['quality_control'],
  quality_control: ['work_in_progress', 'vehicle_ready'],
  vehicle_ready: ['vehicle_delivered'],
  vehicle_delivered: ['closed'],
  closed: [],
}

const LABELS: Record<Lang, Record<WorkshopStage, string>> = {
  fr: {
    appointment_confirmed: 'Rendez-vous confirmé',
    vehicle_expected: 'Véhicule attendu',
    vehicle_checked_in: 'Dépôt enregistré',
    vehicle_received: 'Véhicule réceptionné',
    diagnosis_in_progress: 'Diagnostic en cours',
    customer_approval_required: 'Accord client requis',
    work_authorized: 'Travaux autorisés',
    work_in_progress: 'Intervention en cours',
    quality_control: 'Contrôle qualité',
    vehicle_ready: 'Véhicule prêt',
    vehicle_delivered: 'Véhicule restitué',
    closed: 'Dossier clôturé',
  },
  en: {
    appointment_confirmed: 'Appointment confirmed',
    vehicle_expected: 'Vehicle expected',
    vehicle_checked_in: 'Check-in recorded',
    vehicle_received: 'Vehicle received',
    diagnosis_in_progress: 'Diagnosis in progress',
    customer_approval_required: 'Customer approval required',
    work_authorized: 'Work authorised',
    work_in_progress: 'Work in progress',
    quality_control: 'Quality control',
    vehicle_ready: 'Vehicle ready',
    vehicle_delivered: 'Vehicle delivered',
    closed: 'Case closed',
  },
  ar: {
    appointment_confirmed: 'تم تأكيد الموعد',
    vehicle_expected: 'السيارة منتظرة',
    vehicle_checked_in: 'تم تسجيل إيداع السيارة',
    vehicle_received: 'تم استلام السيارة',
    diagnosis_in_progress: 'التشخيص جارٍ',
    customer_approval_required: 'موافقة العميل مطلوبة',
    work_authorized: 'تمت الموافقة على الأشغال',
    work_in_progress: 'الأشغال جارية',
    quality_control: 'مراقبة الجودة',
    vehicle_ready: 'السيارة جاهزة',
    vehicle_delivered: 'تم تسليم السيارة',
    closed: 'تم إغلاق الملف',
  },
}

const TONES: Record<WorkshopStage, Tone> = {
  appointment_confirmed: 'info',
  vehicle_expected: 'info',
  vehicle_checked_in: 'primary',
  vehicle_received: 'primary',
  diagnosis_in_progress: 'warning',
  customer_approval_required: 'warning',
  work_authorized: 'success',
  work_in_progress: 'primary',
  quality_control: 'info',
  vehicle_ready: 'success',
  vehicle_delivered: 'success',
  closed: 'neutral',
}

export function isWorkshopStage(value: unknown): value is WorkshopStage {
  return typeof value === 'string' && WORKSHOP_STAGES.includes(value as WorkshopStage)
}

export function workshopStageMeta(stage: WorkshopStage, lang: Lang) {
  return { label: LABELS[lang][stage], tone: TONES[stage] }
}

export function allowedWorkshopTransitions(stage: WorkshopStage | null): WorkshopStage[] {
  return stage === null ? ['appointment_confirmed'] : NEXT_STAGES[stage]
}

export function canTransitionWorkshopStage(previous: WorkshopStage | null, next: WorkshopStage): boolean {
  return allowedWorkshopTransitions(previous).includes(next)
}

export function assertWorkshopTransition(previous: WorkshopStage | null, next: WorkshopStage): void {
  if (!canTransitionWorkshopStage(previous, next)) {
    throw new Error(`Invalid workshop transition: ${previous ?? 'none'} -> ${next}`)
  }
}

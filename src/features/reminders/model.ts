import type { Lang } from '@/i18n'
import type { Tone } from '@/types/domain'

export type ReminderType = 'fixed_date' | 'after_service' | 'mileage' | 'date_or_mileage' | 'seasonal_campaign'
export type ReminderStatus = 'scheduled' | 'sent' | 'opened' | 'converted' | 'ignored' | 'cancelled'

export interface MaintenanceReminder {
  id: string
  garage_id: string
  center_id: string | null
  client_id: string
  vehicle_id: string | null
  client_vehicle_id: string | null
  service_request_id: string | null
  reminder_type: ReminderType
  title: string
  due_date: string | null
  due_mileage: number | null
  status: ReminderStatus
  scheduled_at: string
  sent_at: string | null
  converted_request_id: string | null
  source: string
  created_by: string | null
  created_at: string
}

const labels: Record<Lang, Record<ReminderStatus, string>> = {
  fr: { scheduled: 'Planifié', sent: 'Envoyé', opened: 'Ouvert', converted: 'Converti', ignored: 'Ignoré', cancelled: 'Annulé' },
  en: { scheduled: 'Scheduled', sent: 'Sent', opened: 'Opened', converted: 'Converted', ignored: 'Ignored', cancelled: 'Cancelled' },
  ar: { scheduled: 'مجدول', sent: 'مُرسل', opened: 'مفتوح', converted: 'محوّل', ignored: 'متجاهل', cancelled: 'ملغى' },
}
const tones: Record<ReminderStatus, Tone> = {
  scheduled: 'info', sent: 'primary', opened: 'warning', converted: 'success', ignored: 'neutral', cancelled: 'neutral',
}

export function reminderStatusMeta(status: ReminderStatus, lang: Lang) {
  return { label: labels[lang][status], tone: tones[status] }
}

export function reminderIsDue(reminder: Pick<MaintenanceReminder, 'due_date' | 'due_mileage'>, currentMileage?: number | null, now = new Date()) {
  const dateDue = !!reminder.due_date && reminder.due_date <= now.toISOString().slice(0, 10)
  const mileageDue = reminder.due_mileage !== null && currentMileage !== null && currentMileage !== undefined
    && currentMileage >= reminder.due_mileage
  return dateDue || mileageDue
}

import type { Appointment, GarageCenter, Quote, ServiceRequest } from '@/types/domain'
import type { MaintenanceReminder } from '@/features/reminders/model'

export interface CenterNetworkMetrics {
  center_id: string
  center_name: string
  appointments: number
  interventions: number
  quote_amount: number
  accepted_amount: number
  acceptance_rate: number | null
  average_decision_hours: number | null
  average_intervention_hours: number | null
  vehicles_waiting: number
  delays: number
  reminders_converted: number
  satisfaction: number | null
}

export function canViewNetworkDashboard(
  legacyRole: string | null | undefined,
  organizationRole: string | null | undefined,
  centerCount: number,
  enabled: boolean,
) {
  const permitted = ['owner', 'admin'].includes(legacyRole ?? '')
    || ['organization_owner', 'network_admin', 'regional_manager'].includes(organizationRole ?? '')
  return enabled && centerCount > 1 && permitted
}

function hoursBetween(start?: string | null, end?: string | null) {
  if (!start || !end) return null
  const hours = (new Date(end).getTime() - new Date(start).getTime()) / 3_600_000
  return Number.isFinite(hours) && hours >= 0 ? hours : null
}

function average(values: Array<number | null>) {
  const usable = values.filter((value): value is number => value !== null)
  return usable.length ? usable.reduce((sum, value) => sum + value, 0) / usable.length : null
}

export function aggregateNetworkDashboard(input: {
  centers: GarageCenter[]
  requests: ServiceRequest[]
  quotes: Quote[]
  appointments: Appointment[]
  reminders: MaintenanceReminder[]
  now?: Date
}): CenterNetworkMetrics[] {
  const now = input.now ?? new Date()
  return input.centers.filter((center) => center.is_active).map((center) => {
    const requests = input.requests.filter((request) => request.center_id === center.id)
    const requestIds = new Set(requests.map((request) => request.id))
    const quotes = input.quotes.filter((quote) => !!quote.service_request_id && requestIds.has(quote.service_request_id))
    const decidedQuotes = quotes.filter((quote) => ['accepted', 'declined'].includes(quote.status))
    const acceptedQuotes = quotes.filter((quote) => quote.status === 'accepted')
    return {
      center_id: center.id,
      center_name: center.name,
      appointments: input.appointments.filter((appointment) => appointment.center_id === center.id).length,
      interventions: requests.length,
      quote_amount: quotes.reduce((sum, quote) => sum + quote.total, 0),
      accepted_amount: acceptedQuotes.reduce((sum, quote) => sum + quote.total, 0),
      acceptance_rate: decidedQuotes.length ? acceptedQuotes.length / decidedQuotes.length : null,
      average_decision_hours: average(decidedQuotes.map((quote) => hoursBetween(quote.sent_at, quote.accepted_at ?? quote.declined_at))),
      average_intervention_hours: average(requests.map((request) => hoursBetween(request.vehicle_checked_in_at, request.vehicle_delivered_at))),
      vehicles_waiting: requests.filter((request) => !['vehicle_delivered', 'closed'].includes(request.workshop_stage ?? '')).length,
      delays: requests.filter((request) => !!request.estimated_completion_at && new Date(request.estimated_completion_at) < now && !['vehicle_delivered', 'closed'].includes(request.workshop_stage ?? '')).length,
      reminders_converted: input.reminders.filter((reminder) => reminder.center_id === center.id && reminder.status === 'converted').length,
      satisfaction: null,
    }
  })
}

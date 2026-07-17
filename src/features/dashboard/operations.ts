import type { Appointment, Quote, ServiceRequest, WorkshopStage } from '@/types/domain'
import type { MaintenanceReminder } from '@/features/reminders/model'
import { isWorkshopStage } from '@/features/workshop/lifecycle'

export type DashboardPeriod = 'today' | '7d' | '30d' | 'all'
export type DashboardStatusFilter = 'all' | 'attention' | 'in_work' | 'ready'

export interface OperationalDashboardInput {
  requests: ServiceRequest[]
  quotes: Quote[]
  appointments: Appointment[]
  reminders: MaintenanceReminder[]
  period?: DashboardPeriod
  status?: DashboardStatusFilter
  advisorId?: string
  now?: Date
}

const presentStages = new Set<WorkshopStage>([
  'vehicle_checked_in', 'vehicle_received', 'diagnosis_in_progress', 'customer_approval_required',
  'work_authorized', 'work_in_progress', 'quality_control', 'vehicle_ready',
])
const workStages = new Set<WorkshopStage>(['work_authorized', 'work_in_progress'])
const closedStages = new Set<WorkshopStage>(['vehicle_delivered', 'closed'])

function requestStage(request: ServiceRequest): WorkshopStage | null {
  return isWorkshopStage(request.workshop_stage) ? request.workshop_stage : null
}

function periodStart(period: DashboardPeriod, now: Date) {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  if (period === '7d') start.setDate(start.getDate() - 6)
  if (period === '30d') start.setDate(start.getDate() - 29)
  return start
}

function inPeriod(value: string | null | undefined, period: DashboardPeriod, now: Date) {
  if (period === 'all') return true
  if (!value) return false
  const date = new Date(value)
  const start = periodStart(period, now)
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  return date >= start && date <= end
}

function matchesStatus(request: ServiceRequest, filter: DashboardStatusFilter) {
  const stage = requestStage(request)
  if (filter === 'all') return true
  if (filter === 'attention') return request.status === 'pending' || stage === 'customer_approval_required'
  if (filter === 'in_work') return !!stage && workStages.has(stage)
  return stage === 'vehicle_ready'
}

export function operationalDashboard(input: OperationalDashboardInput) {
  const now = input.now ?? new Date()
  const period = input.period ?? 'today'
  const status = input.status ?? 'all'
  const day = now.toISOString().slice(0, 10)
  const advisorAppointmentIds = new Set(
    input.appointments.filter((appointment) => !input.advisorId || appointment.assigned_to === input.advisorId).map((appointment) => appointment.id),
  )
  const requests = input.requests.filter((request) => {
    const relevantDate = request.requested_date ?? request.created_at
    return inPeriod(relevantDate, period, now)
      && matchesStatus(request, status)
      && (!input.advisorId || (!!request.appointment_id && advisorAppointmentIds.has(request.appointment_id)))
  })
  const requestIds = new Set(requests.map((request) => request.id))
  const quotes = input.quotes.filter((quote) =>
    inPeriod(quote.created_at, period, now)
    && (!input.advisorId || (!!quote.service_request_id && requestIds.has(quote.service_request_id))),
  )
  const appointments = input.appointments.filter((appointment) =>
    inPeriod(appointment.starts_at, period, now)
    && (!input.advisorId || appointment.assigned_to === input.advisorId),
  )
  const decisions = quotes.filter((quote) => quote.status === 'accepted' || quote.status === 'declined')
  const accepted = quotes.filter((quote) => quote.status === 'accepted')

  return {
    expectedToday: requests.filter((request) => request.requested_date === day && ['appointment_confirmed', 'vehicle_expected'].includes(requestStage(request) ?? '')).length,
    vehiclesPresent: requests.filter((request) => {
      const stage = requestStage(request)
      return !!stage && presentStages.has(stage)
    }).length,
    approvalsPending: requests.filter((request) => requestStage(request) === 'customer_approval_required').length,
    workInProgress: requests.filter((request) => {
      const stage = requestStage(request)
      return !!stage && workStages.has(stage)
    }).length,
    qualityControl: requests.filter((request) => requestStage(request) === 'quality_control').length,
    ready: requests.filter((request) => requestStage(request) === 'vehicle_ready').length,
    delayed: requests.filter((request) => {
      const stage = requestStage(request)
      return !!request.estimated_completion_at
        && new Date(request.estimated_completion_at) < now
        && (!stage || !closedStages.has(stage))
    }).length,
    quotesSent: quotes.filter((quote) => ['sent', 'accepted', 'declined'].includes(quote.status)).length,
    acceptanceRate: decisions.length ? accepted.length / decisions.length : null,
    acceptedAmount: accepted.reduce((total, quote) => total + quote.total, 0),
    upcomingAppointments: appointments.filter((appointment) => new Date(appointment.starts_at) >= now).length,
    activeReminders: input.reminders.filter((reminder) => ['scheduled', 'sent', 'opened'].includes(reminder.status)).length,
    satisfaction: null,
  }
}

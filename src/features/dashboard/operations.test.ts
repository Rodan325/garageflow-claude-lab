import { describe, expect, it } from 'vitest'
import type { Appointment, Quote, ServiceRequest } from '@/types/domain'
import type { MaintenanceReminder } from '@/features/reminders/model'
import { operationalDashboard } from './operations'

const request = (stage: ServiceRequest['workshop_stage'], extra: Partial<ServiceRequest> = {}) => ({
  id: crypto.randomUUID(), garage_id: 'g1', client_id: 'c1', reference: 'REQ', service_id: null,
  service_name: 'Service', vehicle_label: 'Vehicle', requested_date: '2026-07-15', requested_time: null,
  proposed_date: null, proposed_time: null, note: null, contact_name: null, contact_phone: null,
  contact_email: null, status: 'confirmed', customer_id: null, appointment_id: null, center_id: null,
  client_stage: null, client_vehicle_id: null, workshop_stage: stage,
  estimated_completion_at: null, vehicle_checked_in_at: null, vehicle_delivered_at: null,
  created_at: '2026-07-15T08:00:00Z', updated_at: '2026-07-15T08:00:00Z', ...extra,
}) as ServiceRequest

describe('independent garage operational dashboard', () => {
  it('computes the workshop workload and delays from current stages', () => {
    const requests = [
      request('vehicle_expected'), request('vehicle_received'), request('customer_approval_required'),
      request('work_in_progress', { estimated_completion_at: '2026-07-15T09:00:00Z' }),
      request('quality_control'), request('vehicle_ready'), request('vehicle_delivered', { estimated_completion_at: '2026-07-14T09:00:00Z' }),
    ]
    const metrics = operationalDashboard({ requests, quotes: [], appointments: [], reminders: [], now: new Date('2026-07-15T12:00:00Z') })
    expect(metrics).toMatchObject({ expectedToday: 1, vehiclesPresent: 5, approvalsPending: 1, workInProgress: 1, qualityControl: 1, ready: 1, delayed: 1 })
  })

  it('computes quote performance without inventing satisfaction data', () => {
    const quotes = [
      { status: 'accepted', total: 1200, created_at: '2026-07-15T08:00:00Z' },
      { status: 'declined', total: 500, created_at: '2026-07-15T09:00:00Z' },
      { status: 'sent', total: 300, created_at: '2026-07-15T10:00:00Z' },
    ] as Quote[]
    const appointments = [{ starts_at: '2026-07-15T15:00:00Z', assigned_to: 'advisor-1' }] as Appointment[]
    const reminders = [{ status: 'scheduled' }] as MaintenanceReminder[]
    const metrics = operationalDashboard({ requests: [], quotes, appointments, reminders, now: new Date('2026-07-15T12:00:00Z') })
    expect(metrics.quotesSent).toBe(3)
    expect(metrics.acceptanceRate).toBe(0.5)
    expect(metrics.acceptedAmount).toBe(1200)
    expect(metrics.upcomingAppointments).toBe(1)
    expect(metrics.activeReminders).toBe(1)
    expect(metrics.satisfaction).toBeNull()
  })

  it('filters linked requests and quotes through appointment advisor assignments', () => {
    const appointments = [
      { id: 'a1', starts_at: '2026-07-15T15:00:00Z', assigned_to: 'advisor-1' },
      { id: 'a2', starts_at: '2026-07-15T16:00:00Z', assigned_to: 'advisor-2' },
    ] as Appointment[]
    const requests = [
      request('vehicle_ready', { id: 'r1', appointment_id: 'a1' }),
      request('vehicle_ready', { id: 'r2', appointment_id: 'a2' }),
    ]
    const quotes = [
      { status: 'accepted', total: 100, service_request_id: 'r1', created_at: '2026-07-15T08:00:00Z' },
      { status: 'accepted', total: 200, service_request_id: 'r2', created_at: '2026-07-15T08:00:00Z' },
    ] as Quote[]
    const metrics = operationalDashboard({ requests, quotes, appointments, reminders: [], advisorId: 'advisor-1', now: new Date('2026-07-15T12:00:00Z') })
    expect(metrics.ready).toBe(1)
    expect(metrics.acceptedAmount).toBe(100)
  })
})

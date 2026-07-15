import { describe, expect, it } from 'vitest'
import type { Appointment, GarageCenter, Quote, ServiceRequest } from '@/types/domain'
import type { MaintenanceReminder } from '@/features/reminders/model'
import { aggregateNetworkDashboard, canViewNetworkDashboard } from './model'

describe('generic network dashboard', () => {
  it('stays hidden for an independent garage and non-network roles', () => {
    expect(canViewNetworkDashboard('owner', null, 1, true)).toBe(false)
    expect(canViewNetworkDashboard('advisor', null, 3, true)).toBe(false)
    expect(canViewNetworkDashboard('owner', null, 3, false)).toBe(false)
  })

  it('supports legacy owners and generic network roles with multiple centers', () => {
    expect(canViewNetworkDashboard('owner', null, 3, true)).toBe(true)
    expect(canViewNetworkDashboard(null, 'regional_manager', 3, true)).toBe(true)
  })

  it('compares centers without inventing satisfaction data', () => {
    const centers = [
      { id: 'c1', name: 'Centre 1', is_active: true },
      { id: 'c2', name: 'Centre 2', is_active: true },
    ] as GarageCenter[]
    const requests = [
      { id: 'r1', center_id: 'c1', workshop_stage: 'vehicle_ready', estimated_completion_at: '2026-07-15T10:00:00Z' },
      { id: 'r2', center_id: 'c2', workshop_stage: 'vehicle_delivered', vehicle_checked_in_at: '2026-07-15T08:00:00Z', vehicle_delivered_at: '2026-07-15T12:00:00Z' },
    ] as unknown as ServiceRequest[]
    const quotes = [{ service_request_id: 'r1', status: 'accepted', total: 500, sent_at: '2026-07-15T08:00:00Z', accepted_at: '2026-07-15T09:00:00Z' }] as Quote[]
    const appointments = [{ center_id: 'c1' }, { center_id: 'c2' }] as unknown as Appointment[]
    const reminders = [{ center_id: 'c1', status: 'converted' }] as MaintenanceReminder[]
    const rows = aggregateNetworkDashboard({ centers, requests, quotes, appointments, reminders, now: new Date('2026-07-15T12:00:00Z') })
    expect(rows[0]).toMatchObject({ accepted_amount: 500, acceptance_rate: 1, delays: 1, reminders_converted: 1, satisfaction: null })
    expect(rows[1].average_intervention_hours).toBe(4)
  })
})

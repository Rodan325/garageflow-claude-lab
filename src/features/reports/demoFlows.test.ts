import { beforeEach, describe, expect, it } from 'vitest'
import { demo, DEMO_CLIENT_ID, DEMO_GARAGE_ID, setDemoKind } from '@/lib/demo'

describe('delivery report and reminder demo flows', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    setDemoKind('garage')
  })

  it('finalizes an immutable report while preserving mileage integrity', () => {
    const request = demo.createRequest({
      garage_id: DEMO_GARAGE_ID,
      client_id: DEMO_CLIENT_ID,
      service_name: 'Contrôle annuel',
      vehicle_label: 'Renault Clio · AA-123-AA',
    })
    const draft = demo.saveDeliveryReport(request.id, { entry_mileage: 80000, exit_mileage: 80015 })
    expect(draft.status).toBe('draft')

    const finalized = demo.saveDeliveryReport(request.id, { completed_work: ['Contrôle qualité'] }, true)
    expect(finalized.status).toBe('finalized')
    expect(finalized.finalized_at).not.toBeNull()
    expect(() => demo.saveDeliveryReport(request.id, { observations: 'late edit' })).toThrow('immutable')
  })

  it('converts a reminder into a new request without changing the original service request', () => {
    const originalRequests = demo.garageRequests()
    const reminder = demo.maintenanceReminders(DEMO_GARAGE_ID, DEMO_CLIENT_ID)[0]
    const result = demo.convertMaintenanceReminder(reminder.id)

    expect(result.reminder.status).toBe('converted')
    expect(result.reminder.converted_request_id).toBe(result.request.id)
    expect(demo.garageRequests()).toHaveLength(originalRequests.length + 1)
    expect(demo.garageRequests().find((item) => item.id === reminder.service_request_id)).toBeDefined()
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearDemo,
  demo,
  resetDemoData,
  setDemoKind,
  setDemoOrganizationKind,
} from '@/lib/demo'

describe('demo center transfer flow', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    setDemoOrganizationKind('network')
    setDemoKind('garage')
    resetDemoData()
  })

  it('keeps the request in place until customer confirmation and staff completion', () => {
    const request = demo.garageRequests()[0]
    const destination = demo.centers().find((center) => center.id !== request.center_id)!
    const transfer = demo.proposeCenterTransfer(request.id, destination.id, 'Capacity')
    expect(demo.garageRequests()[0].center_id).toBe(request.center_id)
    expect(transfer.status).toBe('proposed')

    const confirmed = demo.transitionCenterTransfer(transfer.id, 'confirm')
    expect(confirmed.status).toBe('customer_confirmed')
    expect(demo.garageRequests()[0].center_id).toBe(request.center_id)

    const completed = demo.transitionCenterTransfer(transfer.id, 'complete')
    expect(completed.status).toBe('completed')
    expect(demo.garageRequests()[0].center_id).toBe(destination.id)
    expect(demo.serviceRequestTransferEvents(transfer.id).map((event) => event.new_status))
      .toEqual(['proposed', 'customer_confirmed', 'completed'])
    clearDemo()
  })

  it('does not allow two concurrent transfers for one request', () => {
    const request = demo.garageRequests()[0]
    const destinations = demo.centers().filter((center) => center.id !== request.center_id)
    demo.proposeCenterTransfer(request.id, destinations[0].id)
    expect(() => demo.proposeCenterTransfer(request.id, destinations[1].id)).toThrow('TRANSFER_ALREADY_OPEN')
  })
})

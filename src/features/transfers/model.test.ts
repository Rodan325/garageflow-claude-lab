import { describe, expect, it } from 'vitest'
import { assertTransferScope, transitionTransferStatus } from './model'

const request = { garage_id: 'org-a', center_id: 'center-a' }
const source = { id: 'center-a', garage_id: 'org-a', is_active: true }
const destination = { id: 'center-b', garage_id: 'org-a', is_active: true }

describe('center transfer rules', () => {
  it('allows a transfer between two active centers of the same organization', () => {
    expect(() => assertTransferScope(request, source, destination)).not.toThrow()
  })

  it('rejects an inter-organization transfer', () => {
    expect(() => assertTransferScope(request, source, { ...destination, garage_id: 'org-b' }))
      .toThrow('TRANSFER_CROSS_ORGANIZATION')
  })

  it('rejects stale, inactive and identical centers', () => {
    expect(() => assertTransferScope({ ...request, center_id: 'other' }, source, destination))
      .toThrow('TRANSFER_SOURCE_MISMATCH')
    expect(() => assertTransferScope(request, source, { ...destination, is_active: false }))
      .toThrow('TRANSFER_CENTER_INACTIVE')
    expect(() => assertTransferScope(request, source, source)).toThrow('TRANSFER_SAME_CENTER')
  })

  it('requires customer confirmation before completion', () => {
    expect(transitionTransferStatus('proposed', 'confirm')).toBe('customer_confirmed')
    expect(transitionTransferStatus('proposed', 'decline')).toBe('cancelled')
    expect(transitionTransferStatus('customer_confirmed', 'complete')).toBe('completed')
    expect(() => transitionTransferStatus('proposed', 'complete')).toThrow('INVALID_TRANSFER_TRANSITION')
  })
})

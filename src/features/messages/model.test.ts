import { describe, expect, it } from 'vitest'
import { isRequestConversationWritable } from './model'

describe('service request conversation status', () => {
  it.each([
    'pending',
    'accepted',
    'reschedule_proposed',
    'confirmed',
    'completed',
  ] as const)('allows messages while request status is %s', (status) => {
    expect(isRequestConversationWritable({ status, workshop_stage: null })).toBe(true)
  })

  it.each(['declined', 'cancelled'] as const)(
    'makes a %s request read-only',
    (status) => {
      expect(isRequestConversationWritable({ status, workshop_stage: null })).toBe(false)
    },
  )

  it('makes a closed workshop request read-only even when completed', () => {
    expect(isRequestConversationWritable({
      status: 'completed',
      workshop_stage: 'closed',
    })).toBe(false)
  })

  it('fails closed for an unknown request status', () => {
    expect(isRequestConversationWritable({
      status: 'unknown' as 'pending',
      workshop_stage: null,
    })).toBe(false)
  })
})

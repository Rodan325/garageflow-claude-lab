import { describe, expect, it } from 'vitest'
import { canStaffTransitionRecommendation, customerDecisionStatus, recommendationStatusMeta } from './model'

describe('recommendation decisions', () => {
  it('accepts, declines and requests a callback from a proposed recommendation', () => {
    expect(customerDecisionStatus('accepted', 'proposed')).toBe('accepted')
    expect(customerDecisionStatus('declined', 'proposed')).toBe('declined')
    expect(customerDecisionStatus('callback_requested', 'proposed')).toBe('callback_requested')
  })

  it('logs a question without changing the current status', () => {
    expect(customerDecisionStatus('question', 'proposed')).toBe('proposed')
    expect(customerDecisionStatus('question', 'callback_requested')).toBe('callback_requested')
  })

  it('refuses decisions from a terminal status', () => {
    expect(() => customerDecisionStatus('accepted', 'declined')).toThrow()
    expect(canStaffTransitionRecommendation('accepted', 'completed')).toBe(true)
    expect(canStaffTransitionRecommendation('completed', 'proposed')).toBe(false)
  })

  it('localises statuses without changing their technical values', () => {
    expect(recommendationStatusMeta('callback_requested', 'en').label).toBe('Callback requested')
    expect(recommendationStatusMeta('callback_requested', 'ar').label).toBe('طلب معاودة الاتصال')
  })
})

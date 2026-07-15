import { describe, expect, it } from 'vitest'
import { reminderIsDue, reminderStatusMeta } from './model'

describe('maintenance reminder engine', () => {
  it('becomes due on the first reached date or mileage threshold', () => {
    const reminder = { due_date: '2026-08-01', due_mileage: 100000 }
    expect(reminderIsDue(reminder, 100100, new Date('2026-07-01'))).toBe(true)
    expect(reminderIsDue(reminder, 99000, new Date('2026-08-01'))).toBe(true)
    expect(reminderIsDue(reminder, 99000, new Date('2026-07-01'))).toBe(false)
  })

  it('localises statuses without changing their values', () => {
    expect(reminderStatusMeta('converted', 'en').label).toBe('Converted')
    expect(reminderStatusMeta('converted', 'ar').label).toBe('محوّل')
  })
})

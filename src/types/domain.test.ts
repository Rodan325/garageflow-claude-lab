import { describe, expect, it } from 'vitest'
import { REQUEST_STATUS_META, REPAIR_COLUMNS, ROLE_LABEL } from './domain'

describe('domain metadata', () => {
  it('maps every request status to a label + tone', () => {
    const statuses = ['pending', 'accepted', 'declined', 'reschedule_proposed', 'confirmed', 'completed', 'cancelled'] as const
    for (const s of statuses) {
      expect(REQUEST_STATUS_META[s]).toBeDefined()
      expect(REQUEST_STATUS_META[s].label.length).toBeGreaterThan(0)
    }
  })

  it('orders the workshop kanban from diagnosis to delivery', () => {
    expect(REPAIR_COLUMNS[0]).toBe('to_diagnose')
    expect(REPAIR_COLUMNS.at(-1)).toBe('delivered')
    expect(REPAIR_COLUMNS).toHaveLength(6)
  })

  it('labels garage roles in French', () => {
    expect(ROLE_LABEL.owner).toBe('Gérant')
    expect(ROLE_LABEL.mechanic).toBe('Mécanicien')
  })
})

import { describe, it, expect } from 'vitest'
import { pickValidCenter } from './centerSelection'
import type { GarageCenter } from '@/types/domain'

const center = (over: Partial<GarageCenter>): GarageCenter => ({
  id: 'c1', garage_id: 'g1', slug: 's', name: 'Centre', address: null, city: null,
  postal_code: null, phone: null, is_active: true, sort_order: 0, created_at: '', ...over,
})

const g1 = [
  center({ id: 'c1', garage_id: 'g1' }),
  center({ id: 'c2', garage_id: 'g1', is_active: false }),
]

describe('pickValidCenter', () => {
  it('accepts an active center of the current garage', () => {
    expect(pickValidCenter(g1, 'c1', 'g1')?.id).toBe('c1')
  })

  it('rejects an unknown / stale center id', () => {
    expect(pickValidCenter(g1, 'gone', 'g1')).toBeNull()
  })

  it('rejects an inactive center', () => {
    expect(pickValidCenter(g1, 'c2', 'g1')).toBeNull()
  })

  it('rejects a center that belongs to another garage', () => {
    expect(pickValidCenter(g1, 'c1', 'g2')).toBeNull()
  })

  it('returns null when centers, selection or garage are missing', () => {
    expect(pickValidCenter(undefined, 'c1', 'g1')).toBeNull()
    expect(pickValidCenter(g1, null, 'g1')).toBeNull()
    expect(pickValidCenter(g1, 'c1', null)).toBeNull()
  })
})

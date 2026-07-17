import { describe, expect, it } from 'vitest'
import type { GarageCenter } from '@/types/domain'
import { resolveNetworkCenters } from './network'

const presentationCenters = [
  { id: 'center-1' },
  { id: 'center-2' },
  { id: 'center-3' },
] as GarageCenter[]

describe('network center resolution', () => {
  it('uses presentation centers synchronously before the query hydrates', () => {
    expect(resolveNetworkCenters(true, undefined, presentationCenters)).toBe(presentationCenters)
  })

  it('never substitutes presentation centers in a real account', () => {
    expect(resolveNetworkCenters(false, undefined, presentationCenters)).toEqual([])
    const queried = [{ id: 'real-center' }] as GarageCenter[]
    expect(resolveNetworkCenters(false, queried, presentationCenters)).toBe(queried)
  })
})

import { afterEach, describe, expect, it } from 'vitest'
import { getSelectedGarageId } from './useSelectedGarage'

const KEY = 'gf-selected-garage'
const REAL_GARAGE_ID = '11111111-1111-4111-8111-111111111111'

afterEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('getSelectedGarageId', () => {
  it('keeps a persisted Supabase garage UUID outside demo mode', () => {
    localStorage.setItem(KEY, REAL_GARAGE_ID)

    expect(getSelectedGarageId()).toBe(REAL_GARAGE_ID)
    expect(localStorage.getItem(KEY)).toBe(REAL_GARAGE_ID)
  })

  it('removes a persisted demo garage before real Supabase queries run', () => {
    localStorage.setItem(KEY, 'demo-garage')

    expect(getSelectedGarageId()).toBeNull()
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('keeps the synthetic garage while the current tab is in demo mode', () => {
    sessionStorage.setItem('gf-demo', 'client')
    localStorage.setItem(KEY, 'demo-garage')

    expect(getSelectedGarageId()).toBe('demo-garage')
    expect(localStorage.getItem(KEY)).toBe('demo-garage')
  })
})

import { describe, expect, it } from 'vitest'
import {
  allowedWorkshopTransitions,
  assertWorkshopTransition,
  canTransitionWorkshopStage,
  workshopStageMeta,
  WORKSHOP_STAGES,
} from './lifecycle'

describe('workshop lifecycle', () => {
  it('keeps ordinary workshop actions on the controlled operational path', () => {
    expect(allowedWorkshopTransitions(null)).toEqual(['appointment_confirmed'])
    expect(canTransitionWorkshopStage('appointment_confirmed', 'vehicle_expected')).toBe(true)
    expect(canTransitionWorkshopStage('vehicle_expected', 'vehicle_checked_in')).toBe(true)
    expect(canTransitionWorkshopStage('vehicle_checked_in', 'vehicle_received')).toBe(true)
    expect(canTransitionWorkshopStage('vehicle_received', 'diagnosis_in_progress')).toBe(true)
    expect(canTransitionWorkshopStage('work_authorized', 'work_in_progress')).toBe(true)
    expect(canTransitionWorkshopStage('work_in_progress', 'quality_control')).toBe(true)
    expect(canTransitionWorkshopStage('quality_control', 'vehicle_ready')).toBe(true)
    expect(canTransitionWorkshopStage('vehicle_ready', 'vehicle_delivered')).toBe(true)
    expect(canTransitionWorkshopStage('vehicle_delivered', 'closed')).toBe(true)
  })

  it('routes approval, authorisation, rework, and reopening through dedicated workflows', () => {
    expect(allowedWorkshopTransitions('diagnosis_in_progress')).toEqual([])
    expect(allowedWorkshopTransitions('customer_approval_required')).toEqual([])
    expect(canTransitionWorkshopStage('diagnosis_in_progress', 'work_authorized')).toBe(false)
    expect(canTransitionWorkshopStage('quality_control', 'work_in_progress')).toBe(false)
  })

  it('rejects skipped and backward transitions', () => {
    expect(canTransitionWorkshopStage('vehicle_received', 'vehicle_ready')).toBe(false)
    expect(() => assertWorkshopTransition('vehicle_ready', 'work_in_progress')).toThrow('Invalid workshop transition')
    expect(allowedWorkshopTransitions('closed')).toEqual([])
  })

  it('localises every stage in French, English and Arabic', () => {
    for (const stage of WORKSHOP_STAGES) {
      expect(workshopStageMeta(stage, 'fr').label).toBeTruthy()
      expect(workshopStageMeta(stage, 'en').label).not.toBe(workshopStageMeta(stage, 'fr').label)
      expect(workshopStageMeta(stage, 'ar').label).not.toBe(workshopStageMeta(stage, 'fr').label)
    }
  })
})

import { describe, expect, it } from 'vitest'
import {
  allowedWorkshopTransitions,
  assertWorkshopTransition,
  canTransitionWorkshopStage,
  workshopStageMeta,
  WORKSHOP_STAGES,
} from './lifecycle'

describe('workshop lifecycle', () => {
  it('starts with a confirmed appointment and follows the default sequence', () => {
    expect(allowedWorkshopTransitions(null)).toEqual(['appointment_confirmed'])
    for (let index = 0; index < WORKSHOP_STAGES.length - 1; index += 1) {
      expect(canTransitionWorkshopStage(WORKSHOP_STAGES[index], WORKSHOP_STAGES[index + 1])).toBe(true)
    }
  })

  it('allows diagnosis without approval and quality-control rework', () => {
    expect(canTransitionWorkshopStage('diagnosis_in_progress', 'work_authorized')).toBe(true)
    expect(canTransitionWorkshopStage('quality_control', 'work_in_progress')).toBe(true)
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

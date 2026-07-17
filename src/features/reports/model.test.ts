import { describe, expect, it } from 'vitest'
import { canEditDeliveryReport, validateDeliveryMileage, type DeliveryReport } from './model'
import { deliveryReportLabels } from './reportPdf'

describe('delivery report rules', () => {
  it('allows only draft reports to be edited', () => {
    expect(canEditDeliveryReport({ status: 'draft' } as DeliveryReport)).toBe(true)
    expect(canEditDeliveryReport({ status: 'finalized' } as DeliveryReport)).toBe(false)
  })

  it('rejects negative or decreasing mileage', () => {
    expect(validateDeliveryMileage(98000, 98042)).toBe(true)
    expect(validateDeliveryMileage(98000, 97999)).toBe(false)
    expect(validateDeliveryMileage(-1, null)).toBe(false)
  })

  it('provides localized PDF labels including Arabic', () => {
    expect(deliveryReportLabels('en').title).toBe('Vehicle handover report')
    expect(deliveryReportLabels('ar').title).toBe('تقرير تسليم السيارة')
    expect(deliveryReportLabels('fr').legal).toContain('RODANBTECH')
  })
})

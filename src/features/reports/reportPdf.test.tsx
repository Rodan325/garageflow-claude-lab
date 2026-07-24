// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { Garage, ServiceRequest } from '@/types/domain'
import type { DeliveryReport } from './model'
import { deliveryReportDocument, deliveryReportLabels, renderDeliveryReportPdfBlob } from './reportPdf'

const report: DeliveryReport = {
  id: 'report-ar-test',
  garage_id: 'garage-ar-test',
  center_id: 'center-ar-test',
  service_request_id: 'request-ar-test',
  report_number: 'RI-AR-TEST-001',
  status: 'finalized',
  customer_snapshot: { name: 'عميل تجريبي' },
  vehicle_snapshot: { label: 'سيارة تجريبية', registration: 'TEST-AR-001' },
  entry_mileage: 10000,
  exit_mileage: 10005,
  checked_in_at: '2026-07-18T08:00:00Z',
  delivered_at: '2026-07-18T16:00:00Z',
  requested_work: ['فحص دوري'],
  diagnostic_summary: 'تم التشخيص بنجاح.',
  completed_work: ['تم إنجاز العمل المطلوب.'],
  accepted_recommendations: [],
  deferred_recommendations: [],
  parts: [],
  authorized_attachment_ids: [],
  observations: null,
  next_due_date: '2027-01-18',
  next_due_mileage: 20000,
  warranty_terms: 'تطبق شروط الضمان المتفق عليها.',
  final_validation: 'تم فحص الجودة النهائي.',
  finalized_by: 'staff-ar-test',
  finalized_at: '2026-07-18T16:00:00Z',
  created_at: '2026-07-18T15:00:00Z',
  updated_at: '2026-07-18T16:00:00Z',
}

const request = {
  reference: 'REQUEST-AR-001',
  vehicle_label: 'Test Vehicle',
} as ServiceRequest

const garage = {
  name: 'ورشة تجريبية',
  address: 'عنوان تجريبي',
  phone: '+212 5 00 00 00 00',
  email: 'garage@example.test',
  accent_color: '#0f766e',
} as Garage

describe('Arabic delivery report PDF', () => {
  it('builds an Arabic document with explicit pagination metadata', () => {
    const document = deliveryReportDocument({ report, request, garage, lang: 'ar' })

    expect(document.props.title).toContain(deliveryReportLabels('ar').title)
    expect(document.props.title).toContain(report.report_number)
    expect(deliveryReportLabels('ar')).toMatchObject({
      subtotal: 'المجموع الفرعي',
      tax: 'ضريبة القيمة المضافة',
      total: 'المجموع',
    })
  })

  it('keeps the repeated footer inside the printable page area', () => {
    const source = deliveryReportDocument({ report, request, garage, lang: 'ar' })
    const page = source.props.children
    const footer = page.props.children.find((child: { props?: { fixed?: boolean } }) => child?.props?.fixed)

    expect(footer.props.style).toMatchObject({ bottom: 28 })
  })

  it('renders a real PDF with the embedded Arabic font', async () => {
    const blob = await renderDeliveryReportPdfBlob({
      report,
      request,
      garage,
      lang: 'ar',
      centerName: 'المركز الرئيسي',
      financialSummary: { subtotal: '100.00 EUR', tax: '20.00 EUR', total: '120.00 EUR' },
    })
    const bytes = new Uint8Array(await blob.arrayBuffer())

    expect(blob.type).toBe('application/pdf')
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe('%PDF')
    expect(bytes.byteLength).toBeGreaterThan(20_000)
  }, 20_000)
})

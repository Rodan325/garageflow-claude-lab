import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { ServiceRequestAttachment } from '../src/features/attachments/model'
import type { DeliveryReport } from '../src/features/reports/model'
import { renderDeliveryReportPdfBlob } from '../src/features/reports/reportPdf'
import type { Garage, ServiceRequest } from '../src/types/domain'

const garage = {
  id: '00000000-0000-4000-8000-000000000101',
  name: 'ورشة الأطلس للسيارات',
  slug: 'atelier-atlas-test',
  address: '12 شارع الاختبار، الرباط، المغرب',
  phone: '+212 5 00 00 00 00',
  email: 'atelier@example.test',
  accent_color: '#0f766e',
} as Garage

const request = {
  id: '00000000-0000-4000-8000-000000000201',
  reference: 'CLK-AR-2026-0042',
  garage_id: garage.id,
  client_id: '00000000-0000-4000-8000-000000000202',
  service_name: 'صيانة دورية وتشخيص نظام الفرامل',
  status: 'completed',
  vehicle_label: 'Peugeot 3008',
} as ServiceRequest

const report: DeliveryReport = {
  id: '00000000-0000-4000-8000-000000000301',
  garage_id: garage.id,
  center_id: '00000000-0000-4000-8000-000000000102',
  service_request_id: request.id,
  report_number: 'RI-2026-AR-0042',
  status: 'finalized',
  customer_snapshot: { name: 'آمنة العلوي' },
  vehicle_snapshot: { label: 'بيجو 3008', registration: 'CL-2026-AR' },
  entry_mileage: 83420,
  exit_mileage: 83427,
  checked_in_at: '2026-07-18T08:30:00+01:00',
  delivered_at: '2026-07-18T17:45:00+01:00',
  requested_work: [
    'إجراء الصيانة الدورية وفحص مستويات السوائل وعناصر السلامة الأساسية.',
    'فحص صوت غير معتاد يظهر عند الضغط على دواسة الفرامل في السرعات المنخفضة.',
    'التحقق من ضغط الإطارات وحالة المسّاحات والإضاءة الخارجية.',
  ],
  diagnostic_summary: 'أظهر التشخيص تآكلًا متقدمًا في صفائح الفرامل الأمامية مع بقاء الأقراص ضمن حدود الاستعمال. لم يُرصد أي تسرب، وكانت نتائج فحص البطارية ونظام الشحن طبيعية.',
  completed_work: [
    'تغيير زيت المحرك والمرشح وفق مواصفات الشركة المصنّعة.',
    'استبدال صفائح الفرامل الأمامية بعد موافقة العميلة.',
    'ضبط ضغط الإطارات، وتحديث سجل الصيانة، وإجراء تجربة طريق نهائية.',
  ],
  accepted_recommendations: [
    'استبدال صفائح الفرامل الأمامية بسبب بلوغها حد التآكل الموصى به.',
    'تنظيف وفحص نقاط تثبيت مجموعة الفرامل أثناء عملية الاستبدال.',
  ],
  deferred_recommendations: [
    'استبدال مسّاحة الزجاج الخلفي أُجّل بناءً على قرار العميلة إلى الزيارة القادمة.',
  ],
  parts: [
    'طقم صفائح فرامل أمامية مطابق لمواصفات المركبة.',
    'زيت محرك ومرشح زيت وحلقة إحكام جديدة.',
  ],
  authorized_attachment_ids: ['attachment-photo-1', 'attachment-photo-2'],
  observations: 'تمت تجربة المركبة بعد التدخل، ولم يظهر الصوت المبلّغ عنه. ضغط الإطارات مضبوط، ولا توجد ملاحظة سلامة فورية عند التسليم.',
  next_due_date: '2027-01-18',
  next_due_mileage: 93420,
  warranty_terms: 'تخضع القطع والأعمال المنجزة لشروط الضمان المتفق عليها مع الورشة، مع ضرورة تقديم هذا التقرير واتباع توصيات الاستعمال والصيانة.',
  final_validation: 'اكتمل فحص الجودة النهائي، وتأكد الفني من عزم التثبيت ومستويات السوائل وعمل المكابح والإضاءة. سُلّمت المركبة بعد شرح الأعمال والتوصيات للعميلة.',
  finalized_by: '00000000-0000-4000-8000-000000000103',
  finalized_at: '2026-07-18T17:30:00+01:00',
  created_at: '2026-07-18T16:45:00+01:00',
  updated_at: '2026-07-18T17:30:00+01:00',
}

const attachments: ServiceRequestAttachment[] = [
  {
    id: 'attachment-photo-1', garage_id: garage.id, center_id: report.center_id,
    service_request_id: request.id, recommendation_id: null,
    uploaded_by: report.finalized_by, file_name: 'controle-frein-avant.jpg',
    mime_type: 'image/jpeg', file_size: 142000, storage_path: 'test-only/photo-1.jpg',
    visibility: 'customer', document_type: 'photo', created_at: report.created_at,
  },
  {
    id: 'attachment-photo-2', garage_id: garage.id, center_id: report.center_id,
    service_request_id: request.id, recommendation_id: null,
    uploaded_by: report.finalized_by, file_name: 'controle-qualite-final.jpg',
    mime_type: 'image/jpeg', file_size: 126000, storage_path: 'test-only/photo-2.jpg',
    visibility: 'customer', document_type: 'photo', created_at: report.created_at,
  },
]

const outputDirectory = join(process.cwd(), 'output', 'pdf')
await mkdir(outputDirectory, { recursive: true })
const blob = await renderDeliveryReportPdfBlob({
  report,
  request,
  garage,
  lang: 'ar',
  attachments,
  centerName: 'المركز الرئيسي - الرباط',
  financialSummary: {
    subtotal: '1,120.00 EUR',
    tax: '224.00 EUR',
    total: '1,344.00 EUR',
  },
})
const outputPath = join(outputDirectory, 'clikarage-delivery-report-ar.pdf')
await writeFile(outputPath, Buffer.from(await blob.arrayBuffer()))
process.stdout.write(`${outputPath}\n`)

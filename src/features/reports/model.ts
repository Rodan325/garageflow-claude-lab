export interface DeliveryReport {
  id: string
  garage_id: string
  center_id: string | null
  service_request_id: string
  report_number: string
  status: 'draft' | 'finalized'
  customer_snapshot: Record<string, unknown>
  vehicle_snapshot: Record<string, unknown>
  entry_mileage: number | null
  exit_mileage: number | null
  checked_in_at: string | null
  delivered_at: string | null
  requested_work: string[]
  diagnostic_summary: string | null
  completed_work: string[]
  accepted_recommendations: string[]
  deferred_recommendations: string[]
  parts: string[]
  authorized_attachment_ids: string[]
  observations: string | null
  next_due_date: string | null
  next_due_mileage: number | null
  warranty_terms: string | null
  final_validation: string | null
  finalized_by: string | null
  finalized_at: string | null
  created_at: string
  updated_at: string
}

export function canEditDeliveryReport(report: DeliveryReport) {
  return report.status === 'draft'
}

export function validateDeliveryMileage(entry: number | null, exit: number | null) {
  if (entry !== null && entry < 0) return false
  if (exit !== null && exit < 0) return false
  return entry === null || exit === null || exit >= entry
}

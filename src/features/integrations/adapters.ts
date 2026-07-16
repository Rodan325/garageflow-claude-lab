import type { CsvImportPreview, CsvImportRow } from './csvImport'

export type IntegrationType = 'csv' | 'rest_api' | 'webhook' | 'dms' | 'crm' | 'calendar' | 'email' | 'sms'
export type SyncStatus = 'pending' | 'synced' | 'failed' | 'conflict'

export interface ExternalReference {
  external_source: string
  external_organization_id: string | null
  external_center_id: string | null
  external_booking_id: string | null
  sync_status: SyncStatus
  last_synced_at: string | null
  sync_error: string | null
}

export interface ImportReport {
  imported: number
  skipped: number
  failed: number
  errors: Array<{ line: number; message: string }>
}

export interface BookingImportAdapter {
  readonly source: string
  preview(input: string): Promise<CsvImportPreview>
  import(rows: CsvImportRow[]): Promise<ImportReport>
}

export interface CustomerSyncAdapter<TCustomer = unknown> {
  readonly source: string
  sync(customers: TCustomer[]): Promise<ImportReport>
}

export interface VehicleSyncAdapter<TVehicle = unknown> {
  readonly source: string
  sync(vehicles: TVehicle[]): Promise<ImportReport>
}

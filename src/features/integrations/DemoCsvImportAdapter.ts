import type { BookingImportAdapter, ImportReport } from './adapters'
import { previewCsvImport, type CsvImportRow } from './csvImport'

export class DemoCsvImportAdapter implements BookingImportAdapter {
  readonly source = 'demo-csv'
  constructor(private readonly existingKeys: Iterable<string> = []) {}

  async preview(input: string) {
    return previewCsvImport(input, this.existingKeys)
  }

  async import(rows: CsvImportRow[]): Promise<ImportReport> {
    return {
      imported: rows.length,
      skipped: 0,
      failed: 0,
      errors: [],
    }
  }
}

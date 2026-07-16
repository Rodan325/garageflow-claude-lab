import type { BookingImportAdapter, ImportReport } from './adapters'
import { previewCsvImport, type CsvImportOptions, type CsvImportRow } from './csvImport'

export class DemoCsvImportAdapter implements BookingImportAdapter {
  readonly source = 'demo-csv'
  constructor(
    private readonly existingKeys: Iterable<string> = [],
    private readonly options: CsvImportOptions = {},
  ) {}

  async preview(input: string) {
    return previewCsvImport(input, this.existingKeys, this.options)
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

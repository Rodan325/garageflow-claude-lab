import { describe, expect, it } from 'vitest'
import { DEFAULT_CSV_IMPORT_LIMITS, previewCsvImport } from './csvImport'

const csv = `entity_type,name,city,first_name,last_name,email,brand,model,registration,customer_email,title,starts_at,category,duration_minutes,price_from
center,Atelier Est,Lyon,,,,,,,,,,,,
customer,,,Nora,Martin,nora@example.fr,,,,,,,,,
vehicle,,,,,,Renault,Clio,AA-123-AA,nora@example.fr,,,,,
appointment,,,,,,,,,nora@example.fr,Revision,2026-08-10T09:00:00Z,,,
service,Revision,,,,,,,,,,,Entretien,60,99`

describe('CSV import preview', () => {
  it('accepts all five generic entity types', () => {
    const result = previewCsvImport(csv)
    expect(result.rows.map((row) => row.entityType)).toEqual([
      'center', 'customer', 'vehicle', 'appointment', 'service',
    ])
    expect(result.issues).toEqual([])
  })

  it('reports validation errors line by line', () => {
    const result = previewCsvImport('entity_type,email,first_name,last_name\ncustomer,invalid,Nora,Martin')
    expect(result.rows).toHaveLength(0)
    expect(result.issues).toContainEqual(expect.objectContaining({ line: 2, field: 'email', code: 'invalid_value' }))
  })

  it('prevents duplicates from the file and existing data', () => {
    const source = 'entity_type,first_name,last_name,email\ncustomer,Nora,Martin,nora@example.fr\ncustomer,Nora,Martin,nora@example.fr'
    const inFile = previewCsvImport(source)
    expect(inFile.rows).toHaveLength(1)
    expect(inFile.duplicateRows).toBe(1)
    expect(previewCsvImport(source, ['customer:nora@example.fr']).rows).toHaveLength(0)
  })

  it('supports quoted commas without shifting columns', () => {
    const result = previewCsvImport('entity_type,name,category,duration_minutes,price_from\nservice,"Revision, filtres",Entretien,90,149')
    expect(result.rows[0].data.name).toBe('Revision, filtres')
  })

  it('rejects malformed CSV and missing entity type columns', () => {
    expect(previewCsvImport('entity_type,name\nservice,"broken').issues[0].code).toBe('invalid_csv')
    expect(previewCsvImport('name\nAtelier').issues[0].field).toBe('entity_type')
  })

  it.each([
    '=HYPERLINK("https://example.invalid")',
    '+SUM(1;2)',
    '-1+2',
    '@commande',
    '   =HYPERLINK("https://example.invalid")',
  ])('neutralizes spreadsheet formulas before preview: %s', (dangerousValue) => {
    const source = `entity_type,name,category,duration_minutes,price_from\nservice,"${dangerousValue.split('"').join('""')}",Entretien,60,99`
    const result = previewCsvImport(source)

    expect(result.issues).toEqual([])
    expect(result.rows[0].data.name).toMatch(/^'/)
    expect(result.rows[0].data.name.slice(1)).toBe(dangerousValue.trim())
  })

  it('keeps ordinary cell values unchanged', () => {
    const source = 'entity_type,name,category,duration_minutes,price_from\nservice,Révision complète,Entretien,60,99'
    const result = previewCsvImport(source)

    expect(result.issues).toEqual([])
    expect(result.rows[0].data.name).toBe('Révision complète')
  })

  it('uses the explicit safe defaults for CSV limits', () => {
    expect(DEFAULT_CSV_IMPORT_LIMITS).toEqual({
      maxFileBytes: 5 * 1024 * 1024,
      maxRows: 10_000,
      maxColumns: 100,
      maxCellCharacters: 10_000,
    })
  })

  it('rejects files exceeding the configured byte limit', () => {
    const result = previewCsvImport('entity_type,name\ncenter,Atelier', [], {
      limits: { maxFileBytes: 10 },
    })

    expect(result.issues[0]).toEqual(expect.objectContaining({ code: 'file_too_large', line: 1 }))
    expect(result.rows).toEqual([])
  })

  it('rejects files exceeding the configured row limit', () => {
    const source = 'entity_type,name,city\ncenter,Atelier A,Lyon\ncenter,Atelier B,Paris'
    const result = previewCsvImport(source, [], { limits: { maxRows: 1 } })

    expect(result.issues[0]).toEqual(expect.objectContaining({ code: 'too_many_rows', line: 1 }))
    expect(result.totalRows).toBe(2)
  })

  it('rejects rows exceeding the configured column limit', () => {
    const source = 'entity_type,name,city,extra\ncenter,Atelier,Lyon,value'
    const result = previewCsvImport(source, [], { limits: { maxColumns: 3 } })

    expect(result.issues[0]).toEqual(expect.objectContaining({ code: 'too_many_columns', line: 1 }))
  })

  it('rejects an oversized cell without accepting the row', () => {
    const source = 'entity_type,name,city\ncenter,Atelier beaucoup trop long,Lyon'
    const result = previewCsvImport(source, [], { limits: { maxCellCharacters: 10 } })

    expect(result.issues).toContainEqual(expect.objectContaining({
      code: 'cell_too_long',
      line: 2,
      field: 'name',
    }))
    expect(result.rows).toEqual([])
  })

  it.each([
    ['fr', /limite de 1 lignes/],
    ['en', /limit of 1 rows/],
    ['ar', /1 صف/],
  ] as const)('localizes limit errors in %s', (locale, message) => {
    const source = 'entity_type,name,city\ncenter,Atelier A,Lyon\ncenter,Atelier B,Paris'
    const result = previewCsvImport(source, [], { locale, limits: { maxRows: 1 } })

    expect(result.issues[0].message).toMatch(message)
  })
})

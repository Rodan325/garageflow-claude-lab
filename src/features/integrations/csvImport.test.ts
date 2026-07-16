import { describe, expect, it } from 'vitest'
import { previewCsvImport } from './csvImport'

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
})

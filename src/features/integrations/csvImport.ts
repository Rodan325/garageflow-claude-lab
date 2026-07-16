export type ImportEntityType = 'center' | 'customer' | 'vehicle' | 'appointment' | 'service'

export interface CsvImportRow {
  line: number
  entityType: ImportEntityType
  data: Record<string, string>
  duplicateKey: string
}

export interface CsvImportIssue {
  line: number
  code: 'invalid_csv' | 'missing_field' | 'invalid_value' | 'duplicate'
  field: string | null
  message: string
}

export interface CsvImportPreview {
  headers: string[]
  rows: CsvImportRow[]
  issues: CsvImportIssue[]
  totalRows: number
  duplicateRows: number
}

const ENTITY_TYPES = new Set<ImportEntityType>(['center', 'customer', 'vehicle', 'appointment', 'service'])
const REQUIRED_FIELDS: Record<ImportEntityType, string[]> = {
  center: ['name', 'city'],
  customer: ['first_name', 'last_name', 'email'],
  vehicle: ['brand', 'model', 'registration', 'customer_email'],
  appointment: ['title', 'starts_at', 'customer_email'],
  service: ['name', 'category', 'duration_minutes', 'price_from'],
}

function parseCsv(source: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let value = ''
  let quoted = false
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    if (char === '"') {
      if (quoted && source[index + 1] === '"') {
        value += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (char === ',' && !quoted) {
      row.push(value.trim())
      value = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && source[index + 1] === '\n') index += 1
      row.push(value.trim())
      if (row.some(Boolean)) rows.push(row)
      row = []
      value = ''
    } else {
      value += char
    }
  }
  if (quoted) throw new Error('UNCLOSED_QUOTE')
  row.push(value.trim())
  if (row.some(Boolean)) rows.push(row)
  return rows
}

const normalize = (value: string) => value.trim().toLocaleLowerCase('fr').replace(/\s+/g, ' ')

function duplicateKey(entityType: ImportEntityType, data: Record<string, string>) {
  if (entityType === 'center') return `center:${normalize(data.slug || `${data.name}:${data.city}`)}`
  if (entityType === 'customer') return `customer:${normalize(data.email || data.phone)}`
  if (entityType === 'vehicle') return `vehicle:${normalize(data.vin || data.registration)}`
  if (entityType === 'appointment') return `appointment:${normalize(data.external_booking_id || `${data.customer_email}:${data.starts_at}:${data.title}`)}`
  return `service:${normalize(`${data.name}:${data.category}`)}`
}

function validateValue(entityType: ImportEntityType, data: Record<string, string>, line: number) {
  const issues: CsvImportIssue[] = []
  if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) {
    issues.push({ line, code: 'invalid_value', field: 'email', message: 'Adresse email invalide' })
  }
  if (data.customer_email && !/^\S+@\S+\.\S+$/.test(data.customer_email)) {
    issues.push({ line, code: 'invalid_value', field: 'customer_email', message: 'Email client invalide' })
  }
  if (entityType === 'appointment' && Number.isNaN(Date.parse(data.starts_at))) {
    issues.push({ line, code: 'invalid_value', field: 'starts_at', message: 'Date de rendez-vous invalide' })
  }
  for (const field of entityType === 'service' ? ['duration_minutes', 'price_from'] : []) {
    const value = Number(data[field])
    if (!Number.isFinite(value) || value < 0) {
      issues.push({ line, code: 'invalid_value', field, message: 'Valeur numérique invalide' })
    }
  }
  return issues
}

export function previewCsvImport(source: string, existingKeys: Iterable<string> = []): CsvImportPreview {
  let matrix: string[][]
  try {
    matrix = parseCsv(source.replace(/^\uFEFF/, ''))
  } catch {
    return {
      headers: [], rows: [], totalRows: 0, duplicateRows: 0,
      issues: [{ line: 1, code: 'invalid_csv', field: null, message: 'Le CSV contient une valeur entre guillemets non fermée' }],
    }
  }
  const headers = (matrix[0] ?? []).map((header) => normalize(header).replace(/\s+/g, '_'))
  if (!headers.includes('entity_type')) {
    return {
      headers, rows: [], totalRows: Math.max(0, matrix.length - 1), duplicateRows: 0,
      issues: [{ line: 1, code: 'missing_field', field: 'entity_type', message: 'Colonne entity_type manquante' }],
    }
  }
  const seen = new Set([...existingKeys].map(normalize))
  const rows: CsvImportRow[] = []
  const issues: CsvImportIssue[] = []
  let duplicateRows = 0
  matrix.slice(1).forEach((values, rowIndex) => {
    const line = rowIndex + 2
    const data = Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? '']))
    const rawEntityType = normalize(data.entity_type)
    if (!ENTITY_TYPES.has(rawEntityType as ImportEntityType)) {
      issues.push({ line, code: 'invalid_value', field: 'entity_type', message: 'Type d’entité non pris en charge' })
      return
    }
    const entityType = rawEntityType as ImportEntityType
    const missing = REQUIRED_FIELDS[entityType].filter((field) => !data[field])
    if (missing.length) {
      missing.forEach((field) => issues.push({ line, code: 'missing_field', field, message: 'Champ obligatoire manquant' }))
      return
    }
    const valueIssues = validateValue(entityType, data, line)
    if (valueIssues.length) {
      issues.push(...valueIssues)
      return
    }
    const key = duplicateKey(entityType, data)
    if (seen.has(normalize(key))) {
      duplicateRows += 1
      issues.push({ line, code: 'duplicate', field: null, message: 'Ligne en doublon ignorée' })
      return
    }
    seen.add(normalize(key))
    rows.push({ line, entityType, data, duplicateKey: key })
  })
  return { headers, rows, issues, totalRows: Math.max(0, matrix.length - 1), duplicateRows }
}

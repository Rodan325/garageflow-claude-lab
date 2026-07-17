export type ImportEntityType = 'center' | 'customer' | 'vehicle' | 'appointment' | 'service'

export type CsvImportLocale = 'fr' | 'en' | 'ar'

export interface CsvImportLimits {
  maxFileBytes: number
  maxRows: number
  maxColumns: number
  maxCellCharacters: number
}

export interface CsvImportOptions {
  locale?: CsvImportLocale
  limits?: Partial<CsvImportLimits>
}

export interface CsvImportRow {
  line: number
  entityType: ImportEntityType
  data: Record<string, string>
  duplicateKey: string
}

export type CsvImportIssueCode =
  | 'invalid_csv'
  | 'missing_field'
  | 'invalid_value'
  | 'duplicate'
  | 'file_too_large'
  | 'too_many_rows'
  | 'too_many_columns'
  | 'cell_too_long'

export interface CsvImportIssue {
  line: number
  code: CsvImportIssueCode
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

export const DEFAULT_CSV_IMPORT_LIMITS: Readonly<CsvImportLimits> = Object.freeze({
  maxFileBytes: 5 * 1024 * 1024,
  maxRows: 10_000,
  maxColumns: 100,
  maxCellCharacters: 10_000,
})

const ENTITY_TYPES = new Set<ImportEntityType>(['center', 'customer', 'vehicle', 'appointment', 'service'])
const REQUIRED_FIELDS: Record<ImportEntityType, string[]> = {
  center: ['name', 'city'],
  customer: ['first_name', 'last_name', 'email'],
  vehicle: ['brand', 'model', 'registration', 'customer_email'],
  appointment: ['title', 'starts_at', 'customer_email'],
  service: ['name', 'category', 'duration_minutes', 'price_from'],
}

type MessageKey =
  | 'unclosed_quote'
  | 'missing_entity_type'
  | 'unsupported_entity'
  | 'required_field'
  | 'invalid_email'
  | 'invalid_customer_email'
  | 'invalid_appointment_date'
  | 'invalid_number'
  | 'duplicate'
  | 'file_too_large'
  | 'too_many_rows'
  | 'too_many_columns'
  | 'cell_too_long'

const MESSAGES: Record<CsvImportLocale, Record<MessageKey, string>> = {
  fr: {
    unclosed_quote: 'Le CSV contient une valeur entre guillemets non fermée.',
    missing_entity_type: 'La colonne entity_type est manquante.',
    unsupported_entity: 'Ce type d’entité n’est pas pris en charge.',
    required_field: 'Ce champ obligatoire est manquant.',
    invalid_email: 'L’adresse email est invalide.',
    invalid_customer_email: 'L’email client est invalide.',
    invalid_appointment_date: 'La date de rendez-vous est invalide.',
    invalid_number: 'La valeur numérique est invalide.',
    duplicate: 'Cette ligne en doublon a été ignorée.',
    file_too_large: 'Le fichier CSV dépasse la taille maximale de {limit} Mo.',
    too_many_rows: 'Le fichier CSV dépasse la limite de {limit} lignes.',
    too_many_columns: 'Le fichier CSV dépasse la limite de {limit} colonnes.',
    cell_too_long: 'Cette cellule dépasse la limite de {limit} caractères.',
  },
  en: {
    unclosed_quote: 'The CSV contains an unclosed quoted value.',
    missing_entity_type: 'The entity_type column is missing.',
    unsupported_entity: 'This entity type is not supported.',
    required_field: 'This required field is missing.',
    invalid_email: 'The email address is invalid.',
    invalid_customer_email: 'The customer email address is invalid.',
    invalid_appointment_date: 'The appointment date is invalid.',
    invalid_number: 'The numeric value is invalid.',
    duplicate: 'This duplicate row was ignored.',
    file_too_large: 'The CSV file exceeds the maximum size of {limit} MB.',
    too_many_rows: 'The CSV file exceeds the limit of {limit} rows.',
    too_many_columns: 'The CSV file exceeds the limit of {limit} columns.',
    cell_too_long: 'This cell exceeds the limit of {limit} characters.',
  },
  ar: {
    unclosed_quote: 'يحتوي ملف CSV على قيمة بين علامتي اقتباس غير مغلقتين.',
    missing_entity_type: 'العمود entity_type مفقود.',
    unsupported_entity: 'نوع الكيان هذا غير مدعوم.',
    required_field: 'هذا الحقل الإلزامي مفقود.',
    invalid_email: 'عنوان البريد الإلكتروني غير صالح.',
    invalid_customer_email: 'عنوان البريد الإلكتروني للعميل غير صالح.',
    invalid_appointment_date: 'تاريخ الموعد غير صالح.',
    invalid_number: 'القيمة الرقمية غير صالحة.',
    duplicate: 'تم تجاهل هذا الصف المكرر.',
    file_too_large: 'يتجاوز ملف CSV الحجم الأقصى وهو {limit} ميغابايت.',
    too_many_rows: 'يتجاوز ملف CSV الحد الأقصى وهو {limit} صفًا.',
    too_many_columns: 'يتجاوز ملف CSV الحد الأقصى وهو {limit} عمودًا.',
    cell_too_long: 'تتجاوز هذه الخلية الحد الأقصى وهو {limit} حرفًا.',
  },
}

function formatMessage(locale: CsvImportLocale, key: MessageKey, variables: Record<string, string | number> = {}) {
  return Object.entries(variables).reduce(
    (message, [name, value]) => message.split(`{${name}}`).join(String(value)),
    MESSAGES[locale][key],
  )
}

function resolveLimits(overrides: Partial<CsvImportLimits> = {}): CsvImportLimits {
  return Object.fromEntries(
    Object.entries(DEFAULT_CSV_IMPORT_LIMITS).map(([key, fallback]) => {
      const configured = overrides[key as keyof CsvImportLimits]
      return [key, typeof configured === 'number' && Number.isFinite(configured) && configured > 0
        ? Math.floor(configured)
        : fallback]
    }),
  ) as unknown as CsvImportLimits
}

/** Prefix spreadsheet formulas so previewed values remain inert in future CSV exports. */
export function neutralizeSpreadsheetFormula(value: string): string {
  return /^[\s]*[=+\-@]/.test(value) ? value.replace(/^(\s*)/, "$1'") : value
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

function validateValue(
  entityType: ImportEntityType,
  data: Record<string, string>,
  line: number,
  locale: CsvImportLocale,
) {
  const issues: CsvImportIssue[] = []
  if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) {
    issues.push({ line, code: 'invalid_value', field: 'email', message: formatMessage(locale, 'invalid_email') })
  }
  if (data.customer_email && !/^\S+@\S+\.\S+$/.test(data.customer_email)) {
    issues.push({ line, code: 'invalid_value', field: 'customer_email', message: formatMessage(locale, 'invalid_customer_email') })
  }
  if (entityType === 'appointment' && Number.isNaN(Date.parse(data.starts_at))) {
    issues.push({ line, code: 'invalid_value', field: 'starts_at', message: formatMessage(locale, 'invalid_appointment_date') })
  }
  for (const field of entityType === 'service' ? ['duration_minutes', 'price_from'] : []) {
    const value = Number(data[field])
    if (!Number.isFinite(value) || value < 0) {
      issues.push({ line, code: 'invalid_value', field, message: formatMessage(locale, 'invalid_number') })
    }
  }
  return issues
}

function rejectedPreview(issue: CsvImportIssue, totalRows = 0, headers: string[] = []): CsvImportPreview {
  return { headers, rows: [], totalRows, duplicateRows: 0, issues: [issue] }
}

export function previewCsvImport(
  source: string,
  existingKeys: Iterable<string> = [],
  options: CsvImportOptions = {},
): CsvImportPreview {
  const locale = options.locale ?? 'fr'
  const limits = resolveLimits(options.limits)
  const fileBytes = new TextEncoder().encode(source).byteLength
  if (fileBytes > limits.maxFileBytes) {
    return rejectedPreview({
      line: 1,
      code: 'file_too_large',
      field: null,
      message: formatMessage(locale, 'file_too_large', { limit: limits.maxFileBytes / 1024 / 1024 }),
    })
  }

  let matrix: string[][]
  try {
    matrix = parseCsv(source.replace(/^\uFEFF/, ''))
  } catch {
    return rejectedPreview({
      line: 1,
      code: 'invalid_csv',
      field: null,
      message: formatMessage(locale, 'unclosed_quote'),
    })
  }

  const totalRows = Math.max(0, matrix.length - 1)
  if (totalRows > limits.maxRows) {
    return rejectedPreview({
      line: 1,
      code: 'too_many_rows',
      field: null,
      message: formatMessage(locale, 'too_many_rows', { limit: limits.maxRows }),
    }, totalRows)
  }

  const oversizedColumnRow = matrix.findIndex((row) => row.length > limits.maxColumns)
  if (oversizedColumnRow >= 0) {
    return rejectedPreview({
      line: oversizedColumnRow + 1,
      code: 'too_many_columns',
      field: null,
      message: formatMessage(locale, 'too_many_columns', { limit: limits.maxColumns }),
    }, totalRows)
  }

  const headers = (matrix[0] ?? []).map((header) => normalize(header).replace(/\s+/g, '_'))
  if (!headers.includes('entity_type')) {
    return rejectedPreview({
      line: 1,
      code: 'missing_field',
      field: 'entity_type',
      message: formatMessage(locale, 'missing_entity_type'),
    }, totalRows, headers)
  }

  const seen = new Set([...existingKeys].map(normalize))
  const rows: CsvImportRow[] = []
  const issues: CsvImportIssue[] = []
  let duplicateRows = 0
  matrix.slice(1).forEach((values, rowIndex) => {
    const line = rowIndex + 2
    const oversizedCells = values.flatMap((value, index) => value.length > limits.maxCellCharacters ? [index] : [])
    if (oversizedCells.length > 0) {
      oversizedCells.forEach((index) => issues.push({
        line,
        code: 'cell_too_long',
        field: headers[index] ?? null,
        message: formatMessage(locale, 'cell_too_long', { limit: limits.maxCellCharacters }),
      }))
      return
    }

    const data = Object.fromEntries(headers.map((header, index) => [
      header,
      neutralizeSpreadsheetFormula(values[index]?.trim() ?? ''),
    ]))
    const rawEntityType = normalize(data.entity_type)
    if (!ENTITY_TYPES.has(rawEntityType as ImportEntityType)) {
      issues.push({ line, code: 'invalid_value', field: 'entity_type', message: formatMessage(locale, 'unsupported_entity') })
      return
    }
    const entityType = rawEntityType as ImportEntityType
    const missing = REQUIRED_FIELDS[entityType].filter((field) => !data[field])
    if (missing.length) {
      missing.forEach((field) => issues.push({
        line,
        code: 'missing_field',
        field,
        message: formatMessage(locale, 'required_field'),
      }))
      return
    }
    const valueIssues = validateValue(entityType, data, line, locale)
    if (valueIssues.length) {
      issues.push(...valueIssues)
      return
    }
    const key = duplicateKey(entityType, data)
    if (seen.has(normalize(key))) {
      duplicateRows += 1
      issues.push({ line, code: 'duplicate', field: null, message: formatMessage(locale, 'duplicate') })
      return
    }
    seen.add(normalize(key))
    rows.push({ line, entityType, data, duplicateKey: key })
  })
  return { headers, rows, issues, totalRows, duplicateRows }
}

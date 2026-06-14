import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

export function euro(value?: number | null) {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
}

export function shortDate(value?: string | null) {
  if (!value) return '—'
  try {
    return format(parseISO(value), 'd MMM yyyy', { locale: fr })
  } catch {
    return value
  }
}

export function dateTime(value?: string | null) {
  if (!value) return '—'
  try {
    return format(parseISO(value), "EEEE d MMM 'à' HH:mm", { locale: fr })
  } catch {
    return value
  }
}

export function fromNow(value?: string | null) {
  if (!value) return ''
  try {
    return formatDistanceToNow(parseISO(value), { addSuffix: true, locale: fr })
  } catch {
    return ''
  }
}

/** Format a "HH:MM:SS" or "HH:MM" db time to "HH:MM". */
export function shortTime(value?: string | null) {
  if (!value) return '—'
  return value.slice(0, 5)
}

export function dateLabel(date: Date) {
  return format(date, 'EEEE d MMMM', { locale: fr })
}

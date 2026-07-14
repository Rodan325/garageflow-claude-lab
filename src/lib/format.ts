import { LOCALES, type Lang } from '@/i18n'

const dash = '—'

function parseDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function euro(value?: number | null, lang: Lang = 'fr') {
  if (value === null || value === undefined) return dash
  return new Intl.NumberFormat(LOCALES[lang], { style: 'currency', currency: 'EUR' }).format(value)
}

export function shortDate(value?: string | null, lang: Lang = 'fr') {
  if (!value) return dash
  const date = parseDate(value)
  return date
    ? new Intl.DateTimeFormat(LOCALES[lang], { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
    : value
}

export function dateTime(value?: string | null, lang: Lang = 'fr') {
  if (!value) return dash
  const date = parseDate(value)
  return date
    ? new Intl.DateTimeFormat(LOCALES[lang], {
        weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      }).format(date)
    : value
}

export function fromNow(value?: string | null, lang: Lang = 'fr') {
  if (!value) return ''
  const date = parseDate(value)
  if (!date) return ''
  const seconds = Math.round((date.getTime() - Date.now()) / 1000)
  const abs = Math.abs(seconds)
  let amount = seconds
  let unit: Intl.RelativeTimeFormatUnit = 'second'
  if (abs >= 86400) {
    amount = Math.round(seconds / 86400)
    unit = 'day'
  } else if (abs >= 3600) {
    amount = Math.round(seconds / 3600)
    unit = 'hour'
  } else if (abs >= 60) {
    amount = Math.round(seconds / 60)
    unit = 'minute'
  }
  return new Intl.RelativeTimeFormat(LOCALES[lang], { numeric: 'auto' }).format(amount, unit)
}

/** Format a "HH:MM:SS" or "HH:MM" database time to "HH:MM". */
export function shortTime(value?: string | null) {
  if (!value) return dash
  return value.slice(0, 5)
}

export function dateLabel(date: Date, lang: Lang = 'fr') {
  return new Intl.DateTimeFormat(LOCALES[lang], { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
}

import { afterEach, describe, expect, it, vi } from 'vitest'
import { clientStageMeta, quoteStatusMeta, requestStatusMeta, roleLabel, weekdayLabel } from './domainLabels'
import { LOCALES } from './index'
import { dateLabel, dateTime, euro, fromNow, shortDate } from '@/lib/format'

afterEach(() => vi.useRealTimers())

describe('localized domain labels', () => {
  it('localizes technical statuses without changing their values', () => {
    expect(quoteStatusMeta('draft', 'en').label).toBe('Draft')
    expect(quoteStatusMeta('draft', 'ar').label).toBe('مسودة')
    expect(requestStatusMeta('pending', 'en').label).toBe('Pending')
    expect(requestStatusMeta('pending', 'ar').label).toBe('قيد الانتظار')
    expect(clientStageMeta('appointment_confirmed', 'en').label).toBe('Appointment confirmed')
    expect(clientStageMeta('appointment_confirmed', 'ar').label).toBe('تم تأكيد الموعد')
  })

  it('localizes garage roles and weekdays while retaining technical role keys', () => {
    expect(roleLabel('advisor', 'en')).toBe('Advisor')
    expect(roleLabel('advisor', 'ar')).toBe('المستشار')
    expect(weekdayLabel(1, 'en')).toBe('Monday')
    expect(weekdayLabel(1, 'ar')).toBe('الاثنين')
  })
})

describe('Intl formatting', () => {
  const value = '2026-07-13T12:00:00.000Z'
  const date = new Date(value)

  it.each(['fr', 'en', 'ar'] as const)('formats dates and euros with the %s locale', (lang) => {
    expect(shortDate(value, lang)).toBe(
      new Intl.DateTimeFormat(LOCALES[lang], { day: 'numeric', month: 'short', year: 'numeric' }).format(date),
    )
    expect(dateTime(value, lang)).toBe(
      new Intl.DateTimeFormat(LOCALES[lang], { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date),
    )
    expect(dateLabel(date, lang)).toBe(
      new Intl.DateTimeFormat(LOCALES[lang], { weekday: 'long', day: 'numeric', month: 'long' }).format(date),
    )
    expect(euro(1234.5, lang)).toBe(
      new Intl.NumberFormat(LOCALES[lang], { style: 'currency', currency: 'EUR' }).format(1234.5),
    )
  })

  it('uses localized relative time', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-13T12:00:00.000Z'))
    const tomorrow = '2026-07-14T12:00:00.000Z'

    expect(fromNow(tomorrow, 'fr')).toBe(new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' }).format(1, 'day'))
    expect(fromNow(tomorrow, 'en')).toBe(new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' }).format(1, 'day'))
    expect(fromNow(tomorrow, 'ar')).toBe(new Intl.RelativeTimeFormat('ar-MA', { numeric: 'auto' }).format(1, 'day'))
  })
})

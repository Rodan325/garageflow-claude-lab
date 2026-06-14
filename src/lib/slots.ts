import { addDays, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { GarageHours } from '@/types/domain'

/** Hourly slots between opening and closing (e.g. 08:00 → 18:00). */
export function buildDaySlots(open?: string | null, close?: string | null): string[] {
  if (!open || !close) return []
  const start = parseInt(open.slice(0, 2), 10)
  const end = parseInt(close.slice(0, 2), 10)
  const out: string[] = []
  for (let h = start; h < end; h++) out.push(`${String(h).padStart(2, '0')}:00`)
  return out
}

export interface DayOption {
  iso: string
  label: string
  weekday: number
}

/** The next open days (skips closed days), Doctolib-style horizontal picker. */
export function openDays(hours: GarageHours[] | undefined, max = 8): DayOption[] {
  const out: DayOption[] = []
  for (let i = 0; i < 21 && out.length < max; i++) {
    const d = addDays(new Date(), i)
    const wd = d.getDay()
    const h = hours?.find((x) => x.weekday === wd)
    if (h && !h.is_closed && h.open_time) {
      out.push({ iso: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE d MMM', { locale: fr }), weekday: wd })
    }
  }
  return out
}

export function slotsForDate(hours: GarageHours[] | undefined, iso: string): string[] {
  const wd = new Date(iso).getDay()
  const h = hours?.find((x) => x.weekday === wd)
  return buildDaySlots(h?.open_time, h?.close_time)
}

/** First available slot per day, for the "prochains créneaux" preview on cards. */
export function nextSlots(hours: GarageHours[] | undefined, count = 3) {
  const out: { iso: string; label: string; time: string }[] = []
  for (const d of openDays(hours, count)) {
    const ts = slotsForDate(hours, d.iso)
    if (ts[0]) out.push({ iso: d.iso, label: d.label, time: ts[0] })
    if (out.length >= count) break
  }
  return out
}

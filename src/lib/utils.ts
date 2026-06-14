import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes with conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Small helper to pause (used by demo flows / optimistic UX). */
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Initials from a full name, e.g. "Sophie Martin" -> "SM". */
export function initials(name?: string | null) {
  if (!name) return '??'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

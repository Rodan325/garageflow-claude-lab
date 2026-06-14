import { useCallback, useEffect, useState } from 'react'

/**
 * Progressive disclosure for the Pro back-office.
 * - "essentiel": réservations, agenda, clients, véhicules — for a classic garage.
 * - "avance": adds workshop, quotes, team — for a more organised/technical garage.
 * The power is never removed, just tucked away by default.
 */
export type ProMode = 'essentiel' | 'avance'
const KEY = 'gf-pro-mode'

export function getProMode(): ProMode {
  if (typeof window === 'undefined') return 'essentiel'
  return localStorage.getItem(KEY) === 'avance' ? 'avance' : 'essentiel'
}

export function useProMode() {
  const [mode, setMode] = useState<ProMode>(() => getProMode())

  useEffect(() => {
    const handler = () => setMode(getProMode())
    window.addEventListener('gf-pro-mode-change', handler)
    return () => window.removeEventListener('gf-pro-mode-change', handler)
  }, [])

  const set = useCallback((m: ProMode) => {
    localStorage.setItem(KEY, m)
    setMode(m)
    window.dispatchEvent(new Event('gf-pro-mode-change'))
  }, [])

  return { mode, set }
}

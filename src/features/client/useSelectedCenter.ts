import { useCallback, useEffect, useState } from 'react'

// Mirrors useSelectedGarage: the client's chosen center persists per browser so
// it survives a login round-trip. It is validated against the garage's centers
// at use-site (a stale id from another garage is simply ignored).
const KEY = 'gf-selected-center'

export function getSelectedCenterId() {
  return typeof window !== 'undefined' ? localStorage.getItem(KEY) : null
}

export function useSelectedCenter() {
  const [selectedCenterId, setId] = useState<string | null>(() => getSelectedCenterId())

  useEffect(() => {
    const handler = () => setId(getSelectedCenterId())
    window.addEventListener('gf-center-change', handler)
    return () => window.removeEventListener('gf-center-change', handler)
  }, [])

  const select = useCallback((id: string) => {
    localStorage.setItem(KEY, id)
    setId(id)
    window.dispatchEvent(new Event('gf-center-change'))
  }, [])

  const clear = useCallback(() => {
    localStorage.removeItem(KEY)
    setId(null)
    window.dispatchEvent(new Event('gf-center-change'))
  }, [])

  return { selectedCenterId, select, clear }
}

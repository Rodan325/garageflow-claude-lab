import { useCallback, useEffect, useState } from 'react'
import { isDemo } from '@/lib/demo'

const KEY = 'gf-selected-garage'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function getSelectedGarageId() {
  if (typeof window === 'undefined') return null

  const garageId = localStorage.getItem(KEY)
  if (!garageId || isDemo()) return garageId

  if (!UUID_PATTERN.test(garageId)) {
    localStorage.removeItem(KEY)
    return null
  }

  return garageId
}

export function useSelectedGarage() {
  const [selectedGarageId, setId] = useState<string | null>(() => getSelectedGarageId())

  useEffect(() => {
    const handler = () => setId(getSelectedGarageId())
    window.addEventListener('gf-garage-change', handler)
    return () => window.removeEventListener('gf-garage-change', handler)
  }, [])

  const select = useCallback((id: string) => {
    localStorage.setItem(KEY, id)
    setId(id)
    window.dispatchEvent(new Event('gf-garage-change'))
  }, [])

  return { selectedGarageId, select }
}

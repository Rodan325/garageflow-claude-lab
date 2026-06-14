import { useCallback, useEffect, useState } from 'react'

const KEY = 'gf-selected-garage'

export function getSelectedGarageId() {
  return typeof window !== 'undefined' ? localStorage.getItem(KEY) : null
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

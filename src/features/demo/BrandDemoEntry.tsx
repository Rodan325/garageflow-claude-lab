import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useBrand, type BrandId } from '@/branding'

// Dedicated demo activation routes:
//   /demo/speedy  → activate the Speedy demo brand
//   /demo/reset   → back to the default product brand
const TARGETS: Record<string, BrandId> = { speedy: 'speedy', reset: 'default', default: 'default' }

export function BrandDemoEntry() {
  const { brand } = useParams()
  const { setBrand } = useBrand()
  const navigate = useNavigate()

  useEffect(() => {
    setBrand(TARGETS[(brand ?? '').toLowerCase()] ?? 'default')
    navigate('/', { replace: true })
  }, [brand, setBrand, navigate])

  return null
}

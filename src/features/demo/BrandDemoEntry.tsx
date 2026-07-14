import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useBrand, type BrandId } from '@/branding'
import { clearDemo, getDemoBrand, resetDemoData } from '@/lib/demo'

// Dedicated demo activation routes (the app uses HashRouter, so the real URLs
// carry the # fragment):
//   /#/demo/speedy → activate the Speedy demo brand
//   /#/demo/reset  → leave the demo, back to the default Clikarage brand
export function BrandDemoEntry() {
  const { brand } = useParams()
  const { setBrand, exitDemo } = useBrand()
  const navigate = useNavigate()

  useEffect(() => {
    const key = (brand ?? '').toLowerCase()
    if (key === 'speedy') {
      setBrand('speedy' as BrandId)
    } else {
      if (key === 'reset') {
        resetDemoData(getDemoBrand())
        clearDemo()
      }
      // default / reset / anything unknown → centralized exit.
      exitDemo()
    }
    navigate('/', { replace: true })
  }, [brand, setBrand, exitDemo, navigate])

  return null
}

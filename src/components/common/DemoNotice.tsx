import { useNavigate } from 'react-router-dom'
import { useBrand } from '@/branding'

/**
 * Sticky disclaimer shown while a NON-official (demo) brand is active — e.g. the
 * Speedy demo. Stays visible during the demo and offers the single, centralized
 * way back to the product. Renders nothing under the official brand.
 */
export function DemoNotice() {
  const { brand, exitDemo } = useBrand()
  const navigate = useNavigate()
  if (brand.official || !brand.demoNotice) return null
  return (
    <div
      role="note"
      className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-500/15 px-4 py-1.5 text-center text-[11px] font-medium leading-snug text-amber-700 dark:text-amber-300"
    >
      <span>{brand.demoNotice}</span>
      <button
        type="button"
        onClick={() => {
          exitDemo()
          navigate('/', { replace: true })
        }}
        className="rounded-md bg-amber-500/20 px-2 py-0.5 font-semibold hover:bg-amber-500/30"
      >
        Revenir à GarageFlow
      </button>
    </div>
  )
}

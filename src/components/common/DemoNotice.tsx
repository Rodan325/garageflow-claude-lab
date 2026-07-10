import { useBrand } from '@/branding'

/**
 * Discreet, always-visible disclaimer shown while a NON-official (demo) brand is
 * active — e.g. the Speedy demo. Renders nothing under the official product brand.
 */
export function DemoNotice() {
  const { brand } = useBrand()
  if (brand.official || !brand.demoNotice) return null
  return (
    <div
      role="note"
      className="w-full bg-amber-500/15 px-4 py-1.5 text-center text-[11px] font-medium leading-snug text-amber-700 dark:text-amber-300"
    >
      {brand.demoNotice}
    </div>
  )
}

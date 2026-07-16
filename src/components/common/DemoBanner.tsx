import { CircleGauge } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { useT } from '@/i18n'

/** Discreet product-preview badge. Reset remains available only at /demo/reset. */
export function DemoBanner() {
  const { demo } = useAuth()
  const t = useT()
  if (!demo) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 sm:bottom-4">
      <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-border/80 bg-background/95 px-3 py-1.5 text-center text-xs font-medium text-muted-foreground shadow-lg backdrop-blur">
        <CircleGauge className="h-3.5 w-3.5 shrink-0 text-primary" />
        {t.common.demoAccountNotice}
      </span>
    </div>
  )
}

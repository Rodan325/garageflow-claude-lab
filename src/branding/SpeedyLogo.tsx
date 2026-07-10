import { cn } from '@/lib/utils'

/**
 * PLACEHOLDER logo zone for the Speedy demo — deliberately NOT the official
 * Speedy logo (no brand asset is bundled). It uses the active brand color via
 * CSS vars. To use a real, authorized asset later, set `logoUrl`/`logoComponent`
 * on the Speedy brand config instead of editing the app.
 */
export function SpeedyLogo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-bold', className)}>
      <span
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-base font-extrabold text-primary-foreground shadow-sm"
        aria-hidden
      >
        S
      </span>
      {!compact && (
        <span className="text-lg tracking-tight">
          Speedy{' '}
          <span className="align-top text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">démo</span>
        </span>
      )}
    </span>
  )
}

import { cn } from '@/lib/utils'

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-bold', className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 17V11l5-4 5 4v6" />
          <path d="M4 17h12" />
          <circle cx="9" cy="14" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      </span>
      {!compact && (
        <span className="text-lg tracking-tight">
          Garage<span className="text-primary">Flow</span>
        </span>
      )}
    </span>
  )
}

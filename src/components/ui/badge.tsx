import { cn } from '@/lib/utils'
import type { Tone } from '@/types/domain'

export const toneClasses: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  primary: 'bg-accent text-accent-foreground',
  info: 'bg-info/15 text-info',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/20 text-warning-foreground',
  danger: 'bg-danger/15 text-danger',
}

const dotClasses: Record<Tone, string> = {
  neutral: 'bg-muted-foreground',
  primary: 'bg-primary',
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: { tone?: Tone } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  )
}

export function StatusPill({ tone = 'neutral', label }: { tone?: Tone; label: string }) {
  return (
    <Badge tone={tone}>
      <span className={cn('h-1.5 w-1.5 rounded-full', dotClasses[tone])} />
      {label}
    </Badge>
  )
}

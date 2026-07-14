import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLang } from '@/i18n'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-muted-foreground', className)} />
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

export function LoadingState({ label }: { label?: string }) {
  const { tr } = useLang()
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
      <Spinner className="h-6 w-6" />
      <p className="text-sm">{label ?? tr('Chargement…')}</p>
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        {description && <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function ErrorState({
  title,
  message,
  onRetry,
}: {
  title?: string
  message?: string
  onRetry?: () => void
}) {
  const { tr } = useLang()
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-danger/30 bg-danger/5 px-6 py-12 text-center">
      <p className="font-semibold text-danger">{title ?? tr('Une erreur est survenue')}</p>
      {message && <p className="mx-auto max-w-md text-sm text-muted-foreground">{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium hover:bg-muted/60"
        >
          {tr('Réessayer')}
        </button>
      )}
    </div>
  )
}

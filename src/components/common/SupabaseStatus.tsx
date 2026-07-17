import { Database, WifiOff } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthProvider'
import { cn } from '@/lib/utils'
import { useT } from '@/i18n'

/**
 * Product-level service status. Provider details stay out of the staff UI.
 */
export function SupabaseStatus({ className }: { className?: string }) {
  const { session, demo } = useAuth()
  const t = useT()
  const base = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium'

  if (demo) {
    return null
  }

  const connected = isSupabaseConfigured && !!session
  const label = connected
    ? t.common.serviceConnected
    : isSupabaseConfigured
      ? t.common.sessionRequired
      : t.common.serviceUnavailable

  return (
    <span
      className={cn(base, connected ? 'bg-success/15 text-success' : 'bg-warning/20 text-warning-foreground', className)}
      title={label}
    >
      {connected ? <Database className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
      {label}
    </span>
  )
}

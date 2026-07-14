import { Database, FlaskConical, WifiOff } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthProvider'
import { cn } from '@/lib/utils'
import { useLang } from '@/i18n'

/**
 * Backend status indicator shown in the Pro topbar — visible to non-technical
 * staff. In local demo mode it must NOT read as "offline": the demo simply
 * doesn't touch a real backend. Four honest states:
 *   demo → "Mode démo" · configured + session → "Supabase connecté"
 *   configured, no session → "Non connecté" · not configured → "Supabase non configuré"
 */
export function SupabaseStatus({ className }: { className?: string }) {
  const { session, demo } = useAuth()
  const { tr } = useLang()
  const base = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium'

  if (demo) {
    return (
      <span
        className={cn(base, 'bg-amber-500/15 text-warning-foreground', className)}
        title={tr('Mode démo local : les données restent dans ce navigateur')}
      >
        <FlaskConical className="h-3.5 w-3.5" />
        {tr('Mode démo')}
      </span>
    )
  }

  const connected = isSupabaseConfigured && !!session
  const label = connected ? tr('Supabase connecté') : isSupabaseConfigured ? tr('Non connecté') : tr('Supabase non configuré')
  const title = connected
    ? tr('Connecté à Supabase')
    : isSupabaseConfigured
      ? tr('Supabase configuré, aucune session active')
      : tr('Supabase non configuré')

  return (
    <span
      className={cn(base, connected ? 'bg-success/15 text-success' : 'bg-warning/20 text-warning-foreground', className)}
      title={title}
    >
      {connected ? <Database className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
      {label}
    </span>
  )
}

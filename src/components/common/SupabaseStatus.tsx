import { Database, WifiOff } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthProvider'
import { cn } from '@/lib/utils'

/** Backend status indicator shown in the Pro topbar — visible to non-technical staff. */
export function SupabaseStatus({ className }: { className?: string }) {
  const { session } = useAuth()
  const connected = isSupabaseConfigured && !!session
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        connected ? 'bg-success/15 text-success' : 'bg-warning/20 text-warning-foreground',
        className,
      )}
      title={connected ? 'Connecté à Supabase' : 'Backend non connecté'}
    >
      {connected ? <Database className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
      {connected ? 'Supabase connecté' : 'Hors ligne'}
    </span>
  )
}

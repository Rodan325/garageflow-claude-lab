import { AlertTriangle } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/supabase'

/** Shown only when the Supabase env is missing — keeps the demo honest. */
export function ConfigBanner() {
  if (isSupabaseConfigured) return null
  return (
    <div className="flex items-center justify-center gap-2 bg-warning px-4 py-2 text-center text-sm font-medium text-warning-foreground">
      <AlertTriangle className="h-4 w-4" />
      Supabase non configuré — copiez <code className="rounded bg-black/10 px-1">.env.example</code> vers{' '}
      <code className="rounded bg-black/10 px-1">.env</code> et renseignez l’URL + la clé anon.
    </div>
  )
}

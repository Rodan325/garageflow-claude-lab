import { AlertTriangle } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useT } from '@/i18n'

/** Shown only when the Supabase env is missing — keeps the demo honest. */
export function ConfigBanner() {
  const t = useT()
  if (isSupabaseConfigured) return null
  return (
    <div className="flex items-center justify-center gap-2 bg-warning px-4 py-2 text-center text-sm font-medium text-warning-foreground">
      <AlertTriangle className="h-4 w-4" />
      {t.login.configTitle} — {t.login.configBodyStart}{' '}
      <code className="rounded bg-black/10 px-1">.env</code>. {t.login.configBodyEnd}
    </div>
  )
}

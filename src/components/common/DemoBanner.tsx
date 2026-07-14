import { useNavigate } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { useBrand } from '@/branding'
import { getDemoBrand, resetDemoData } from '@/lib/demo'
import { useLang } from '@/i18n'

/** Visible strip shown whenever the app runs in local demo mode. */
export function DemoBanner() {
  const { demo, signOut } = useAuth()
  const { exitDemo } = useBrand()
  const navigate = useNavigate()
  const { tr } = useLang()
  if (!demo) return null
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 bg-amber-500/15 px-3 py-1.5 text-center text-xs font-medium text-warning-foreground">
      <FlaskConical className="h-3.5 w-3.5" />
      <span>
        {tr('Mode démo local ({mode}) — données fictives stockées uniquement dans ce navigateur. Supabase peut être configuré, mais ce mode ne modifie pas les vraies données.', { mode: tr(demo === 'garage' ? 'garage' : 'client') })}
      </span>
      <button
        onClick={() => {
          // Reset the active dataset before removing the brand that selects it.
          resetDemoData(getDemoBrand())
          exitDemo()
          navigate(0)
        }}
        className="ms-2 rounded-md bg-foreground/10 px-2 py-0.5 font-semibold hover:bg-foreground/20"
      >
        {tr('Réinitialiser les données')}
      </button>
      <button
        onClick={async () => {
          exitDemo()
          await signOut()
          navigate('/')
        }}
        className="rounded-md bg-foreground/10 px-2 py-0.5 font-semibold hover:bg-foreground/20"
      >
        {tr('Quitter la démo')}
      </button>
    </div>
  )
}

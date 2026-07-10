import { useNavigate } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { useBrand } from '@/branding'
import { resetDemoData } from '@/lib/demo'

/** Visible strip shown whenever the app runs in local demo mode. */
export function DemoBanner() {
  const { demo, signOut } = useAuth()
  const { exitDemo } = useBrand()
  const navigate = useNavigate()
  if (!demo) return null
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 bg-amber-500/15 px-3 py-1.5 text-center text-xs font-medium text-warning-foreground">
      <FlaskConical className="h-3.5 w-3.5" />
      <span>
        Mode démo local ({demo === 'garage' ? 'garage' : 'client'}) — données fictives stockées uniquement dans ce
        navigateur. Supabase peut être configuré, mais ce mode ne modifie pas les vraies données.
      </span>
      <button
        onClick={() => {
          // Centralized brand exit first, then reseed the (now default) data.
          exitDemo()
          resetDemoData()
          navigate(0)
        }}
        className="ml-2 rounded-md bg-foreground/10 px-2 py-0.5 font-semibold hover:bg-foreground/20"
      >
        Réinitialiser les données
      </button>
      <button
        onClick={async () => {
          exitDemo()
          await signOut()
          navigate('/')
        }}
        className="rounded-md bg-foreground/10 px-2 py-0.5 font-semibold hover:bg-foreground/20"
      >
        Quitter la démo
      </button>
    </div>
  )
}

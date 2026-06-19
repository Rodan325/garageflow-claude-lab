import { useNavigate } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { resetDemoData } from '@/lib/demo'

/** Visible strip shown whenever the app runs in local demo mode. */
export function DemoBanner() {
  const { demo, signOut } = useAuth()
  const navigate = useNavigate()
  if (!demo) return null
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 bg-amber-500/15 px-3 py-1.5 text-center text-xs font-medium text-warning-foreground">
      <FlaskConical className="h-3.5 w-3.5" />
      Mode démo local — données fictives ({demo === 'garage' ? 'garage' : 'client'})
      <button
        onClick={() => {
          resetDemoData()
          navigate(0)
        }}
        className="ml-2 rounded-md bg-foreground/10 px-2 py-0.5 font-semibold hover:bg-foreground/20"
      >
        Réinitialiser les données
      </button>
      <button
        onClick={async () => {
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

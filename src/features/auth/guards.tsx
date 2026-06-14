import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { Spinner } from '@/components/ui/feedback'

function FullScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <Spinner className="h-7 w-7" />
    </div>
  )
}

/** Gate for the Pro back-office: authenticated garage staff OR garage demo. */
export function RequireStaff({ children }: { children: React.ReactNode }) {
  const { ready, authed, isStaff } = useAuth()
  const loc = useLocation()
  if (!ready) return <FullScreen />
  if (!authed) return <Navigate to={`/login?redirect=${encodeURIComponent(loc.pathname)}`} replace />
  if (!isStaff) return <Navigate to="/app" replace />
  return <>{children}</>
}

/** Gate for client-only pages: authenticated client OR client demo. */
export function RequireClientAuth({ children }: { children: React.ReactNode }) {
  const { ready, authed, isStaff } = useAuth()
  const loc = useLocation()
  if (!ready) return <FullScreen />
  if (!authed) return <Navigate to={`/login?redirect=${encodeURIComponent(loc.pathname)}`} replace />
  if (isStaff) return <Navigate to="/pro" replace />
  return <>{children}</>
}

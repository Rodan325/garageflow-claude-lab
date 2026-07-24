import { Navigate, useLocation } from 'react-router-dom'
import { Spinner } from '@/components/ui/feedback'
import { useAuth } from '@/features/auth/AuthProvider'
import { NotFoundPage } from '@/features/marketing/NotFoundPage'
import { LEGAL_V2_DOCUMENTS } from '@/config/legalV2'
import {
  dpaSelfServiceEnabled,
  legalAcceptanceV2Enabled,
  legalDocsV2Enabled,
} from '@/lib/features'
import { resolveDpaAccess, type DpaAccessDecision } from './dpaAccess'

export function DpaAccessGuard({
  children,
}: {
  children: React.ReactNode | ((access: DpaAccessDecision) => React.ReactNode)
}) {
  const location = useLocation()
  const { ready, authed, accountType, membership } = useAuth()
  const access = resolveDpaAccess({
    authenticated: authed,
    accountType,
    organizationId: membership?.garage_id ?? null,
    role: membership?.role ?? null,
    organizationRole: membership?.organization_role ?? null,
    centerId: membership?.center_id ?? null,
    documentPublic: LEGAL_V2_DOCUMENTS.dpa.public,
    legalDocsV2: legalDocsV2Enabled(),
    legalAcceptanceV2: legalAcceptanceV2Enabled(),
    dpaSelfService: dpaSelfServiceEnabled(),
  })

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Spinner className="h-7 w-7" />
      </div>
    )
  }
  if (!access.canRead) {
    if (!authed) {
      const redirect = `${location.pathname}${location.search}`
      return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />
    }
    return <NotFoundPage />
  }

  return <>{typeof children === 'function' ? children(access) : children}</>
}

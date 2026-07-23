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

export interface DpaAuthority {
  role: string | null
  organizationRole: string | null
  centerId: string | null
}

export interface DpaAccessInput extends DpaAuthority {
  authenticated: boolean
  accountType: 'staff' | 'client' | null
  organizationId: string | null
  documentPublic: boolean
  legalDocsV2: boolean
  legalAcceptanceV2: boolean
  dpaSelfService: boolean
}

export interface DpaAccessDecision {
  canRead: boolean
  canAccept: boolean
}

export function isAuthorizedDpaRepresentative(authority: DpaAuthority): boolean {
  if (authority.organizationRole === 'organization_owner' || authority.organizationRole === 'network_admin') {
    return true
  }
  return (
    authority.organizationRole === null
    && authority.centerId === null
    && (authority.role === 'owner' || authority.role === 'admin')
  )
}

export function resolveDpaAccess(input: DpaAccessInput): DpaAccessDecision {
  const organizationMember = (
    input.authenticated
    && input.accountType === 'staff'
    && Boolean(input.organizationId)
  )
  const canRead = input.documentPublic === true || organizationMember
  const canAccept = (
    organizationMember
    && input.legalDocsV2 === true
    && input.legalAcceptanceV2 === true
    && input.dpaSelfService === true
    && isAuthorizedDpaRepresentative(input)
  )
  return { canRead, canAccept }
}

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

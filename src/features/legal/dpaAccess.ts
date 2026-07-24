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

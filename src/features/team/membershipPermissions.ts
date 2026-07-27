type MembershipAuthority = {
  center_id?: string | null
  center_role?: string | null
  role?: string | null
  status?: string | null
  organization_role?: string | null
}

export function canManageOrganizationMembership(membership?: MembershipAuthority | null) {
  if (!membership || membership.status !== 'active') return false
  return (
    membership.organization_role === 'organization_owner'
    && membership.role === 'owner'
  ) || (
    membership.organization_role === 'network_admin'
    && membership.role === 'admin'
  )
}

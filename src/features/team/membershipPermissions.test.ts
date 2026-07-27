import { describe, expect, it } from 'vitest'
import { canManageOrganizationMembership } from './membershipPermissions'

const membership = {
  role: 'admin',
  status: 'active',
  organization_role: null,
  center_id: '22222222-2222-4222-8222-22222222c001',
  center_role: 'center_manager',
}

describe('organization membership management capability', () => {
  it('allows only consistent active organization owners and network admins', () => {
    expect(canManageOrganizationMembership({
      ...membership,
      role: 'owner',
      organization_role: 'organization_owner',
    })).toBe(true)
    expect(canManageOrganizationMembership({
      ...membership,
      center_id: null,
      center_role: null,
      organization_role: 'network_admin',
    })).toBe(true)
  })

  it('does not trust a legacy admin role or a center manager role', () => {
    expect(canManageOrganizationMembership(membership)).toBe(false)
    expect(canManageOrganizationMembership({
      ...membership,
      organization_role: 'regional_manager',
    })).toBe(false)
  })

  it('fails closed for inactive, unscoped, or inconsistent memberships', () => {
    expect(canManageOrganizationMembership({
      ...membership,
      status: 'disabled',
      organization_role: 'network_admin',
    })).toBe(false)
    expect(canManageOrganizationMembership({
      ...membership,
      role: 'front_desk',
      center_id: null,
      center_role: null,
    })).toBe(false)
    expect(canManageOrganizationMembership({
      ...membership,
      role: 'admin',
      organization_role: 'organization_owner',
    })).toBe(false)
  })
})

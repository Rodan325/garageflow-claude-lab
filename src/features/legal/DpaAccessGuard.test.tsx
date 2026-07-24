import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const state = vi.hoisted(() => ({
  ready: true,
  authed: false,
  accountType: null as 'staff' | 'client' | null,
  membership: null as null | {
    garage_id: string
    role: string
    organization_role: string | null
    center_id: string | null
  },
  docs: false,
  acceptance: false,
  dpa: false,
}))

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => state,
}))
vi.mock('@/lib/features', () => ({
  legalDocsV2Enabled: () => state.docs,
  legalAcceptanceV2Enabled: () => state.docs && state.acceptance,
  dpaSelfServiceEnabled: () => state.docs && state.acceptance && state.dpa,
}))
vi.mock('@/features/marketing/NotFoundPage', () => ({
  NotFoundPage: () => <div>not found</div>,
}))

import { DpaAccessGuard } from './DpaAccessGuard'
import { resolveDpaAccess } from './dpaAccess'

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={['/dpa']}>
      <Routes>
        <Route path="/dpa" element={<DpaAccessGuard><div>private DPA</div></DpaAccessGuard>} />
        <Route path="/login" element={<div>login required</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  state.ready = true
  state.authed = false
  state.accountType = null
  state.membership = null
  state.docs = false
  state.acceptance = false
  state.dpa = false
})

afterEach(cleanup)

describe('private DPA access', () => {
  it('redirects an anonymous visitor even when every self-service flag is enabled', () => {
    state.docs = true
    state.acceptance = true
    state.dpa = true
    renderGuard()
    expect(screen.getByText('login required')).toBeInTheDocument()
    expect(screen.queryByText('private DPA')).toBeNull()
  })

  it('rejects an authenticated user without an organization', () => {
    state.authed = true
    state.accountType = 'staff'
    renderGuard()
    expect(screen.getByText('not found')).toBeInTheDocument()
  })

  it('allows an organization member to read but not accept', () => {
    expect(resolveDpaAccess({
      authenticated: true,
      accountType: 'staff',
      organizationId: 'organization-a',
      role: 'advisor',
      organizationRole: null,
      centerId: null,
      documentPublic: false,
      legalDocsV2: true,
      legalAcceptanceV2: true,
      dpaSelfService: true,
    })).toEqual({ canRead: true, canAccept: false })
  })

  it('allows an organization owner to accept only with the complete exact flag chain', () => {
    const base = {
      authenticated: true,
      accountType: 'staff' as const,
      organizationId: 'organization-a',
      role: 'owner',
      organizationRole: 'organization_owner',
      centerId: null,
      documentPublic: false,
    }
    expect(resolveDpaAccess({
      ...base,
      legalDocsV2: true,
      legalAcceptanceV2: true,
      dpaSelfService: true,
    })).toEqual({ canRead: true, canAccept: true })
    for (const flags of [
      { legalDocsV2: false, legalAcceptanceV2: true, dpaSelfService: true },
      { legalDocsV2: true, legalAcceptanceV2: false, dpaSelfService: true },
      { legalDocsV2: true, legalAcceptanceV2: true, dpaSelfService: false },
    ]) {
      expect(resolveDpaAccess({ ...base, ...flags })).toEqual({ canRead: true, canAccept: false })
    }
  })

  it('respects public false independently from feature flags', () => {
    expect(resolveDpaAccess({
      authenticated: false,
      accountType: null,
      organizationId: null,
      role: null,
      organizationRole: null,
      centerId: null,
      documentPublic: false,
      legalDocsV2: true,
      legalAcceptanceV2: true,
      dpaSelfService: true,
    }).canRead).toBe(false)
  })
})

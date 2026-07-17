import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RequireClientAuth, RequireStaff } from './guards'

const authState = vi.hoisted(() => ({
  ready: true,
  authed: true,
  accountType: null as 'staff' | 'client' | null,
}))

vi.mock('./AuthProvider', () => ({ useAuth: () => authState }))
vi.mock('@/features/legal/LegalAcceptanceGate', () => ({
  LegalAcceptanceGate: ({ children }: { children: React.ReactNode }) => children,
}))

beforeEach(() => {
  authState.ready = true
  authState.authed = true
  authState.accountType = null
})

describe('authenticated route guards', () => {
  it('waits for the account type instead of redirecting a loading staff session to the client area', () => {
    const { rerender } = renderStaffRoute()
    expect(screen.queryByText('staff area')).not.toBeInTheDocument()
    expect(screen.queryByText('client area')).not.toBeInTheDocument()

    authState.accountType = 'staff'
    rerender(staffRoutes())
    expect(screen.getByText('staff area')).toBeInTheDocument()
  })

  it('waits for the account type instead of exposing a client route to a loading staff session', () => {
    const { rerender } = renderClientRoute()
    expect(screen.queryByText('client area')).not.toBeInTheDocument()
    expect(screen.queryByText('staff area')).not.toBeInTheDocument()

    authState.accountType = 'staff'
    rerender(clientRoutes())
    expect(screen.getByText('staff area')).toBeInTheDocument()
  })
})

function staffRoutes() {
  return (
    <MemoryRouter initialEntries={['/pro']}>
      <Routes>
        <Route path="/pro" element={<RequireStaff><div>staff area</div></RequireStaff>} />
        <Route path="/app" element={<div>client area</div>} />
      </Routes>
    </MemoryRouter>
  )
}

function clientRoutes() {
  return (
    <MemoryRouter initialEntries={['/app/bookings']}>
      <Routes>
        <Route path="/app/bookings" element={<RequireClientAuth><div>client area</div></RequireClientAuth>} />
        <Route path="/pro" element={<div>staff area</div>} />
      </Routes>
    </MemoryRouter>
  )
}

function renderStaffRoute() {
  return render(staffRoutes())
}

function renderClientRoute() {
  return render(clientRoutes())
}

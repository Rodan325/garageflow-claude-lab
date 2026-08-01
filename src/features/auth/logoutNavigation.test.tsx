import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

/**
 * AUTH-UX-01 — after a sign-out the redirect must REPLACE the protected entry
 * in history, otherwise the browser back button walks straight back into it.
 */

const auth = { ready: true, authed: false, isStaff: false }

vi.mock('./AuthProvider', () => ({ useAuth: () => auth }))
vi.mock('@/features/legal/LegalAcceptanceGate', () => ({
  LegalAcceptanceGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const { RequireClientAuth } = await import('./guards')

function Probe() {
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <div>
      <span data-testid="path">{location.pathname}</span>
      <button onClick={() => navigate(-1)}>retour</button>
    </div>
  )
}

function renderAt(entries: string[], index: number) {
  return render(
    <MemoryRouter initialEntries={entries} initialIndex={index}>
      <Probe />
      <Routes>
        <Route path="/login" element={<span>page de connexion</span>} />
        <Route
          path="/app/profile"
          element={<RequireClientAuth><span>zone protégée</span></RequireClientAuth>}
        />
        <Route path="/" element={<span>accueil public</span>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('navigation after sign-out', () => {
  it('redirects a signed-out user away from the protected area', () => {
    renderAt(['/', '/app/profile'], 1)
    expect(screen.getByTestId('path')).toHaveTextContent('/login')
    expect(screen.queryByText('zone protégée')).toBeNull()
  })

  it('does not return to the protected page when going back', () => {
    renderAt(['/', '/app/profile'], 1)
    expect(screen.getByTestId('path')).toHaveTextContent('/login')

    screen.getByText('retour').click()

    // The protected entry was replaced, so back lands on the public page.
    expect(screen.getByTestId('path')).not.toHaveTextContent('/app/profile')
    expect(screen.queryByText('zone protégée')).toBeNull()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SupabaseStatus } from './SupabaseStatus'

// Supabase is "configured" for these tests so we can exercise the connected /
// not-connected branches; the demo branch must win regardless of this.
vi.mock('@/lib/supabase', () => ({ isSupabaseConfigured: true }))

const mockAuth = vi.fn()
vi.mock('@/features/auth/AuthProvider', () => ({ useAuth: () => mockAuth() }))

describe('SupabaseStatus', () => {
  beforeEach(() => mockAuth.mockReset())

  it('leaves the single global product notice to DemoBanner in presentation mode', () => {
    mockAuth.mockReturnValue({ demo: 'garage', session: null })
    const { container } = render(<SupabaseStatus />)
    expect(container).toBeEmptyDOMElement()
    expect(document.body).not.toHaveTextContent('Supabase')
  })

  it('shows a generic synchronisation state with a real session', () => {
    mockAuth.mockReturnValue({ demo: null, session: { user: { id: 'u1' } } })
    render(<SupabaseStatus />)
    expect(screen.getByText('Service synchronisé')).toBeInTheDocument()
  })

  it('shows a generic session state when configured but signed out', () => {
    mockAuth.mockReturnValue({ demo: null, session: null })
    render(<SupabaseStatus />)
    expect(screen.getByText('Session requise')).toBeInTheDocument()
  })
})

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

  it('shows "Mode démo" in demo mode (never "Hors ligne"), even without a session', () => {
    mockAuth.mockReturnValue({ demo: 'garage', session: null })
    render(<SupabaseStatus />)
    expect(screen.getByText('Mode démo')).toBeInTheDocument()
    expect(screen.queryByText('Hors ligne')).toBeNull()
  })

  it('shows "Supabase connecté" with a real session', () => {
    mockAuth.mockReturnValue({ demo: null, session: { user: { id: 'u1' } } })
    render(<SupabaseStatus />)
    expect(screen.getByText('Supabase connecté')).toBeInTheDocument()
  })

  it('shows "Non connecté" when configured but no session', () => {
    mockAuth.mockReturnValue({ demo: null, session: null })
    render(<SupabaseStatus />)
    expect(screen.getByText('Non connecté')).toBeInTheDocument()
  })
})

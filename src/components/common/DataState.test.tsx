import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { EmptyState } from '@/components/ui/feedback'
import { DataState, classifyDataError } from './DataState'

/**
 * UX-ERR-01 — loading, a genuinely empty list, a network failure, a refused
 * access and an expired session must never look the same.
 */

function view(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('classifyDataError', () => {
  it('detects an expired session', () => {
    expect(classifyDataError({ code: 'PGRST301' })).toBe('expired')
    expect(classifyDataError({ message: 'JWT expired' })).toBe('expired')
    expect(classifyDataError({ status: 401, message: 'invalid token' })).toBe('expired')
    expect(classifyDataError({ message: 'Invalid Refresh Token: Already Used' })).toBe('expired')
  })

  it('detects a refused access', () => {
    expect(classifyDataError({ code: '42501' })).toBe('forbidden')
    expect(classifyDataError({ status: 403 })).toBe('forbidden')
    expect(classifyDataError({ message: 'permission denied for table quotes' })).toBe('forbidden')
    expect(classifyDataError({ message: 'new row violates row-level security policy' })).toBe('forbidden')
  })

  it('detects a network failure', () => {
    expect(classifyDataError(new TypeError('Failed to fetch'))).toBe('network')
    expect(classifyDataError({ message: 'NetworkError when attempting to fetch resource' })).toBe('network')
    expect(classifyDataError({ message: 'fetch failed' })).toBe('network')
  })

  it('falls back to unknown', () => {
    expect(classifyDataError({ code: '23505', message: 'duplicate key' })).toBe('unknown')
    expect(classifyDataError(null)).toBe('unknown')
  })

  it('does not mistake a permission error for an expired session', () => {
    expect(classifyDataError({ status: 401, message: 'permission denied' })).toBe('forbidden')
  })
})

describe('DataState rendering', () => {
  it('shows the loading state, never the empty state', () => {
    view(<DataState isLoading isEmpty empty={<EmptyState title="Aucune demande" />}>contenu</DataState>)
    expect(screen.getByText('Chargement…')).toBeInTheDocument()
    expect(screen.queryByText('Aucune demande')).toBeNull()
    expect(screen.queryByText('contenu')).toBeNull()
  })

  it('shows the empty state when the query really returned nothing', () => {
    view(<DataState isEmpty empty={<EmptyState title="Aucune demande" />}>contenu</DataState>)
    expect(screen.getByText('Aucune demande')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('distinguishes a network error from "no result"', () => {
    const onRetry = vi.fn()
    view(
      <DataState isError error={new TypeError('Failed to fetch')} onRetry={onRetry} empty={<EmptyState title="Aucune demande" />}>
        contenu
      </DataState>,
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Connexion indisponible')).toBeInTheDocument()
    // The crux of UX-ERR-01: an outage must not be announced as an empty list.
    expect(screen.queryByText('Aucune demande')).toBeNull()
    expect(screen.queryByText('contenu')).toBeNull()

    screen.getByText('Réessayer').click()
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('shows a refused access without a retry button', () => {
    view(<DataState isError error={{ code: '42501' }} onRetry={vi.fn()}>contenu</DataState>)
    expect(screen.getByText('Accès refusé')).toBeInTheDocument()
    // Retrying would fail identically, so the button must not be offered.
    expect(screen.queryByText('Réessayer')).toBeNull()
  })

  it('shows an expired session with a link to sign in again', () => {
    view(<DataState isError error={{ code: 'PGRST301' }}>contenu</DataState>)
    expect(screen.getByText('Session expirée')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'Se reconnecter' })
    expect(link).toHaveAttribute('href', '/login')
  })

  it('shows a generic error with a retry for anything else', () => {
    const onRetry = vi.fn()
    view(<DataState isError error={{ code: '23505' }} onRetry={onRetry}>contenu</DataState>)
    expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument()
    screen.getByText('Réessayer').click()
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('renders the content when everything succeeded', () => {
    view(<DataState empty={<EmptyState title="Aucune demande" />}>contenu</DataState>)
    expect(screen.getByText('contenu')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

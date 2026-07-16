import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DemoBanner } from './DemoBanner'

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({ demo: 'garage' }),
}))

describe('DemoBanner', () => {
  it('shows a discreet product account notice without permanent reset actions', () => {
    const { container } = render(<DemoBanner />)

    expect(screen.getByText('Compte de démonstration — les actions n’affectent aucune donnée réelle.')).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('bottom-20', 'sm:bottom-4')
    expect(screen.queryByRole('button', { name: 'Réinitialiser les données' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Quitter la démo' })).toBeNull()
  })
})

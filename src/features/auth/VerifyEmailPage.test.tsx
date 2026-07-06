import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { VerifyEmailPage } from './VerifyEmailPage'

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { resend: vi.fn() } },
  isSupabaseConfigured: true,
}))
vi.mock('@/components/ui/toast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }))

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/verify-email" element={<VerifyEmailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('VerifyEmailPage', () => {
  it('shows the email passed as a query param', () => {
    renderAt('/verify-email?email=julie%40example.fr')
    expect(screen.getByText('Vérifiez votre email')).toBeInTheDocument()
    expect(screen.getByText('julie@example.fr')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aller à la connexion' })).toBeInTheDocument()
    // The resend option appears only when we know which address to resend to.
    expect(screen.getByRole('button', { name: /Renvoyer l’email/ })).toBeInTheDocument()
  })

  it('renders generic copy and hides resend without an email param', () => {
    renderAt('/verify-email')
    expect(screen.getByText('Vérifiez votre email')).toBeInTheDocument()
    expect(screen.getByText(/votre adresse email/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Renvoyer l’email/ })).toBeNull()
  })
})

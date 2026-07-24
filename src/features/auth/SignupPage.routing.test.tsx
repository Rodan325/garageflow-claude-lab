import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { SignupPage } from './SignupPage'

// Controllable auth mock: each test sets the signUp result and the session state
// that the post-signup effects observe.
const h = vi.hoisted(() => ({
  signUp: vi.fn(),
  session: null as unknown,
  accountType: null as 'client' | 'staff' | null,
  ready: true,
}))

vi.mock('./AuthProvider', () => ({
  useAuth: () => ({
    signUp: h.signUp,
    ready: h.ready,
    session: h.session,
    accountType: h.accountType,
  }),
}))
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))
function LocationProbe() {
  const loc = useLocation()
  return <div data-testid="loc">{loc.pathname + loc.search}</div>
}

function renderSignup() {
  return render(
    <MemoryRouter initialEntries={['/signup']}>
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/app" element={<><div>ESPACE CLIENT</div><LocationProbe /></>} />
        <Route path="/verify-email" element={<><div>VERIFIER EMAIL</div><LocationProbe /></>} />
        <Route path="/login" element={<><div>CONNEXION</div><LocationProbe /></>} />
      </Routes>
    </MemoryRouter>,
  )
}

// Fill every field with values that pass the signup schema (same valid combo as
// signupSchema.test.ts), then tick both consent checkboxes.
function fillValidForm(container: HTMLElement) {
  const set = (id: string, value: string) => {
    const el = container.querySelector(`#${id}`) as HTMLInputElement
    fireEvent.change(el, { target: { value } })
  }
  set('fullName', 'Julie Durand')
  set('email', 'julie@example.fr')
  set('emailConfirm', 'julie@example.fr')
  set('password', 'Trokman472xz!!')
  set('passwordConfirm', 'Trokman472xz!!')
  container.querySelectorAll('input[type="checkbox"]').forEach((c) => fireEvent.click(c))
}

beforeEach(() => {
  h.signUp.mockReset()
  h.session = null
  h.accountType = null
  h.ready = true
})

describe('SignupPage — routing après inscription', () => {
  it('inscription avec session → /app', async () => {
    // Supabase returns a session immediately (email confirmation disabled).
    h.signUp.mockResolvedValue({ error: null, needsEmailConfirmation: false, email: 'julie@example.fr' })
    h.session = { user: { id: 'u1' } }
    h.accountType = 'client'

    const { container } = renderSignup()
    fillValidForm(container)
    fireEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    expect(await screen.findByText('ESPACE CLIENT')).toBeInTheDocument()
  })

  it('inscription sans session → /verify-email?email=...', async () => {
    // Supabase created the user but awaits email confirmation (no session).
    h.signUp.mockResolvedValue({ error: null, needsEmailConfirmation: true, email: 'julie@example.fr' })

    const { container } = renderSignup()
    fillValidForm(container)
    fireEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    expect(await screen.findByText('VERIFIER EMAIL')).toBeInTheDocument()
    expect(screen.getByTestId('loc').textContent).toContain('email=julie%40example.fr')
  })
})

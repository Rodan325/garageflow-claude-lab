import { render, screen, waitFor } from '@testing-library/react'
import { QueryClientProvider, useQuery } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { queryClient } from '@/lib/queryClient'
import { AuthProvider, useAuth } from './AuthProvider'

/**
 * AUTH-UX-01 — the sign-out must invalidate local state immediately instead of
 * waiting for the SIGNED_OUT event, and must never leave the previous account's
 * data readable from the React Query cache.
 */

const session = (userId: string) => ({
  access_token: `token-${userId}`,
  refresh_token: 'r',
  expires_in: 3600,
  token_type: 'bearer',
  user: { id: userId, email: `${userId}@example.test` },
})

const mocks = vi.hoisted(() => ({
  signOut: vi.fn(async (): Promise<{ error: Error | null }> => ({ error: null })),
  getSession: vi.fn(async () => ({ data: { session: null as unknown }, error: null })),
  onAuthStateChange: vi.fn(),
  from: vi.fn(),
}))

let authListener: ((event: string, s: unknown) => void | Promise<void>) | null = null

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: mocks.getSession,
      signOut: mocks.signOut,
      onAuthStateChange: (cb: (event: string, s: unknown) => void) => {
        authListener = cb
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
          eq: () => ({ order: () => ({ limit: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
        }),
      }),
    }),
  },
}))

/** Renders the auth flags plus a query whose data must disappear on sign-out. */
function Probe() {
  const { ready, authed, signOut } = useAuth()
  const { data } = useQuery({
    queryKey: ['secret'],
    queryFn: async () => 'DONNEE-COMPTE-PRECEDENT',
    enabled: authed,
  })
  return (
    <div>
      <span data-testid="ready">{String(ready)}</span>
      <span data-testid="authed">{String(authed)}</span>
      <span data-testid="secret">{data ?? ''}</span>
      <button onClick={() => void signOut()}>déconnexion</button>
    </div>
  )
}

function renderApp() {
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider><Probe /></AuthProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  authListener = null
  mocks.signOut.mockReset().mockResolvedValue({ error: null })
  mocks.getSession.mockReset().mockResolvedValue({ data: { session: session('user-1') }, error: null })
  queryClient.clear()
  sessionStorage.clear()
  localStorage.clear()
})

afterEach(() => {
  queryClient.clear()
  vi.restoreAllMocks()
})

async function signedIn() {
  const view = renderApp()
  await waitFor(() => expect(screen.getByTestId('ready')).toHaveTextContent('true'))
  await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('true'))
  await waitFor(() => expect(screen.getByTestId('secret')).toHaveTextContent('DONNEE-COMPTE-PRECEDENT'))
  return view
}

describe('AUTH-UX-01 — sign-out', () => {
  it('signs out immediately without waiting for the SIGNED_OUT event', async () => {
    await signedIn()
    screen.getByText('déconnexion').click()

    // No SIGNED_OUT emitted on purpose: the UI must already be signed out.
    await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('false'))
    expect(mocks.signOut).toHaveBeenCalledTimes(1)
  })

  it('stays signed out when the SIGNED_OUT event arrives late', async () => {
    await signedIn()
    screen.getByText('déconnexion').click()
    await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('false'))

    // Delayed event must be idempotent, not resurrect anything.
    await authListener?.('SIGNED_OUT', null)
    await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('false'))
    expect(screen.getByTestId('secret')).toHaveTextContent('')
  })

  it('does not keep the protected UI when Supabase rejects the sign-out', async () => {
    mocks.signOut.mockRejectedValueOnce(new Error('network down'))
    await signedIn()
    screen.getByText('déconnexion').click()

    await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('false'))
    // Falls back to a local-scope sign-out so a refresh cannot restore it.
    await waitFor(() => expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' }))
  })

  it('does not keep the protected UI when Supabase returns an error object', async () => {
    mocks.signOut.mockResolvedValueOnce({ error: new Error('server error') })
    await signedIn()
    screen.getByText('déconnexion').click()

    await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('false'))
    await waitFor(() => expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' }))
  })

  it('ignores a double click instead of signing out twice', async () => {
    let resolveSignOut: (v: { error: null }) => void = () => {}
    mocks.signOut.mockImplementationOnce(
      () => new Promise((resolve) => { resolveSignOut = resolve as (v: { error: null }) => void }),
    )
    await signedIn()

    const button = screen.getByText('déconnexion')
    button.click()
    button.click()
    button.click()

    resolveSignOut({ error: null })
    await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('false'))
    expect(mocks.signOut).toHaveBeenCalledTimes(1)
  })

  it('clears cached data so nothing from the previous account stays visible', async () => {
    await signedIn()
    expect(queryClient.getQueryData(['secret'])).toBe('DONNEE-COMPTE-PRECEDENT')

    screen.getByText('déconnexion').click()

    await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('false'))
    expect(queryClient.getQueryData(['secret'])).toBeUndefined()
    expect(screen.getByTestId('secret')).toHaveTextContent('')
  })

  it('shows no session after a refresh once the sign-out is done', async () => {
    await signedIn()
    screen.getByText('déconnexion').click()
    await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('false'))

    // Simulate reloading the tab: Supabase no longer returns a session.
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null })
    renderApp()
    const flags = await screen.findAllByTestId('authed')
    await waitFor(() => flags.forEach((node) => expect(node).toHaveTextContent('false')))
  })

  it('drops the previous cache when another account signs in in the same tab', async () => {
    await signedIn()
    // An entry no mounted component observes, so it cannot be refetched back:
    // if it survives the switch, the cache really was not cleared.
    queryClient.setQueryData(['dossier-compte-1'], 'DONNEE-COMPTE-PRECEDENT')

    // No explicit sign-out: a different identity arrives through the listener.
    await authListener?.('SIGNED_IN', session('user-2'))

    await waitFor(() => expect(queryClient.getQueryData(['dossier-compte-1'])).toBeUndefined())
  })

  it('keeps the cache when the same user refreshes their token', async () => {
    await signedIn()
    queryClient.setQueryData(['dossier-compte-1'], 'DONNEE-COMPTE-PRECEDENT')

    await authListener?.('TOKEN_REFRESHED', session('user-1'))

    // Same identity → no reason to drop anything.
    expect(queryClient.getQueryData(['dossier-compte-1'])).toBe('DONNEE-COMPTE-PRECEDENT')
  })
})

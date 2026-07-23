import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider } from '@/i18n'

const state = vi.hoisted(() => ({
  v2: false,
  statuses: [] as Array<Record<string, unknown>>,
  acceptances: [] as Array<Record<string, unknown>>,
  getStatuses: vi.fn(),
  listAcceptances: vi.fn(),
  record: vi.fn(),
}))

vi.mock('@/lib/features', () => ({
  legalAcceptanceV2Enabled: () => state.v2,
}))
vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    userId: 'owner-a',
    demo: null,
    membership: { garage_id: 'organization-a' },
    garage: { id: 'organization-a' },
  }),
}))
vi.mock('./legalAcceptance', () => ({
  getLegalV2AcceptanceStatuses: state.getStatuses,
  listOwnLegalAcceptances: state.listAcceptances,
  recordLegalV2Acceptance: state.record,
  requiredLegalV2Documents: () => ['terms_pro', 'dpa'],
}))
vi.mock('@/components/common/PageHeader', () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}))
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ error: vi.fn() }),
}))

import { LegalStatusPage } from './LegalStatusPage'

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <MemoryRouter>
          <LegalStatusPage />
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>,
  )
}

function status(
  documentKey: 'terms_pro' | 'dpa',
  options: { accepted?: boolean; current?: boolean; canAccept?: boolean } = {},
) {
  const accepted = options.accepted ?? false
  const current = options.current ?? true
  const canAccept = options.canAccept ?? true
  return {
    accepted,
    current,
    can_accept: canAccept,
    reason: accepted ? 'accepted' : canAccept ? 'acceptance_available' : 'authorized_representative_required',
    document_key: documentKey,
    document_version: current ? (documentKey === 'dpa' ? 'dpa-2026-01' : 'terms-2026-01') : null,
    document_sha256: current ? 'a'.repeat(64) : null,
    organization_id: 'organization-a',
    acceptance_scope: 'organization',
    accepted_at: accepted ? '2026-07-23T12:00:00Z' : null,
  }
}

beforeEach(() => {
  localStorage.setItem('gf-lang', 'fr')
  state.v2 = false
  state.statuses = []
  state.acceptances = []
  state.getStatuses.mockReset().mockImplementation(async () => state.statuses)
  state.listAcceptances.mockReset().mockImplementation(async () => state.acceptances)
  state.record.mockReset().mockResolvedValue(undefined)
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('professional legal status V2', () => {
  it('preserves the legacy status path while V2 is disabled', async () => {
    renderPage()

    expect(await screen.findByText('Statut légal')).toBeInTheDocument()
    expect(state.listAcceptances).toHaveBeenCalledWith('owner-a')
    expect(state.getStatuses).not.toHaveBeenCalled()
    expect(screen.getByRole('link', { name: 'Conditions d’utilisation' })).toHaveAttribute('href', '/terms')
  })

  it('uses V2 registry statuses and the professional terms route when enabled', async () => {
    state.v2 = true
    state.statuses = [status('terms_pro'), status('dpa', { accepted: true })]
    renderPage()

    expect(await screen.findByText('terms-2026-01', { exact: false })).toBeInTheDocument()
    expect(state.getStatuses).toHaveBeenCalledWith('garage', 'organization-a', 'fr')
    expect(screen.getByRole('link', { name: 'Conditions d’utilisation' })).toHaveAttribute('href', '/terms/pro')
    expect(screen.getByRole('button', { name: 'Accepter la version courante' })).toBeInTheDocument()
  })

  it('shows status but no action to a simple member', async () => {
    state.v2 = true
    state.statuses = [
      status('terms_pro', { canAccept: false }),
      status('dpa', { canAccept: false }),
    ]
    renderPage()

    expect(await screen.findAllByText(
      'Seul un propriétaire ou représentant habilité de l’organisation peut accepter ce document.',
    )).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Accepter la version courante' })).toBeNull()
  })

  it('does not count an old hash as current evidence', async () => {
    state.v2 = true
    state.statuses = [
      status('terms_pro', { current: false, canAccept: false }),
      status('dpa', { accepted: true }),
    ]
    renderPage()

    expect(await screen.findByText(/Aucune version applicable publiée/)).toBeInTheDocument()
    expect(screen.getAllByText('Manquante')).toHaveLength(1)
    expect(screen.queryByRole('button', { name: 'Accepter la version courante' })).toBeNull()
  })

  it('allows an authorized representative to record through the RPC client', async () => {
    state.v2 = true
    state.statuses = [status('terms_pro'), status('dpa', { accepted: true })]
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Accepter la version courante' }))
    await waitFor(() => expect(state.record).toHaveBeenCalledWith('terms_pro', {
      displayedLanguage: 'fr',
      organizationId: 'organization-a',
    }))
  })
})

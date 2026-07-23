import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider } from '@/i18n'

const state = vi.hoisted(() => ({
  v2: false,
  legacyMissing: [] as string[],
  v2Statuses: [] as Array<Record<string, unknown>>,
  v2Error: false,
  memberRole: 'owner',
  organizationRole: null as string | null,
  centerId: null as string | null,
  getLegacy: vi.fn(),
  getV2: vi.fn(),
  recordV2: vi.fn(),
}))

vi.mock('@/lib/features', () => ({ legalAcceptanceV2Enabled: () => state.v2 }))
vi.mock('@/lib/supabase', () => ({ isSupabaseConfigured: true }))
vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    demo: null,
    userId: 'user-owner-a',
    membership: {
      garage_id: 'organization-a',
      role: state.memberRole,
      organization_role: state.organizationRole,
      center_id: state.centerId,
    },
    garage: { id: 'organization-a' },
    signOut: vi.fn(),
  }),
}))
vi.mock('./legalAcceptance', () => ({
  getMissingLegalDocuments: state.getLegacy,
  getLegalV2AcceptanceStatuses: state.getV2,
  recordLegalV2Acceptance: state.recordV2,
}))
vi.mock('@/components/common/LegalFooter', () => ({ LegalFooter: () => null }))
vi.mock('@/components/common/LanguageSwitcher', () => ({ LanguageSwitcher: () => null }))
vi.mock('@/components/ui/toast', () => ({ useToast: () => ({ error: vi.fn() }) }))

import { LegalAcceptanceGate } from './LegalAcceptanceGate'

function renderGate() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <MemoryRouter>
          <LegalAcceptanceGate role="garage"><div>protected workspace</div></LegalAcceptanceGate>
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  localStorage.setItem('gf-lang', 'fr')
  state.v2 = false
  state.legacyMissing = []
  state.v2Statuses = []
  state.v2Error = false
  state.memberRole = 'owner'
  state.organizationRole = null
  state.centerId = null
  state.getLegacy.mockReset().mockImplementation(async () => state.legacyMissing)
  state.getV2.mockReset().mockImplementation(async () => {
    if (state.v2Error) throw new Error('V2 evidence unavailable')
    return state.v2Statuses
  })
  state.recordV2.mockReset().mockResolvedValue(undefined)
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('LegalAcceptanceGate V2 switching', () => {
  function missingStatus(
    documentKey: 'terms_pro' | 'terms_client' | 'dpa',
    canAccept = true,
  ) {
    return {
      accepted: false,
      current: true,
      can_accept: canAccept,
      reason: canAccept ? 'acceptance_available' : 'authorized_representative_required',
      document_key: documentKey,
      document_version: documentKey === 'dpa' ? 'dpa-2026-01' : 'terms-2026-01',
      document_sha256: 'a'.repeat(64),
      organization_id: documentKey === 'terms_client' ? null : 'organization-a',
      acceptance_scope: documentKey === 'terms_client' ? 'user' : 'organization',
      accepted_at: null,
    }
  }

  it('preserves the legacy evidence query when V2 is disabled', async () => {
    state.legacyMissing = []
    renderGate()

    expect(await screen.findByText('protected workspace')).toBeInTheDocument()
    expect(state.getLegacy).toHaveBeenCalledWith('user-owner-a', 'garage')
    expect(state.getV2).not.toHaveBeenCalled()
    expect(state.recordV2).not.toHaveBeenCalled()
  })

  it('blocks new legacy acceptance when historical evidence is missing', async () => {
    state.legacyMissing = ['terms']
    renderGate()

    expect(await screen.findByText('Documents contractuels en cours de validation')).toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(screen.queryByRole('button', { name: 'J’accepte et je continue' })).toBeNull()
  })

  it('queries and records the organization-scoped V2 documents when enabled', async () => {
    state.v2 = true
    state.v2Statuses = [missingStatus('terms_pro'), missingStatus('dpa')]
    const user = userEvent.setup()
    renderGate()

    expect(await screen.findByText(/terms-2026-01/)).toBeInTheDocument()
    expect(screen.getByText(/dpa-2026-01/)).toBeInTheDocument()
    expect(state.getV2).toHaveBeenCalledWith('garage', 'organization-a', 'fr')
    expect(state.getLegacy).not.toHaveBeenCalled()

    for (const checkbox of screen.getAllByRole('checkbox')) await user.click(checkbox)
    await user.click(screen.getByRole('button', { name: 'J’accepte et je continue' }))

    await waitFor(() => expect(state.recordV2).toHaveBeenCalledTimes(2))
    expect(state.recordV2).toHaveBeenNthCalledWith(1, 'terms_pro', {
      displayedLanguage: 'fr',
      organizationId: 'organization-a',
    })
    expect(state.recordV2).toHaveBeenNthCalledWith(2, 'dpa', {
      displayedLanguage: 'fr',
      organizationId: 'organization-a',
    })
  })

  it('does not offer any organization-scoped acceptance to a simple member', async () => {
    state.v2 = true
    state.memberRole = 'advisor'
    state.v2Statuses = [missingStatus('terms_pro', false), missingStatus('dpa', false)]
    renderGate()

    expect(await screen.findAllByText('Seul un propriétaire ou représentant habilité de l’organisation peut accepter ce document.')).toHaveLength(2)
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(screen.getByRole('button', { name: 'J’accepte et je continue' })).toBeDisabled()
    expect(state.recordV2).not.toHaveBeenCalled()
  })

  it('unblocks the workspace when current V2 evidence is complete', async () => {
    state.v2 = true
    state.v2Statuses = []
    renderGate()
    expect(await screen.findByText('protected workspace')).toBeInTheDocument()
    expect(state.recordV2).not.toHaveBeenCalled()
  })

  it('fails closed when the V2 evidence query fails', async () => {
    state.v2 = true
    state.v2Error = true
    renderGate()
    expect(await screen.findByText('Une erreur est survenue')).toBeInTheDocument()
    expect(screen.queryByText('protected workspace')).not.toBeInTheDocument()
  })
})

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider } from '@/i18n'

const state = vi.hoisted(() => ({
  v2: false,
  legacyMissing: [] as string[],
  v2Missing: [] as string[],
  v2Error: false,
  getLegacy: vi.fn(),
  getV2: vi.fn(),
  recordLegacy: vi.fn(),
  recordV2: vi.fn(),
}))

vi.mock('@/lib/features', () => ({ legalAcceptanceV2Enabled: () => state.v2 }))
vi.mock('@/lib/supabase', () => ({ isSupabaseConfigured: true }))
vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    demo: null,
    userId: 'user-owner-a',
    membership: { garage_id: 'organization-a' },
    garage: { id: 'organization-a' },
    signOut: vi.fn(),
  }),
}))
vi.mock('./legalAcceptance', () => ({
  getMissingLegalDocuments: state.getLegacy,
  getMissingLegalV2Documents: state.getV2,
  recordMultipleLegalAcceptances: state.recordLegacy,
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
  state.v2Missing = []
  state.v2Error = false
  state.getLegacy.mockReset().mockImplementation(async () => state.legacyMissing)
  state.getV2.mockReset().mockImplementation(async () => {
    if (state.v2Error) throw new Error('V2 evidence unavailable')
    return state.v2Missing
  })
  state.recordLegacy.mockReset().mockResolvedValue(undefined)
  state.recordV2.mockReset().mockResolvedValue(undefined)
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('LegalAcceptanceGate V2 switching', () => {
  it('preserves the legacy evidence query when V2 is disabled', async () => {
    state.legacyMissing = []
    renderGate()

    expect(await screen.findByText('protected workspace')).toBeInTheDocument()
    expect(state.getLegacy).toHaveBeenCalledWith('user-owner-a', 'garage')
    expect(state.getV2).not.toHaveBeenCalled()
    expect(state.recordV2).not.toHaveBeenCalled()
  })

  it('queries and records the organization-scoped V2 documents when enabled', async () => {
    state.v2 = true
    state.v2Missing = ['terms_pro', 'dpa']
    const user = userEvent.setup()
    renderGate()

    expect(await screen.findByText(/terms-2026-01/)).toBeInTheDocument()
    expect(screen.getByText(/dpa-2026-01/)).toBeInTheDocument()
    expect(state.getV2).toHaveBeenCalledWith('user-owner-a', 'garage', 'organization-a')
    expect(state.getLegacy).not.toHaveBeenCalled()

    for (const checkbox of screen.getAllByRole('checkbox')) await user.click(checkbox)
    await user.click(screen.getByRole('button', { name: 'J’accepte et je continue' }))

    await waitFor(() => expect(state.recordV2).toHaveBeenCalledTimes(2))
    expect(state.recordV2).toHaveBeenNthCalledWith(1, 'terms_pro', 'garage', 'legal_gate', {
      displayedLanguage: 'fr',
      organizationId: 'organization-a',
    })
    expect(state.recordV2).toHaveBeenNthCalledWith(2, 'dpa', 'garage', 'legal_gate', {
      displayedLanguage: 'fr',
      organizationId: 'organization-a',
    })
    expect(state.recordLegacy).not.toHaveBeenCalled()
  })

  it('unblocks the workspace when current V2 evidence is complete', async () => {
    state.v2 = true
    state.v2Missing = []
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

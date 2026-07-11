import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DemoBanner } from './DemoBanner'

const mocks = vi.hoisted(() => ({
  exitDemo: vi.fn(),
  getDemoBrand: vi.fn(() => 'speedy' as const),
  navigate: vi.fn(),
  resetDemoData: vi.fn(),
  signOut: vi.fn(async () => undefined),
}))

vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }))
vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({ demo: 'garage', signOut: mocks.signOut }),
}))
vi.mock('@/branding', () => ({
  useBrand: () => ({ exitDemo: mocks.exitDemo }),
}))
vi.mock('@/lib/demo', () => ({
  getDemoBrand: mocks.getDemoBrand,
  resetDemoData: mocks.resetDemoData,
}))

describe('DemoBanner actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resets the captured Speedy store before leaving the brand', () => {
    render(<DemoBanner />)

    fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser les données' }))

    expect(mocks.getDemoBrand).toHaveBeenCalledOnce()
    expect(mocks.resetDemoData).toHaveBeenCalledWith('speedy')
    expect(mocks.resetDemoData.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.exitDemo.mock.invocationCallOrder[0],
    )
    expect(mocks.navigate).toHaveBeenCalledWith(0)
  })

  it('leaves the demo without resetting either store', async () => {
    render(<DemoBanner />)

    fireEvent.click(screen.getByRole('button', { name: 'Quitter la démo' }))

    expect(mocks.exitDemo).toHaveBeenCalledOnce()
    expect(mocks.resetDemoData).not.toHaveBeenCalled()
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/'))
  })
})

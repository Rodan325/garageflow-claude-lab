import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BrandDemoEntry } from './BrandDemoEntry'

const mocks = vi.hoisted(() => ({
  brand: 'reset',
  clearDemo: vi.fn(),
  exitDemo: vi.fn(),
  getDemoBrand: vi.fn(() => 'speedy' as const),
  navigate: vi.fn(),
  resetDemoData: vi.fn(),
  setBrand: vi.fn(),
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
  useParams: () => ({ brand: mocks.brand }),
}))

vi.mock('@/branding', () => ({
  useBrand: () => ({ setBrand: mocks.setBrand, exitDemo: mocks.exitDemo }),
}))

vi.mock('@/lib/demo', () => ({
  clearDemo: mocks.clearDemo,
  getDemoBrand: mocks.getDemoBrand,
  resetDemoData: mocks.resetDemoData,
}))

describe('BrandDemoEntry', () => {
  beforeEach(() => {
    mocks.brand = 'reset'
    vi.clearAllMocks()
  })

  it('resets the active data set only through the technical reset route', async () => {
    render(<BrandDemoEntry />)

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/', { replace: true }))
    expect(mocks.getDemoBrand).toHaveBeenCalledOnce()
    expect(mocks.resetDemoData).toHaveBeenCalledWith('speedy')
    expect(mocks.clearDemo).toHaveBeenCalledOnce()
    expect(mocks.exitDemo).toHaveBeenCalledOnce()
    expect(mocks.resetDemoData.mock.invocationCallOrder[0]).toBeLessThan(mocks.exitDemo.mock.invocationCallOrder[0])
  })

  it('activates Speedy without resetting either demo store', async () => {
    mocks.brand = 'speedy'
    render(<BrandDemoEntry />)

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/', { replace: true }))
    expect(mocks.setBrand).toHaveBeenCalledWith('speedy')
    expect(mocks.resetDemoData).not.toHaveBeenCalled()
    expect(mocks.clearDemo).not.toHaveBeenCalled()
    expect(mocks.exitDemo).not.toHaveBeenCalled()
  })
})

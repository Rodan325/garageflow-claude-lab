import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

const flags = vi.hoisted(() => ({ docs: false, acceptance: false, dpa: false }))

vi.mock('@/lib/features', () => ({
  legalDocsV2Enabled: () => flags.docs,
}))
vi.mock('./DpaAccessGuard', () => ({
  DpaAccessGuard: ({ children }: { children: React.ReactNode | ((access: { canRead: boolean; canAccept: boolean }) => React.ReactNode) }) => (
    <>{typeof children === 'function'
      ? children({ canRead: true, canAccept: flags.docs && flags.acceptance && flags.dpa })
      : children}</>
  ),
}))
vi.mock('./HistoricalDpa20260702Page', () => ({
  DpaPage: () => <div data-testid="historical-dpa">historical DPA</div>,
}))
vi.mock('./HistoricalDocumentNotice', () => ({
  HistoricalDocumentNotice: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="historical-notice">{children}</div>
  ),
}))
vi.mock('./LegalV2DocumentPage', () => ({
  LegalV2DocumentPage: () => <div data-testid="v2-dpa">V2 DPA</div>,
}))
vi.mock('./CommercialLegalPage', () => ({
  CommercialLegalPage: () => <div data-testid="commercial-dpa">commercial DPA review</div>,
}))

import { DpaPage } from './DpaPage'

afterEach(() => {
  cleanup()
  flags.docs = false
  flags.acceptance = false
  flags.dpa = false
})

describe('DPA route feature gates', () => {
  it.each([
    [false, false, false, 'commercial-dpa'],
    [false, false, true, 'commercial-dpa'],
    [false, true, false, 'commercial-dpa'],
    [false, true, true, 'commercial-dpa'],
    [true, false, false, 'v2-dpa'],
    [true, false, true, 'v2-dpa'],
    [true, true, false, 'v2-dpa'],
    [true, true, true, 'v2-dpa'],
  ] as const)(
    'routes docs=%s acceptance=%s dpa=%s to %s',
    (docs, acceptance, dpa, expected) => {
      flags.docs = docs
      flags.acceptance = acceptance
      flags.dpa = dpa
      render(<MemoryRouter><DpaPage /></MemoryRouter>)
      expect(screen.getByTestId(expected)).toBeInTheDocument()
    },
  )

  it('keeps the explicit historical archive reachable regardless of flags', () => {
    flags.docs = true
    flags.acceptance = true
    flags.dpa = true
    render(<MemoryRouter initialEntries={['/dpa?version=2026-07-02']}><DpaPage /></MemoryRouter>)
    expect(screen.getByTestId('historical-notice')).toBeInTheDocument()
    expect(screen.getByTestId('historical-dpa')).toBeInTheDocument()
  })
})

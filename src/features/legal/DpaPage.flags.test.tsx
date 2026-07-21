import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

const flags = vi.hoisted(() => ({ docs: false, acceptance: false, dpa: false }))

vi.mock('@/lib/features', () => ({
  legalDocsV2Enabled: () => flags.docs,
  dpaSelfServiceEnabled: () => flags.docs && flags.acceptance && flags.dpa,
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
vi.mock('@/features/marketing/NotFoundPage', () => ({
  NotFoundPage: () => <div data-testid="not-found">not found</div>,
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
    [false, false, false, 'historical-dpa'],
    [false, false, true, 'historical-dpa'],
    [false, true, false, 'historical-dpa'],
    [false, true, true, 'historical-dpa'],
    [true, false, false, 'not-found'],
    [true, false, true, 'not-found'],
    [true, true, false, 'not-found'],
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

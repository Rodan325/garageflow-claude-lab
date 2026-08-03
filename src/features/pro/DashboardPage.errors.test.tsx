import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

/**
 * UX-ERR-01 — a KPI source failing on its own must not leave the other KPIs at
 * zero: that reads as a quiet morning instead of an outage.
 */

const idle = { data: [], isLoading: false, isError: false, error: null, refetch: vi.fn() }
const failed = (message = 'Failed to fetch') => ({
  data: undefined, isLoading: false, isError: true, error: new TypeError(message), refetch: vi.fn(),
})

const q = vi.hoisted(() => ({
  requests: { current: null as unknown },
  quotes: { current: null as unknown },
  appointments: { current: null as unknown },
  tasks: { current: null as unknown },
  team: { current: null as unknown },
  reminders: { current: null as unknown },
}))

vi.mock('@/data/requests', () => ({ useGarageRequests: () => q.requests.current }))
vi.mock('@/data/proData', () => ({
  useQuotes: () => q.quotes.current,
  useAppointments: () => q.appointments.current,
  useTasks: () => q.tasks.current,
  useTeam: () => q.team.current,
  useToggleTask: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/data/reminders', () => ({ useMaintenanceReminders: () => q.reminders.current }))
vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({ garage: { id: 'g1', name: 'Garage' }, profile: { full_name: 'Sophie Martin' } }),
}))

const { DashboardPage } = await import('./DashboardPage')

function renderDashboard() {
  return render(<MemoryRouter><DashboardPage /></MemoryRouter>)
}

beforeEach(() => {
  q.requests.current = idle
  q.quotes.current = idle
  q.appointments.current = idle
  q.tasks.current = idle
  q.team.current = idle
  q.reminders.current = idle
})

describe('garage dashboard — partial KPI failures', () => {
  it('renders the KPIs when every source succeeded', () => {
    renderDashboard()
    expect(screen.getByText('Véhicules attendus aujourd’hui')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('does not show KPIs at zero when the quotes query fails', () => {
    q.quotes.current = failed()
    renderDashboard()

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Connexion indisponible')).toBeInTheDocument()
    // The misleading part: a "0" that looks like real data.
    expect(screen.queryByText('Devis envoyés')).toBeNull()
    expect(screen.queryByText('Véhicules attendus aujourd’hui')).toBeNull()
  })

  it('does not show KPIs at zero when the appointments query fails', () => {
    q.appointments.current = failed()
    renderDashboard()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.queryByText('Véhicules présents')).toBeNull()
  })

  it('does not show KPIs at zero when the tasks query fails', () => {
    q.tasks.current = failed()
    renderDashboard()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.queryByText('Travaux en cours')).toBeNull()
  })

  it('covers the team and reminders sources too', () => {
    q.team.current = failed()
    const { unmount } = renderDashboard()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    unmount()

    q.team.current = idle
    q.reminders.current = failed()
    renderDashboard()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('reports a refused access without offering a pointless retry', () => {
    q.requests.current = { data: undefined, isLoading: false, isError: true, error: { code: '42501' }, refetch: vi.fn() }
    renderDashboard()
    expect(screen.getByText('Accès refusé')).toBeInTheDocument()
    expect(screen.queryByText('Réessayer')).toBeNull()
  })

  it('retries every KPI source, not just the failing one', () => {
    const requestsRefetch = vi.fn()
    const quotesRefetch = vi.fn()
    q.requests.current = { ...idle, refetch: requestsRefetch }
    q.quotes.current = { ...failed(), refetch: quotesRefetch }
    renderDashboard()

    screen.getByText('Réessayer').click()

    expect(quotesRefetch).toHaveBeenCalled()
    expect(requestsRefetch).toHaveBeenCalled()
  })
})

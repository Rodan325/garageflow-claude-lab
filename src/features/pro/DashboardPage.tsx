import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, BadgeEuro, BellRing, CalendarClock, CarFront, CheckSquare, CircleCheckBig,
  ClipboardCheck, Clock3, FileCheck2, Gauge, Inbox, List, ShieldCheck, TriangleAlert, Wrench,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState, Skeleton } from '@/components/ui/feedback'
import { StatusPill } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { PageHeader } from '@/components/common/PageHeader'
import { Select } from '@/components/ui/input'
import { useAuth } from '@/features/auth/AuthProvider'
import { useAppointments, useQuotes, useTasks, useTeam, useToggleTask } from '@/data/proData'
import { useGarageRequests } from '@/data/requests'
import { useMaintenanceReminders } from '@/data/reminders'
import type { RequestStatus } from '@/types/domain'
import { requestStatusMeta } from '@/i18n/domainLabels'
import { useLang } from '@/i18n'
import { localizeDemoText } from '@/i18n/demoContent'
import { euro, percent } from '@/lib/format'
import { cn } from '@/lib/utils'
import { maintenanceRemindersEnabled, workshopTimelineEnabled } from '@/lib/features'
import { operationalDashboard, type DashboardPeriod, type DashboardStatusFilter } from '@/features/dashboard/operations'

function Kpi({ icon: Icon, label, value, tone = 'neutral', loading, to }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
  tone?: 'neutral' | 'primary' | 'warning' | 'danger' | 'success'
  loading?: boolean
  to?: string
}) {
  const toneClass = {
    neutral: 'bg-muted text-muted-foreground', primary: 'bg-primary/10 text-primary',
    warning: 'bg-warning/10 text-warning', danger: 'bg-danger/10 text-danger', success: 'bg-success/10 text-success',
  }[tone]
  const inner = (
    <Card className="h-full p-3 transition-colors hover:bg-muted/30 sm:p-4">
      <div className="flex items-center gap-3">
        <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-lg', toneClass)}><Icon className="h-5 w-5" /></span>
        <div className="min-w-0">
          {loading ? <Skeleton className="h-6 w-10" /> : <p className="text-xl font-bold tracking-tight">{value}</p>}
          <p className="text-xs font-medium leading-tight text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  )
  return to ? <Link to={to}>{inner}</Link> : inner
}

export function DashboardPage() {
  const { lang, tr } = useLang()
  const { garage, profile } = useAuth()
  const garageId = garage?.id
  const [period, setPeriod] = useState<DashboardPeriod>('today')
  const [status, setStatus] = useState<DashboardStatusFilter>('all')
  const [advisorId, setAdvisorId] = useState('')
  const { data: requests, isLoading } = useGarageRequests(garageId)
  const { data: quotes } = useQuotes(garageId)
  const { data: appointments } = useAppointments(garageId)
  const { data: tasks } = useTasks(garageId)
  const { data: team } = useTeam(garageId)
  const { data: reminders } = useMaintenanceReminders(maintenanceRemindersEnabled() ? garageId : undefined)
  const toggleTask = useToggleTask()
  const metrics = operationalDashboard({
    requests: requests ?? [], quotes: quotes ?? [], appointments: appointments ?? [], reminders: reminders ?? [],
    period, status, advisorId: advisorId || undefined,
  })
  const attention = (requests ?? []).filter((request) => request.status === 'pending' || request.workshop_stage === 'customer_approval_required').slice(0, 5)
  const openTasks = (tasks ?? []).filter((task) => task.status !== 'done').slice(0, 5)

  return (
    <div>
      <PageHeader title={tr('Bonjour {name}', { name: profile?.full_name?.split(' ')[0] ?? '' })} subtitle={tr('Pilotez l’activité de votre atelier en temps réel.')} />

      <Card className="mb-4 flex flex-wrap items-end gap-3 p-3">
        <Filter label={tr('Période')} value={period} onChange={(value) => setPeriod(value as DashboardPeriod)} options={[
          ['today', tr('Aujourd’hui')], ['7d', tr('7 derniers jours')], ['30d', tr('30 derniers jours')], ['all', tr('Toute la période')],
        ]} />
        <Filter label={tr('Statut atelier')} value={status} onChange={(value) => setStatus(value as DashboardStatusFilter)} options={[
          ['all', tr('Tous les statuts')], ['attention', tr('Attention requise')], ['in_work', tr('Travaux en cours')], ['ready', tr('Véhicules prêts')],
        ]} />
        <Filter label={tr('Conseiller')} value={advisorId} onChange={setAdvisorId} options={[
          ['', tr('Tous les conseillers')], ...(team ?? []).filter((member) => ['owner', 'admin', 'advisor', 'front_desk'].includes(member.role)).map((member) => [member.user_id, member.profile?.full_name ?? tr('Membre')]),
        ]} />
        <div className="ms-auto flex gap-1 rounded-lg bg-muted p-1 text-xs font-medium">
          <Link className="rounded-md bg-card px-2.5 py-1.5 shadow-sm" to="/pro/bookings"><List className="me-1 inline h-3.5 w-3.5" />{tr('Liste')}</Link>
          {workshopTimelineEnabled() && <Link className="rounded-md px-2.5 py-1.5 text-muted-foreground hover:text-foreground" to="/pro/workshop"><Gauge className="me-1 inline h-3.5 w-3.5" />{tr('Kanban')}</Link>}
          <Link className="rounded-md px-2.5 py-1.5 text-muted-foreground hover:text-foreground" to="/pro/calendar"><CalendarClock className="me-1 inline h-3.5 w-3.5" />{tr('Agenda')}</Link>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={CalendarClock} label={tr('Véhicules attendus aujourd’hui')} value={metrics.expectedToday} loading={isLoading} to="/pro/calendar" />
        <Kpi icon={CarFront} label={tr('Véhicules présents')} value={metrics.vehiclesPresent} loading={isLoading} tone="primary" to="/pro/workshop" />
        <Kpi icon={ClipboardCheck} label={tr('Accords en attente')} value={metrics.approvalsPending} loading={isLoading} tone={metrics.approvalsPending ? 'warning' : 'neutral'} to="/pro/workshop" />
        <Kpi icon={Wrench} label={tr('Travaux en cours')} value={metrics.workInProgress} loading={isLoading} to="/pro/workshop" />
        <Kpi icon={ShieldCheck} label={tr('Contrôles qualité')} value={metrics.qualityControl} loading={isLoading} to="/pro/workshop" />
        <Kpi icon={CircleCheckBig} label={tr('Véhicules prêts')} value={metrics.ready} loading={isLoading} tone="success" to="/pro/workshop" />
        <Kpi icon={TriangleAlert} label={tr('Retards')} value={metrics.delayed} loading={isLoading} tone={metrics.delayed ? 'danger' : 'neutral'} to="/pro/workshop" />
        <Kpi icon={FileCheck2} label={tr('Devis envoyés')} value={metrics.quotesSent} loading={isLoading} to="/pro/quotes" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={BadgeEuro} label={tr('Montant accepté')} value={euro(metrics.acceptedAmount, lang)} tone="success" to="/pro/quotes" />
        <Kpi icon={CheckSquare} label={tr('Taux d’acceptation')} value={metrics.acceptanceRate === null ? '—' : percent(metrics.acceptanceRate, lang)} to="/pro/quotes" />
        <Kpi icon={CalendarClock} label={tr('Rendez-vous à venir')} value={metrics.upcomingAppointments} to="/pro/calendar" />
        <Kpi icon={BellRing} label={tr('Rappels actifs')} value={metrics.activeReminders} to={maintenanceRemindersEnabled() ? '/pro/reminders' : undefined} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{tr('À traiter maintenant')}</CardTitle>
            <Link to="/pro/bookings" className="inline-flex items-center gap-1 text-sm font-medium text-primary">{tr('Tout voir')} <ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link>
          </CardHeader>
          <CardContent>
            {!attention.length ? <EmptyState icon={Inbox} title={tr('Tout est à jour')} /> : (
              <ul className="space-y-2">
                {attention.map((request) => (
                  <li key={request.id}>
                    <Link to={request.workshop_stage === 'customer_approval_required' ? '/pro/workshop' : '/pro/bookings'} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/40">
                      <Avatar name={request.contact_name} />
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{request.contact_name ?? tr('Client')}</p><p className="truncate text-xs text-muted-foreground">{localizeDemoText(request.service_name, lang)} · {request.vehicle_label}</p></div>
                      <StatusPill {...requestStatusMeta(request.status as RequestStatus, lang)} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader><CardTitle>{tr('À faire aujourd’hui')}</CardTitle></CardHeader>
          <CardContent>
            {!openTasks.length ? <EmptyState icon={CheckSquare} title={tr('Rien à faire')} /> : (
              <ul className="space-y-2.5">
                {openTasks.map((task) => (
                  <li key={task.id} className="flex items-start gap-2.5 text-sm">
                    <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]" onChange={() => toggleTask.mutate({ id: task.id, status: 'done', garageId: garageId! })} />
                    <span>{localizeDemoText(task.title, lang)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />{tr('La satisfaction sera affichée dès qu’un questionnaire sera connecté.')}</p>
    </div>
  )
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) {
  return (
    <label className="min-w-36 text-xs font-medium text-muted-foreground">
      {label}
      <Select className="mt-1 h-9 min-w-36 bg-background text-foreground" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </Select>
    </label>
  )
}

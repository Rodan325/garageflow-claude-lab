import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CalendarClock, CheckSquare, Clock, Inbox } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton, EmptyState } from '@/components/ui/feedback'
import { StatusPill } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/common/PageHeader'
import { useAuth } from '@/features/auth/AuthProvider'
import { useDashboardStats, useTasks, useToggleTask, useAppointments } from '@/data/proData'
import { useGarageRequests } from '@/data/requests'
import type { RequestStatus } from '@/types/domain'
import { requestStatusMeta } from '@/i18n/domainLabels'
import { useLang } from '@/i18n'
import { localizeDemoText } from '@/i18n/demoContent'
import { dateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { listItem, listStagger } from '@/lib/motion'

function Kpi({
  icon: Icon, label, value, loading, accent, to,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  loading: boolean
  accent?: boolean
  to?: string
}) {
  const inner = (
    <Card className="h-full min-w-0 p-3 transition-colors hover:bg-muted/30 sm:p-4">
      <div className="flex items-center gap-3">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', accent ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          {loading ? <Skeleton className="h-7 w-8" /> : <p className="text-xl font-bold leading-none tracking-tight sm:text-2xl">{value}</p>}
          <p className="mt-1 text-xs font-medium leading-tight text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  )
  return to ? <Link to={to} className="block min-w-0">{inner}</Link> : inner
}

export function DashboardPage() {
  const { lang, tr } = useLang()
  const { garage, profile } = useAuth()
  const gid = garage?.id
  const { data: stats, isLoading } = useDashboardStats(gid)
  const { data: requests } = useGarageRequests(gid)
  const { data: tasks } = useTasks(gid)
  const { data: appointments } = useAppointments(gid)
  const toggleTask = useToggleTask()

  const pending = (requests ?? []).filter((r) => r.status === 'pending')
  const waitingClient = (requests ?? []).filter((r) => r.status === 'reschedule_proposed')
  const openTasks = (tasks ?? []).filter((t) => t.status !== 'done').slice(0, 6)
  const today = new Date().toDateString()
  const todayAppts = (appointments ?? []).filter((a) => new Date(a.starts_at).toDateString() === today)

  return (
    <div>
      <PageHeader title={tr('Bonjour {name}', { name: profile?.full_name?.split(' ')[0] ?? '' })} subtitle={tr('Voici ce qui demande votre attention.')} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Kpi icon={Inbox} label={tr('Demandes')} value={stats?.pendingRequests ?? 0} loading={isLoading} accent to="/pro/bookings" />
        <Kpi icon={CalendarClock} label={tr('RDV du jour')} value={stats?.todayAppointments ?? 0} loading={isLoading} to="/pro/calendar" />
        <Kpi icon={CheckSquare} label={tr('Tâches')} value={stats?.openTasks ?? 0} loading={isLoading} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-5 sm:gap-5 lg:grid-cols-3">
        {/* Demandes à traiter */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{tr('À traiter')}</CardTitle>
            <Link to="/pro/bookings" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              {tr('Réservations')} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {pending.length === 0 && waitingClient.length === 0 ? (
              <EmptyState icon={Inbox} title={tr('Tout est à jour')} description={tr('Aucune demande en attente pour le moment.')} />
            ) : (
              <>
                {pending.length > 0 && (
                  <motion.ul variants={listStagger} initial="hidden" animate="show" className="space-y-2">
                    {pending.slice(0, 5).map((r) => (
                      <motion.li key={r.id} variants={listItem}>
                        <Link to="/pro/bookings" className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/40">
                          <Avatar name={r.contact_name} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{r.contact_name ?? tr('Client')}</p>
                            <p className="truncate text-xs text-muted-foreground">{localizeDemoText(r.service_name, lang)} · {r.vehicle_label}</p>
                          </div>
                          <StatusPill {...requestStatusMeta(r.status as RequestStatus, lang)} />
                        </Link>
                      </motion.li>
                    ))}
                  </motion.ul>
                )}
                {waitingClient.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {tr('{count} demande(s) en attente de réponse du client.', { count: waitingClient.length })}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Tâches du jour */}
        <Card>
          <CardHeader><CardTitle>{tr('À faire aujourd’hui')}</CardTitle></CardHeader>
          <CardContent>
            {openTasks.length === 0 ? (
              <EmptyState icon={CheckSquare} title={tr('Rien à faire')} />
            ) : (
              <ul className="space-y-2.5">
                {openTasks.map((t) => (
                  <li key={t.id} className="flex items-start gap-2.5 text-sm">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
                      onChange={() => toggleTask.mutate({ id: t.id, status: 'done', garageId: gid! })}
                    />
                    <span>{localizeDemoText(t.title, lang)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rendez-vous du jour */}
      <Card className="mt-4 sm:mt-5">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{tr('Rendez-vous du jour')}</CardTitle>
          <Link to="/pro/calendar" className="text-sm font-medium text-primary hover:underline">{tr('Agenda')}</Link>
        </CardHeader>
        <CardContent>
          {todayAppts.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title={tr('Aucun rendez-vous aujourd’hui')}
              action={<Link to="/pro/calendar"><Button variant="outline" size="sm">{tr('Voir l’agenda')}</Button></Link>}
            />
          ) : (
            <ul className="divide-y divide-border">
              {todayAppts.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Clock className="h-4 w-4" /></span>
                  <span className="flex-1 font-medium">{localizeDemoText(a.title, lang)}</span>
                  <span className="text-muted-foreground">{dateTime(a.starts_at, lang)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

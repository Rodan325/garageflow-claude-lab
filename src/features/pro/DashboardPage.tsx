import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Car, CheckSquare, Inbox, Users, Wrench, CalendarClock, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton, EmptyState } from '@/components/ui/feedback'
import { StatusPill } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { PageHeader } from '@/components/common/PageHeader'
import { useAuth } from '@/features/auth/AuthProvider'
import { useDashboardStats, useTasks, useToggleTask, useAppointments } from '@/data/proData'
import { useGarageRequests } from '@/data/requests'
import { REQUEST_STATUS_META } from '@/types/domain'
import { dateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { listItem, listStagger } from '@/lib/motion'

type Tone = 'primary' | 'warning' | 'info' | 'success' | 'neutral'
const toneBg: Record<Tone, string> = {
  primary: 'bg-primary/10 text-primary',
  warning: 'bg-warning/15 text-warning-foreground',
  info: 'bg-info/12 text-info',
  success: 'bg-success/12 text-success',
  neutral: 'bg-muted text-muted-foreground',
}

function Kpi({
  icon: Icon, label, value, tone, loading, to,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  tone: Tone
  loading: boolean
  to?: string
}) {
  const inner = (
    <Card className="group h-full p-4 transition-shadow hover:shadow-elevated">
      <div className="flex items-center gap-3">
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', toneBg[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          {loading ? <Skeleton className="h-7 w-10" /> : <p className="text-2xl font-bold leading-none tracking-tight">{value}</p>}
          <p className="mt-1 truncate text-xs font-medium text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  )
  return to ? <Link to={to}>{inner}</Link> : inner
}

export function DashboardPage() {
  const { garage, profile } = useAuth()
  const gid = garage?.id
  const { data: stats, isLoading } = useDashboardStats(gid)
  const { data: requests } = useGarageRequests(gid)
  const { data: tasks } = useTasks(gid)
  const { data: appointments } = useAppointments(gid)
  const toggleTask = useToggleTask()

  const pending = (requests ?? []).filter((r) => r.status === 'pending')
  const openTasks = (tasks ?? []).filter((t) => t.status !== 'done').slice(0, 5)
  const today = new Date().toDateString()
  const todayAppts = (appointments ?? []).filter((a) => new Date(a.starts_at).toDateString() === today)

  return (
    <div>
      <PageHeader
        title={`Bonjour ${profile?.full_name?.split(' ')[0] ?? ''}`}
        subtitle="Voici l’activité du garage aujourd’hui."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Kpi icon={Inbox} label="Demandes en attente" value={stats?.pendingRequests ?? 0} tone="warning" loading={isLoading} to="/pro/bookings" />
        <Kpi icon={CalendarClock} label="RDV aujourd’hui" value={stats?.todayAppointments ?? 0} tone="primary" loading={isLoading} to="/pro/calendar" />
        <Kpi icon={Wrench} label="Réparations en cours" value={stats?.openRepairs ?? 0} tone="info" loading={isLoading} to="/pro/workshop" />
        <Kpi icon={CheckSquare} label="Tâches ouvertes" value={stats?.openTasks ?? 0} tone="neutral" loading={isLoading} />
        <Kpi icon={Car} label="Véhicules" value={stats?.vehicles ?? 0} tone="success" loading={isLoading} to="/pro/vehicles" />
        <Kpi icon={Users} label="Clients" value={stats?.customers ?? 0} tone="neutral" loading={isLoading} to="/pro/clients" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-primary" />
              <CardTitle>Demandes à traiter</CardTitle>
            </div>
            <Link to="/pro/bookings" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Tout voir <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <EmptyState icon={Inbox} title="Aucune demande en attente" description="Les nouvelles réservations clients apparaîtront ici." />
            ) : (
              <motion.ul variants={listStagger} initial="hidden" animate="show" className="space-y-2">
                {pending.slice(0, 5).map((r) => (
                  <motion.li key={r.id} variants={listItem}>
                    <Link
                      to="/pro/bookings"
                      className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/50"
                    >
                      <Avatar name={r.contact_name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{r.contact_name ?? 'Client'}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {r.service_name} · {r.vehicle_label ?? 'Véhicule'}
                        </p>
                      </div>
                      <StatusPill {...REQUEST_STATUS_META[r.status as keyof typeof REQUEST_STATUS_META]} />
                    </Link>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Tâches</CardTitle>
          </CardHeader>
          <CardContent>
            {openTasks.length === 0 ? (
              <EmptyState icon={CheckSquare} title="Rien à faire" description="Toutes les tâches sont à jour." />
            ) : (
              <ul className="space-y-2.5">
                {openTasks.map((t) => (
                  <li key={t.id} className="flex items-start gap-2.5 text-sm">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
                      onChange={() => toggleTask.mutate({ id: t.id, status: 'done', garageId: gid! })}
                    />
                    <span>{t.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader className="flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            <CardTitle>Rendez-vous du jour</CardTitle>
          </div>
          <Link to="/pro/calendar" className="text-sm font-medium text-primary hover:underline">Agenda</Link>
        </CardHeader>
        <CardContent>
          {todayAppts.length === 0 ? (
            <EmptyState icon={CalendarClock} title="Aucun rendez-vous aujourd’hui" />
          ) : (
            <ul className="divide-y divide-border">
              {todayAppts.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground"><Clock className="h-4 w-4" /></span>
                  <span className="flex-1 font-medium">{a.title}</span>
                  <span className="text-muted-foreground">{dateTime(a.starts_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { Building2, Clock3, TriangleAlert } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/card'
import { EmptyState, LoadingState } from '@/components/ui/feedback'
import { useAuth } from '@/features/auth/AuthProvider'
import { useNetworkDashboard } from '@/data/network'
import { useLang } from '@/i18n'
import { euro, percent } from '@/lib/format'
import { networkDashboardEnabled } from '@/lib/features'
import { canViewNetworkDashboard } from './model'

export function NetworkDashboardPage() {
  const { garage, role, membership } = useAuth()
  const { lang, tr } = useLang()
  const { data, centers, isLoading } = useNetworkDashboard(garage?.id)
  const allowed = canViewNetworkDashboard(role, membership?.organization_role, centers.length, networkDashboardEnabled())
  if (isLoading) return <LoadingState />
  if (!allowed) return <Navigate to="/pro" replace />
  if (!data?.length) return <EmptyState icon={Building2} title={tr('Aucune donnée réseau disponible')} />

  return (
    <div>
      <PageHeader title={tr('Vue réseau')} subtitle={tr('Comparez l’activité de vos établissements sans mélanger les organisations.')} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data.map((center) => (
          <Card key={center.center_id} className="overflow-hidden">
            <div className="border-b border-border bg-muted/30 p-4"><p className="font-semibold">{center.center_name}</p></div>
            <dl className="grid grid-cols-2 gap-px bg-border text-sm">
              <Metric label={tr('Rendez-vous')} value={center.appointments} />
              <Metric label={tr('Interventions')} value={center.interventions} />
              <Metric label={tr('Montant des devis')} value={euro(center.quote_amount, lang)} />
              <Metric label={tr('Montant accepté')} value={euro(center.accepted_amount, lang)} />
              <Metric label={tr('Taux d’acceptation')} value={center.acceptance_rate === null ? '—' : percent(center.acceptance_rate, lang)} />
              <Metric label={tr('Délai de décision')} value={center.average_decision_hours === null ? '—' : tr('{hours} h', { hours: center.average_decision_hours.toFixed(1) })} />
              <Metric label={tr('Durée moyenne')} value={center.average_intervention_hours === null ? '—' : tr('{hours} h', { hours: center.average_intervention_hours.toFixed(1) })} />
              <Metric label={tr('Véhicules en attente')} value={center.vehicles_waiting} />
              <Metric label={tr('Retards')} value={center.delays} danger={center.delays > 0} />
              <Metric label={tr('Rappels convertis')} value={center.reminders_converted} />
            </dl>
          </Card>
        ))}
      </div>
      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />{tr('La satisfaction n’est pas affichée tant qu’aucun questionnaire n’est connecté.')}</p>
    </div>
  )
}

function Metric({ label, value, danger = false }: { label: string; value: string | number; danger?: boolean }) {
  return (
    <div className="bg-card p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={danger ? 'mt-1 flex items-center gap-1 font-semibold text-danger' : 'mt-1 font-semibold'}>{danger && <TriangleAlert className="h-3.5 w-3.5" />}{value}</dd>
    </div>
  )
}

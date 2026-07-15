import { ArrowRight, Clock3, ShieldCheck, TriangleAlert, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, StatusPill } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState, LoadingState } from '@/components/ui/feedback'
import { PageHeader } from '@/components/common/PageHeader'
import { useToast } from '@/components/ui/toast'
import { useGarageRequests } from '@/data/requests'
import { useTransitionWorkshopStage } from '@/data/workshop'
import { useAuth } from '@/features/auth/AuthProvider'
import { useLang } from '@/i18n'
import { dateTime } from '@/lib/format'
import { deliveryReportsEnabled, recommendationsEnabled } from '@/lib/features'
import type { ServiceRequest, WorkshopStage } from '@/types/domain'
import {
  allowedWorkshopTransitions,
  isWorkshopStage,
  workshopStageMeta,
  WORKSHOP_STAGES,
} from './lifecycle'

function requestStage(request: ServiceRequest): WorkshopStage | null {
  return isWorkshopStage(request.workshop_stage) ? request.workshop_stage : null
}

export function WorkshopLifecycleBoard() {
  const { garage } = useAuth()
  const { lang, tr } = useLang()
  const toast = useToast()
  const transition = useTransitionWorkshopStage()
  const { data: requests, isLoading } = useGarageRequests(garage?.id)
  const activeRequests = (requests ?? []).filter((request) => requestStage(request) !== 'closed')

  async function move(request: ServiceRequest, newStage: WorkshopStage) {
    try {
      await transition.mutateAsync({
        requestId: request.id,
        garageId: request.garage_id,
        clientId: request.client_id,
        newStage,
        customerMessage: workshopStageMeta(newStage, lang).label,
        visibleToCustomer: true,
      })
      toast.success(tr('Mise à jour enregistrée'))
    } catch {
      toast.error(tr('Transition impossible'), tr('Cette étape ne peut pas être appliquée à ce dossier.'))
    }
  }

  return (
    <div>
      <PageHeader
        title={tr('Cycle atelier')}
        subtitle={tr('Suivez chaque véhicule, de la confirmation du rendez-vous à sa restitution.')}
      />
      {isLoading ? (
        <LoadingState />
      ) : activeRequests.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title={tr('Aucun dossier atelier actif')}
          description={tr('Les demandes confirmées apparaîtront ici dès leur prise en charge.')}
        />
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4" data-testid="workshop-lifecycle-board">
          {WORKSHOP_STAGES.map((stage, stageIndex) => {
            const meta = workshopStageMeta(stage, lang)
            const items = activeRequests.filter((request) => {
              const current = requestStage(request)
              return current === stage || (stageIndex === 0 && current === null)
            })
            return (
              <section key={stage} className="w-72 shrink-0" aria-label={meta.label}>
                <div className="mb-2 flex items-center justify-between gap-2 px-1">
                  <p className="text-sm font-semibold">{meta.label}</p>
                  <Badge>{items.length}</Badge>
                </div>
                <div className="min-h-28 space-y-2 rounded-xl bg-muted/40 p-2">
                  {items.map((request) => (
                    <WorkshopRequestCard
                      key={request.id}
                      request={request}
                      lang={lang}
                      busy={transition.isPending && transition.variables?.requestId === request.id}
                      onMove={move}
                    />
                  ))}
                  {items.length === 0 && <p className="py-8 text-center text-xs text-muted-foreground">—</p>}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

function WorkshopRequestCard({
  request,
  lang,
  busy,
  onMove,
}: {
  request: ServiceRequest
  lang: 'fr' | 'en' | 'ar'
  busy: boolean
  onMove: (request: ServiceRequest, stage: WorkshopStage) => void
}) {
  const { tr } = useLang()
  const currentStage = requestStage(request)
  const nextStages = allowedWorkshopTransitions(currentStage)
  const isLate = !!request.estimated_completion_at
    && new Date(request.estimated_completion_at).getTime() < Date.now()
    && currentStage !== 'vehicle_ready'
    && currentStage !== 'vehicle_delivered'
    && currentStage !== 'closed'

  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{request.vehicle_label || request.service_name}</p>
          <p className="text-xs text-muted-foreground">{request.reference}</p>
        </div>
        {currentStage === 'customer_approval_required' && (
          <StatusPill tone="warning" label={workshopStageMeta(currentStage, lang).label} />
        )}
        {currentStage === 'vehicle_ready' && (
          <StatusPill tone="success" label={workshopStageMeta(currentStage, lang).label} />
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{request.service_name}</p>
      {request.estimated_completion_at && (
        <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{tr('Restitution estimée : {date}', { date: dateTime(request.estimated_completion_at, lang) })}</span>
        </div>
      )}
      {isLate && (
        <Badge tone="danger" className="mt-2">
          <TriangleAlert className="h-3 w-3" /> {tr('En retard')}
        </Badge>
      )}
      {currentStage === 'quality_control' && (
        <div className="mt-2 flex items-center gap-1 text-xs text-info">
          <ShieldCheck className="h-3.5 w-3.5" /> {tr('Validation finale en cours')}
        </div>
      )}
      <div className="mt-3 space-y-1.5">
        {nextStages.map((nextStage) => (
          <Button
            key={nextStage}
            size="sm"
            variant={nextStages.length > 1 ? 'secondary' : 'primary'}
            className="w-full justify-between"
            loading={busy}
            onClick={() => onMove(request, nextStage)}
          >
            <span className="truncate">{workshopStageMeta(nextStage, lang).label}</span>
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </Button>
        ))}
        {recommendationsEnabled() && currentStage !== null && (
          <Link
            to={`/pro/workshop/${request.id}/recommendations`}
            className="inline-flex w-full items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium text-primary hover:bg-muted"
          >
            {tr('Diagnostic et recommandations')}
          </Link>
        )}
        {deliveryReportsEnabled() && currentStage !== null && (
          <Link
            to={`/pro/workshop/${request.id}/report`}
            className="inline-flex w-full items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium text-primary hover:bg-muted"
          >
            {tr('Rapport de restitution')}
          </Link>
        )}
      </div>
    </Card>
  )
}

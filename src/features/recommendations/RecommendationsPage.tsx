import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Banknote, Clock3, FilePlus2, Plus, ShieldAlert } from 'lucide-react'
import { Badge, StatusPill } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState, LoadingState } from '@/components/ui/feedback'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/common/PageHeader'
import { useToast } from '@/components/ui/toast'
import { useGarageRequests } from '@/data/requests'
import { useCreateRecommendation, useRecommendations, useSetRecommendationStatus } from '@/data/recommendations'
import { useAuth } from '@/features/auth/AuthProvider'
import { useLang } from '@/i18n'
import { dateTime, euro } from '@/lib/format'
import {
  recommendationStatusMeta,
  recommendationUrgencyMeta,
  type RecommendationStatus,
  type RecommendationUrgency,
} from './model'
import { AttachmentsPanel } from '@/features/attachments/AttachmentsPanel'
import { attachmentsEnabled } from '@/lib/features'

export function RecommendationsPage() {
  const { requestId } = useParams()
  const { garage } = useAuth()
  const { lang, tr } = useLang()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const { data: requests } = useGarageRequests(garage?.id)
  const { data: recommendations, isLoading } = useRecommendations(requestId)
  const setStatus = useSetRecommendationStatus()
  const request = requests?.find((item) => item.id === requestId)

  async function transition(recommendationId: string, newStatus: RecommendationStatus) {
    if (!requestId) return
    try {
      await setStatus.mutateAsync({ recommendationId, requestId, newStatus })
      toast.success(tr('Recommandation mise à jour'))
    } catch {
      toast.error(tr('Action impossible'), tr('Le statut de cette recommandation n’a pas pu être modifié.'))
    }
  }

  return (
    <div>
      <Link to="/pro/workshop" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {tr('Retour à l’atelier')}
      </Link>
      <PageHeader
        title={tr('Diagnostic et recommandations')}
        subtitle={request ? `${request.vehicle_label ?? request.service_name} · ${request.reference}` : undefined}
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> {tr('Nouvelle recommandation')}</Button>}
      />
      {isLoading ? (
        <LoadingState />
      ) : !recommendations?.length ? (
        <EmptyState
          icon={ShieldAlert}
          title={tr('Aucune recommandation')}
          description={tr('Ajoutez les constats issus du diagnostic et proposez-les au client.')}
          action={<Button onClick={() => setOpen(true)}>{tr('Ajouter une recommandation')}</Button>}
        />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {recommendations.map((item) => {
            const status = recommendationStatusMeta(item.status, lang)
            const urgency = recommendationUrgencyMeta(item.urgency, lang)
            return (
              <Card key={item.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-semibold">{item.title}</h2>
                    {item.category && <p className="text-xs text-muted-foreground">{item.category}</p>}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone={urgency.tone}>{urgency.label}</Badge>
                    <StatusPill tone={status.tone} label={status.label} />
                  </div>
                </div>
                {item.description && <p className="mt-3 text-sm text-muted-foreground">{item.description}</p>}
                {item.reason && <p className="mt-2 rounded-lg bg-muted/60 p-2 text-sm"><strong>{tr('Motif')} :</strong> {item.reason}</p>}
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  {item.estimated_price !== null && (
                    <span className="inline-flex items-center gap-1"><Banknote className="h-4 w-4 text-primary" /> {euro(item.estimated_price, lang)}</span>
                  )}
                  {item.estimated_duration_minutes !== null && (
                    <span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4 text-primary" /> {tr('{minutes} min', { minutes: item.estimated_duration_minutes })}</span>
                  )}
                </div>
                {item.affects_delivery_time && item.proposed_delivery_at && (
                  <p className="mt-2 text-xs text-warning-foreground">
                    {tr('Nouvelle restitution estimée : {date}', { date: dateTime(item.proposed_delivery_at, lang) })}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {(item.status === 'draft' || item.status === 'callback_requested') && (
                    <Button size="sm" onClick={() => transition(item.id, 'proposed')}>{tr('Proposer au client')}</Button>
                  )}
                  {item.status === 'accepted' && (
                    <Button size="sm" onClick={() => transition(item.id, 'completed')}>{tr('Marquer réalisée')}</Button>
                  )}
                  {item.status !== 'draft' && item.status !== 'cancelled' && item.status !== 'completed' && (
                    <Link to={`/pro/quotes/new?request=${item.service_request_id}&recommendation=${item.id}`}>
                      <Button size="sm" variant="outline"><FilePlus2 className="h-4 w-4" /> {tr('Créer un devis complémentaire')}</Button>
                    </Link>
                  )}
                  {['draft', 'proposed', 'callback_requested', 'accepted', 'declined'].includes(item.status) && (
                    <Button size="sm" variant="ghost" onClick={() => transition(item.id, 'cancelled')}>{tr('Annuler')}</Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
      {request && attachmentsEnabled() && (
        <AttachmentsPanel garageId={request.garage_id} requestId={request.id} />
      )}
      {open && requestId && <NewRecommendationModal requestId={requestId} onClose={() => setOpen(false)} />}
    </div>
  )
}

function NewRecommendationModal({ requestId, onClose }: { requestId: string; onClose: () => void }) {
  const { lang, tr } = useLang()
  const toast = useToast()
  const create = useCreateRecommendation()
  const [form, setForm] = useState({
    title: '', description: '', category: '', urgency: 'recommended' as RecommendationUrgency,
    reason: '', price: '', duration: '', affectsDelivery: false, proposedDelivery: '',
  })

  async function submit() {
    if (!form.title.trim()) {
      toast.error(tr('Intitulé requis'))
      return
    }
    try {
      await create.mutateAsync({
        requestId, title: form.title, description: form.description || null,
        category: form.category || null, urgency: form.urgency, reason: form.reason || null,
        estimatedPrice: form.price ? Number(form.price) : null,
        estimatedDurationMinutes: form.duration ? Number(form.duration) : null,
        affectsDeliveryTime: form.affectsDelivery,
        proposedDeliveryAt: form.proposedDelivery ? new Date(form.proposedDelivery).toISOString() : null,
      })
      toast.success(tr('Recommandation créée'))
      onClose()
    } catch {
      toast.error(tr('Création impossible'), tr('Vérifiez les informations saisies.'))
    }
  }

  return (
    <Modal open onClose={onClose} title={tr('Nouvelle recommandation')} footer={<><Button variant="ghost" onClick={onClose}>{tr('Annuler')}</Button><Button loading={create.isPending} onClick={submit}>{tr('Créer')}</Button></>}>
      <div className="space-y-3">
        <Field label={tr('Intitulé')} htmlFor="recommendation-title" required>
          <Input id="recommendation-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </Field>
        <Field label={tr('Description')} htmlFor="recommendation-description">
          <Textarea id="recommendation-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={tr('Catégorie')} htmlFor="recommendation-category">
            <Input id="recommendation-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
          </Field>
          <Field label={tr('Urgence')} htmlFor="recommendation-urgency">
            <Select id="recommendation-urgency" value={form.urgency} onChange={(event) => setForm({ ...form, urgency: event.target.value as RecommendationUrgency })}>
              {(['critical', 'recommended', 'preventive', 'information'] as RecommendationUrgency[]).map((urgency) => (
                <option key={urgency} value={urgency}>{recommendationUrgencyMeta(urgency, lang).label}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label={tr('Motif du diagnostic')} htmlFor="recommendation-reason">
          <Textarea id="recommendation-reason" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={tr('Prix estimé')} htmlFor="recommendation-price"><Input id="recommendation-price" type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></Field>
          <Field label={tr('Durée estimée (minutes)')} htmlFor="recommendation-duration"><Input id="recommendation-duration" type="number" min="0" value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.affectsDelivery} onChange={(event) => setForm({ ...form, affectsDelivery: event.target.checked })} />
          {tr('Cette recommandation modifie l’heure de restitution')}
        </label>
        {form.affectsDelivery && (
          <Field label={tr('Nouvelle restitution estimée')} htmlFor="recommendation-delivery">
            <Input id="recommendation-delivery" type="datetime-local" value={form.proposedDelivery} onChange={(event) => setForm({ ...form, proposedDelivery: event.target.value })} />
          </Field>
        )}
      </div>
    </Modal>
  )
}

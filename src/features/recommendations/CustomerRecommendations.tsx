import { useState } from 'react'
import { Banknote, Clock3, MessageCircleQuestion } from 'lucide-react'
import { Badge, StatusPill } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { useDecideRecommendation, useRecommendations } from '@/data/recommendations'
import { useLang } from '@/i18n'
import { dateTime, euro } from '@/lib/format'
import {
  recommendationStatusMeta,
  recommendationUrgencyMeta,
  type RecommendationDecision,
  type WorkshopRecommendation,
} from './model'

export function CustomerRecommendations({ requestId }: { requestId: string }) {
  const { data: recommendations } = useRecommendations(requestId, true)
  const { tr } = useLang()
  if (!recommendations?.length) return null

  return (
    <section className="mt-4" aria-labelledby="customer-recommendations-title">
      <h2 id="customer-recommendations-title" className="mb-2 font-semibold">{tr('Recommandations de l’atelier')}</h2>
      <div className="space-y-3">
        {recommendations.map((recommendation) => (
          <CustomerRecommendationCard key={recommendation.id} recommendation={recommendation} requestId={requestId} />
        ))}
      </div>
    </section>
  )
}

function CustomerRecommendationCard({ recommendation, requestId }: { recommendation: WorkshopRecommendation; requestId: string }) {
  const { lang, tr } = useLang()
  const toast = useToast()
  const decide = useDecideRecommendation()
  const [note, setNote] = useState('')
  const [questionOpen, setQuestionOpen] = useState(false)
  const status = recommendationStatusMeta(recommendation.status, lang)
  const urgency = recommendationUrgencyMeta(recommendation.urgency, lang)
  const awaitingDecision = recommendation.status === 'proposed' || recommendation.status === 'callback_requested'

  async function submit(action: RecommendationDecision) {
    if (action === 'question' && !note.trim()) return
    try {
      await decide.mutateAsync({ recommendationId: recommendation.id, requestId, action, note: note || null, language: lang })
      setNote('')
      setQuestionOpen(false)
      toast.success(action === 'question' ? tr('Question envoyée') : tr('Votre choix a été enregistré'))
    } catch {
      toast.error(tr('Action impossible'), tr('Votre réponse n’a pas pu être enregistrée.'))
    }
  }

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{recommendation.title}</h3>
          {recommendation.category && <p className="text-xs text-muted-foreground">{recommendation.category}</p>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={urgency.tone}>{urgency.label}</Badge>
          <StatusPill tone={status.tone} label={status.label} />
        </div>
      </div>
      {recommendation.description && <p className="mt-3 text-sm text-muted-foreground">{recommendation.description}</p>}
      {recommendation.reason && <p className="mt-2 text-sm"><strong>{tr('Pourquoi')} :</strong> {recommendation.reason}</p>}
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        {recommendation.estimated_price !== null && <span className="inline-flex items-center gap-1"><Banknote className="h-4 w-4 text-primary" /> {euro(recommendation.estimated_price, lang)}</span>}
        {recommendation.estimated_duration_minutes !== null && <span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4 text-primary" /> {tr('{minutes} min', { minutes: recommendation.estimated_duration_minutes })}</span>}
      </div>
      {recommendation.affects_delivery_time && recommendation.proposed_delivery_at && (
        <p className="mt-2 rounded-lg bg-warning/15 p-2 text-xs text-warning-foreground">
          {tr('Cette intervention reporte la restitution estimée au {date}.', { date: dateTime(recommendation.proposed_delivery_at, lang) })}
        </p>
      )}
      {awaitingDecision && (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" loading={decide.isPending} onClick={() => submit('accepted')}>{tr('Accepter')}</Button>
            <Button size="sm" variant="outline" loading={decide.isPending} onClick={() => submit('declined')}>{tr('Refuser')}</Button>
            <Button size="sm" variant="secondary" loading={decide.isPending} onClick={() => submit('callback_requested')}>{tr('Être rappelé')}</Button>
            <Button size="sm" variant="ghost" onClick={() => setQuestionOpen((open) => !open)}><MessageCircleQuestion className="h-4 w-4" /> {tr('Poser une question')}</Button>
          </div>
          {questionOpen && (
            <div className="mt-3 space-y-2">
              <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={tr('Votre question à l’atelier…')} />
              <Button size="sm" disabled={!note.trim()} loading={decide.isPending} onClick={() => submit('question')}>{tr('Envoyer la question')}</Button>
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">{tr('Votre décision est horodatée et associée aux versions légales affichées.')}</p>
        </>
      )}
      {recommendation.customer_decision_note && (
        <p className="mt-3 rounded-lg bg-muted/60 p-2 text-sm">{recommendation.customer_decision_note}</p>
      )}
    </Card>
  )
}

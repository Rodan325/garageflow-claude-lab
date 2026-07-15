import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/input'
import { LoadingState, EmptyState } from '@/components/ui/feedback'
import { useAuth } from '@/features/auth/AuthProvider'
import { useAddRequestMessage, useClientRequests, useRequestMessages } from '@/data/requests'
import type { RequestStatus } from '@/types/domain'
import { requestStatusMeta } from '@/i18n/domainLabels'
import { useLang } from '@/i18n'
import { localizeDemoText } from '@/i18n/demoContent'
import { shortDate, shortTime, fromNow } from '@/lib/format'
import { workshopTimelineEnabled } from '@/lib/features'
import { CustomerWorkshopTimeline } from '@/features/workshop/CustomerWorkshopTimeline'

export function ClientBookingDetailPage() {
  const { lang, tr } = useLang()
  const { id } = useParams()
  const { userId } = useAuth()
  const { data: requests, isLoading } = useClientRequests(userId)
  const { data: messages } = useRequestMessages(id)
  const addMessage = useAddRequestMessage()
  const [body, setBody] = useState('')

  const request = requests?.find((r) => r.id === id)

  if (isLoading) return <LoadingState />
  if (!request)
    return (
      <div className="p-4">
        <EmptyState title={tr('Demande introuvable')} action={<Link to="/app/bookings"><Button>{tr('Retour')}</Button></Link>} />
      </div>
    )

  const meta = requestStatusMeta(request.status as RequestStatus, lang)

  async function send() {
    if (!body.trim() || !request) return
    await addMessage.mutateAsync({
      request_id: request.id,
      garage_id: request.garage_id,
      sender: 'client',
      author_id: userId!,
      body: body.trim(),
    })
    setBody('')
  }

  return (
    <div className="p-4">
      <Link to="/app/bookings" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {tr('Mes demandes')}
      </Link>

      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold">{localizeDemoText(request.service_name, lang)}</p>
            <p className="text-xs text-muted-foreground">{request.reference}</p>
          </div>
          <StatusPill tone={meta.tone} label={meta.label} />
        </div>
        <dl className="mt-3 space-y-1.5 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">{tr('Véhicule')}</dt><dd className="font-medium">{request.vehicle_label}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">{tr('Créneau souhaité')}</dt><dd className="font-medium">{tr('{date} à {time}', { date: shortDate(request.requested_date, lang), time: shortTime(request.requested_time) })}</dd></div>
          {request.proposed_date && (
            <div className="flex justify-between"><dt className="text-muted-foreground">{tr('Créneau proposé')}</dt><dd className="font-medium">{tr('{date} à {time}', { date: shortDate(request.proposed_date, lang), time: shortTime(request.proposed_time) })}</dd></div>
          )}
          {request.note && <div className="pt-1"><dt className="text-muted-foreground">{tr('Votre message')}</dt><dd className="mt-1 rounded-lg bg-muted/60 p-2">{localizeDemoText(request.note, lang)}</dd></div>}
        </dl>
      </Card>

      {workshopTimelineEnabled() && <CustomerWorkshopTimeline requestId={request.id} />}

      <div className="mt-5">
        <p className="mb-2 text-sm font-semibold">{tr('Échanges avec le garage')}</p>
        {(messages ?? []).length === 0 ? (
          <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{tr('Aucun message pour l’instant.')}</p>
        ) : (
          <ul className="space-y-2">
            {messages!.map((m) => (
              <li
                key={m.id}
                className={`max-w-[85%] rounded-lg p-2.5 text-sm ${m.sender === 'client' ? 'ms-auto bg-primary text-primary-foreground' : 'bg-muted'}`}
              >
                {m.body}
                <span className="mt-1 block text-[10px] opacity-70">{fromNow(m.created_at, lang)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex gap-2">
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={tr('Écrire au garage…')} className="min-h-[44px]" />
          <Button onClick={send} loading={addMessage.isPending}>{tr('Envoyer')}</Button>
        </div>
      </div>
    </div>
  )
}

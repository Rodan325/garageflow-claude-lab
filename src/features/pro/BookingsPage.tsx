import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarPlus, Check, Clock, Inbox, MessageSquare, Phone, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Field, Input, Textarea } from '@/components/ui/input'
import { EmptyState, LoadingState } from '@/components/ui/feedback'
import { PageHeader } from '@/components/common/PageHeader'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/features/auth/AuthProvider'
import {
  useAddRequestMessage,
  useConvertRequestToAppointment,
  useGarageRequests,
  useRequestMessages,
  useUpdateRequestStatus,
} from '@/data/requests'
import { REQUEST_STATUS_META, type RequestStatus, type ServiceRequest } from '@/types/domain'
import { shortDate, shortTime, fromNow } from '@/lib/format'
import { listItem, listStagger } from '@/lib/motion'

const TABS = [
  { value: 'pending', label: 'En attente' },
  { value: 'active', label: 'En cours' },
  { value: 'confirmed', label: 'Confirmées' },
  { value: 'archived', label: 'Archivées' },
  { value: 'all', label: 'Toutes' },
]

function matchTab(status: RequestStatus, tab: string) {
  if (tab === 'all') return true
  if (tab === 'pending') return status === 'pending'
  if (tab === 'active') return status === 'accepted' || status === 'reschedule_proposed'
  if (tab === 'confirmed') return status === 'confirmed'
  if (tab === 'archived') return status === 'completed' || status === 'declined' || status === 'cancelled'
  return true
}

export function BookingsPage() {
  const { garage, userId } = useAuth()
  const gid = garage?.id
  const toast = useToast()
  const { data: requests, isLoading } = useGarageRequests(gid)
  const updateStatus = useUpdateRequestStatus()
  const convert = useConvertRequestToAppointment()

  const [tab, setTab] = useState('pending')
  const [proposeFor, setProposeFor] = useState<ServiceRequest | null>(null)
  const [detailFor, setDetailFor] = useState<ServiceRequest | null>(null)

  const counts = useMemo(() => {
    const list = requests ?? []
    return {
      pending: list.filter((r) => r.status === 'pending').length,
      active: list.filter((r) => r.status === 'accepted' || r.status === 'reschedule_proposed').length,
      confirmed: list.filter((r) => r.status === 'confirmed').length,
    }
  }, [requests])

  const filtered = (requests ?? []).filter((r) => matchTab(r.status as RequestStatus, tab))

  async function setStatus(r: ServiceRequest, status: RequestStatus, msg: string) {
    try {
      await updateStatus.mutateAsync({ id: r.id, garageId: r.garage_id, clientId: r.client_id, status })
      toast.success(msg)
    } catch (e) {
      toast.error('Action impossible', (e as Error).message)
    }
  }

  // One click: accept if needed, then create the appointment + link client/vehicle.
  async function confirmBooking(r: ServiceRequest) {
    try {
      if (r.status === 'pending') {
        await updateStatus.mutateAsync({ id: r.id, garageId: r.garage_id, clientId: r.client_id, status: 'accepted' })
      }
      await convert.mutateAsync({ requestId: r.id, garageId: r.garage_id })
      toast.success('Rendez-vous confirmé', 'Ajouté à l’agenda et au CRM.')
    } catch (e) {
      await updateStatus
        .mutateAsync({ id: r.id, garageId: r.garage_id, clientId: r.client_id, status: 'confirmed' })
        .catch(() => {})
      toast.info('Demande confirmée', `Planification agenda à finaliser (${(e as Error).message}).`)
    }
  }

  return (
    <div>
      <PageHeader title="Réservations reçues" subtitle="Acceptez, refusez ou proposez un autre créneau." />

      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        items={TABS.map((t) => ({
          ...t,
          count: t.value in counts ? (counts as Record<string, number>)[t.value] : undefined,
        }))}
      />

      {isLoading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Inbox} title="Aucune demande ici" description="Les réservations clients arriveront dans cette boîte." />
      ) : (
        <motion.div variants={listStagger} initial="hidden" animate="show" className="grid gap-3">
          {filtered.map((r) => {
            const meta = REQUEST_STATUS_META[r.status as RequestStatus]
            const isPending = r.status === 'pending'
            const isAccepted = r.status === 'accepted'
            const isProposed = r.status === 'reschedule_proposed'
            const isConfirmed = r.status === 'confirmed'
            return (
              <motion.div key={r.id} variants={listItem}>
                <Card className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <Avatar name={r.contact_name} className="h-10 w-10" />
                      <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{r.contact_name ?? 'Client'}</p>
                        <span className="text-xs text-muted-foreground">{r.reference}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{r.service_name}</span> · {r.vehicle_label}
                      </p>
                      {r.contact_phone && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" /> {r.contact_phone}
                        </p>
                      )}
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        Souhaité : {shortDate(r.requested_date)} à {shortTime(r.requested_time)}
                        {isProposed && r.proposed_date && (
                          <span className="ml-2 rounded bg-accent px-1.5 py-0.5 text-xs text-accent-foreground">
                            Proposé : {shortDate(r.proposed_date)} à {shortTime(r.proposed_time)}
                          </span>
                        )}
                      </p>
                      {r.note && <p className="mt-2 rounded-lg bg-muted/60 p-2 text-sm">{r.note}</p>}
                      <p className="mt-2 text-xs text-muted-foreground">Reçue {fromNow(r.created_at)}</p>
                      </div>
                    </div>
                    <StatusPill tone={meta.tone} label={meta.label} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    {(isPending || isAccepted) && (
                      <>
                        <Button size="sm" loading={convert.isPending} onClick={() => confirmBooking(r)}>
                          <Check className="h-4 w-4" /> Confirmer
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setProposeFor(r)}>
                          <CalendarPlus className="h-4 w-4" /> Autre créneau
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setStatus(r, isPending ? 'declined' : 'cancelled', 'Demande refusée')}
                        >
                          <X className="h-4 w-4" /> Refuser
                        </Button>
                      </>
                    )}
                    {isProposed && (
                      <>
                        <span className="text-sm text-muted-foreground">En attente de la réponse du client…</span>
                        <Button size="sm" variant="ghost" onClick={() => setStatus(r, 'cancelled', 'Demande annulée')}>
                          Annuler
                        </Button>
                      </>
                    )}
                    {isConfirmed && (
                      <Button size="sm" variant="outline" onClick={() => setStatus(r, 'completed', 'Marquée terminée')}>
                        <Check className="h-4 w-4" /> Marquer terminée
                      </Button>
                    )}
                    {r.contact_phone && (
                      <a href={`tel:${r.contact_phone}`} className="inline-flex">
                        <Button size="sm" variant="ghost"><Phone className="h-4 w-4" /> Appeler</Button>
                      </a>
                    )}
                    <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setDetailFor(r)}>
                      <MessageSquare className="h-4 w-4" /> Détails
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {proposeFor && (
        <ProposeSlotModal
          request={proposeFor}
          onClose={() => setProposeFor(null)}
          onDone={() => {
            setProposeFor(null)
            toast.success('Nouveau créneau proposé', 'Le client va recevoir la proposition.')
          }}
        />
      )}

      {detailFor && userId && (
        <RequestDetailModal request={detailFor} userId={userId} onClose={() => setDetailFor(null)} />
      )}
    </div>
  )
}

function ProposeSlotModal({
  request,
  onClose,
  onDone,
}: {
  request: ServiceRequest
  onClose: () => void
  onDone: () => void
}) {
  const update = useUpdateRequestStatus()
  const toast = useToast()
  const [date, setDate] = useState(request.requested_date ?? '')
  const [time, setTime] = useState((request.requested_time ?? '09:00').slice(0, 5))

  async function submit() {
    if (!date || !time) {
      toast.error('Renseignez une date et une heure')
      return
    }
    try {
      await update.mutateAsync({
        id: request.id,
        garageId: request.garage_id,
        clientId: request.client_id,
        status: 'reschedule_proposed',
        proposed_date: date,
        proposed_time: time,
      })
      onDone()
    } catch (e) {
      toast.error('Action impossible', (e as Error).message)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Proposer un autre créneau"
      description={`${request.service_name} · ${request.contact_name ?? ''}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button loading={update.isPending} onClick={submit}>Envoyer la proposition</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date proposée" htmlFor="pdate">
          <Input id="pdate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Heure" htmlFor="ptime">
          <Input id="ptime" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}

function RequestDetailModal({
  request,
  userId,
  onClose,
}: {
  request: ServiceRequest
  userId: string
  onClose: () => void
}) {
  const { data: messages, isLoading } = useRequestMessages(request.id)
  const addMessage = useAddRequestMessage()
  const [body, setBody] = useState('')

  async function send() {
    if (!body.trim()) return
    await addMessage.mutateAsync({
      request_id: request.id,
      garage_id: request.garage_id,
      sender: 'garage',
      author_id: userId,
      body: body.trim(),
    })
    setBody('')
  }

  return (
    <Modal open onClose={onClose} variant="sheet" title={`Demande ${request.reference}`} description={request.service_name}>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-muted-foreground">Client</dt><dd className="font-medium">{request.contact_name}</dd></div>
        <div><dt className="text-muted-foreground">Téléphone</dt><dd className="font-medium">{request.contact_phone ?? '—'}</dd></div>
        <div><dt className="text-muted-foreground">Véhicule</dt><dd className="font-medium">{request.vehicle_label}</dd></div>
        <div><dt className="text-muted-foreground">Créneau souhaité</dt><dd className="font-medium">{shortDate(request.requested_date)} à {shortTime(request.requested_time)}</dd></div>
      </dl>

      <div className="mt-5">
        <p className="mb-2 text-sm font-semibold">Échanges</p>
        {isLoading ? (
          <LoadingState label="Chargement des messages…" />
        ) : (messages ?? []).length === 0 ? (
          <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">Aucun message pour l’instant.</p>
        ) : (
          <ul className="space-y-2">
            {messages!.map((m) => (
              <li
                key={m.id}
                className={`max-w-[85%] rounded-lg p-2.5 text-sm ${
                  m.sender === 'garage' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted'
                }`}
              >
                {m.body}
                <span className="mt-1 block text-[10px] opacity-70">{fromNow(m.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex gap-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Écrire au client…"
            className="min-h-[44px]"
          />
          <Button onClick={send} loading={addMessage.isPending}>Envoyer</Button>
        </div>
      </div>
    </Modal>
  )
}

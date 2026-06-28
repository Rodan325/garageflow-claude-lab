import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowLeft, Check, CheckCircle2, ChevronRight, Clock, LogIn, Plus, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, Input, Textarea } from '@/components/ui/input'
import { EmptyState, LoadingState } from '@/components/ui/feedback'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/features/auth/AuthProvider'
import { useGarages, useGarageServices, useGarageHours } from '@/data/garagePublic'
import { useClientVehicles, useUpsertClientVehicle } from '@/data/clientData'
import { useCreateRequest } from '@/data/requests'
import { useSelectedGarage } from '../useSelectedGarage'
import { BOOK_SERVICE_KEY } from '../ClientHomePage'
import { openDays, slotsForDate } from '@/lib/slots'
import { euro } from '@/lib/format'
import { usePrefersReducedMotion } from '@/lib/motion'
import type { GarageService } from '@/types/domain'

type Step = 'service' | 'slot' | 'identify' | 'done'
const STEPS: Step[] = ['service', 'slot', 'identify']
const STEP_LABEL: Record<Step, string> = {
  service: 'Prestation',
  slot: 'Créneau',
  identify: 'Vos informations',
  done: 'Confirmé',
}
const DRAFT_KEY = 'gf-booking-draft'

interface NewVehicle {
  brand: string
  model: string
  year: string
  registration: string
}

export function BookingFlow() {
  const navigate = useNavigate()
  const toast = useToast()
  const { userId, profile, email, authed } = useAuth()
  const { selectedGarageId } = useSelectedGarage()
  const reduced = usePrefersReducedMotion()

  const { data: services, isLoading: servicesLoading } = useGarageServices(selectedGarageId ?? undefined)
  const { data: hours } = useGarageHours(selectedGarageId ?? undefined)
  const { data: garages } = useGarages()
  const { data: vehicles } = useClientVehicles(userId)
  const addVehicle = useUpsertClientVehicle()
  const createRequest = useCreateRequest()

  const garageName = garages?.find((g) => g.id === selectedGarageId)?.name ?? ''

  const [step, setStep] = useState<Step>('service')
  const [service, setService] = useState<GarageService | null>(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')
  const [vehicleMode, setVehicleMode] = useState<'existing' | 'new'>('new')
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('')
  const [newVehicle, setNewVehicle] = useState<NewVehicle>({ brand: '', model: '', year: '', registration: '' })
  const [contactName, setContactName] = useState(profile?.full_name ?? '')
  const [contactPhone, setContactPhone] = useState(profile?.phone ?? '')
  const [reference, setReference] = useState<string | null>(null)
  const restored = useRef(false)

  const days = useMemo(() => openDays(hours, 8), [hours])
  const slots = useMemo(() => (date ? slotsForDate(hours, date) : []), [date, hours])

  // Restore a deep-linked service or a saved draft (e.g. after a login round-trip).
  useEffect(() => {
    if (restored.current || !services) return
    const pre = sessionStorage.getItem(BOOK_SERVICE_KEY)
    if (pre) {
      const found = services.find((s) => s.id === pre)
      sessionStorage.removeItem(BOOK_SERVICE_KEY)
      if (found) {
        setService(found)
        setStep('slot')
        restored.current = true
        return
      }
    }
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (raw) {
      try {
        const d = JSON.parse(raw)
        const f = d.serviceId ? services.find((s) => s.id === d.serviceId) : null
        if (f) setService(f)
        if (d.date) setDate(d.date)
        if (d.time) setTime(d.time)
        if (d.note) setNote(d.note)
        if (d.contactName) setContactName(d.contactName)
        if (d.contactPhone) setContactPhone(d.contactPhone)
        if (d.newVehicle) { setVehicleMode('new'); setNewVehicle(d.newVehicle) }
        if (d.vehicleId) { setVehicleMode('existing'); setSelectedVehicleId(d.vehicleId) }
        if (f && d.date && d.time) setStep('identify')
      } catch {
        /* ignore malformed draft */
      }
    }
    restored.current = true
  }, [services])

  // Only non-archived vehicles are reusable in a booking.
  const myVehicles = useMemo(() => (vehicles ?? []).filter((v) => !v.archived), [vehicles])

  // Default to an existing vehicle when the client has some.
  useEffect(() => {
    if (myVehicles.length > 0 && !selectedVehicleId && vehicleMode === 'new' && !newVehicle.brand) {
      setVehicleMode('existing')
      setSelectedVehicleId(myVehicles[0].id)
    }
  }, [myVehicles]) // eslint-disable-line react-hooks/exhaustive-deps

  function persistDraft() {
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        serviceId: service?.id,
        date,
        time,
        note,
        vehicleId: vehicleMode === 'existing' ? selectedVehicleId : null,
        newVehicle: vehicleMode === 'new' ? newVehicle : null,
        contactName,
        contactPhone,
      }),
    )
  }

  function goAuth(path: '/login' | '/signup') {
    persistDraft()
    navigate(`${path}?redirect=${encodeURIComponent('/app/book')}`)
  }

  if (!selectedGarageId) {
    return (
      <div className="p-4">
        <EmptyState
          title="Choisissez d’abord un garage"
          description="Revenez à l’accueil pour sélectionner votre garage."
          action={<Link to="/app"><Button>Choisir un garage</Button></Link>}
        />
      </div>
    )
  }

  const stepIndex = STEPS.indexOf(step)
  const back = () => setStep(STEPS[Math.max(0, stepIndex - 1)])

  async function submit() {
    if (!service || !date || !time || !contactName.trim()) {
      toast.error('Informations incomplètes')
      return
    }
    try {
      let vehId: string | null = null
      let label = ''
      if (vehicleMode === 'new') {
        if (!newVehicle.brand || !newVehicle.model) {
          toast.error('Renseignez la marque et le modèle')
          return
        }
        const created = await addVehicle.mutateAsync({
          client_id: userId!,
          brand: newVehicle.brand,
          model: newVehicle.model,
          year: newVehicle.year ? Number(newVehicle.year) : null,
          registration: newVehicle.registration || null,
        })
        vehId = created.id
        label = `${newVehicle.brand} ${newVehicle.model}${newVehicle.registration ? ` · ${newVehicle.registration}` : ''}`
      } else {
        const v = vehicles?.find((x) => x.id === selectedVehicleId)
        if (!v) {
          toast.error('Choisissez un véhicule')
          return
        }
        vehId = v.id
        label = `${v.brand} ${v.model}${v.registration ? ` · ${v.registration}` : ''}`
      }

      const row = await createRequest.mutateAsync({
        garage_id: selectedGarageId!,
        client_id: userId!,
        service_id: service.id,
        service_name: service.name,
        client_vehicle_id: vehId,
        vehicle_label: label,
        requested_date: date,
        requested_time: time,
        note: note || null,
        contact_name: contactName,
        contact_phone: contactPhone || null,
        contact_email: email,
        status: 'pending',
      })
      sessionStorage.removeItem(DRAFT_KEY)
      setReference(row.reference)
      setStep('done')
    } catch (e) {
      toast.error('Envoi impossible', (e as Error).message)
    }
  }

  if (step === 'done' && reference) {
    return (
      <Confirmation
        reference={reference}
        service={service?.name}
        garage={garageName}
        when={date ? `${format(new Date(date), 'EEEE d MMM', { locale: fr })} à ${time}` : ''}
        onTrack={() => navigate('/app/bookings')}
      />
    )
  }

  const transition = reduced ? { duration: 0 } : { duration: 0.22 }

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col p-4">
      {/* progress */}
      <div className="mb-3 flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>
      <p className="mb-3 text-sm font-medium text-muted-foreground">Étape {stepIndex + 1}/3 · {STEP_LABEL[step]}</p>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: reduced ? 0 : 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={transition}
          className="flex-1"
        >
          {step === 'service' && (
            <div>
              <h1 className="mb-3 text-lg font-bold">Quelle prestation ?</h1>
              {servicesLoading ? (
                <LoadingState />
              ) : (
                <div className="space-y-2">
                  {(services ?? []).map((s) => (
                    <button key={s.id} className="w-full text-left" onClick={() => { setService(s); setStep('slot') }}>
                      <Card className={`flex items-center justify-between p-4 transition-colors hover:bg-muted/40 ${service?.id === s.id ? 'ring-2 ring-primary' : ''}`}>
                        <div className="min-w-0">
                          <p className="font-medium">{s.name}</p>
                          {s.description && <p className="line-clamp-1 text-xs text-muted-foreground">{s.description}</p>}
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {s.duration_minutes} min</p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-primary">{s.price_type === 'fixed' ? euro(s.price_from) : `dès ${euro(s.price_from)}`}</span>
                      </Card>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'slot' && (
            <div>
              <h1 className="mb-1 text-lg font-bold">Choisissez un créneau</h1>
              {service && <p className="mb-3 text-sm text-muted-foreground">{service.name}</p>}
              <p className="mb-2 text-sm font-medium">Date</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {days.map((d) => (
                  <button
                    key={d.iso}
                    onClick={() => { setDate(d.iso); setTime('') }}
                    className={`shrink-0 rounded-xl border px-3 py-2 text-center text-sm capitalize ${date === d.iso ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:bg-muted/40'}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              {date && (
                <>
                  <p className="mb-2 mt-4 text-sm font-medium">Horaire souhaité</p>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {slots.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTime(t)}
                        className={`rounded-lg border py-2 text-sm ${time === t ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:bg-muted/40'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <p className="mt-3 text-xs text-muted-foreground">Le garage confirmera ou proposera un autre créneau.</p>
              <div className="mt-5 flex gap-2">
                <Button variant="outline" onClick={back} aria-label="Retour"><ArrowLeft className="h-4 w-4" /></Button>
                <Button className="flex-1" disabled={!date || !time} onClick={() => setStep('identify')}>
                  Continuer <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 'identify' && (
            <div>
              <h1 className="mb-3 text-lg font-bold">Véhicule & coordonnées</h1>
              <RecapCard service={service} date={date} time={time} />

              {/* Vehicle */}
              <p className="mb-1 mt-4 text-sm font-medium">Véhicule</p>
              <p className="mb-2 text-xs text-muted-foreground">
                Les informations de votre véhicule sont utilisées pour permettre au garage de traiter votre demande, préparer le rendez-vous et établir un devis.
              </p>
              {authed && myVehicles.length > 0 && (
                <div className="space-y-2">
                  {myVehicles.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => { setVehicleMode('existing'); setSelectedVehicleId(v.id) }}
                      className="w-full text-left"
                    >
                      <Card className={`flex items-center justify-between p-3 ${vehicleMode === 'existing' && selectedVehicleId === v.id ? 'ring-2 ring-primary' : ''}`}>
                        <div>
                          <p className="text-sm font-medium">{v.brand} {v.model}</p>
                          <p className="text-xs text-muted-foreground">{v.registration ?? 'sans plaque'}</p>
                        </div>
                        {vehicleMode === 'existing' && selectedVehicleId === v.id && <Check className="h-4 w-4 text-primary" />}
                      </Card>
                    </button>
                  ))}
                  <button
                    onClick={() => { setVehicleMode('new'); setSelectedVehicleId('') }}
                    className={`flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm ${vehicleMode === 'new' ? 'bg-muted/40' : ''}`}
                  >
                    <Plus className="h-4 w-4" /> Autre véhicule
                  </button>
                </div>
              )}
              {(vehicleMode === 'new' || !authed || myVehicles.length === 0) && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Marque" htmlFor="vb" required><Input id="vb" value={newVehicle.brand} onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })} /></Field>
                  <Field label="Modèle" htmlFor="vm" required><Input id="vm" value={newVehicle.model} onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })} /></Field>
                  <Field label="Année" htmlFor="vy"><Input id="vy" type="number" value={newVehicle.year} onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })} /></Field>
                  <Field label="Plaque" htmlFor="vr"><Input id="vr" value={newVehicle.registration} onChange={(e) => setNewVehicle({ ...newVehicle, registration: e.target.value })} /></Field>
                </div>
              )}

              {/* Coordinates */}
              <p className="mb-2 mt-4 text-sm font-medium">Coordonnées</p>
              <div className="space-y-3">
                <Field label="Nom" htmlFor="cn" required><Input id="cn" value={contactName} onChange={(e) => setContactName(e.target.value)} /></Field>
                <Field label="Téléphone" htmlFor="cp"><Input id="cp" type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="06 12 34 56 78" /></Field>
                <Field label="Message au garage" htmlFor="msg"><Textarea id="msg" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Décrivez le problème (facultatif)" /></Field>
              </div>

              {/* Consent before sharing the vehicle with this garage */}
              <p className="mt-4 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                En envoyant cette demande, vous autorisez ce garage à consulter les informations de ce véhicule
                uniquement pour traiter votre demande, préparer un rendez-vous, établir un devis et assurer le suivi de l'intervention.
              </p>

              {/* Confirm / identify */}
              <div className="mt-4">
                {authed ? (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={back} aria-label="Retour"><ArrowLeft className="h-4 w-4" /></Button>
                    <Button className="flex-1" loading={createRequest.isPending || addVehicle.isPending} onClick={submit}>
                      <Check className="h-4 w-4" /> Envoyer la demande
                    </Button>
                  </div>
                ) : (
                  <Card className="space-y-3 bg-muted/30 p-4">
                    <p className="text-sm font-medium">Dernière étape : identifiez-vous pour confirmer</p>
                    <p className="text-xs text-muted-foreground">Vos informations sont conservées. Vous revenez ici juste après.</p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button className="flex-1" onClick={() => goAuth('/login')}><LogIn className="h-4 w-4" /> Se connecter</Button>
                      <Button variant="outline" className="flex-1" onClick={() => goAuth('/signup')}><UserPlus className="h-4 w-4" /> Créer un compte</Button>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}
        </motion.div>
    </div>
  )
}

function RecapCard({ service, date, time }: { service: GarageService | null; date: string; time: string }) {
  return (
    <Card className="space-y-1.5 bg-muted/40 p-3 text-sm">
      <div className="flex justify-between"><span className="text-muted-foreground">Prestation</span><span className="font-medium">{service?.name ?? '—'}</span></div>
      <div className="flex justify-between"><span className="text-muted-foreground">Créneau</span><span className="font-medium capitalize">{date ? format(new Date(date), 'EEE d MMM', { locale: fr }) : '—'} · {time || '—'}</span></div>
    </Card>
  )
}

function Confirmation({
  reference, service, garage, when, onTrack,
}: {
  reference: string
  service?: string
  garage?: string
  when?: string
  onTrack: () => void
}) {
  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 14 }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success"
      >
        <CheckCircle2 className="h-9 w-9" />
      </motion.div>
      <div>
        <h1 className="text-xl font-bold">Demande envoyée</h1>
        <p className="mt-1 text-sm text-muted-foreground">Le garage va vous répondre rapidement.</p>
      </div>
      <Card className="w-full max-w-xs p-4 text-left">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Référence</span>
          <span className="font-bold tracking-wider text-primary">{reference}</span>
        </div>
        <div className="mt-2 space-y-1.5 border-t border-border pt-2 text-sm">
          {service && <Row label="Prestation" value={service} />}
          {garage && <Row label="Garage" value={garage} />}
          {when && <Row label="Date" value={when} />}
          <Row label="Statut" value="En attente" />
        </div>
      </Card>
      <Button className="w-full max-w-xs" onClick={onTrack}>Voir ma demande</Button>
      <Link to="/app" className="text-sm text-muted-foreground hover:text-foreground">Retour à l’accueil</Link>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium capitalize">{value}</span>
    </div>
  )
}

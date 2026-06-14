import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowLeft, Check, CheckCircle2, ChevronRight, Clock, Plus } from 'lucide-react'
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
import type { GarageService, ClientVehicle } from '@/types/domain'

type Step = 'service' | 'vehicle' | 'slot' | 'details' | 'done'
const STEPS: Step[] = ['service', 'vehicle', 'slot', 'details']
const STEP_LABEL: Record<Step, string> = {
  service: 'Prestation',
  vehicle: 'Véhicule',
  slot: 'Créneau',
  details: 'Coordonnées',
  done: 'Confirmé',
}

export function BookingFlow() {
  const navigate = useNavigate()
  const toast = useToast()
  const { userId, profile, email } = useAuth()
  const { selectedGarageId } = useSelectedGarage()
  const reduced = usePrefersReducedMotion()

  const { data: services, isLoading: servicesLoading } = useGarageServices(selectedGarageId ?? undefined)
  const { data: hours } = useGarageHours(selectedGarageId ?? undefined)
  const { data: vehicles } = useClientVehicles(userId)
  const addVehicle = useUpsertClientVehicle()
  const createRequest = useCreateRequest()

  const [step, setStep] = useState<Step>('service')
  const [service, setService] = useState<GarageService | null>(null)
  const [vehicle, setVehicle] = useState<ClientVehicle | null>(null)
  const [date, setDate] = useState<string>('')
  const [time, setTime] = useState<string>('')
  const [note, setNote] = useState('')
  const [contactName, setContactName] = useState(profile?.full_name ?? '')
  const [contactPhone, setContactPhone] = useState(profile?.phone ?? '')
  const [reference, setReference] = useState<string | null>(null)

  const { data: garages } = useGarages()
  const garageName = garages?.find((g) => g.id === selectedGarageId)?.name ?? ''

  const days = useMemo(() => openDays(hours, 8), [hours])
  const slots = useMemo(() => (date ? slotsForDate(hours, date) : []), [date, hours])

  // Deep-link from the home prestation list: preselect service and skip step 1.
  useEffect(() => {
    const pre = sessionStorage.getItem(BOOK_SERVICE_KEY)
    if (pre && services) {
      const found = services.find((s) => s.id === pre)
      sessionStorage.removeItem(BOOK_SERVICE_KEY)
      if (found) {
        setService(found)
        setStep('vehicle')
      }
    }
  }, [services])

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

  function next() {
    const i = STEPS.indexOf(step)
    if (i < STEPS.length - 1) setStep(STEPS[i + 1])
  }
  function back() {
    const i = STEPS.indexOf(step)
    if (i > 0) setStep(STEPS[i - 1])
  }

  async function submit() {
    if (!service || !vehicle || !date || !time || !contactName) {
      toast.error('Informations incomplètes')
      return
    }
    try {
      const row = await createRequest.mutateAsync({
        garage_id: selectedGarageId!,
        client_id: userId!,
        service_id: service.id,
        service_name: service.name,
        client_vehicle_id: vehicle.id,
        vehicle_label: `${vehicle.brand} ${vehicle.model}${vehicle.registration ? ` · ${vehicle.registration}` : ''}`,
        requested_date: date,
        requested_time: time,
        note: note || null,
        contact_name: contactName,
        contact_phone: contactPhone || null,
        contact_email: email,
        status: 'pending',
      })
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

  const transition = reduced ? { duration: 0 } : { duration: 0.25 }

  return (
    <div className="flex min-h-full flex-col p-4">
      {/* progress */}
      <div className="mb-4 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div
              className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? 'bg-primary' : 'bg-muted'}`}
            />
          </div>
        ))}
      </div>
      <p className="mb-3 text-sm font-medium text-muted-foreground">
        Étape {stepIndex + 1}/4 · {STEP_LABEL[step]}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: reduced ? 0 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: reduced ? 0 : -20 }}
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
                    <button key={s.id} className="w-full text-left" onClick={() => { setService(s); next() }}>
                      <Card className={`focus-card flex items-center justify-between p-4 ${service?.id === s.id ? 'ring-2 ring-primary' : ''}`}>
                        <div>
                          <p className="font-medium">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.description}</p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {s.duration_minutes} min</p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-primary">dès {euro(s.price_from)}</span>
                      </Card>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'vehicle' && (
            <VehicleStep
              vehicles={vehicles ?? []}
              selected={vehicle}
              onSelect={(v) => { setVehicle(v); next() }}
              onAdd={async (v) => {
                const created = await addVehicle.mutateAsync({ ...v, client_id: userId! })
                setVehicle(created)
                next()
              }}
              adding={addVehicle.isPending}
            />
          )}

          {step === 'slot' && (
            <div>
              <h1 className="mb-3 text-lg font-bold">Choisissez un créneau</h1>
              <p className="mb-2 text-sm font-medium">Date</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {days.map((d) => (
                  <button
                    key={d.iso}
                    onClick={() => { setDate(d.iso); setTime('') }}
                    className={`shrink-0 rounded-xl border px-3 py-2 text-center text-sm capitalize ${date === d.iso ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              {date && (
                <>
                  <p className="mb-2 mt-4 text-sm font-medium">Horaire souhaité</p>
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTime(t)}
                        className={`rounded-lg border py-2 text-sm ${time === t ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <p className="mt-3 text-xs text-muted-foreground">Le garage confirmera ou proposera un autre créneau.</p>
              <div className="mt-5 flex gap-2">
                <Button variant="outline" onClick={back}><ArrowLeft className="h-4 w-4" /></Button>
                <Button className="flex-1" disabled={!date || !time} onClick={next}>Continuer <ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {step === 'details' && (
            <div>
              <h1 className="mb-3 text-lg font-bold">Vos coordonnées</h1>
              <RecapCard service={service} vehicle={vehicle} date={date} time={time} />
              <div className="mt-4 space-y-3">
                <Field label="Nom" htmlFor="cn" required><Input id="cn" value={contactName} onChange={(e) => setContactName(e.target.value)} /></Field>
                <Field label="Téléphone" htmlFor="cp"><Input id="cp" type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="06 12 34 56 78" /></Field>
                <Field label="Message au garage" htmlFor="msg" hint="Décrivez le problème ou une demande particulière."><Textarea id="msg" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
              </div>
              <div className="mt-5 flex gap-2">
                <Button variant="outline" onClick={back}><ArrowLeft className="h-4 w-4" /></Button>
                <Button className="flex-1" loading={createRequest.isPending} onClick={submit}>
                  <Check className="h-4 w-4" /> Envoyer la demande
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function RecapCard({ service, vehicle, date, time }: { service: GarageService | null; vehicle: ClientVehicle | null; date: string; time: string }) {
  return (
    <Card className="space-y-1.5 bg-muted/40 p-3 text-sm">
      <div className="flex justify-between"><span className="text-muted-foreground">Prestation</span><span className="font-medium">{service?.name}</span></div>
      <div className="flex justify-between"><span className="text-muted-foreground">Véhicule</span><span className="font-medium">{vehicle ? `${vehicle.brand} ${vehicle.model}` : '—'}</span></div>
      <div className="flex justify-between"><span className="text-muted-foreground">Créneau</span><span className="font-medium">{date ? format(new Date(date), 'd MMM', { locale: fr }) : '—'} à {time || '—'}</span></div>
    </Card>
  )
}

function VehicleStep({
  vehicles,
  selected,
  onSelect,
  onAdd,
  adding,
}: {
  vehicles: ClientVehicle[]
  selected: ClientVehicle | null
  onSelect: (v: ClientVehicle) => void
  onAdd: (v: { brand: string; model: string; year: number | null; fuel: string | null; registration: string | null }) => void
  adding: boolean
}) {
  const [showForm, setShowForm] = useState(vehicles.length === 0)
  const [form, setForm] = useState({ brand: '', model: '', year: '', fuel: '', registration: '' })

  return (
    <div>
      <h1 className="mb-3 text-lg font-bold">Quel véhicule ?</h1>
      <div className="space-y-2">
        {vehicles.map((v) => (
          <button key={v.id} className="w-full text-left" onClick={() => onSelect(v)}>
            <Card className={`focus-card flex items-center justify-between p-4 ${selected?.id === v.id ? 'ring-2 ring-primary' : ''}`}>
              <div>
                <p className="font-medium">{v.brand} {v.model}</p>
                <p className="text-xs text-muted-foreground">{v.year ?? '—'} · {v.registration ?? 'sans plaque'}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Card>
          </button>
        ))}
      </div>

      {!showForm ? (
        <Button variant="outline" className="mt-3 w-full" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Ajouter un véhicule
        </Button>
      ) : (
        <Card className="mt-3 space-y-3 p-4">
          <p className="text-sm font-semibold">Nouveau véhicule</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Marque" htmlFor="vb" required><Input id="vb" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></Field>
            <Field label="Modèle" htmlFor="vm" required><Input id="vm" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></Field>
            <Field label="Année" htmlFor="vy"><Input id="vy" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></Field>
            <Field label="Plaque" htmlFor="vr"><Input id="vr" value={form.registration} onChange={(e) => setForm({ ...form, registration: e.target.value })} /></Field>
          </div>
          <Button
            className="w-full"
            loading={adding}
            onClick={() =>
              form.brand && form.model
                ? onAdd({
                    brand: form.brand,
                    model: form.model,
                    year: form.year ? Number(form.year) : null,
                    fuel: form.fuel || null,
                    registration: form.registration || null,
                  })
                : undefined
            }
          >
            Utiliser ce véhicule
          </Button>
        </Card>
      )}
    </div>
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
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 p-6 text-center">
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

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check, Plus, Search, Trash2, UserPlus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { LoadingState } from '@/components/ui/feedback'
import { PageHeader } from '@/components/common/PageHeader'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/features/auth/AuthProvider'
import { useGarageRequests } from '@/data/requests'
import { useManageServices } from '@/data/catalog'
import { useCreateQuote, useQuote, useQuoteLines, useUpdateQuote } from '@/data/quotes'
import { useCustomers, useCreateCustomer, useVehicles, useCreateVehicle } from '@/data/proData'
import { euro } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Customer, DefaultLine, Vehicle } from '@/types/domain'

interface Line { label: string; quantity: number; unit_price: number; tax_rate: number }
const DEFAULT_CONDITIONS = 'Devis valable 30 jours. Pièces et main-d’œuvre garanties. TVA 20% incluse.'

function parseVehicleLabel(label?: string | null) {
  if (!label) return { brand: '', model: '', registration: '' }
  const [namePart, plate] = label.split(/\s+[·-]\s+/)
  const tokens = (namePart ?? '').trim().split(/\s+/)
  return { brand: tokens[0] ?? '', model: tokens.slice(1).join(' '), registration: (plate ?? '').trim() }
}
const fullName = (c?: Customer | null) => (c ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() : '')
const vehLabel = (v?: Vehicle | null) => (v ? `${v.brand} ${v.model}${v.registration ? ` · ${v.registration}` : ''}` : '')

export function QuoteEditorPage() {
  const { id } = useParams()
  const editing = !!id
  const [params] = useSearchParams()
  const requestId = params.get('request')
  const { garage } = useAuth()
  const gid = garage?.id
  const navigate = useNavigate()
  const toast = useToast()

  const { data: requests } = useGarageRequests(gid)
  const { data: services } = useManageServices(gid)
  const { data: customers } = useCustomers(gid)
  const { data: vehicles } = useVehicles(gid)
  const { data: existingQuote, isLoading: quoteLoading } = useQuote(editing ? id : undefined)
  const { data: existingLines } = useQuoteLines(editing ? id : undefined)
  const createQuote = useCreateQuote()
  const updateQuote = useUpdateQuote()
  const createCustomer = useCreateCustomer()
  const createVehicle = useCreateVehicle()

  const [title, setTitle] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [conditions, setConditions] = useState(DEFAULT_CONDITIONS)
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<Line[]>([])

  // Client / vehicle selection
  const [clientMode, setClientMode] = useState<'existing' | 'new'>('new')
  const [customerId, setCustomerId] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [newClient, setNewClient] = useState({ first: '', last: '', phone: '', email: '' })
  const [vehicleMode, setVehicleMode] = useState<'existing' | 'new'>('new')
  const [vehicleId, setVehicleId] = useState('')
  const [newVehicle, setNewVehicle] = useState({ brand: '', model: '', registration: '' })
  const [suggested, setSuggested] = useState<{ client?: boolean; vehicle?: boolean }>({})

  const init = useRef(false)

  useEffect(() => {
    if (init.current) return

    if (editing) {
      if (existingQuote && existingLines && customers) {
        setTitle(existingQuote.title)
        setValidUntil(existingQuote.valid_until ?? '')
        setConditions(existingQuote.conditions ?? DEFAULT_CONDITIONS)
        setNotes(existingQuote.notes ?? '')
        setLines(existingLines.map((l) => ({ label: l.label, quantity: l.quantity, unit_price: l.unit_price, tax_rate: l.tax_rate })))
        if (existingQuote.customer_id) { setClientMode('existing'); setCustomerId(existingQuote.customer_id) }
        else { setClientMode('new'); setNewClient((n) => ({ ...n, first: existingQuote.client_name ?? '' })) }
        if (existingQuote.vehicle_id) { setVehicleMode('existing'); setVehicleId(existingQuote.vehicle_id) }
        else { setVehicleMode('new'); setNewVehicle(parseVehicleLabel(existingQuote.vehicle_label)) }
        init.current = true
      }
      return
    }

    if (requests && services && customers && vehicles) {
      const req = requestId ? requests.find((r) => r.id === requestId) : null
      const svc = req ? services.find((s) => s.id === req.service_id) : null
      setTitle(req?.service_name ?? svc?.name ?? 'Devis')

      // suggest client: linked_user_id, then phone, then email
      let matchedClient: Customer | undefined
      if (req) {
        matchedClient =
          customers.find((c) => c.linked_user_id && c.linked_user_id === req.client_id) ||
          (req.contact_phone ? customers.find((c) => c.phone && c.phone === req.contact_phone) : undefined) ||
          (req.contact_email ? customers.find((c) => c.email && c.email === req.contact_email) : undefined) ||
          (req.customer_id ? customers.find((c) => c.id === req.customer_id) : undefined)
      }
      if (matchedClient) {
        setClientMode('existing'); setCustomerId(matchedClient.id); setSuggested((s) => ({ ...s, client: true }))
      } else if (req) {
        const [first, ...rest] = (req.contact_name ?? '').split(' ')
        setClientMode('new'); setNewClient({ first: first ?? '', last: rest.join(' '), phone: req.contact_phone ?? '', email: req.contact_email ?? '' })
      }

      // suggest vehicle by registration
      const parsed = parseVehicleLabel(req?.vehicle_label)
      const matchedVehicle = parsed.registration ? vehicles.find((v) => v.registration && v.registration.replace(/\s/g, '') === parsed.registration.replace(/\s/g, '')) : undefined
      if (matchedVehicle) {
        setVehicleMode('existing'); setVehicleId(matchedVehicle.id); setSuggested((s) => ({ ...s, vehicle: true }))
      } else if (req) {
        setVehicleMode('new'); setNewVehicle(parsed)
      }

      // lines from the service default lines
      const defaults = (svc?.default_lines as unknown as DefaultLine[]) ?? []
      if (defaults.length > 0) setLines(defaults.map((l) => ({ ...l })))
      else setLines([{ label: svc?.name ?? req?.service_name ?? 'Prestation', quantity: 1, unit_price: svc?.price_from ?? 0, tax_rate: svc?.tax_rate ?? 20 }])

      init.current = true
    }
  }, [editing, existingQuote, existingLines, requests, services, customers, vehicles, requestId])

  // Auto-select the only vehicle of a chosen existing client
  useEffect(() => {
    if (clientMode !== 'existing' || !customerId) return
    const own = (vehicles ?? []).filter((v) => v.customer_id === customerId)
    if (vehicleMode === 'existing' && vehicleId && own.some((v) => v.id === vehicleId)) return
    if (own.length === 1) { setVehicleMode('existing'); setVehicleId(own[0].id) }
  }, [customerId, clientMode]) // eslint-disable-line react-hooks/exhaustive-deps

  const totals = useMemo(() => {
    let subtotal = 0, tax = 0
    for (const l of lines) {
      const lt = (Number(l.quantity) || 0) * (Number(l.unit_price) || 0)
      subtotal += lt
      tax += lt * ((Number(l.tax_rate) || 0) / 100)
    }
    return { subtotal: +subtotal.toFixed(2), tax: +tax.toFixed(2), total: +(subtotal + tax).toFixed(2) }
  }, [lines])

  const setLine = (i: number, patch: Partial<Line>) => setLines((c) => c.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  const addLine = () => setLines((c) => [...c, { label: '', quantity: 1, unit_price: 0, tax_rate: 20 }])
  const removeLine = (i: number) => setLines((c) => c.filter((_, idx) => idx !== i))

  function applyService(serviceId: string) {
    const svc = (services ?? []).find((s) => s.id === serviceId)
    if (!svc) return
    setTitle(svc.name)
    const defaults = (svc.default_lines as unknown as DefaultLine[]) ?? []
    setLines(defaults.length > 0 ? defaults.map((l) => ({ ...l })) : [{ label: svc.name, quantity: 1, unit_price: svc.price_from ?? 0, tax_rate: svc.tax_rate ?? 20 }])
  }

  const clientVehicles = (vehicles ?? []).filter((v) => v.customer_id === customerId)
  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase()
    const list = customers ?? []
    if (!q) return list.slice(0, 6)
    return list.filter((c) => `${fullName(c)} ${c.phone ?? ''} ${c.email ?? ''}`.toLowerCase().includes(q)).slice(0, 6)
  }, [customers, clientSearch])

  async function save(thenPrint: boolean) {
    if (!gid) return
    if (!title.trim() || lines.length === 0) { toast.error('Ajoutez un intitulé et au moins une ligne'); return }

    try {
      // Resolve client (avoid duplicates)
      let resolvedCustomerId: string | null = null
      let clientName = ''
      if (clientMode === 'existing') {
        const c = (customers ?? []).find((x) => x.id === customerId)
        if (!c) { toast.error('Choisissez un client'); return }
        resolvedCustomerId = c.id
        clientName = fullName(c)
      } else {
        if (!newClient.first && !newClient.last) { toast.error('Renseignez le client'); return }
        const dup = (customers ?? []).find(
          (c) => (newClient.email && c.email === newClient.email) || (newClient.phone && c.phone === newClient.phone),
        )
        if (dup) {
          resolvedCustomerId = dup.id
          clientName = fullName(dup)
        } else {
          const c = await createCustomer.mutateAsync({ garage_id: gid, first_name: newClient.first || null, last_name: newClient.last || null, phone: newClient.phone || null, email: newClient.email || null })
          resolvedCustomerId = c.id
          clientName = fullName(c)
        }
      }

      // Resolve vehicle
      let resolvedVehicleId: string | null = null
      let vehicleLabel = ''
      if (vehicleMode === 'existing' && vehicleId) {
        const v = (vehicles ?? []).find((x) => x.id === vehicleId)
        resolvedVehicleId = v?.id ?? null
        vehicleLabel = vehLabel(v)
      } else if (newVehicle.brand) {
        const dupV = newVehicle.registration ? (vehicles ?? []).find((v) => v.registration && v.registration.replace(/\s/g, '') === newVehicle.registration.replace(/\s/g, '')) : undefined
        if (dupV) {
          resolvedVehicleId = dupV.id
          vehicleLabel = vehLabel(dupV)
        } else {
          const v = await createVehicle.mutateAsync({ garage_id: gid, customer_id: resolvedCustomerId, brand: newVehicle.brand, model: newVehicle.model || '—', registration: newVehicle.registration || null })
          resolvedVehicleId = v.id
          vehicleLabel = vehLabel(v)
        }
      }

      const lineRows = lines.map((l, i) => ({
        label: l.label, quantity: l.quantity, unit_price: l.unit_price, tax_rate: l.tax_rate,
        line_total: +((Number(l.quantity) || 0) * (Number(l.unit_price) || 0)).toFixed(2), sort_order: i,
      }))
      const quoteFields = {
        garage_id: gid, title, status: 'draft',
        subtotal: totals.subtotal, tax_total: totals.tax, total: totals.total,
        notes: notes || null, conditions: conditions || null, valid_until: validUntil || null,
        client_name: clientName || null, vehicle_label: vehicleLabel || null,
        customer_id: resolvedCustomerId, vehicle_id: resolvedVehicleId, service_request_id: requestId,
      }

      if (editing && id) {
        await updateQuote.mutateAsync({ id, garageId: gid, quote: quoteFields, lines: lineRows })
        toast.success('Devis mis à jour')
        navigate(thenPrint ? `/print/quote/${id}` : '/pro/quotes')
      } else {
        const number = `DV-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`
        const row = await createQuote.mutateAsync({ quote: { ...quoteFields, number }, lines: lineRows })
        toast.success('Devis créé')
        navigate(thenPrint ? `/print/quote/${row.id}` : '/pro/quotes')
      }
    } catch (e) {
      toast.error('Enregistrement impossible', (e as Error).message)
    }
  }

  if (editing && quoteLoading) return <LoadingState />
  const saving = createQuote.isPending || updateQuote.isPending || createCustomer.isPending || createVehicle.isPending

  return (
    <div>
      <button onClick={() => navigate('/pro/quotes')} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Devis
      </button>
      <PageHeader title={editing ? 'Modifier le devis' : 'Nouveau devis'} subtitle="Client, véhicule et lignes — préremplis, modifiables avant validation." />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Lines */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Lignes du devis</CardTitle>
            <Select className="w-48" defaultValue="" onChange={(e) => { if (e.target.value) applyService(e.target.value) }}>
              <option value="">Partir d’une prestation…</option>
              {(services ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="hidden grid-cols-12 gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid">
              <span className="col-span-6">Désignation</span>
              <span className="col-span-2 text-right">Qté</span>
              <span className="col-span-2 text-right">PU HT</span>
              <span className="col-span-1 text-right">TVA</span>
              <span className="col-span-1" />
            </div>
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-12 items-center gap-2">
                <Input className="col-span-12 sm:col-span-6" value={l.label} placeholder="Désignation" onChange={(e) => setLine(i, { label: e.target.value })} />
                <Input className="col-span-3 sm:col-span-2 text-right" type="number" value={l.quantity} onChange={(e) => setLine(i, { quantity: Number(e.target.value) })} />
                <Input className="col-span-4 sm:col-span-2 text-right" type="number" value={l.unit_price} onChange={(e) => setLine(i, { unit_price: Number(e.target.value) })} />
                <Input className="col-span-3 sm:col-span-1 text-right" type="number" value={l.tax_rate} onChange={(e) => setLine(i, { tax_rate: Number(e.target.value) })} />
                <button onClick={() => removeLine(i)} className="col-span-2 flex justify-end text-muted-foreground hover:text-danger sm:col-span-1" aria-label="Supprimer"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addLine}><Plus className="h-4 w-4" /> Ajouter une ligne</Button>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Récapitulatif</CardTitle></CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total HT</span><span className="font-medium">{euro(totals.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">TVA</span><span className="font-medium">{euro(totals.tax)}</span></div>
              <div className="flex justify-between border-t border-border pt-1.5 text-base"><span className="font-semibold">Total TTC</span><span className="font-bold text-primary">{euro(totals.total)}</span></div>
            </CardContent>
          </Card>

          {/* Client */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Client</CardTitle>
              {suggested.client && clientMode === 'existing' && <Badge tone="primary">Suggéré</Badge>}
            </CardHeader>
            <CardContent className="space-y-3">
              {clientMode === 'existing' && customerId ? (
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{fullName((customers ?? []).find((c) => c.id === customerId))}</p>
                    <p className="text-xs text-muted-foreground">{(customers ?? []).find((c) => c.id === customerId)?.phone ?? '—'}</p>
                  </div>
                  <button className="text-xs font-medium text-primary hover:underline" onClick={() => { setCustomerId(''); setSuggested((s) => ({ ...s, client: false })) }}>Changer</button>
                </div>
              ) : clientMode === 'existing' ? (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Nom, téléphone, email…" className="pl-9" />
                  </div>
                  <div className="space-y-1">
                    {filteredClients.map((c) => (
                      <button key={c.id} onClick={() => { setCustomerId(c.id); setClientSearch('') }} className="flex w-full items-center justify-between rounded-lg p-2 text-left text-sm hover:bg-muted/60">
                        <span className="font-medium">{fullName(c) || 'Client'}</span>
                        <span className="text-xs text-muted-foreground">{c.phone ?? c.email ?? ''}</span>
                      </button>
                    ))}
                    {filteredClients.length === 0 && <p className="px-2 py-1 text-xs text-muted-foreground">Aucun client trouvé.</p>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setClientMode('new')}><UserPlus className="h-4 w-4" /> Nouveau client</Button>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Prénom" htmlFor="cf"><Input id="cf" value={newClient.first} onChange={(e) => setNewClient({ ...newClient, first: e.target.value })} /></Field>
                    <Field label="Nom" htmlFor="cl"><Input id="cl" value={newClient.last} onChange={(e) => setNewClient({ ...newClient, last: e.target.value })} /></Field>
                    <Field label="Téléphone" htmlFor="cp"><Input id="cp" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} /></Field>
                    <Field label="Email" htmlFor="ce"><Input id="ce" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} /></Field>
                  </div>
                  {(customers ?? []).length > 0 && (
                    <button className="text-xs font-medium text-primary hover:underline" onClick={() => setClientMode('existing')}>Choisir un client existant</button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Vehicle */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Véhicule</CardTitle>
              {suggested.vehicle && vehicleMode === 'existing' && <Badge tone="primary">Suggéré</Badge>}
            </CardHeader>
            <CardContent className="space-y-2">
              {clientMode === 'existing' && customerId && clientVehicles.length > 0 && (
                <div className="space-y-1">
                  {clientVehicles.map((v) => (
                    <button key={v.id} onClick={() => { setVehicleMode('existing'); setVehicleId(v.id) }} className={cn('flex w-full items-center justify-between rounded-lg border p-2 text-left text-sm', vehicleMode === 'existing' && vehicleId === v.id ? 'border-primary' : 'border-border hover:bg-muted/60')}>
                      <span>{v.brand} {v.model} <span className="text-muted-foreground">· {v.registration ?? 'sans plaque'}</span></span>
                      {vehicleMode === 'existing' && vehicleId === v.id && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
              {vehicleMode === 'new' || !(clientMode === 'existing' && customerId && clientVehicles.length > 0) ? (
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Marque" htmlFor="vb"><Input id="vb" value={newVehicle.brand} onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })} /></Field>
                  <Field label="Modèle" htmlFor="vm"><Input id="vm" value={newVehicle.model} onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })} /></Field>
                  <div className="col-span-2"><Field label="Immatriculation" htmlFor="vr"><Input id="vr" value={newVehicle.registration} onChange={(e) => setNewVehicle({ ...newVehicle, registration: e.target.value })} /></Field></div>
                </div>
              ) : (
                <button className="text-xs font-medium text-primary hover:underline" onClick={() => { setVehicleMode('new'); setVehicleId('') }}>Nouveau véhicule</button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Détails</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Field label="Intitulé" htmlFor="qt"><Input id="qt" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
              <Field label="Valable jusqu’au" htmlFor="qd"><Input id="qd" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></Field>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-5">
        <CardHeader><CardTitle>Conditions & notes</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Field label="Conditions (imprimées sur le devis)" htmlFor="qcond"><Textarea id="qcond" value={conditions} onChange={(e) => setConditions(e.target.value)} /></Field>
          <Field label="Notes internes (non imprimées)" htmlFor="qn"><Textarea id="qn" value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        </CardContent>
      </Card>

      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={() => save(false)} loading={saving}>Enregistrer</Button>
        <Button onClick={() => save(true)} loading={saving}>Enregistrer & aperçu</Button>
      </div>
    </div>
  )
}

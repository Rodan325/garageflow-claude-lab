import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/input'
import { LoadingState } from '@/components/ui/feedback'
import { PageHeader } from '@/components/common/PageHeader'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/features/auth/AuthProvider'
import { useGarageRequests } from '@/data/requests'
import { useManageServices } from '@/data/catalog'
import { useCreateQuote, useQuote, useQuoteLines, useUpdateQuote } from '@/data/quotes'
import { euro } from '@/lib/format'
import type { DefaultLine } from '@/types/domain'

interface Line {
  label: string
  quantity: number
  unit_price: number
  tax_rate: number
}

const DEFAULT_CONDITIONS = 'Devis valable 30 jours. Pièces et main-d’œuvre garanties. TVA 20% incluse.'

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
  const { data: existingQuote, isLoading: quoteLoading } = useQuote(editing ? id : undefined)
  const { data: existingLines } = useQuoteLines(editing ? id : undefined)
  const createQuote = useCreateQuote()
  const updateQuote = useUpdateQuote()

  const [title, setTitle] = useState('')
  const [clientName, setClientName] = useState('')
  const [vehicleLabel, setVehicleLabel] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [conditions, setConditions] = useState(DEFAULT_CONDITIONS)
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<Line[]>([])
  const [customerId, setCustomerId] = useState<string | null>(null)
  const init = useRef(false)

  // Prefill once everything needed is available.
  useEffect(() => {
    if (init.current) return

    if (editing) {
      if (existingQuote && existingLines) {
        setTitle(existingQuote.title)
        setClientName(existingQuote.client_name ?? '')
        setVehicleLabel(existingQuote.vehicle_label ?? '')
        setValidUntil(existingQuote.valid_until ?? '')
        setConditions(existingQuote.conditions ?? DEFAULT_CONDITIONS)
        setNotes(existingQuote.notes ?? '')
        setCustomerId(existingQuote.customer_id)
        setLines(existingLines.map((l) => ({ label: l.label, quantity: l.quantity, unit_price: l.unit_price, tax_rate: l.tax_rate })))
        init.current = true
      }
      return
    }

    // create — prefill from a request + its service default lines
    if (requests && services) {
      const req = requestId ? requests.find((r) => r.id === requestId) : null
      const svc = req ? services.find((s) => s.id === req.service_id) : null
      setTitle(req?.service_name ?? svc?.name ?? 'Devis')
      setClientName(req?.contact_name ?? '')
      setVehicleLabel(req?.vehicle_label ?? '')
      setCustomerId(req?.customer_id ?? null)
      const defaults = (svc?.default_lines as unknown as DefaultLine[]) ?? []
      if (defaults.length > 0) {
        setLines(defaults.map((l) => ({ label: l.label, quantity: l.quantity, unit_price: l.unit_price, tax_rate: l.tax_rate })))
      } else {
        setLines([
          { label: svc?.name ?? req?.service_name ?? 'Prestation', quantity: 1, unit_price: svc?.price_from ?? 0, tax_rate: svc?.tax_rate ?? 20 },
        ])
      }
      init.current = true
    }
  }, [editing, existingQuote, existingLines, requests, services, requestId])

  const totals = useMemo(() => {
    let subtotal = 0
    let tax = 0
    for (const l of lines) {
      const lt = (Number(l.quantity) || 0) * (Number(l.unit_price) || 0)
      subtotal += lt
      tax += lt * ((Number(l.tax_rate) || 0) / 100)
    }
    return { subtotal: +subtotal.toFixed(2), tax: +tax.toFixed(2), total: +(subtotal + tax).toFixed(2) }
  }, [lines])

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((cur) => cur.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  const addLine = () => setLines((cur) => [...cur, { label: '', quantity: 1, unit_price: 0, tax_rate: 20 }])
  const removeLine = (i: number) => setLines((cur) => cur.filter((_, idx) => idx !== i))

  async function save(thenPrint: boolean) {
    if (!gid) return
    if (!title.trim() || lines.length === 0) {
      toast.error('Ajoutez un intitulé et au moins une ligne')
      return
    }
    const lineRows = lines.map((l, i) => ({
      label: l.label,
      quantity: l.quantity,
      unit_price: l.unit_price,
      tax_rate: l.tax_rate,
      line_total: +((Number(l.quantity) || 0) * (Number(l.unit_price) || 0)).toFixed(2),
      sort_order: i,
    }))
    const quoteFields = {
      garage_id: gid,
      title,
      status: 'draft',
      subtotal: totals.subtotal,
      tax_total: totals.tax,
      total: totals.total,
      notes: notes || null,
      conditions: conditions || null,
      valid_until: validUntil || null,
      client_name: clientName || null,
      vehicle_label: vehicleLabel || null,
      customer_id: customerId,
      service_request_id: requestId,
    }
    try {
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

  const saving = createQuote.isPending || updateQuote.isPending

  return (
    <div>
      <button onClick={() => navigate('/pro/quotes')} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Devis
      </button>
      <PageHeader title={editing ? 'Modifier le devis' : 'Nouveau devis'} subtitle="Prérempli, modifiable avant validation." />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Lignes du devis</CardTitle></CardHeader>
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
                <button onClick={() => removeLine(i)} className="col-span-2 flex justify-end text-muted-foreground hover:text-danger sm:col-span-1" aria-label="Supprimer la ligne">
                  <Trash2 className="h-4 w-4" />
                </button>
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

          <Card>
            <CardHeader><CardTitle>Client & véhicule</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Field label="Intitulé" htmlFor="qt"><Input id="qt" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
              <Field label="Client" htmlFor="qc"><Input id="qc" value={clientName} onChange={(e) => setClientName(e.target.value)} /></Field>
              <Field label="Véhicule" htmlFor="qv"><Input id="qv" value={vehicleLabel} onChange={(e) => setVehicleLabel(e.target.value)} /></Field>
              <Field label="Valable jusqu’au" htmlFor="qd"><Input id="qd" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></Field>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-5">
        <CardHeader><CardTitle>Conditions & notes</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Field label="Conditions" htmlFor="qcond"><Textarea id="qcond" value={conditions} onChange={(e) => setConditions(e.target.value)} /></Field>
          <Field label="Notes internes (non imprimées)" htmlFor="qn"><Textarea id="qn" value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        </CardContent>
      </Card>

      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={() => save(false)} loading={saving}>Enregistrer</Button>
        <Button onClick={() => save(true)} loading={saving}>Enregistrer & aperçu PDF</Button>
      </div>
    </div>
  )
}

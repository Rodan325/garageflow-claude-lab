import { useMemo, useState } from 'react'
import { Car, Plus, Search } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Field, Input, Select } from '@/components/ui/input'
import { StatusPill } from '@/components/ui/badge'
import { EmptyState, LoadingState } from '@/components/ui/feedback'
import { PageHeader } from '@/components/common/PageHeader'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/features/auth/AuthProvider'
import { useCreateVehicle, useCustomers, useVehicles } from '@/data/proData'

const VSTATUS: Record<string, { label: string; tone: 'neutral' | 'info' | 'primary' }> = {
  active: { label: 'Actif', tone: 'neutral' },
  in_service: { label: 'À l’atelier', tone: 'primary' },
  archived: { label: 'Archivé', tone: 'neutral' },
}

export function VehiclesPage() {
  const { garage } = useAuth()
  const gid = garage?.id
  const { data: vehicles, isLoading } = useVehicles(gid)
  const { data: customers } = useCustomers(gid)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)

  const custName = (id: string | null) => {
    const c = customers?.find((x) => x.id === id)
    return c ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() : '—'
  }

  const filtered = useMemo(() => {
    const list = vehicles ?? []
    if (!q) return list
    const s = q.toLowerCase()
    return list.filter((v) =>
      [v.brand, v.model, v.registration, v.vin].filter(Boolean).join(' ').toLowerCase().includes(s),
    )
  }, [vehicles, q])

  return (
    <div>
      <PageHeader
        title="Véhicules"
        subtitle="Le parc clients suivi par le garage."
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Ajouter</Button>}
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher marque, modèle, plaque…" className="pl-9" />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Car} title="Aucun véhicule" description="Ajoutez un premier véhicule au parc." action={<Button onClick={() => setOpen(true)}>Ajouter un véhicule</Button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <Card key={v.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{v.brand} {v.model}</p>
                  <p className="text-sm text-muted-foreground">{v.year ?? '—'} · {v.fuel ?? '—'}</p>
                </div>
                <StatusPill {...(VSTATUS[v.status] ?? VSTATUS.active)} />
              </div>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Plaque</dt><dd className="font-medium">{v.registration ?? '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Kilométrage</dt><dd className="font-medium">{v.mileage ? `${v.mileage.toLocaleString('fr-FR')} km` : '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Client</dt><dd className="font-medium">{custName(v.customer_id)}</dd></div>
              </dl>
            </Card>
          ))}
        </div>
      )}

      {open && <NewVehicleModal garageId={gid!} customers={customers ?? []} onClose={() => setOpen(false)} />}
    </div>
  )
}

function NewVehicleModal({
  garageId,
  customers,
  onClose,
}: {
  garageId: string
  customers: { id: string; first_name: string | null; last_name: string | null }[]
  onClose: () => void
}) {
  const create = useCreateVehicle()
  const toast = useToast()
  const [form, setForm] = useState({ brand: '', model: '', year: '', fuel: '', mileage: '', registration: '', customer_id: '' })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function submit() {
    if (!form.brand || !form.model) {
      toast.error('Marque et modèle requis')
      return
    }
    try {
      await create.mutateAsync({
        garage_id: garageId,
        brand: form.brand,
        model: form.model,
        year: form.year ? Number(form.year) : null,
        fuel: form.fuel || null,
        mileage: form.mileage ? Number(form.mileage) : null,
        registration: form.registration || null,
        customer_id: form.customer_id || null,
      })
      toast.success('Véhicule ajouté')
      onClose()
    } catch (e) {
      toast.error('Création impossible', (e as Error).message)
    }
  }

  return (
    <Modal open onClose={onClose} title="Ajouter un véhicule" footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button loading={create.isPending} onClick={submit}>Ajouter</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Marque" htmlFor="br" required><Input id="br" value={form.brand} onChange={(e) => set('brand', e.target.value)} /></Field>
        <Field label="Modèle" htmlFor="mo" required><Input id="mo" value={form.model} onChange={(e) => set('model', e.target.value)} /></Field>
        <Field label="Année" htmlFor="ye"><Input id="ye" type="number" value={form.year} onChange={(e) => set('year', e.target.value)} /></Field>
        <Field label="Carburant" htmlFor="fu"><Input id="fu" value={form.fuel} onChange={(e) => set('fuel', e.target.value)} placeholder="Essence / Diesel" /></Field>
        <Field label="Kilométrage" htmlFor="mi"><Input id="mi" type="number" value={form.mileage} onChange={(e) => set('mileage', e.target.value)} /></Field>
        <Field label="Plaque" htmlFor="re"><Input id="re" value={form.registration} onChange={(e) => set('registration', e.target.value)} /></Field>
        <div className="col-span-2">
          <Field label="Client" htmlFor="cu">
            <Select id="cu" value={form.customer_id} onChange={(e) => set('customer_id', e.target.value)}>
              <option value="">— Aucun —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{`${c.first_name ?? ''} ${c.last_name ?? ''}`.trim()}</option>
              ))}
            </Select>
          </Field>
        </div>
      </div>
    </Modal>
  )
}

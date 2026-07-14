import { useMemo, useState } from 'react'
import { Car, Plus, Search } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Field, Input, Select } from '@/components/ui/input'
import { StatusPill } from '@/components/ui/badge'
import { EmptyState, LoadingState } from '@/components/ui/feedback'
import { VehicleFields } from '@/components/common/VehicleFields'
import { vehicleFieldsError } from '@/data/vehicleCatalog'
import { PageHeader } from '@/components/common/PageHeader'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/features/auth/AuthProvider'
import { useCreateVehicle, useCustomers, useVehicles } from '@/data/proData'
import { LOCALES, useLang } from '@/i18n'

const VSTATUS: Record<string, { label: string; tone: 'neutral' | 'info' | 'primary' }> = {
  active: { label: 'Actif', tone: 'neutral' },
  in_service: { label: 'À l’atelier', tone: 'primary' },
  archived: { label: 'Archivé', tone: 'neutral' },
}

export function VehiclesPage() {
  const { lang, tr } = useLang()
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
        title={tr('Véhicules')}
        subtitle={tr('Le parc clients suivi par le garage.')}
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> {tr('Ajouter')}</Button>}
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr('Rechercher marque, modèle, plaque…')} className="ps-9" />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Car} title={tr('Aucun véhicule')} description={tr('Ajoutez un premier véhicule au parc.')} action={<Button onClick={() => setOpen(true)}>{tr('Ajouter un véhicule')}</Button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <Card key={v.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{v.brand} {v.model}</p>
                  <p className="text-sm text-muted-foreground">{v.year ?? '—'} · {v.fuel ? tr(v.fuel) : '—'}</p>
                </div>
                <StatusPill {...(VSTATUS[v.status] ?? VSTATUS.active)} label={tr((VSTATUS[v.status] ?? VSTATUS.active).label)} />
              </div>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">{tr('Plaque')}</dt><dd className="font-medium force-ltr">{v.registration ?? '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">{tr('Kilométrage')}</dt><dd className="font-medium">{v.mileage ? `${v.mileage.toLocaleString(LOCALES[lang])} km` : '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">{tr('Client')}</dt><dd className="font-medium">{custName(v.customer_id)}</dd></div>
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
  const { tr } = useLang()
  const create = useCreateVehicle()
  const toast = useToast()
  const [form, setForm] = useState({ brand: '', model: '', year: '', fuel: '', mileage: '', registration: '', customer_id: '' })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function submit() {
    const vErr = vehicleFieldsError({ brand: form.brand, model: form.model, year: form.year, fuel: form.fuel })
    if (vErr) {
      toast.error(tr(vErr))
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
      toast.success(tr('Véhicule ajouté'))
      onClose()
    } catch {
      toast.error(tr('Création impossible'), tr('L’enregistrement n’a pas pu être terminé.'))
    }
  }

  return (
    <Modal open onClose={onClose} title={tr('Ajouter un véhicule')} footer={<><Button variant="ghost" onClick={onClose}>{tr('Annuler')}</Button><Button loading={create.isPending} onClick={submit}>{tr('Ajouter')}</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <VehicleFields
          value={{ brand: form.brand, model: form.model, year: form.year, fuel: form.fuel }}
          onChange={(p) => setForm((f) => ({ ...f, ...p }))}
        />
        <Field label={tr('Kilométrage')} htmlFor="mi"><Input id="mi" type="number" value={form.mileage} onChange={(e) => set('mileage', e.target.value)} /></Field>
        <Field label={tr('Plaque')} htmlFor="re"><Input id="re" className="force-ltr" value={form.registration} onChange={(e) => set('registration', e.target.value)} /></Field>
        <div className="col-span-2">
          <Field label={tr('Client')} htmlFor="cu">
            <Select id="cu" value={form.customer_id} onChange={(e) => set('customer_id', e.target.value)}>
              <option value="">— {tr('Aucun')} —</option>
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

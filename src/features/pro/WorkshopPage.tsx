import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Wrench } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { EmptyState, LoadingState } from '@/components/ui/feedback'
import { PageHeader } from '@/components/common/PageHeader'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/features/auth/AuthProvider'
import { useCreateRepair, useRepairs, useUpdateRepairStatus, useVehicles } from '@/data/proData'
import { REPAIR_COLUMNS, REPAIR_STATUS_META, type RepairStatus } from '@/types/domain'

export function WorkshopPage() {
  const { garage } = useAuth()
  const gid = garage?.id
  const { data: repairs, isLoading } = useRepairs(gid)
  const { data: vehicles } = useVehicles(gid)
  const updateStatus = useUpdateRepairStatus()
  const [open, setOpen] = useState(false)

  const vlabel = (id: string | null) => {
    const v = vehicles?.find((x) => x.id === id)
    return v ? `${v.brand} ${v.model}` : null
  }

  function move(id: string, current: RepairStatus, dir: -1 | 1) {
    const idx = REPAIR_COLUMNS.indexOf(current)
    const next = REPAIR_COLUMNS[idx + dir]
    if (next) updateStatus.mutate({ id, status: next, garageId: gid! })
  }

  return (
    <div>
      <PageHeader
        title="Atelier"
        subtitle="Suivi des réparations en cours."
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nouvelle réparation</Button>}
      />

      {isLoading ? (
        <LoadingState />
      ) : (repairs ?? []).length === 0 ? (
        <EmptyState icon={Wrench} title="Atelier vide" description="Aucune réparation en cours pour le moment." action={<Button onClick={() => setOpen(true)}>Créer une réparation</Button>} />
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-3">
          {REPAIR_COLUMNS.map((col) => {
            const meta = REPAIR_STATUS_META[col]
            const items = (repairs ?? []).filter((r) => r.status === col)
            return (
              <div key={col} className="w-64 shrink-0">
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="text-sm font-semibold">{meta.label}</p>
                  <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="space-y-2 rounded-xl bg-muted/40 p-2">
                  {items.map((r) => {
                    const idx = REPAIR_COLUMNS.indexOf(col)
                    return (
                      <Card key={r.id} className="p-3">
                        <p className="text-sm font-medium">{r.title}</p>
                        {vlabel(r.vehicle_id) && <p className="text-xs text-muted-foreground">{vlabel(r.vehicle_id)}</p>}
                        {r.symptom && <p className="mt-1 text-xs text-muted-foreground">{r.symptom}</p>}
                        <div className="mt-2 flex justify-between">
                          <button
                            disabled={idx === 0}
                            onClick={() => move(r.id, col, -1)}
                            className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                            aria-label="Étape précédente"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            disabled={idx === REPAIR_COLUMNS.length - 1}
                            onClick={() => move(r.id, col, 1)}
                            className="rounded p-1 text-primary hover:bg-muted disabled:opacity-30"
                            aria-label="Étape suivante"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </Card>
                    )
                  })}
                  {items.length === 0 && <p className="px-2 py-4 text-center text-xs text-muted-foreground">—</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {open && <NewRepairModal garageId={gid!} vehicles={vehicles ?? []} onClose={() => setOpen(false)} />}
    </div>
  )
}

function NewRepairModal({
  garageId,
  vehicles,
  onClose,
}: {
  garageId: string
  vehicles: { id: string; brand: string; model: string }[]
  onClose: () => void
}) {
  const create = useCreateRepair()
  const toast = useToast()
  const [form, setForm] = useState({ title: '', symptom: '', vehicle_id: '' })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function submit() {
    if (!form.title) {
      toast.error('Intitulé requis')
      return
    }
    try {
      await create.mutateAsync({
        garage_id: garageId,
        title: form.title,
        symptom: form.symptom || null,
        vehicle_id: form.vehicle_id || null,
        status: 'to_diagnose',
      })
      toast.success('Réparation créée')
      onClose()
    } catch (e) {
      toast.error('Création impossible', (e as Error).message)
    }
  }

  return (
    <Modal open onClose={onClose} title="Nouvelle réparation" footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button loading={create.isPending} onClick={submit}>Créer</Button></>}>
      <div className="space-y-3">
        <Field label="Intitulé" htmlFor="rt" required><Input id="rt" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Remplacement plaquettes" /></Field>
        <Field label="Symptôme / demande" htmlFor="rs"><Textarea id="rs" value={form.symptom} onChange={(e) => set('symptom', e.target.value)} /></Field>
        <Field label="Véhicule" htmlFor="rv">
          <Select id="rv" value={form.vehicle_id} onChange={(e) => set('vehicle_id', e.target.value)}>
            <option value="">— Aucun —</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.brand} {v.model}</option>)}
          </Select>
        </Field>
      </div>
    </Modal>
  )
}

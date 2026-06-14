import { useState } from 'react'
import { Car, Plus, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Field, Input } from '@/components/ui/input'
import { EmptyState, LoadingState } from '@/components/ui/feedback'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/features/auth/AuthProvider'
import { useClientVehicles, useDeleteClientVehicle, useUpsertClientVehicle } from '@/data/clientData'

export function ClientVehiclesPage() {
  const { userId } = useAuth()
  const toast = useToast()
  const { data: vehicles, isLoading } = useClientVehicles(userId)
  const del = useDeleteClientVehicle(userId)
  const [open, setOpen] = useState(false)

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Mes véhicules</h1>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Ajouter</Button>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <LoadingState />
        ) : (vehicles ?? []).length === 0 ? (
          <EmptyState icon={Car} title="Aucun véhicule" description="Ajoutez un véhicule pour réserver plus vite." action={<Button onClick={() => setOpen(true)}>Ajouter un véhicule</Button>} />
        ) : (
          <div className="space-y-2">
            {vehicles!.map((v) => (
              <Card key={v.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{v.brand} {v.model}</p>
                  <p className="text-xs text-muted-foreground">{v.year ?? '—'} · {v.fuel ?? '—'} · {v.registration ?? 'sans plaque'}</p>
                </div>
                <button
                  onClick={() => del.mutate(v.id, { onSuccess: () => toast.success('Véhicule supprimé') })}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-danger"
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {open && userId && <AddVehicleModal clientId={userId} onClose={() => setOpen(false)} />}
    </div>
  )
}

function AddVehicleModal({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const add = useUpsertClientVehicle()
  const toast = useToast()
  const [form, setForm] = useState({ brand: '', model: '', year: '', fuel: '', registration: '' })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function submit() {
    if (!form.brand || !form.model) {
      toast.error('Marque et modèle requis')
      return
    }
    try {
      await add.mutateAsync({
        client_id: clientId,
        brand: form.brand,
        model: form.model,
        year: form.year ? Number(form.year) : null,
        fuel: form.fuel || null,
        registration: form.registration || null,
      })
      toast.success('Véhicule ajouté')
      onClose()
    } catch (e) {
      toast.error('Ajout impossible', (e as Error).message)
    }
  }

  return (
    <Modal open onClose={onClose} variant="sheet" title="Ajouter un véhicule" footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button loading={add.isPending} onClick={submit}>Ajouter</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Marque" htmlFor="b" required><Input id="b" value={form.brand} onChange={(e) => set('brand', e.target.value)} /></Field>
        <Field label="Modèle" htmlFor="m" required><Input id="m" value={form.model} onChange={(e) => set('model', e.target.value)} /></Field>
        <Field label="Année" htmlFor="y"><Input id="y" type="number" value={form.year} onChange={(e) => set('year', e.target.value)} /></Field>
        <Field label="Carburant" htmlFor="f"><Input id="f" value={form.fuel} onChange={(e) => set('fuel', e.target.value)} /></Field>
        <div className="col-span-2"><Field label="Plaque" htmlFor="r"><Input id="r" value={form.registration} onChange={(e) => set('registration', e.target.value)} /></Field></div>
      </div>
    </Modal>
  )
}

import { useState } from 'react'
import { Archive, ArchiveRestore, Car, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Field, Input, Textarea } from '@/components/ui/input'
import { EmptyState, LoadingState } from '@/components/ui/feedback'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/features/auth/AuthProvider'
import { useClientVehicles, useUpsertClientVehicle, useUpdateClientVehicle, useDeleteClientVehicle } from '@/data/clientData'
import type { ClientVehicle } from '@/types/domain'

export function ClientVehiclesPage() {
  const { userId } = useAuth()
  const toast = useToast()
  const { data: vehicles, isLoading } = useClientVehicles(userId)
  const update = useUpdateClientVehicle(userId)
  const del = useDeleteClientVehicle(userId)
  const [editing, setEditing] = useState<ClientVehicle | 'new' | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const all = vehicles ?? []
  const active = all.filter((v) => !v.archived)
  const archived = all.filter((v) => v.archived)
  const shown = showArchived ? all : active

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Mes véhicules</h1>
        <Button size="sm" onClick={() => setEditing('new')}><Plus className="h-4 w-4" /> Ajouter</Button>
      </div>

      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
        Vos véhicules sont privés. Vous choisissez celui à partager avec un garage au moment d'une demande.
      </p>

      <div className="mt-4">
        {isLoading ? (
          <LoadingState />
        ) : active.length === 0 && archived.length === 0 ? (
          <EmptyState icon={Car} title="Aucun véhicule" description="Ajoutez un véhicule pour réserver plus vite la prochaine fois." action={<Button onClick={() => setEditing('new')}>Ajouter un véhicule</Button>} />
        ) : (
          <div className="space-y-2">
            {shown.map((v) => (
              <Card key={v.id} className={`flex items-center justify-between gap-3 p-4 ${v.archived ? 'opacity-60' : ''}`}>
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {v.brand} {v.model}
                    {v.archived && <span className="ml-2 text-xs font-normal text-muted-foreground">(archivé)</span>}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[v.year, v.fuel, v.mileage ? `${v.mileage.toLocaleString('fr-FR')} km` : null, v.registration ?? 'sans plaque'].filter(Boolean).join(' · ')}
                  </p>
                  {v.notes && <p className="mt-0.5 truncate text-xs text-muted-foreground">{v.notes}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => setEditing(v)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Modifier"><Pencil className="h-4 w-4" /></button>
                  <button
                    onClick={() => update.mutate({ id: v.id, patch: { archived: !v.archived } }, { onSuccess: () => toast.success(v.archived ? 'Véhicule réactivé' : 'Véhicule archivé') })}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={v.archived ? 'Réactiver' : 'Archiver'}
                  >
                    {v.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => { if (confirm('Supprimer définitivement ce véhicule ?')) del.mutate(v.id, { onSuccess: () => toast.success('Véhicule supprimé') }) }}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-danger"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            ))}

            {archived.length > 0 && (
              <button onClick={() => setShowArchived((s) => !s)} className="text-xs font-medium text-primary hover:underline">
                {showArchived ? 'Masquer les véhicules archivés' : `Voir les véhicules archivés (${archived.length})`}
              </button>
            )}
          </div>
        )}
      </div>

      {editing && userId && (
        <VehicleModal clientId={userId} vehicle={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}

function VehicleModal({ clientId, vehicle, onClose }: { clientId: string; vehicle: ClientVehicle | null; onClose: () => void }) {
  const add = useUpsertClientVehicle()
  const update = useUpdateClientVehicle(clientId)
  const toast = useToast()
  const [form, setForm] = useState({
    brand: vehicle?.brand ?? '', model: vehicle?.model ?? '',
    year: vehicle?.year ? String(vehicle.year) : '', fuel: vehicle?.fuel ?? '',
    mileage: vehicle?.mileage ? String(vehicle.mileage) : '', registration: vehicle?.registration ?? '',
    notes: vehicle?.notes ?? '',
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const isEdit = !!vehicle

  async function submit() {
    if (!form.brand.trim() || !form.model.trim()) {
      toast.error('Marque et modèle requis')
      return
    }
    const payload = {
      brand: form.brand.trim(), model: form.model.trim(),
      year: form.year ? Number(form.year) : null, fuel: form.fuel || null,
      mileage: form.mileage ? Number(form.mileage) : null, registration: form.registration || null,
      notes: form.notes.trim() || null,
    }
    try {
      if (isEdit) await update.mutateAsync({ id: vehicle!.id, patch: payload })
      else await add.mutateAsync({ client_id: clientId, ...payload })
      toast.success(isEdit ? 'Véhicule mis à jour' : 'Véhicule ajouté')
      onClose()
    } catch (e) {
      toast.error('Enregistrement impossible', (e as Error).message)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      variant="sheet"
      title={isEdit ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
      footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button loading={add.isPending || update.isPending} onClick={submit}>{isEdit ? 'Enregistrer' : 'Ajouter'}</Button></>}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Marque" htmlFor="b" required><Input id="b" value={form.brand} onChange={(e) => set('brand', e.target.value)} /></Field>
        <Field label="Modèle" htmlFor="m" required><Input id="m" value={form.model} onChange={(e) => set('model', e.target.value)} /></Field>
        <Field label="Année" htmlFor="y"><Input id="y" type="number" value={form.year} onChange={(e) => set('year', e.target.value)} /></Field>
        <Field label="Carburant" htmlFor="f"><Input id="f" value={form.fuel} onChange={(e) => set('fuel', e.target.value)} placeholder="Essence, Diesel…" /></Field>
        <Field label="Kilométrage" htmlFor="km"><Input id="km" type="number" value={form.mileage} onChange={(e) => set('mileage', e.target.value)} /></Field>
        <Field label="Immatriculation" htmlFor="r"><Input id="r" value={form.registration} onChange={(e) => set('registration', e.target.value)} /></Field>
        <div className="col-span-2"><Field label="Notes (facultatif)" htmlFor="n"><Textarea id="n" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Couleur, particularités…" /></Field></div>
      </div>
    </Modal>
  )
}

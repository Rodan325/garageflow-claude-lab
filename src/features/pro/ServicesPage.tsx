import { useState } from 'react'
import { Eye, EyeOff, Pencil, Plus, Trash2, Wrench } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState, LoadingState } from '@/components/ui/feedback'
import { PageHeader } from '@/components/common/PageHeader'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/features/auth/AuthProvider'
import { useCreateService, useDeleteService, useManageServices, useUpdateService } from '@/data/catalog'
import { euro } from '@/lib/format'
import type { DefaultLine, GarageService } from '@/types/domain'

export function ServicesPage() {
  const { garage, role } = useAuth()
  const gid = garage?.id
  const toast = useToast()
  const canManage = role === 'owner' || role === 'admin' || role === 'advisor' || role === 'front_desk'
  const { data: services, isLoading } = useManageServices(gid)
  const update = useUpdateService()
  const del = useDeleteService()
  const [editing, setEditing] = useState<GarageService | 'new' | null>(null)

  return (
    <div>
      <PageHeader
        title="Prestations"
        subtitle="Votre catalogue : visible côté client et utilisé pour préremplir les devis."
        action={canManage ? <Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" /> Nouvelle prestation</Button> : undefined}
      />

      {isLoading ? (
        <LoadingState />
      ) : (services ?? []).length === 0 ? (
        <EmptyState icon={Wrench} title="Aucune prestation" description="Ajoutez vos prestations pour permettre la réservation en ligne." action={canManage ? <Button onClick={() => setEditing('new')}>Ajouter</Button> : undefined} />
      ) : (
        <div className="space-y-2">
          {services!.map((s) => (
            <Card key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{s.name}</p>
                  {!s.is_active && <Badge tone="neutral">Masquée</Badge>}
                  {s.category && <Badge tone="neutral">{s.category}</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {s.duration_minutes} min · {s.price_type === 'fixed' ? euro(s.price_from) : `dès ${euro(s.price_from)}`}
                  {(s.default_lines as unknown as DefaultLine[])?.length ? ` · ${(s.default_lines as unknown as DefaultLine[]).length} ligne(s) devis` : ''}
                </p>
              </div>
              {canManage && (
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: s.id, garageId: gid!, patch: { is_active: !s.is_active } })} aria-label="Visibilité">
                    {s.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(s)}><Pencil className="h-4 w-4" /> Modifier</Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => del.mutate({ id: s.id, garageId: gid! }, { onSuccess: () => toast.success('Prestation supprimée') })}
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {editing && gid && <ServiceModal garageId={gid} service={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function ServiceModal({ garageId, service, onClose }: { garageId: string; service: GarageService | null; onClose: () => void }) {
  const create = useCreateService()
  const update = useUpdateService()
  const toast = useToast()
  const [form, setForm] = useState({
    name: service?.name ?? '',
    category: service?.category ?? '',
    description: service?.description ?? '',
    duration_minutes: String(service?.duration_minutes ?? 60),
    price_from: service?.price_from != null ? String(service.price_from) : '',
    price_type: (service?.price_type as 'from' | 'fixed') ?? 'from',
    tax_rate: String(service?.tax_rate ?? 20),
    labor_hours: service?.labor_hours != null ? String(service.labor_hours) : '',
    is_active: service?.is_active ?? true,
  })
  const [lines, setLines] = useState<DefaultLine[]>(
    ((service?.default_lines as unknown as DefaultLine[]) ?? []).map((l) => ({ ...l })),
  )
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

  async function submit() {
    if (!form.name.trim()) {
      toast.error('Nom requis')
      return
    }
    const payload = {
      garage_id: garageId,
      name: form.name,
      category: form.category || null,
      description: form.description || null,
      duration_minutes: Number(form.duration_minutes) || 60,
      price_from: form.price_from ? Number(form.price_from) : null,
      price_type: form.price_type,
      tax_rate: Number(form.tax_rate) || 20,
      labor_hours: form.labor_hours ? Number(form.labor_hours) : null,
      is_active: form.is_active,
      default_lines: lines as unknown as never,
    }
    try {
      if (service) await update.mutateAsync({ id: service.id, garageId, patch: payload })
      else await create.mutateAsync(payload)
      toast.success(service ? 'Prestation mise à jour' : 'Prestation créée')
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
      title={service ? 'Modifier la prestation' : 'Nouvelle prestation'}
      footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button loading={create.isPending || update.isPending} onClick={submit}>Enregistrer</Button></>}
    >
      <div className="space-y-3">
        <Field label="Nom" htmlFor="sn" required><Input id="sn" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Vidange 5W30" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Catégorie" htmlFor="sc"><Input id="sc" value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="Entretien" /></Field>
          <Field label="Durée (min)" htmlFor="sd"><Input id="sd" type="number" value={form.duration_minutes} onChange={(e) => set('duration_minutes', e.target.value)} /></Field>
        </div>
        <Field label="Description courte" htmlFor="sdesc"><Textarea id="sdesc" value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Prix (€)" htmlFor="sp"><Input id="sp" type="number" value={form.price_from} onChange={(e) => set('price_from', e.target.value)} /></Field>
          <Field label="Type" htmlFor="spt">
            <Select id="spt" value={form.price_type} onChange={(e) => set('price_type', e.target.value)}>
              <option value="from">À partir de</option>
              <option value="fixed">Prix fixe</option>
            </Select>
          </Field>
          <Field label="TVA (%)" htmlFor="stx"><Input id="stx" type="number" value={form.tax_rate} onChange={(e) => set('tax_rate', e.target.value)} /></Field>
        </div>
        <Field label="Main-d’œuvre estimée (h)" htmlFor="slh"><Input id="slh" type="number" value={form.labor_hours} onChange={(e) => set('labor_hours', e.target.value)} /></Field>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 rounded border-input" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
          Visible côté client (réservable)
        </label>

        {/* Default quote lines */}
        <div className="rounded-lg border border-border p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Lignes de devis par défaut</p>
            <Button size="sm" variant="ghost" onClick={() => setLines((l) => [...l, { label: '', quantity: 1, unit_price: 0, tax_rate: Number(form.tax_rate) || 20 }])}>
              <Plus className="h-4 w-4" /> Ligne
            </Button>
          </div>
          {lines.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucune ligne — un devis partira d’une ligne unique reprenant la prestation.</p>
          ) : (
            <div className="space-y-2">
              {lines.map((l, i) => (
                <div key={i} className="grid grid-cols-12 items-center gap-1.5">
                  <Input className="col-span-6" placeholder="Désignation" value={l.label} onChange={(e) => setLines((cur) => cur.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))} />
                  <Input className="col-span-2 text-right" type="number" value={l.quantity} onChange={(e) => setLines((cur) => cur.map((x, idx) => (idx === i ? { ...x, quantity: Number(e.target.value) } : x)))} />
                  <Input className="col-span-3 text-right" type="number" value={l.unit_price} onChange={(e) => setLines((cur) => cur.map((x, idx) => (idx === i ? { ...x, unit_price: Number(e.target.value) } : x)))} />
                  <button className="col-span-1 flex justify-end text-muted-foreground hover:text-danger" onClick={() => setLines((cur) => cur.filter((_, idx) => idx !== i))} aria-label="Retirer"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

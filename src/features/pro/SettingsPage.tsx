import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Database, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/common/PageHeader'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/features/auth/AuthProvider'
import { useGarageHours, useGarageServices } from '@/data/garagePublic'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { env } from '@/lib/env'
import { euro, shortTime } from '@/lib/format'
import { ROLE_LABEL, WEEKDAY_LABEL, type GarageRole } from '@/types/domain'

export function SettingsPage() {
  const { garage, profile, role, email, refresh } = useAuth()
  const gid = garage?.id
  const qc = useQueryClient()
  const toast = useToast()
  const canManage = role === 'owner' || role === 'admin'

  const [form, setForm] = useState({ name: '', phone: '', email: '', city: '', description: '' })
  useEffect(() => {
    if (garage) setForm({
      name: garage.name ?? '',
      phone: garage.phone ?? '',
      email: garage.email ?? '',
      city: garage.city ?? '',
      description: garage.description ?? '',
    })
  }, [garage])

  const saveGarage = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('garages').update(form).eq('id', gid!)
      if (error) throw error
    },
    onSuccess: async () => {
      await refresh()
      toast.success('Informations mises à jour')
    },
    onError: (e) => toast.error('Mise à jour impossible', (e as Error).message),
  })

  const { data: services } = useGarageServices(gid)
  const { data: hours } = useGarageHours(gid)
  const [serviceModal, setServiceModal] = useState(false)

  const toggleService = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('garage_services').update({ is_active }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services', gid] }),
  })

  return (
    <div className="space-y-5">
      <PageHeader title="Paramètres" subtitle="Garage, prestations et état du backend." />

      {/* Garage info */}
      <Card>
        <CardHeader><CardTitle>Informations du garage</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nom" htmlFor="gn"><Input id="gn" value={form.name} disabled={!canManage} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Ville" htmlFor="gc"><Input id="gc" value={form.city} disabled={!canManage} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
            <Field label="Téléphone" htmlFor="gp"><Input id="gp" value={form.phone} disabled={!canManage} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Email" htmlFor="ge"><Input id="ge" value={form.email} disabled={!canManage} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          </div>
          <Field label="Description (visible côté client)" htmlFor="gd"><Textarea id="gd" value={form.description} disabled={!canManage} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          {canManage && (
            <div className="flex justify-end">
              <Button loading={saveGarage.isPending} onClick={() => saveGarage.mutate()}>Enregistrer</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Prestations</CardTitle>
          {canManage && <Button size="sm" variant="outline" onClick={() => setServiceModal(true)}><Plus className="h-4 w-4" /> Ajouter</Button>}
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {(services ?? []).map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-muted-foreground">{s.duration_minutes} min · à partir de {euro(s.price_from)}</p>
                </div>
                {canManage && (
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input type="checkbox" className="h-4 w-4 rounded border-input" checked={s.is_active} onChange={(e) => toggleService.mutate({ id: s.id, is_active: e.target.checked })} />
                    Active
                  </label>
                )}
              </li>
            ))}
            {(services ?? []).length === 0 && <li className="py-4 text-sm text-muted-foreground">Aucune prestation.</li>}
          </ul>
        </CardContent>
      </Card>

      {/* Hours */}
      <Card>
        <CardHeader><CardTitle>Horaires d’ouverture</CardTitle></CardHeader>
        <CardContent>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {[1, 2, 3, 4, 5, 6, 0].map((wd) => {
              const h = hours?.find((x) => x.weekday === wd)
              return (
                <li key={wd} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{WEEKDAY_LABEL[wd]}</span>
                  <span className="font-medium">
                    {!h || h.is_closed ? 'Fermé' : `${shortTime(h.open_time)} – ${shortTime(h.close_time)}`}
                  </span>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      {/* Backend status */}
      <Card>
        <CardHeader><CardTitle>État du backend</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground"><Database className="h-4 w-4" /> Supabase</span>
            <Badge tone={isSupabaseConfigured ? 'success' : 'warning'}>{isSupabaseConfigured ? 'Connecté' : 'Non configuré'}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Projet</span>
            <span className="font-mono text-xs">{env.supabaseUrl.replace('https://', '').replace('.supabase.co', '') || '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Isolation</span>
            <span className="font-medium">RLS par garage_id activée</span>
          </div>
          <p className="pt-1 text-xs text-muted-foreground">
            La clé utilisée côté navigateur est la clé publique (anon) — jamais la clé service_role.
          </p>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader><CardTitle>Mon compte</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Nom</span><span className="font-medium">{profile?.full_name ?? '—'}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{email}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Rôle</span><span className="font-medium">{role ? ROLE_LABEL[role as GarageRole] : '—'}</span></div>
        </CardContent>
      </Card>

      {serviceModal && gid && <NewServiceModal garageId={gid} onClose={() => setServiceModal(false)} />}
    </div>
  )
}

function NewServiceModal({ garageId, onClose }: { garageId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const toast = useToast()
  const [form, setForm] = useState({ name: '', duration: '60', price: '', category: '' })

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('garage_services').insert({
        garage_id: garageId,
        name: form.name,
        category: form.category || null,
        duration_minutes: Number(form.duration) || 60,
        price_from: form.price ? Number(form.price) : null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services', garageId] })
      toast.success('Prestation ajoutée')
      onClose()
    },
    onError: (e) => toast.error('Création impossible', (e as Error).message),
  })

  return (
    <Modal open onClose={onClose} title="Nouvelle prestation" footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button loading={create.isPending} onClick={() => (form.name ? create.mutate() : toast.error('Nom requis'))}>Ajouter</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Nom" htmlFor="sn" required><Input id="sn" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field></div>
        <Field label="Durée (min)" htmlFor="sd"><Input id="sd" type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></Field>
        <Field label="Prix à partir de (€)" htmlFor="sp"><Input id="sp" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
        <div className="col-span-2"><Field label="Catégorie" htmlFor="sc"><Input id="sc" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Entretien, Freinage…" /></Field></div>
      </div>
    </Modal>
  )
}

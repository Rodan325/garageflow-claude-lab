import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Database, ImagePlus, Wrench } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/PageHeader'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/features/auth/AuthProvider'
import { useGarageHours } from '@/data/garagePublic'
import { useUpdateGarage, useUploadLogo } from '@/data/catalog'
import { isSupabaseConfigured } from '@/lib/supabase'
import { env } from '@/lib/env'
import { shortTime } from '@/lib/format'
import type { GarageRole } from '@/types/domain'
import { roleLabel, weekdayLabel } from '@/i18n/domainLabels'
import { useLang } from '@/i18n'

export function SettingsPage() {
  const { lang, tr } = useLang()
  const { garage, profile, role, email, demo, refresh } = useAuth()
  const gid = garage?.id
  const navigate = useNavigate()
  const toast = useToast()
  const canManage = role === 'owner' || role === 'admin'
  const updateGarage = useUpdateGarage()
  const uploadLogo = useUploadLogo()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({ name: '', phone: '', email: '', city: '', address: '', description: '', accent_color: '#0f766e', legal_info: '', maps_url: '' })
  useEffect(() => {
    if (garage) setForm({
      name: garage.name ?? '', phone: garage.phone ?? '', email: garage.email ?? '', city: garage.city ?? '',
      address: garage.address ?? '', description: garage.description ?? '',
      accent_color: garage.accent_color || '#0f766e', legal_info: garage.legal_info ?? '', maps_url: garage.maps_url ?? '',
    })
  }, [garage])
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function saveGarage() {
    if (!gid) return
    try {
      await updateGarage.mutateAsync({ id: gid, patch: form })
      await refresh()
      toast.success(tr('Informations mises à jour'))
    } catch {
      toast.error(tr('Mise à jour impossible'), tr('L’enregistrement n’a pas pu être terminé.'))
    }
  }

  async function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !gid) return
    try {
      const url = await uploadLogo.mutateAsync({ garageId: gid, file })
      await updateGarage.mutateAsync({ id: gid, patch: { logo_url: url } })
      await refresh()
      toast.success(tr('Logo mis à jour'))
    } catch {
      toast.error(tr('Téléversement impossible'), tr('Le fichier n’a pas pu être envoyé.'))
    }
  }

  const { data: hours } = useGarageHours(gid)

  return (
    <div className="space-y-5">
      <PageHeader title={tr('Paramètres')} subtitle={tr('Identité du garage, page client et état du backend.')} />

      {/* Identity & branding */}
      <Card>
        <CardHeader><CardTitle>{tr('Identité du garage')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
              {garage?.logo_url ? <img src={garage.logo_url} alt="" className="h-full w-full object-contain" /> : <ImagePlus className="h-6 w-6 text-muted-foreground" />}
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onLogo} />
              <Button size="sm" variant="outline" disabled={!canManage || !!demo} loading={uploadLogo.isPending} onClick={() => fileRef.current?.click()}>
                <ImagePlus className="h-4 w-4" /> {tr(garage?.logo_url ? 'Changer le logo' : 'Importer un logo')}
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">
                {tr(demo ? 'Indisponible en mode démo (nécessite Supabase).' : 'PNG ou SVG. Affiché sur la page client et les devis.')}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={tr('Nom commercial')} htmlFor="gn"><Input id="gn" value={form.name} disabled={!canManage} onChange={(e) => set('name', e.target.value)} /></Field>
            <Field label={tr('Ville')} htmlFor="gc"><Input id="gc" value={form.city} disabled={!canManage} onChange={(e) => set('city', e.target.value)} /></Field>
            <Field label={tr('Adresse')} htmlFor="ga"><Input id="ga" value={form.address} disabled={!canManage} onChange={(e) => set('address', e.target.value)} /></Field>
            <Field label={tr('Téléphone')} htmlFor="gp"><Input id="gp" type="tel" value={form.phone} disabled={!canManage} onChange={(e) => set('phone', e.target.value)} /></Field>
            <Field label={tr('Email')} htmlFor="ge"><Input id="ge" type="email" value={form.email} disabled={!canManage} onChange={(e) => set('email', e.target.value)} /></Field>
            <Field label={tr('Lien Google Maps')} htmlFor="gm"><Input id="gm" type="url" value={form.maps_url} disabled={!canManage} onChange={(e) => set('maps_url', e.target.value)} placeholder="https://maps.google.com/…" /></Field>
          </div>
          <Field label={tr('Description (page client)')} htmlFor="gd"><Textarea id="gd" value={form.description} disabled={!canManage} onChange={(e) => set('description', e.target.value)} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={tr('Couleur d’accent (devis)')} htmlFor="gac">
              <input id="gac" type="color" disabled={!canManage} value={form.accent_color} onChange={(e) => set('accent_color', e.target.value)} className="h-10 w-full cursor-pointer rounded-lg border border-input bg-card p-1" />
            </Field>
            <Field label={tr('Mentions légales (devis)')} htmlFor="gl"><Input id="gl" value={form.legal_info} disabled={!canManage} onChange={(e) => set('legal_info', e.target.value)} placeholder={tr('Forme juridique · SIRET · TVA…')} /></Field>
          </div>
          {canManage && (
            <div className="flex justify-end"><Button loading={updateGarage.isPending} onClick={saveGarage}>{tr('Enregistrer')}</Button></div>
          )}
        </CardContent>
      </Card>

      {/* Prestations pointer */}
      <Card>
        <CardContent className="flex items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground"><Wrench className="h-5 w-5" /></span>
            <div>
              <p className="font-medium">{tr('Prestations & catalogue')}</p>
              <p className="text-sm text-muted-foreground">{tr('Gérez vos prestations et les lignes de devis par défaut.')}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/pro/services')}>{tr('Ouvrir')}</Button>
        </CardContent>
      </Card>

      {/* Hours */}
      <Card>
        <CardHeader><CardTitle>{tr('Horaires d’ouverture')}</CardTitle></CardHeader>
        <CardContent>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {[1, 2, 3, 4, 5, 6, 0].map((wd) => {
              const h = hours?.find((x) => x.weekday === wd)
              return (
                <li key={wd} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{weekdayLabel(wd, lang)}</span>
                  <span className="font-medium">{!h || h.is_closed ? tr('Fermé') : `${shortTime(h.open_time)} – ${shortTime(h.close_time)}`}</span>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      {/* Backend status */}
      <Card>
        <CardHeader><CardTitle>{tr('État du backend')}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground"><Database className="h-4 w-4" /> Supabase</span>
            <Badge tone={demo ? 'warning' : isSupabaseConfigured ? 'success' : 'warning'}>{tr(demo ? 'Mode démo' : isSupabaseConfigured ? 'Connecté' : 'Non configuré')}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{tr('Projet')}</span>
            <span className="font-mono text-xs">{env.supabaseUrl.replace('https://', '').replace('.supabase.co', '') || '—'}</span>
          </div>
          <div className="flex items-center justify-between"><span className="text-muted-foreground">{tr('Isolation')}</span><span className="font-medium">RLS par garage_id</span></div>
          <p className="pt-1 text-xs text-muted-foreground">{tr('Clé publique (anon) uniquement côté navigateur — jamais la clé service_role.')}</p>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader><CardTitle>{tr('Mon compte')}</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">{tr('Nom')}</span><span className="font-medium">{profile?.full_name ?? '—'}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{tr('Email')}</span><span className="font-medium force-ltr">{email}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{tr('Rôle')}</span><span className="font-medium">{role ? roleLabel(role as GarageRole, lang) : '—'}</span></div>
        </CardContent>
      </Card>
    </div>
  )
}

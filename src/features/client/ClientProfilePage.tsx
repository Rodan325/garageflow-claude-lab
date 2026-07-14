import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Car, LogOut, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/features/auth/AuthProvider'
import { useGarages } from '@/data/garagePublic'
import { useClientProfile, useUpdateClientProfile, useUpdateProfile } from '@/data/clientData'
import { useSelectedGarage } from './useSelectedGarage'
import { useLang } from '@/i18n'

export function ClientProfilePage() {
  const { tr } = useLang()
  const { userId, profile, email, signOut, refresh } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const { data: garages } = useGarages()
  const { data: clientProfile } = useClientProfile(userId)
  const { select } = useSelectedGarage()
  const updateProfile = useUpdateProfile()
  const updateClient = useUpdateClientProfile()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  useEffect(() => {
    setFullName(profile?.full_name ?? '')
    setPhone(profile?.phone ?? '')
  }, [profile])

  async function saveContact() {
    if (!userId) return
    await updateProfile.mutateAsync({ id: userId, full_name: fullName, phone })
    await refresh()
    toast.success(tr('Profil mis à jour'))
  }

  async function changeGarage(id: string) {
    if (!userId) return
    await updateClient.mutateAsync({ id: userId, default_garage_id: id || null })
    if (id) select(id)
    toast.success(tr('Garage favori mis à jour'))
  }

  async function toggleConsent(v: boolean) {
    if (!userId) return
    await updateClient.mutateAsync({ id: userId, marketing_consent: v })
    toast.success(tr(v ? 'Communications activées' : 'Communications désactivées'))
  }

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold">{tr('Mon profil')}</h1>

      <Card>
        <CardHeader><CardTitle>{tr('Coordonnées')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Field label={tr('Nom complet')} htmlFor="fn"><Input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
          <Field label={tr('Téléphone')} htmlFor="ph"><Input id="ph" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          <Field label={tr('Email')} htmlFor="em" hint={tr('L’email de connexion ne peut pas être modifié ici.')}><Input id="em" type="email" value={email ?? ''} disabled /></Field>
          <Button className="w-full" loading={updateProfile.isPending} onClick={saveContact}>{tr('Enregistrer')}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{tr('Garage favori')}</CardTitle></CardHeader>
        <CardContent>
          <Select value={clientProfile?.default_garage_id ?? ''} onChange={(e) => changeGarage(e.target.value)}>
            <option value="">— {tr('Aucun')} —</option>
            {(garages ?? []).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{tr('Confidentialité')}</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-input"
              checked={clientProfile?.marketing_consent ?? false}
              onChange={(e) => toggleConsent(e.target.checked)}
            />
            <span className="text-muted-foreground">
              {tr('J’accepte de recevoir des communications du garage (offres, rappels d’entretien).')}
            </span>
          </label>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            {tr('Vos données ne sont visibles que par le garage que vous contactez.')}
          </p>
        </CardContent>
      </Card>

      <Link to="/app/vehicles">
        <Card className="flex items-center justify-between p-4">
          <span className="flex items-center gap-2 font-medium"><Car className="h-4 w-4" /> {tr('Mes véhicules')}</span>
          <span className="text-muted-foreground rtl:rotate-180">›</span>
        </Card>
      </Link>

      <Button
        variant="outline"
        className="w-full"
        onClick={async () => {
          await signOut()
          navigate('/app')
        }}
      >
        <LogOut className="h-4 w-4" /> {tr('Se déconnecter')}
      </Button>
    </div>
  )
}

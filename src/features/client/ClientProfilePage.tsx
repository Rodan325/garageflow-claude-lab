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

export function ClientProfilePage() {
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
    toast.success('Profil mis à jour')
  }

  async function changeGarage(id: string) {
    if (!userId) return
    await updateClient.mutateAsync({ id: userId, default_garage_id: id || null })
    if (id) select(id)
    toast.success('Garage favori mis à jour')
  }

  async function toggleConsent(v: boolean) {
    if (!userId) return
    await updateClient.mutateAsync({ id: userId, marketing_consent: v })
    toast.success(v ? 'Communications activées' : 'Communications désactivées')
  }

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold">Mon profil</h1>

      <Card>
        <CardHeader><CardTitle>Coordonnées</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Field label="Nom complet" htmlFor="fn"><Input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
          <Field label="Téléphone" htmlFor="ph"><Input id="ph" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          <Field label="Email" htmlFor="em" hint="L’email de connexion ne peut pas être modifié ici."><Input id="em" value={email ?? ''} disabled /></Field>
          <Button className="w-full" loading={updateProfile.isPending} onClick={saveContact}>Enregistrer</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Garage favori</CardTitle></CardHeader>
        <CardContent>
          <Select value={clientProfile?.default_garage_id ?? ''} onChange={(e) => changeGarage(e.target.value)}>
            <option value="">— Aucun —</option>
            {(garages ?? []).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Confidentialité</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-input"
              checked={clientProfile?.marketing_consent ?? false}
              onChange={(e) => toggleConsent(e.target.checked)}
            />
            <span className="text-muted-foreground">
              J’accepte de recevoir des communications du garage (offres, rappels d’entretien).
            </span>
          </label>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            Vos données ne sont visibles que par le garage que vous contactez.
          </p>
        </CardContent>
      </Card>

      <Link to="/app/vehicles">
        <Card className="flex items-center justify-between p-4">
          <span className="flex items-center gap-2 font-medium"><Car className="h-4 w-4" /> Mes véhicules</span>
          <span className="text-muted-foreground">›</span>
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
        <LogOut className="h-4 w-4" /> Se déconnecter
      </Button>
    </div>
  )
}

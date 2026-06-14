import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const included = [
  'Espace Pro complet (réservations, agenda, atelier, clients, véhicules, devis)',
  'Application client mobile-first installable (PWA)',
  'Base Supabase dédiée, isolée par garage (RLS)',
  'Comptes équipe avec rôles (gérant, conseiller, mécanicien, réception)',
  'Accompagnement à la prise en main',
  'Export des données du garage à tout moment',
]

const steps = [
  { week: 'Semaine 1', title: 'Mise en place', text: 'Création du garage, des services et des comptes équipe. Import des premiers clients/véhicules.' },
  { week: 'Semaine 2', title: 'Réservations en réel', text: 'Activation de l’app client. Premières demandes traitées dans l’inbox.' },
  { week: 'Semaines 3-4', title: 'Routine atelier', text: 'Agenda + kanban atelier au quotidien. Mesure du temps gagné.' },
]

export function PilotPage() {
  return (
    <div className="container max-w-5xl py-14">
      <div className="text-center">
        <Badge tone="primary">Programme pilote · 4 semaines</Badge>
        <h1 className="mt-4 text-3xl font-black sm:text-4xl">Testez GarageFlow dans votre garage</h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Un cadre simple pour valider la valeur sur le terrain : moins d’appels, des réservations centralisées,
          un atelier lisible. Sans engagement long.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Ce qui est inclus</CardTitle></CardHeader>
          <CardContent>
            <ul className="grid gap-3 sm:grid-cols-2">
              {included.map((i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  {i}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between bg-gradient-to-br from-primary/10 to-accent">
          <CardHeader>
            <CardTitle>Pilote découverte</CardTitle>
            <p className="text-sm text-muted-foreground">Pour un garage indépendant</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-3xl font-black">0 €</span>
              <span className="text-sm text-muted-foreground"> / pendant le pilote</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Tarif d’abonnement défini ensemble à l’issue des 4 semaines, selon l’usage réel.
            </p>
            <Link to="/login" className="block"><Button className="w-full">Démarrer la démo</Button></Link>
          </CardContent>
        </Card>
      </div>

      <h2 className="mt-14 text-center text-2xl font-bold">Déroulé du pilote</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {steps.map((s) => (
          <Card key={s.week} className="p-6">
            <Badge tone="info">{s.week}</Badge>
            <h3 className="mt-3 font-semibold">{s.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{s.text}</p>
          </Card>
        ))}
      </div>

      <div className="mt-12 flex flex-col items-center gap-3 text-center">
        <p className="text-muted-foreground">Une question avant de vous lancer ?</p>
        <Link to="/"><Button variant="outline">Revenir à l’accueil</Button></Link>
      </div>
    </div>
  )
}

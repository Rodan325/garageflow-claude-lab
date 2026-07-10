import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useBrand } from '@/branding'

const included = [
  'Réservation en ligne pour vos clients',
  'Inbox des demandes + confirmation en un clic',
  'Agenda et fiches clients / véhicules',
  'Comptes pour votre équipe',
  'Modules atelier disponibles si besoin',
  'Vos données exportables à tout moment',
]

const steps = [
  { n: '1', title: 'Audit gratuit', text: 'On regarde ensemble votre façon de prendre les rendez-vous aujourd’hui.' },
  { n: '2', title: 'Setup personnalisé', text: 'On configure votre garage, vos prestations, vos horaires et votre équipe.' },
  { n: '3', title: 'Pilote 7 à 14 jours', text: 'Vos clients réservent en ligne, vous traitez les demandes au quotidien.' },
  { n: '4', title: 'Formation rapide', text: 'Une prise en main courte, pensée pour un garage non technique.' },
]

export function PilotPage() {
  const { brand } = useBrand()
  return (
    <div className="container max-w-5xl py-16">
      <div className="text-center">
        <Badge tone="primary">Programme pilote</Badge>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Testez {brand.appName} dans votre garage</h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Un cadre simple pour valider sur le terrain : moins d’appels, des réservations centralisées, un agenda clair.
          Sans engagement.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Ce qui est inclus</CardTitle></CardHeader>
          <CardContent>
            <ul className="grid gap-3 sm:grid-cols-2">
              {included.map((i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {i}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Pilote découverte</CardTitle>
            <p className="text-sm text-muted-foreground">Pour un garage indépendant</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-3xl font-bold">Audit gratuit</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Prix pilote réduit pendant l’essai, puis abonnement défini ensemble selon votre usage réel.
            </p>
            <Link to="/login" className="block"><Button className="w-full">Démarrer la démo</Button></Link>
          </CardContent>
        </Card>
      </div>

      <h2 className="mt-14 text-center text-2xl font-bold">Comment ça se passe</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <Card key={s.n} className="p-6">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{s.n}</span>
            <h3 className="mt-3 font-semibold">{s.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{s.text}</p>
          </Card>
        ))}
      </div>

      <div className="mt-12 flex flex-col items-center gap-3 text-center">
        <p className="text-muted-foreground">Puis un abonnement simple, adapté à votre garage.</p>
        <Link to="/"><Button variant="outline">Revenir à l’accueil</Button></Link>
      </div>
    </div>
  )
}

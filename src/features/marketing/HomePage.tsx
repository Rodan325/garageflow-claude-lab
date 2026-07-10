import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CalendarCheck, CheckCircle2, Inbox, PhoneOff, ShieldCheck, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useBrand } from '@/branding'
import { fadeSlideUp, listItem, listStagger } from '@/lib/motion'

const problems = [
  'Les rendez-vous se prennent au téléphone, entre deux réparations.',
  'Les demandes se perdent entre SMS, appels et post-it.',
  'Aucune vue claire sur l’atelier, les véhicules et les relances.',
]

const benefits = [
  { icon: PhoneOff, title: 'Moins d’appels', text: 'Vos clients réservent en ligne. Vous reprenez la main sur le téléphone.' },
  { icon: Inbox, title: 'Demandes centralisées', text: 'Toutes les demandes arrivent au même endroit, prêtes à traiter.' },
  { icon: CalendarCheck, title: 'Agenda propre', text: 'Une demande confirmée devient un rendez-vous, sans double saisie.' },
  { icon: Users, title: 'Suivi client', text: 'Le client voit l’état de sa demande : acceptée, à confirmer, refusée.' },
  { icon: CheckCircle2, title: 'Simple à prendre en main', text: 'Pensé pour un garage, pas pour un informaticien. Opérationnel en quelques minutes.' },
  { icon: ShieldCheck, title: 'Vos données protégées', text: 'Chaque garage est isolé. Données client réduites au nécessaire.' },
]

export function HomePage() {
  const { brand } = useBrand()
  return (
    <div>
      {/* Hero */}
      <section className="container grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
        <motion.div variants={fadeSlideUp} initial="hidden" animate="show">
          <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            Réservation en ligne pour garages indépendants
          </span>
          <h1 className="text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl">
            Recevez vos demandes de rendez-vous en ligne et gérez-les en quelques clics.
          </h1>
          <p className="mt-4 max-w-lg text-lg text-muted-foreground">
            {brand.appName} réunit l’espace garage et l’application client. Moins d’appels, des demandes centralisées,
            un agenda propre.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/login"><Button size="lg">Espace garage <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link to="/app"><Button size="lg" variant="outline">Voir l’app client</Button></Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Tester sans compte : « Démo garage » ou « Démo client » sur la page de connexion.
          </p>
        </motion.div>

        {/* Sober product preview */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <Card className="overflow-hidden p-0 shadow-elevated">
            <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="ml-2 text-xs text-muted-foreground">Réservations reçues</span>
            </div>
            <div className="space-y-2.5 p-4">
              {[
                { n: 'Julie Durand', s: 'Plaquettes de frein', l: 'En attente', c: 'bg-warning/20 text-warning-foreground' },
                { n: 'Marc Petit', s: 'Révision constructeur', l: 'Confirmée', c: 'bg-success/15 text-success' },
                { n: 'Inès Lefort', s: 'Diagnostic', l: 'Autre créneau', c: 'bg-primary/10 text-primary' },
              ].map((r) => (
                <div key={r.n} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-semibold">{r.n}</p>
                    <p className="text-xs text-muted-foreground">{r.s}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${r.c}`}>{r.l}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Problèmes */}
      <section id="problemes" className="container scroll-mt-20 py-14">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">Ce qui ralentit un garage aujourd’hui</h2>
        <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
          {problems.map((p) => (
            <Card key={p} className="p-5 text-sm text-muted-foreground">{p}</Card>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section id="solution" className="scroll-mt-20 border-t border-border bg-muted/20">
        <div className="container py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Ce que ça change au quotidien</h2>
            <p className="mt-3 text-muted-foreground">Des workflows réels, simples, immédiatement utiles.</p>
          </div>
          <motion.div
            variants={listStagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {benefits.map(({ icon: Icon, title, text }) => (
              <motion.div key={title} variants={listItem}>
                <Card className="h-full p-6">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Parcours */}
      <section id="parcours" className="container scroll-mt-20 py-16">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Côté client</p>
            <h3 className="mt-1 text-lg font-bold">Réserver en 1 minute</h3>
            <ol className="mt-4 space-y-3 text-sm">
              {['Choisir le garage', 'Choisir une prestation', 'Renseigner le véhicule', 'Choisir un créneau', 'Envoyer et suivre la demande'].map((s, i) => (
                <li key={s} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </Card>
          <Card className="p-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Côté garage</p>
            <h3 className="mt-1 text-lg font-bold">Traiter en quelques clics</h3>
            <ol className="mt-4 space-y-3 text-sm">
              {['Recevoir la demande', 'Confirmer, refuser ou proposer un créneau', 'Le rendez-vous se crée tout seul', 'Suivre l’agenda et les clients', 'Garder un historique clair'].map((s, i) => (
                <li key={s} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-muted/20">
        <div className="container flex flex-col items-center gap-4 py-16 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Lancez un pilote dans votre garage</h2>
          <p className="max-w-xl text-muted-foreground">
            Installation rapide, formation courte, sans engagement. Vous gardez le contrôle.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/pilote"><Button size="lg">Découvrir l’offre pilote</Button></Link>
            <Link to="/login"><Button size="lg" variant="outline">Ouvrir l’espace garage</Button></Link>
          </div>
        </div>
      </section>
    </div>
  )
}

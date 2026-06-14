import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Inbox,
  ShieldCheck,
  Smartphone,
  Wrench,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { fadeSlideUp, listItem, listStagger } from '@/lib/motion'

const problems = [
  'Les rendez-vous se prennent par téléphone, entre deux réparations.',
  'Les demandes clients se perdent entre SMS, appels et post-it.',
  'Aucune vue claire sur l’atelier, les véhicules et les relances.',
]

const modules = [
  { icon: Inbox, title: 'Inbox réservations', text: 'Chaque demande client arrive au même endroit. Acceptez, refusez ou proposez un autre créneau en un clic.' },
  { icon: CalendarCheck, title: 'Agenda atelier', text: 'Les demandes confirmées deviennent des rendez-vous planifiés, sans double saisie.' },
  { icon: Wrench, title: 'Atelier en kanban', text: 'Suivez chaque réparation : à diagnostiquer, en cours, en attente de pièces, prêt.' },
  { icon: Smartphone, title: 'App client mobile', text: 'Vos clients réservent en 1 minute depuis leur téléphone et suivent l’avancement.' },
  { icon: ShieldCheck, title: 'Données isolées', text: 'Chaque garage est cloisonné par RLS PostgreSQL. Aucune fuite entre garages.' },
  { icon: CheckCircle2, title: 'Clients & véhicules', text: 'Un CRM simple, pensé pour un garage qui n’est pas à l’aise avec l’informatique.' },
]

export function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="container grid gap-10 py-14 lg:grid-cols-2 lg:py-20">
        <motion.div variants={fadeSlideUp} initial="hidden" animate="show" className="flex flex-col justify-center">
          <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            Réservation + gestion · pour garages indépendants
          </span>
          <h1 className="text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl">
            Le garage prend ses rendez-vous,<br />
            <span className="text-primary">vous gardez la main.</span>
          </h1>
          <p className="mt-4 max-w-lg text-lg text-muted-foreground">
            GarageFlow réunit l’espace <strong>Pro</strong> du garage et l’application <strong>Client</strong>
            mobile-first. Les clients réservent, vous validez, l’atelier suit. Le tout sécurisé et prêt pour un pilote.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/login"><Button size="lg">Espace garage <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link to="/app"><Button size="lg" variant="outline">Voir l’app client</Button></Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Démo : <code className="rounded bg-muted px-1.5 py-0.5">owner@demo-garage.fr</code> /{' '}
            <code className="rounded bg-muted px-1.5 py-0.5">Demo1234!</code>
          </p>
        </motion.div>

        {/* Product preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative"
        >
          <Card className="overflow-hidden p-0">
            <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
              <span className="ml-2 text-xs text-muted-foreground">GarageFlow Pro — Réservations</span>
            </div>
            <div className="space-y-3 p-4">
              {[
                { n: 'Julie Durand', s: 'Plaquettes de frein', t: 'warning', l: 'En attente' },
                { n: 'Marc Petit', s: 'Révision constructeur', t: 'info', l: 'Acceptée' },
                { n: 'Inès Lefort', s: 'Diagnostic électronique', t: 'success', l: 'Confirmée' },
              ].map((r) => (
                <div key={r.n} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-semibold">{r.n}</p>
                    <p className="text-xs text-muted-foreground">{r.s}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      r.t === 'warning'
                        ? 'bg-warning/20 text-warning-foreground'
                        : r.t === 'info'
                          ? 'bg-info/15 text-info'
                          : 'bg-success/15 text-success'
                    }`}
                  >
                    {r.l}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Problems */}
      <section id="problemes" className="border-y border-border bg-muted/30">
        <div className="container py-14">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Ce qui ralentit un garage aujourd’hui</h2>
          <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
            {problems.map((p) => (
              <Card key={p} className="p-5 text-sm text-muted-foreground">
                {p}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solution / modules */}
      <section id="solution" className="container py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Tout le quotidien du garage, au même endroit</h2>
          <p className="mt-3 text-muted-foreground">
            Des workflows réels, pas des écrans de démo. Conçu pour être pris en main dès le premier jour.
          </p>
        </div>
        <motion.div
          variants={listStagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {modules.map(({ icon: Icon, title, text }) => (
            <motion.div key={title} variants={listItem}>
              <Card className="h-full p-6">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Parcours */}
      <section id="parcours" className="border-t border-border bg-muted/30">
        <div className="container grid gap-8 py-16 lg:grid-cols-2">
          <Card className="p-7">
            <h3 className="text-lg font-bold">Côté client · mobile</h3>
            <ol className="mt-4 space-y-3 text-sm">
              {['Choisir son garage', 'Choisir une prestation', 'Renseigner son véhicule', 'Choisir un créneau', 'Envoyer la demande et suivre le statut'].map(
                (s, i) => (
                  <li key={s} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ),
              )}
            </ol>
          </Card>
          <Card className="p-7">
            <h3 className="text-lg font-bold">Côté garage · back-office</h3>
            <ol className="mt-4 space-y-3 text-sm">
              {['Recevoir la demande dans l’inbox', 'Accepter, refuser ou proposer un autre créneau', 'Confirmer → créer le rendez-vous', 'Suivre l’atelier et les véhicules', 'Garder un historique clair par client'].map(
                (s, i) => (
                  <li key={s} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ),
              )}
            </ol>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16">
        <Card className="flex flex-col items-center gap-4 bg-gradient-to-br from-primary/10 to-accent p-10 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Prêt pour un garage pilote</h2>
          <p className="max-w-xl text-muted-foreground">
            Base Supabase sécurisée, isolation par garage, app client installable. Lancez une démo en quelques minutes.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/pilote"><Button size="lg">Découvrir l’offre pilote</Button></Link>
            <Link to="/login"><Button size="lg" variant="outline">Ouvrir l’espace garage</Button></Link>
          </div>
        </Card>
      </section>
    </div>
  )
}

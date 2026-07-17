import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CalendarCheck, CheckCircle2, Inbox, PhoneOff, ShieldCheck, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useBrand } from '@/branding'
import { useT } from '@/i18n'
import { fadeSlideUp, listItem, listStagger } from '@/lib/motion'

const benefitIcons = [PhoneOff, Inbox, CalendarCheck, Users, CheckCircle2, ShieldCheck]
const previewTones = ['bg-warning/20 text-warning-foreground', 'bg-success/15 text-success', 'bg-primary/10 text-primary']

export function HomePage() {
  const { brand } = useBrand()
  const t = useT()
  return (
    <div>
      {/* Hero */}
      <section className="container grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
        <motion.div variants={fadeSlideUp} initial="hidden" animate="show">
          <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {t.home.badge}
          </span>
          <h1 className="text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl">
            {t.home.title}
          </h1>
          <p className="mt-4 max-w-lg text-lg text-muted-foreground">
            <bdi>{brand.appName}</bdi> {t.home.intro}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/login">
              <Button size="lg">
                {t.nav.accessAccount}
                <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {t.home.demoHint}
          </p>
        </motion.div>

        {/* Sober product preview */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <Card className="overflow-hidden p-0 shadow-elevated">
            <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="text-xs text-muted-foreground ltr:ml-2 rtl:mr-2">{t.home.previewTitle}</span>
            </div>
            <div className="space-y-2.5 p-4">
              {t.home.previewRows.map((row, index) => (
                <div key={row.name} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-semibold" dir="auto">{row.name}</p>
                    <p className="text-xs text-muted-foreground">{row.service}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${previewTones[index]}`}>{row.status}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Problèmes */}
      <section id="problemes" className="container scroll-mt-20 py-14">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">{t.home.problemsTitle}</h2>
        <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
          {t.home.problems.map((p) => (
            <Card key={p} className="p-5 text-sm text-muted-foreground">{p}</Card>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section id="solution" className="scroll-mt-20 border-t border-border bg-muted/20">
        <div className="container py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">{t.home.benefitsTitle}</h2>
            <p className="mt-3 text-muted-foreground">{t.home.benefitsSubtitle}</p>
          </div>
          <motion.div
            variants={listStagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {t.home.benefits.map(({ title, text }, index) => {
              const Icon = benefitIcons[index]
              return (
              <motion.div key={title} variants={listItem}>
                <Card className="h-full p-6">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
                </Card>
              </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Parcours */}
      <section id="parcours" className="container scroll-mt-20 py-16">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.home.clientSide}</p>
            <h3 className="mt-1 text-lg font-bold">{t.home.clientTitle}</h3>
            <ol className="mt-4 space-y-3 text-sm">
              {t.home.clientSteps.map((s, i) => (
                <li key={s} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </Card>
          <Card className="p-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.home.garageSide}</p>
            <h3 className="mt-1 text-lg font-bold">{t.home.garageTitle}</h3>
            <ol className="mt-4 space-y-3 text-sm">
              {t.home.garageSteps.map((s, i) => (
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
          <h2 className="text-2xl font-bold sm:text-3xl">{t.home.ctaTitle}</h2>
          <p className="max-w-xl text-muted-foreground">
            {t.home.ctaText}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/solutions"><Button size="lg">{t.home.discoverProduct}</Button></Link>
            <Link to="/login"><Button size="lg" variant="outline">{t.nav.accessAccount}</Button></Link>
          </div>
        </div>
      </section>
    </div>
  )
}

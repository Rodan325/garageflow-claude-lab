import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  HeartHandshake,
  Network,
  ShieldCheck,
  Wrench,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useBrand } from '@/branding'
import { useT } from '@/i18n'
import { fadeSlideUp, listItem, listStagger } from '@/lib/motion'

const capabilityIcons = [ClipboardCheck, Wrench, HeartHandshake, Gauge, ShieldCheck, Network]

export function SolutionsPage() {
  const { brand } = useBrand()
  const t = useT()

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.14),transparent_44%),radial-gradient(circle_at_80%_25%,hsl(var(--accent)/0.55),transparent_36%)]" />
        <motion.div
          variants={fadeSlideUp}
          initial="hidden"
          animate="show"
          className="container relative py-20 text-center lg:py-28"
        >
          <Badge tone="primary">{t.solutions.eyebrow}</Badge>
          <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            {t.solutions.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            <bdi>{brand.appName}</bdi> {t.solutions.intro}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="mailto:anas.rodriguez@rodanbtech.com?subject=Demande%20de%20d%C3%A9monstration%20Clikarage">
              <Button size="lg">
                {t.solutions.requestDemo}
                <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
              </Button>
            </a>
            <Link to="/login"><Button size="lg" variant="outline">{t.solutions.discover}</Button></Link>
          </div>
        </motion.div>
      </section>

      <section className="container py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{t.solutions.journeyEyebrow}</p>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">{t.solutions.journeyTitle}</h2>
          <p className="mt-3 text-muted-foreground">{t.solutions.journeyIntro}</p>
        </div>
        <ol className="mx-auto mt-10 grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {t.solutions.journey.map((step, index) => (
            <li key={step} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {index + 1}
              </span>
              <span className="text-sm font-medium">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-border bg-muted/25">
        <div className="container py-16">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{t.solutions.capabilitiesEyebrow}</p>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">{t.solutions.capabilitiesTitle}</h2>
          </div>
          <motion.div
            variants={listStagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {t.solutions.capabilities.map(({ title, text }, index) => {
              const Icon = capabilityIcons[index]
              return (
                <motion.div key={title} variants={listItem}>
                  <Card className="h-full p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      <section className="container grid gap-6 py-16 lg:grid-cols-2">
        <Card className="p-7">
          <Building2 className="h-7 w-7 text-primary" />
          <h2 className="mt-4 text-xl font-bold">{t.solutions.independentTitle}</h2>
          <p className="mt-2 text-muted-foreground">{t.solutions.independentText}</p>
          <ul className="mt-5 space-y-3 text-sm">
            {t.solutions.independentBenefits.map((benefit) => (
              <li key={benefit} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                {benefit}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-7">
          <Network className="h-7 w-7 text-primary" />
          <h2 className="mt-4 text-xl font-bold">{t.solutions.networkTitle}</h2>
          <p className="mt-2 text-muted-foreground">{t.solutions.networkText}</p>
          <ul className="mt-5 space-y-3 text-sm">
            {t.solutions.networkBenefits.map((benefit) => (
              <li key={benefit} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                {benefit}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="border-t border-border bg-foreground text-background">
        <div className="container flex flex-col items-center gap-5 py-16 text-center">
          <h2 className="max-w-2xl text-2xl font-bold sm:text-3xl">{t.solutions.ctaTitle}</h2>
          <p className="max-w-xl text-background/70">{t.solutions.ctaText}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="mailto:anas.rodriguez@rodanbtech.com?subject=Contact%20Clikarage">
              <Button size="lg">{t.solutions.contact}</Button>
            </a>
            <Link to="/"><Button size="lg" variant="outline" className="border-background/30 text-background hover:bg-background/10">{t.solutions.backHome}</Button></Link>
          </div>
        </div>
      </section>
    </div>
  )
}

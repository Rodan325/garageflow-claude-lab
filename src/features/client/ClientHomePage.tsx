import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Clock, MapPin, Newspaper } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingState, EmptyState } from '@/components/ui/feedback'
import { useAuth } from '@/features/auth/AuthProvider'
import { useGarages, useGarageServices, useGarageNews, useGarageHours } from '@/data/garagePublic'
import { useClientProfile } from '@/data/clientData'
import { useSelectedGarage } from './useSelectedGarage'
import { nextSlots } from '@/lib/slots'
import { euro, shortDate } from '@/lib/format'
import { listItem, listStagger } from '@/lib/motion'
import type { GarageService, GarageHours } from '@/types/domain'
import { useLang } from '@/i18n'
import { localizeDemoText } from '@/i18n/demoContent'

export const BOOK_SERVICE_KEY = 'gf-book-service'

export function ClientHomePage() {
  const { tr } = useLang()
  const { userId, profile } = useAuth()
  const { selectedGarageId, select } = useSelectedGarage()
  const { data: garages, isLoading } = useGarages()
  const { data: clientProfile } = useClientProfile(userId)

  useEffect(() => {
    if (!selectedGarageId && clientProfile?.default_garage_id) select(clientProfile.default_garage_id)
  }, [selectedGarageId, clientProfile, select])

  const selected = garages?.find((g) => g.id === selectedGarageId) ?? null

  if (isLoading) return <LoadingState />

  if (!selected) {
    return (
      <div className="p-4">
        <h1 className="text-lg font-semibold">{tr('Choisissez votre garage')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{tr('Sélectionnez un garage pour prendre rendez-vous.')}</p>
        {(garages ?? []).length === 0 ? (
          <EmptyState icon={MapPin} title={tr('Aucun garage disponible')} />
        ) : (
          <div className="mt-4 space-y-2.5">
            {garages!.map((g) => (
              <button key={g.id} onClick={() => select(g.id)} className="w-full text-start">
                <Card className="flex items-center justify-between p-4 transition-colors hover:bg-muted/40">
                  <div>
                    <p className="font-semibold">{g.name}</p>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {g.city}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <SelectedGarageHome
      garageId={selected.id}
      garageName={selected.name}
      garageCity={selected.city}
      logoUrl={selected.logo_url}
      firstName={profile?.full_name?.split(' ')[0]}
      onChange={() => select('')}
      isAuthed={!!userId}
    />
  )
}

function SelectedGarageHome({
  garageId, garageName, garageCity, logoUrl, firstName, onChange, isAuthed,
}: {
  garageId: string
  garageName: string
  garageCity: string | null
  logoUrl: string | null
  firstName?: string
  onChange: () => void
  isAuthed: boolean
}) {
  const navigate = useNavigate()
  const { lang, tr } = useLang()
  const { data: services } = useGarageServices(garageId)
  const { data: hours } = useGarageHours(garageId)
  const { data: news } = useGarageNews(garageId)

  const book = (serviceId?: string) => {
    if (serviceId) sessionStorage.setItem(BOOK_SERVICE_KEY, serviceId)
    else sessionStorage.removeItem(BOOK_SERVICE_KEY)
    navigate('/app/book')
  }

  return (
    <div className="space-y-5 p-4">
      {/* Sober garage header */}
      <div>
        {firstName && <p className="text-sm text-muted-foreground">{tr('Bonjour {name}', { name: firstName })}</p>}
        <div className="mt-1 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {logoUrl && <img src={logoUrl} alt="" className="h-12 w-12 rounded-lg border border-border object-contain" />}
            <div>
              <h1 className="text-xl font-bold tracking-tight">{garageName}</h1>
              <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {garageCity}</p>
            </div>
          </div>
          <button onClick={onChange} className="shrink-0 text-xs font-medium text-primary hover:underline">{tr('Changer')}</button>
        </div>
      </div>

      {/* Prestations — Doctolib-like list */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{tr('Prestations')}</h2>
        <motion.div variants={listStagger} initial="hidden" animate="show" className="space-y-2.5">
          {(services ?? []).map((s) => (
            <motion.div key={s.id} variants={listItem}>
              <ServiceCard service={s} hours={hours} onBook={() => book(s.id)} />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Actualités */}
      {(news ?? []).length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">{tr('Actualités')}</h2>
            <Link to="/app/news" className="text-xs font-medium text-primary">{tr('Tout voir')}</Link>
          </div>
          <div className="space-y-2">
            {news!.slice(0, 2).map((n) => (
              <Card key={n.id} className="p-3.5">
                <p className="flex items-center gap-1.5 text-sm font-medium"><Newspaper className="h-3.5 w-3.5 text-muted-foreground" /> {localizeDemoText(n.title, lang)}</p>
                {n.body && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{localizeDemoText(n.body, lang)}</p>}
                <p className="mt-1 text-[10px] text-muted-foreground">{shortDate(n.published_at, lang)}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {!isAuthed && (
        <Card className="flex items-center gap-3 p-4">
          <div className="flex-1 text-sm">
            <p className="font-medium">{tr('Connectez-vous pour réserver')}</p>
            <p className="text-muted-foreground">{tr('et suivre vos rendez-vous.')}</p>
          </div>
          <Link to="/login"><Button size="sm">{tr('Connexion')}</Button></Link>
        </Card>
      )}
    </div>
  )
}

function ServiceCard({
  service, hours, onBook,
}: {
  service: GarageService
  hours: GarageHours[] | undefined
  onBook: () => void
}) {
  const { lang, tr } = useLang()
  const slots = nextSlots(hours, 3, lang)
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{localizeDemoText(service.name, lang)}</p>
          <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {tr('{minutes} min', { minutes: service.duration_minutes })}</span>
            {service.price_from != null && <span>· {tr('dès {price}', { price: euro(service.price_from, lang) })}</span>}
          </p>
          {service.description && <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{localizeDemoText(service.description, lang)}</p>}
        </div>
      </div>

      {slots.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{tr('Prochain :')}</span>
          {slots.slice(0, 2).map((s) => (
            <span key={s.iso} className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium capitalize">
              {s.label.replace(/\.$/, '')} · {s.time}
            </span>
          ))}
        </div>
      )}

      <Button className="mt-3 w-full" onClick={onBook}>{tr('Réserver')}</Button>
    </Card>
  )
}

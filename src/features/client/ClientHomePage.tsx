import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CalendarCheck, Car, ChevronRight, MapPin, Megaphone, Newspaper } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingState, EmptyState } from '@/components/ui/feedback'
import { useAuth } from '@/features/auth/AuthProvider'
import { useGarages, useGarageServices, useGarageNews } from '@/data/garagePublic'
import { useClientProfile } from '@/data/clientData'
import { useSelectedGarage } from './useSelectedGarage'
import { euro, shortDate } from '@/lib/format'
import { fadeSlideUp, listItem, listStagger } from '@/lib/motion'

export function ClientHomePage() {
  const { userId, profile } = useAuth()
  const { selectedGarageId, select } = useSelectedGarage()
  const { data: garages, isLoading } = useGarages()
  const { data: clientProfile } = useClientProfile(userId)

  // Preselect the client's default garage on first visit.
  useEffect(() => {
    if (!selectedGarageId && clientProfile?.default_garage_id) select(clientProfile.default_garage_id)
  }, [selectedGarageId, clientProfile, select])

  const selected = garages?.find((g) => g.id === selectedGarageId) ?? null

  if (isLoading) return <LoadingState />

  // Garage directory
  if (!selected) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold">Choisissez votre garage</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sélectionnez un garage pour réserver une prestation.</p>
        {(garages ?? []).length === 0 ? (
          <EmptyState icon={MapPin} title="Aucun garage disponible" />
        ) : (
          <motion.div variants={listStagger} initial="hidden" animate="show" className="mt-4 space-y-3">
            {garages!.map((g) => (
              <motion.button
                key={g.id}
                variants={listItem}
                onClick={() => select(g.id)}
                className="w-full text-left"
              >
                <Card className="focus-card flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold">{g.name}</p>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {g.city}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Card>
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    )
  }

  return <SelectedGarageHome garageId={selected.id} garageName={selected.name} garageCity={selected.city} description={selected.description} specialties={selected.specialties} firstName={profile?.full_name?.split(' ')[0]} onChange={() => select('')} isAuthed={!!userId} />
}

function SelectedGarageHome({
  garageId,
  garageName,
  garageCity,
  description,
  specialties,
  firstName,
  onChange,
  isAuthed,
}: {
  garageId: string
  garageName: string
  garageCity: string | null
  description: string | null
  specialties: string[]
  firstName?: string
  onChange: () => void
  isAuthed: boolean
}) {
  const navigate = useNavigate()
  const { data: services } = useGarageServices(garageId)
  const { data: news } = useGarageNews(garageId)

  return (
    <div className="space-y-5 p-4">
      <motion.div variants={fadeSlideUp} initial="hidden" animate="show">
        {firstName && <p className="text-sm text-muted-foreground">Bonjour {firstName} 👋</p>}
        <div className="mt-2 overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[#0b5b54] p-5 text-primary-foreground">
          <p className="text-xs uppercase tracking-wide opacity-80">Votre garage</p>
          <h1 className="mt-1 text-2xl font-bold">{garageName}</h1>
          <p className="mt-0.5 flex items-center gap-1 text-sm opacity-90"><MapPin className="h-3.5 w-3.5" /> {garageCity}</p>
          {description && <p className="mt-3 text-sm opacity-90">{description}</p>}
          <button onClick={onChange} className="mt-3 text-xs underline opacity-80">Changer de garage</button>
        </div>
      </motion.div>

      <Button size="lg" className="w-full" onClick={() => navigate('/app/book')}>
        <CalendarCheck className="h-5 w-5" /> Réserver une prestation <ArrowRight className="ml-auto h-4 w-4" />
      </Button>

      {specialties?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {specialties.map((s) => <Badge key={s} tone="primary">{s}</Badge>)}
        </div>
      )}

      {/* Services preview */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Prestations</h2>
        </div>
        <div className="space-y-2">
          {(services ?? []).slice(0, 4).map((s) => (
            <Card key={s.id} className="flex items-center justify-between p-3.5">
              <div>
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.duration_minutes} min</p>
              </div>
              <span className="text-sm font-semibold text-primary">dès {euro(s.price_from)}</span>
            </Card>
          ))}
        </div>
      </section>

      {/* News preview */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Actualités</h2>
          <Link to="/app/news" className="text-sm font-medium text-primary">Tout voir</Link>
        </div>
        {(news ?? []).length === 0 ? (
          <EmptyState icon={Newspaper} title="Pas d’actualité" />
        ) : (
          <div className="space-y-2">
            {news!.slice(0, 2).map((n) => (
              <Card key={n.id} className="p-3.5">
                <p className="flex items-center gap-1.5 text-sm font-medium"><Megaphone className="h-3.5 w-3.5 text-primary" /> {n.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{shortDate(n.published_at)}</p>
              </Card>
            ))}
          </div>
        )}
      </section>

      {!isAuthed && (
        <Card className="flex items-center gap-3 bg-accent/60 p-4">
          <Car className="h-5 w-5 text-primary" />
          <div className="flex-1 text-sm">
            <p className="font-medium">Connectez-vous pour réserver</p>
            <p className="text-muted-foreground">Suivez vos demandes et véhicules.</p>
          </div>
          <Link to="/login"><Button size="sm">Connexion</Button></Link>
        </Card>
      )}
    </div>
  )
}

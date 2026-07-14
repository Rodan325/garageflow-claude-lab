import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Megaphone, Newspaper } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState, LoadingState } from '@/components/ui/feedback'
import { useGarageNews, useGarages } from '@/data/garagePublic'
import { useSelectedGarage } from './useSelectedGarage'
import { shortDate } from '@/lib/format'
import { listItem, listStagger } from '@/lib/motion'
import { useLang } from '@/i18n'
import { localizeDemoText } from '@/i18n/demoContent'

export function ClientNewsPage() {
  const { lang, tr } = useLang()
  const { selectedGarageId } = useSelectedGarage()
  const { data: garages } = useGarages()
  const { data: news, isLoading } = useGarageNews(selectedGarageId ?? undefined)
  const garage = garages?.find((g) => g.id === selectedGarageId)

  if (!selectedGarageId) {
    return (
      <div className="p-4">
        <EmptyState title={tr('Aucun garage sélectionné')} action={<Link to="/app"><Button>{tr('Choisir un garage')}</Button></Link>} />
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">{tr('Actualités')}</h1>
      {garage && <p className="mt-1 text-sm text-muted-foreground">{garage.name}</p>}

      <div className="mt-4">
        {isLoading ? (
          <LoadingState />
        ) : (news ?? []).length === 0 ? (
          <EmptyState icon={Newspaper} title={tr('Aucune actualité')} />
        ) : (
          <motion.div variants={listStagger} initial="hidden" animate="show" className="space-y-3">
            {news!.map((n) => (
              <motion.div key={n.id} variants={listItem}>
                <Card className="p-4">
                  <p className="flex items-center gap-2 font-semibold"><Megaphone className="h-4 w-4 text-primary" /> {localizeDemoText(n.title, lang)}</p>
                  {n.body && <p className="mt-1.5 text-sm text-muted-foreground">{localizeDemoText(n.body, lang)}</p>}
                  <p className="mt-2 text-xs text-muted-foreground">{shortDate(n.published_at, lang)}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

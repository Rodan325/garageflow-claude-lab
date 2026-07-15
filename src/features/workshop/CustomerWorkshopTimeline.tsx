import { Check, Clock3 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { LoadingState } from '@/components/ui/feedback'
import { useWorkshopTimeline } from '@/data/workshop'
import { useLang } from '@/i18n'
import { dateTime, fromNow } from '@/lib/format'
import { isWorkshopStage, workshopStageMeta } from './lifecycle'

export function CustomerWorkshopTimeline({ requestId }: { requestId: string }) {
  const { lang, tr } = useLang()
  const { data: events, isLoading } = useWorkshopTimeline(requestId, true)

  if (isLoading) return <LoadingState />
  if (!events?.length) return null

  const latest = events[events.length - 1]
  return (
    <Card className="mt-4 overflow-hidden p-4" data-testid="customer-workshop-timeline">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold">{tr('Suivi de l’intervention')}</h2>
          <p className="text-xs text-muted-foreground">{tr('Les étapes visibles sont mises à jour par votre atelier.')}</p>
        </div>
        {isWorkshopStage(latest.new_stage) && (
          <Badge tone={workshopStageMeta(latest.new_stage, lang).tone}>
            {workshopStageMeta(latest.new_stage, lang).label}
          </Badge>
        )}
      </div>
      {latest.estimated_completion_at && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
          <Clock3 className="h-4 w-4 text-primary" />
          <span>{tr('Restitution estimée : {date}', { date: dateTime(latest.estimated_completion_at, lang) })}</span>
        </div>
      )}
      <ol className="relative mt-4 space-y-4 before:absolute before:inset-y-2 before:start-[9px] before:w-px before:bg-border">
        {[...events].reverse().map((event) => {
          if (!isWorkshopStage(event.new_stage)) return null
          const meta = workshopStageMeta(event.new_stage, lang)
          return (
            <li key={event.id} className="relative ps-8">
              <span className="absolute start-0 top-0.5 grid h-[19px] w-[19px] place-items-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3 w-3" />
              </span>
              <div className="flex flex-wrap items-baseline justify-between gap-1">
                <p className="text-sm font-medium">{meta.label}</p>
                <time className="text-xs text-muted-foreground" dateTime={event.occurred_at}>
                  {fromNow(event.occurred_at, lang)}
                </time>
              </div>
              {event.customer_message && <p className="mt-1 text-sm text-muted-foreground">{event.customer_message}</p>}
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

import { BellRing } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useConvertMaintenanceReminder, useMaintenanceReminders } from '@/data/reminders'
import { useAuth } from '@/features/auth/AuthProvider'
import { useLang } from '@/i18n'
import { localizeDemoText } from '@/i18n/demoContent'
import { shortDate } from '@/lib/format'
import { isDemo } from '@/lib/demo'

export function ClientMaintenanceReminders() {
  const { userId } = useAuth()
  const { lang, tr } = useLang()
  const navigate = useNavigate()
  const { data: reminders } = useMaintenanceReminders(undefined, userId ?? undefined)
  const convert = useConvertMaintenanceReminder()
  const visible = (reminders ?? []).filter((item) => ['scheduled', 'sent', 'opened'].includes(item.status))
  if (!visible.length) return null

  async function book(reminderId: string) {
    if (!isDemo()) {
      navigate('/app/book')
      return
    }
    const result = await convert.mutateAsync({ reminderId })
    if (!result.request) return
    navigate(`/app/bookings/${result.request.id}`)
  }

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{tr('Rappels d’entretien')}</h2>
      <div className="space-y-2">
        {visible.map((reminder) => (
          <Card key={reminder.id} className="flex flex-wrap items-center gap-3 p-3.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-warning/10 text-warning"><BellRing className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{localizeDemoText(reminder.title, lang)}</p>
              <p className="text-xs text-muted-foreground">{reminder.due_date ? shortDate(reminder.due_date, lang) : `${reminder.due_mileage} km`}</p>
            </div>
            <Button size="sm" variant="secondary" loading={convert.isPending} onClick={() => book(reminder.id)}>{tr('Prendre rendez-vous')}</Button>
          </Card>
        ))}
      </div>
    </section>
  )
}

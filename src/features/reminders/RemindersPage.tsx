import { useState } from 'react'
import { BellRing, CalendarClock, Plus } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState, LoadingState } from '@/components/ui/feedback'
import { Field, Input, Select } from '@/components/ui/input'
import { StatusPill } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { useCreateMaintenanceReminder, useMaintenanceReminders } from '@/data/reminders'
import { useGarageRequests } from '@/data/requests'
import { useAuth } from '@/features/auth/AuthProvider'
import { useLang } from '@/i18n'
import { localizeDemoText } from '@/i18n/demoContent'
import { shortDate } from '@/lib/format'
import { reminderStatusMeta, type ReminderType } from './model'

export function RemindersPage() {
  const { garage } = useAuth()
  const { lang, tr } = useLang()
  const toast = useToast()
  const { data: reminders, isLoading } = useMaintenanceReminders(garage?.id)
  const { data: requests } = useGarageRequests(garage?.id)
  const create = useCreateMaintenanceReminder()
  const [open, setOpen] = useState(false)
  const [requestId, setRequestId] = useState('')
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [dueMileage, setDueMileage] = useState('')
  const [type, setType] = useState<ReminderType>('date_or_mileage')

  async function submit() {
    const request = requests?.find((item) => item.id === requestId)
    if (!garage || !request || !title.trim() || (!dueDate && !dueMileage)) return
    try {
      await create.mutateAsync({
        garageId: garage.id, centerId: request.center_id, clientId: request.client_id,
        serviceRequestId: request.id, reminderType: type, title: title.trim(),
        dueDate: dueDate || null, dueMileage: dueMileage ? Number(dueMileage) : null,
        language: lang,
      })
      setOpen(false)
      setTitle('')
      toast.success(tr('Rappel planifié'))
    } catch {
      toast.error(tr('Action impossible'), tr('Le rappel n’a pas pu être créé.'))
    }
  }

  return (
    <div>
      <PageHeader
        title={tr('Rappels d’entretien')}
        subtitle={tr('Planifiez les prochaines échéances par date ou kilométrage.')}
        action={<Button onClick={() => setOpen((value) => !value)}><Plus className="h-4 w-4" /> {tr('Nouveau rappel')}</Button>}
      />
      {open && (
        <Card className="mb-5 grid gap-4 p-4 sm:grid-cols-2">
          <Field label={tr('Dossier client')}>
            <Select value={requestId} onChange={(event) => setRequestId(event.target.value)}>
              <option value="">{tr('Choisir un dossier')}</option>
              {(requests ?? []).map((request) => <option key={request.id} value={request.id}>{request.reference} · {request.vehicle_label}</option>)}
            </Select>
          </Field>
          <Field label={tr('Type de rappel')}>
            <Select value={type} onChange={(event) => setType(event.target.value as ReminderType)}>
              <option value="fixed_date">{tr('Date fixe')}</option>
              <option value="after_service">{tr('Après intervention')}</option>
              <option value="mileage">{tr('Kilométrage')}</option>
              <option value="date_or_mileage">{tr('Date ou kilométrage')}</option>
              <option value="seasonal_campaign">{tr('Campagne saisonnière')}</option>
            </Select>
          </Field>
          <Field label={tr('Intitulé')}><Input value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
          <Field label={tr('Date d’échéance')}><Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></Field>
          <Field label={tr('Kilométrage cible')}><Input type="number" min="0" value={dueMileage} onChange={(event) => setDueMileage(event.target.value)} /></Field>
          <div className="flex items-end justify-end"><Button loading={create.isPending} onClick={submit}>{tr('Planifier')}</Button></div>
        </Card>
      )}
      {isLoading ? <LoadingState /> : !reminders?.length ? (
        <EmptyState icon={CalendarClock} title={tr('Aucun rappel planifié')} description={tr('Les prochaines échéances d’entretien apparaîtront ici.')} />
      ) : (
        <div className="space-y-2">
          {reminders.map((reminder) => {
            const meta = reminderStatusMeta(reminder.status, lang)
            return (
              <Card key={reminder.id} className="flex flex-wrap items-center gap-3 p-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><BellRing className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{localizeDemoText(reminder.title, lang)}</p>
                  <p className="text-xs text-muted-foreground">
                    {[reminder.due_date ? shortDate(reminder.due_date, lang) : null, reminder.due_mileage !== null ? `${reminder.due_mileage} km` : null].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <StatusPill tone={meta.tone} label={meta.label} />
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

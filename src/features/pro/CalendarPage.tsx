import { useMemo, useState } from 'react'
import { CalendarDays, Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Field, Input, Textarea } from '@/components/ui/input'
import { EmptyState, LoadingState } from '@/components/ui/feedback'
import { StatusPill } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/PageHeader'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/features/auth/AuthProvider'
import { useAppointments, useCreateAppointment } from '@/data/proData'
import { dateLabel, shortTime } from '@/lib/format'
import type { Appointment } from '@/types/domain'
import { useLang } from '@/i18n'

const APPT_TONE: Record<string, 'neutral' | 'info' | 'primary' | 'success' | 'danger'> = {
  scheduled: 'info',
  confirmed: 'primary',
  in_progress: 'primary',
  done: 'success',
  cancelled: 'danger',
  no_show: 'danger',
}

export function CalendarPage() {
  const { lang, tr } = useLang()
  const { garage } = useAuth()
  const gid = garage?.id
  const { data: appointments, isLoading } = useAppointments(gid)
  const [open, setOpen] = useState(false)

  const groups = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    for (const a of appointments ?? []) {
      const key = new Date(a.starts_at).toDateString()
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(a)
    }
    return [...map.entries()].sort((a, b) => +new Date(a[0]) - +new Date(b[0]))
  }, [appointments])

  return (
    <div>
      <PageHeader
        title={tr('Agenda')}
        subtitle={tr('Les rendez-vous confirmés depuis les réservations apparaissent ici.')}
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> {tr('Nouveau rendez-vous')}</Button>}
      />

      {isLoading ? (
        <LoadingState />
      ) : groups.length === 0 ? (
        <EmptyState icon={CalendarDays} title={tr('Aucun rendez-vous planifié')} description={tr('Confirmez une réservation ou créez un rendez-vous manuellement.')} />
      ) : (
        <div className="space-y-5">
          {groups.map(([day, list]) => (
            <div key={day}>
              <p className="mb-2 text-sm font-semibold capitalize text-muted-foreground">{dateLabel(new Date(day), lang)}</p>
              <Card className="divide-y divide-border">
                {list.map((a) => (
                  <div key={a.id} className="flex items-center gap-4 p-4">
                    <div className="w-14 shrink-0 text-center">
                      <p className="text-sm font-bold">{shortTime(new Date(a.starts_at).toTimeString().slice(0, 5))}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{a.title}</p>
                      {a.notes && <p className="truncate text-sm text-muted-foreground">{a.notes}</p>}
                    </div>
                    <StatusPill tone={APPT_TONE[a.status] ?? 'neutral'} label={tr(a.status)} />
                  </div>
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}

      {open && <NewAppointmentModal garageId={gid!} onClose={() => setOpen(false)} />}
    </div>
  )
}

function NewAppointmentModal({ garageId, onClose }: { garageId: string; onClose: () => void }) {
  const { tr } = useLang()
  const create = useCreateAppointment()
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('09:00')
  const [notes, setNotes] = useState('')

  async function submit() {
    if (!title || !date) {
      toast.error(tr('Titre et date requis'))
      return
    }
    try {
      await create.mutateAsync({
        garage_id: garageId,
        title,
        starts_at: new Date(`${date}T${time}:00`).toISOString(),
        notes: notes || null,
        status: 'scheduled',
      })
      toast.success(tr('Rendez-vous créé'))
      onClose()
    } catch {
      toast.error(tr('Création impossible'), tr('L’enregistrement n’a pas pu être terminé.'))
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={tr('Nouveau rendez-vous')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{tr('Annuler')}</Button>
          <Button loading={create.isPending} onClick={submit}>{tr('Créer')}</Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label={tr('Intitulé')} htmlFor="t"><Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={tr('Révision — Clio IV')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={tr('Date')} htmlFor="d"><Input id="d" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label={tr('Heure')} htmlFor="h"><Input id="h" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></Field>
        </div>
        <Field label={tr('Notes')} htmlFor="n"><Textarea id="n" value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      </div>
    </Modal>
  )
}

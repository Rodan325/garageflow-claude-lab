import { Bell, CheckCircle2, Clock3, Mail, MessageSquareText, Smartphone } from 'lucide-react'
import { Badge, StatusPill } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { EmptyState, LoadingState } from '@/components/ui/feedback'
import { PageHeader } from '@/components/common/PageHeader'
import { useNotificationOutbox } from '@/data/notifications'
import { useAuth } from '@/features/auth/AuthProvider'
import { useLang } from '@/i18n'
import { fromNow } from '@/lib/format'
import type { NotificationChannel, NotificationEvent, NotificationStatus } from './model'

const eventLabels = {
  fr: { appointment_confirmed: 'Rendez-vous confirmé', vehicle_received: 'Véhicule réceptionné', approval_required: 'Accord requis', quote_available: 'Devis disponible', recommendation_available: 'Recommandation disponible', message_received: 'Message reçu', delivery_time_changed: 'Heure de restitution modifiée', vehicle_ready: 'Véhicule prêt', vehicle_delivered: 'Véhicule restitué', maintenance_reminder: 'Rappel d’entretien' },
  en: { appointment_confirmed: 'Appointment confirmed', vehicle_received: 'Vehicle received', approval_required: 'Approval required', quote_available: 'Quote available', recommendation_available: 'Recommendation available', message_received: 'Message received', delivery_time_changed: 'Handover time changed', vehicle_ready: 'Vehicle ready', vehicle_delivered: 'Vehicle delivered', maintenance_reminder: 'Maintenance reminder' },
  ar: { appointment_confirmed: 'تم تأكيد الموعد', vehicle_received: 'تم استلام السيارة', approval_required: 'الموافقة مطلوبة', quote_available: 'عرض السعر متاح', recommendation_available: 'توصية متاحة', message_received: 'تم استلام رسالة', delivery_time_changed: 'تم تغيير وقت التسليم', vehicle_ready: 'السيارة جاهزة', vehicle_delivered: 'تم تسليم السيارة', maintenance_reminder: 'تذكير بالصيانة' },
} satisfies Record<'fr' | 'en' | 'ar', Record<NotificationEvent, string>>

const statusTones: Record<NotificationStatus, 'neutral' | 'info' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning', processing: 'info', simulated: 'info', sent: 'success',
  failed: 'danger', cancelled: 'neutral',
}
const statusLabels = {
  fr: { pending: 'En attente', processing: 'En cours', simulated: 'Simulée', sent: 'Envoyée', failed: 'Échec', cancelled: 'Annulée' },
  en: { pending: 'Pending', processing: 'Processing', simulated: 'Simulated', sent: 'Sent', failed: 'Failed', cancelled: 'Cancelled' },
  ar: { pending: 'قيد الانتظار', processing: 'قيد المعالجة', simulated: 'محاكاة', sent: 'مُرسل', failed: 'فشل', cancelled: 'ملغى' },
}

function ChannelIcon({ channel }: { channel: NotificationChannel }) {
  const Icon = channel === 'email' ? Mail : channel === 'sms' ? MessageSquareText : channel === 'push' ? Smartphone : Bell
  return <Icon className="h-4 w-4" />
}

export function NotificationsPage() {
  const { garage } = useAuth()
  const { lang, tr } = useLang()
  const { data: items, isLoading } = useNotificationOutbox(garage?.id)
  return (
    <div>
      <PageHeader title={tr('Notifications')} subtitle={tr('Suivez les communications préparées par les parcours Clikarage.')} />
      {isLoading ? <LoadingState /> : !items?.length ? (
        <EmptyState icon={Bell} title={tr('Aucune notification')} description={tr('Les communications liées aux dossiers apparaîtront ici.')} />
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const tone = statusTones[item.status]
            return (
              <Card key={item.id} className="flex flex-wrap items-center gap-3 p-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-muted"><ChannelIcon channel={item.channel} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{eventLabels[lang][item.template_key]}</p>
                  <p className="text-xs text-muted-foreground">{item.channel} · {fromNow(item.created_at, lang)}</p>
                </div>
                {item.status === 'simulated' && <Badge tone="neutral"><CheckCircle2 className="h-3 w-3" /> {tr('Simulation')}</Badge>}
                {item.status === 'pending' && <Clock3 className="h-4 w-4 text-warning" />}
                <StatusPill tone={tone} label={statusLabels[lang][item.status]} />
              </Card>
            )
          })}
        </div>
      )}
      <p className="mt-4 text-xs text-muted-foreground">{tr('Aucun fournisseur email ou SMS n’est appelé depuis le navigateur.')}</p>
    </div>
  )
}

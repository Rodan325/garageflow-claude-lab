import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarX2, ChevronRight, ListChecks } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/ui/badge'
import { EmptyState, LoadingState } from '@/components/ui/feedback'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/features/auth/AuthProvider'
import { useClientRequests, useUpdateRequestStatus } from '@/data/requests'
import { useGarages } from '@/data/garagePublic'
import { REQUEST_STATUS_META, type RequestStatus } from '@/types/domain'
import { shortDate, shortTime, fromNow } from '@/lib/format'
import { listItem, listStagger } from '@/lib/motion'

export function ClientBookingsPage() {
  const { userId } = useAuth()
  const toast = useToast()
  const { data: requests, isLoading } = useClientRequests(userId)
  const { data: garages } = useGarages()
  const update = useUpdateRequestStatus()

  const garageName = (id: string) => garages?.find((g) => g.id === id)?.name ?? 'Garage'

  async function act(id: string, garageId: string, status: RequestStatus, msg: string) {
    try {
      await update.mutateAsync({ id, garageId, clientId: userId!, status })
      toast.success(msg)
    } catch (e) {
      toast.error('Action impossible', (e as Error).message)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Mes demandes</h1>
      <p className="mt-1 text-sm text-muted-foreground">Suivez l’état de vos réservations.</p>

      <div className="mt-4">
        {isLoading ? (
          <LoadingState />
        ) : (requests ?? []).length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="Aucune demande"
            description="Vos réservations apparaîtront ici."
            action={<Link to="/app/book"><Button>Réserver maintenant</Button></Link>}
          />
        ) : (
          <motion.div variants={listStagger} initial="hidden" animate="show" className="space-y-3">
            {requests!.map((r) => {
              const meta = REQUEST_STATUS_META[r.status as RequestStatus]
              const proposed = r.status === 'reschedule_proposed'
              return (
                <motion.div key={r.id} variants={listItem}>
                  <Card className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold">{r.service_name}</p>
                        <p className="text-xs text-muted-foreground">{garageName(r.garage_id)} · {r.reference}</p>
                      </div>
                      <StatusPill tone={meta.tone} label={meta.label} />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {r.vehicle_label} · {shortDate(r.requested_date)} à {shortTime(r.requested_time)}
                    </p>

                    {proposed && (
                      <div className="mt-3 rounded-lg bg-accent/60 p-3">
                        <p className="text-sm font-medium">Le garage propose un autre créneau :</p>
                        <p className="text-sm">{shortDate(r.proposed_date)} à {shortTime(r.proposed_time)}</p>
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" onClick={() => act(r.id, r.garage_id, 'confirmed', 'Créneau accepté')}>Accepter</Button>
                          <Button size="sm" variant="ghost" onClick={() => act(r.id, r.garage_id, 'cancelled', 'Demande annulée')}>Refuser</Button>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                      <span className="text-xs text-muted-foreground">{fromNow(r.created_at)}</span>
                      <div className="flex gap-2">
                        {(r.status === 'pending' || r.status === 'accepted') && (
                          <Button size="sm" variant="ghost" onClick={() => act(r.id, r.garage_id, 'cancelled', 'Demande annulée')}>Annuler</Button>
                        )}
                        <Link to={`/app/bookings/${r.id}`}>
                          <Button size="sm" variant="outline">Détails <ChevronRight className="h-4 w-4" /></Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>

      {(requests ?? []).some((r) => r.status === 'cancelled') && (
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarX2 className="h-3.5 w-3.5" /> Les demandes annulées restent visibles pour votre historique.
        </p>
      )}
    </div>
  )
}

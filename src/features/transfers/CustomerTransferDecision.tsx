import { ArrowRightLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { useGarageCenters } from '@/data/centers'
import { useDecideCenterTransfer, useRequestTransfers } from '@/data/transfers'
import { useLang } from '@/i18n'
import type { ServiceRequest } from '@/types/domain'

export function CustomerTransferDecision({ request }: { request: ServiceRequest }) {
  const { tr } = useLang()
  const toast = useToast()
  const { data: transfers } = useRequestTransfers(request.id)
  const { data: centers } = useGarageCenters(request.garage_id)
  const decide = useDecideCenterTransfer()
  const transfer = transfers?.find((item) => ['proposed', 'customer_confirmed'].includes(item.status))
  if (!transfer) return null
  const destination = centers?.find((center) => center.id === transfer.to_center_id)

  async function answer(accept: boolean) {
    try {
      await decide.mutateAsync({ transferId: transfer!.id, accept })
      toast.success(accept ? tr('Transfert confirmé') : tr('Transfert refusé'))
    } catch {
      toast.error(tr('Réponse impossible'))
    }
  }

  return (
    <Card className="mt-4 border-primary/30 p-4">
      <div className="flex items-start gap-3">
        <ArrowRightLeft className="mt-0.5 h-5 w-5 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{tr('Changement d’établissement proposé')}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {tr('Le garage propose de transférer votre dossier vers {center}.', { center: destination?.name ?? tr('un autre établissement') })}
          </p>
          {transfer.reason && <p className="mt-2 rounded-lg bg-muted p-2 text-sm">{transfer.reason}</p>}
          {transfer.status === 'proposed' ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => answer(true)} loading={decide.isPending}>{tr('Accepter le transfert')}</Button>
              <Button size="sm" variant="outline" onClick={() => answer(false)} disabled={decide.isPending}>{tr('Refuser')}</Button>
            </div>
          ) : (
            <p className="mt-3 text-sm font-medium text-success">{tr('Vous avez confirmé ce transfert.')}</p>
          )}
        </div>
      </div>
    </Card>
  )
}

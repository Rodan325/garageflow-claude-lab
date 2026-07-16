import { useState } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Select, Textarea } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { useManageCenters } from '@/data/centers'
import { useCompleteCenterTransfer, useProposeCenterTransfer, useRequestTransfers } from '@/data/transfers'
import { useLang } from '@/i18n'
import { isDemo } from '@/lib/demo'
import type { ServiceRequest } from '@/types/domain'

export function CenterTransferControl({ request }: { request: ServiceRequest }) {
  const { tr } = useLang()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [destination, setDestination] = useState('')
  const [reason, setReason] = useState('')
  const { data: centers } = useManageCenters(request.garage_id)
  const { data: transfers } = useRequestTransfers(request.id)
  const propose = useProposeCenterTransfer()
  const complete = useCompleteCenterTransfer()
  const available = (centers ?? []).filter((center) => center.is_active && center.id !== request.center_id)
  const activeTransfer = transfers?.find((transfer) => ['proposed', 'customer_confirmed'].includes(transfer.status))

  if (!request.center_id || available.length === 0) return null

  async function submit() {
    if (!destination) return
    try {
      await propose.mutateAsync({
        requestId: request.id,
        garageId: request.garage_id,
        destinationCenterId: destination,
        reason,
      })
      setOpen(false)
      toast.success(tr('Transfert proposé'), tr('La confirmation du client est requise avant le changement d’établissement.'))
    } catch {
      toast.error(tr('Transfert impossible'))
    }
  }

  async function finalizeDemo() {
    if (!activeTransfer || activeTransfer.status !== 'customer_confirmed') return
    await complete.mutateAsync({
      transferId: activeTransfer.id, requestId: request.id, garageId: request.garage_id,
    })
    toast.success(tr('Transfert terminé'))
  }

  return (
    <>
      {activeTransfer ? (
        <div className="rounded-lg bg-muted p-2 text-xs text-muted-foreground">
          <p>{activeTransfer.status === 'proposed' ? tr('En attente de la confirmation du client') : tr('Transfert confirmé par le client')}</p>
          {isDemo() && activeTransfer.status === 'customer_confirmed' && (
            <Button size="sm" variant="secondary" className="mt-2 w-full" onClick={finalizeDemo} loading={complete.isPending}>
              {tr('Finaliser le transfert')}
            </Button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary hover:bg-muted"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" /> {tr('Proposer un autre établissement')}
        </button>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={tr('Transférer la demande')}
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>{tr('Annuler')}</Button><Button onClick={submit} loading={propose.isPending} disabled={!destination}>{tr('Demander confirmation')}</Button></>}
      >
        <div className="space-y-3">
          <Field label={tr('Établissement de destination')} htmlFor={`transfer-${request.id}`}>
            <Select id={`transfer-${request.id}`} value={destination} onChange={(event) => setDestination(event.target.value)}>
              <option value="">{tr('Choisir un établissement')}</option>
              {available.map((center) => <option key={center.id} value={center.id}>{center.name}</option>)}
            </Select>
          </Field>
          <Field label={tr('Motif facultatif')} htmlFor={`reason-${request.id}`}>
            <Textarea id={`reason-${request.id}`} value={reason} onChange={(event) => setReason(event.target.value)} />
          </Field>
          <p className="text-xs text-muted-foreground">{tr('Le véhicule et le dossier client restent rattachés à la même organisation.')}</p>
        </div>
      </Modal>
    </>
  )
}

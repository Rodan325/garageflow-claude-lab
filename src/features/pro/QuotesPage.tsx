import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Field, Input } from '@/components/ui/input'
import { StatusPill } from '@/components/ui/badge'
import { EmptyState, LoadingState } from '@/components/ui/feedback'
import { PageHeader } from '@/components/common/PageHeader'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/features/auth/AuthProvider'
import { useQuotes } from '@/data/proData'
import { supabase } from '@/lib/supabase'
import { euro, shortDate } from '@/lib/format'

const QUOTE_TONE: Record<string, 'neutral' | 'info' | 'success' | 'danger'> = {
  draft: 'neutral',
  sent: 'info',
  accepted: 'success',
  refused: 'danger',
}
const QUOTE_LABEL: Record<string, string> = { draft: 'Brouillon', sent: 'Envoyé', accepted: 'Accepté', refused: 'Refusé' }

export function QuotesPage() {
  const { garage } = useAuth()
  const gid = garage?.id
  const { data: quotes, isLoading } = useQuotes(gid)
  const [open, setOpen] = useState(false)

  return (
    <div>
      <PageHeader
        title="Devis"
        subtitle="Devis simples liés aux clients et véhicules."
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nouveau devis</Button>}
      />

      {isLoading ? (
        <LoadingState />
      ) : (quotes ?? []).length === 0 ? (
        <EmptyState icon={FileText} title="Aucun devis" description="Créez un premier devis pour un client." action={<Button onClick={() => setOpen(true)}>Créer un devis</Button>} />
      ) : (
        <Card className="divide-y divide-border">
          {quotes!.map((q) => (
            <div key={q.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{q.title}</p>
                <p className="text-sm text-muted-foreground">{q.number} · {shortDate(q.created_at)}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold">{euro(q.total)}</span>
                <StatusPill tone={QUOTE_TONE[q.status] ?? 'neutral'} label={QUOTE_LABEL[q.status] ?? q.status} />
              </div>
            </div>
          ))}
        </Card>
      )}

      {open && <NewQuoteModal garageId={gid!} onClose={() => setOpen(false)} />}
    </div>
  )
}

function NewQuoteModal({ garageId, onClose }: { garageId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [total, setTotal] = useState('')

  const create = useMutation({
    mutationFn: async () => {
      const number = `DV-${Date.now().toString().slice(-6)}`
      const amount = Number(total) || 0
      const tax = +(amount - amount / 1.2).toFixed(2)
      const { error } = await supabase.from('quotes').insert({
        garage_id: garageId,
        number,
        title,
        status: 'draft',
        subtotal: +(amount - tax).toFixed(2),
        tax_total: tax,
        total: amount,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotes', garageId] })
      toast.success('Devis créé')
      onClose()
    },
    onError: (e) => toast.error('Création impossible', (e as Error).message),
  })

  return (
    <Modal open onClose={onClose} title="Nouveau devis" footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button loading={create.isPending} onClick={() => (title ? create.mutate() : toast.error('Intitulé requis'))}>Créer</Button></>}>
      <div className="space-y-3">
        <Field label="Intitulé" htmlFor="qt" required><Input id="qt" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Révision + freins" /></Field>
        <Field label="Montant TTC (€)" htmlFor="qa" hint="TVA 20% calculée automatiquement."><Input id="qa" type="number" value={total} onChange={(e) => setTotal(e.target.value)} /></Field>
      </div>
    </Modal>
  )
}

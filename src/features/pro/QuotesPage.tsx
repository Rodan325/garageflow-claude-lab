import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Eye, FileText, Link2, Pencil, Plus, RotateCcw, Send } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge, StatusPill } from '@/components/ui/badge'
import { EmptyState, LoadingState } from '@/components/ui/feedback'
import { PageHeader } from '@/components/common/PageHeader'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/features/auth/AuthProvider'
import { useQuotes } from '@/data/proData'
import { useSendQuote, useReviseQuote } from '@/data/quotes'
import { supabase } from '@/lib/supabase'
import { isDemo, demo, DEMO_QUOTE_LINK_HINT } from '@/lib/demo'
import { QUOTE_STATUS_META } from '@/types/domain'
import { effectiveQuoteStatus, canSendQuote, canReviseQuote, clientQuoteLink, quoteSendBlockReason } from '@/lib/quoteStatus'
import { euro, shortDate } from '@/lib/format'
import type { Quote, QuoteLine } from '@/types/domain'

export function QuotesPage() {
  const { garage } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const { data: quotes, isLoading } = useQuotes(garage?.id)
  const sendQuote = useSendQuote()
  const reviseQuote = useReviseQuote()
  const [busyId, setBusyId] = useState<string | null>(null)

  async function copyLink(token: string | null) {
    const link = clientQuoteLink(token)
    if (!link) { toast.error('Lien indisponible'); return }
    try { await navigator.clipboard.writeText(link); toast.success('Lien client copié', isDemo() ? DEMO_QUOTE_LINK_HINT : undefined) }
    catch { toast.error('Copie impossible', link) }
  }

  async function onSend(q: Quote) {
    if (!garage) return
    // Validity date is mandatory before sending — send the garage to the editor to fix it.
    const blocked = quoteSendBlockReason(q.valid_until)
    if (blocked) {
      toast.error(blocked, 'Complétez la date de validité du devis.')
      navigate(`/pro/quotes/${q.id}`)
      return
    }
    setBusyId(q.id)
    try {
      const row = await sendQuote.mutateAsync({ id: q.id, garageId: garage.id })
      const link = clientQuoteLink(row.client_token)
      if (link) await navigator.clipboard.writeText(link).catch(() => {})
      toast.success('Devis envoyé', isDemo() ? DEMO_QUOTE_LINK_HINT : 'Lien de consultation copié dans le presse-papier')
    } catch (e) {
      toast.error('Envoi impossible', (e as Error).message)
    } finally { setBusyId(null) }
  }

  async function onRevise(q: Quote) {
    if (!garage) return
    setBusyId(q.id)
    try {
      const row = await reviseQuote.mutateAsync({ id: q.id, garageId: garage.id })
      toast.success('Révision créée', 'Nouveau brouillon prêt à modifier')
      navigate(`/pro/quotes/${row.id}`)
    } catch (e) {
      toast.error('Révision impossible', (e as Error).message)
    } finally { setBusyId(null) }
  }

  async function onDownload(q: Quote) {
    setBusyId(q.id)
    try {
      const lines: QuoteLine[] = isDemo()
        ? demo.quoteLines(q.id)
        : (await supabase.from('quote_lines').select('*').eq('quote_id', q.id).order('sort_order')).data ?? []
      const { downloadQuotePdf } = await import('./quotePdf')
      await downloadQuotePdf({ quote: q, lines, garage })
    } catch (e) {
      toast.error('Génération PDF impossible', (e as Error).message)
    } finally { setBusyId(null) }
  }

  return (
    <div>
      <PageHeader
        title="Devis"
        subtitle="Brouillon → envoyé au client → accepté ou refusé. Suivez chaque étape ici."
        action={<Button onClick={() => navigate('/pro/quotes/new')}><Plus className="h-4 w-4" /> Nouveau devis</Button>}
      />

      {isLoading ? (
        <LoadingState />
      ) : (quotes ?? []).length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucun devis"
          description="Créez un devis depuis une réservation (« Créer un devis ») ou à la main."
          action={<Button onClick={() => navigate('/pro/quotes/new')}>Créer un devis</Button>}
        />
      ) : (
        <Card className="divide-y divide-border">
          {quotes!.map((q) => {
            const status = effectiveQuoteStatus(q)
            const meta = QUOTE_STATUS_META[status] ?? { label: q.status, tone: 'neutral' as const }
            const busy = busyId === q.id
            const vehicle = (q.vehicle_label ?? '').split(' · ')[0]
            return (
              <div key={q.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{q.title}</p>
                    {q.revised_from && <Badge tone="neutral">Révision</Badge>}
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {q.number} · {q.client_name ?? '—'}{vehicle ? ` · ${vehicle}` : ''}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Créé le {shortDate(q.created_at)}
                    {q.sent_at ? ` · Envoyé le ${shortDate(q.sent_at)}` : ''}
                    {q.accepted_at ? ` · Accepté le ${shortDate(q.accepted_at)}` : ''}
                    {q.declined_at ? ` · Refusé le ${shortDate(q.declined_at)}` : ''}
                  </p>
                  {status === 'declined' && q.decline_reason && (
                    <p className="mt-1 text-xs text-danger">Motif : {q.decline_reason}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <span className="font-semibold">{euro(q.total)}</span>
                  <StatusPill {...meta} />

                  <Button size="sm" variant="ghost" onClick={() => navigate(`/print/quote/${q.id}`)}><Eye className="h-4 w-4" /> Aperçu</Button>

                  {status === 'draft' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/pro/quotes/${q.id}`)}><Pencil className="h-4 w-4" /> Modifier</Button>
                      <Button size="sm" onClick={() => onSend(q)} loading={busy} disabled={!canSendQuote(status)}><Send className="h-4 w-4" /> Envoyer</Button>
                    </>
                  )}

                  {(status === 'sent' || status === 'accepted') && (
                    <Button size="sm" variant="outline" onClick={() => onDownload(q)} loading={busy}><Download className="h-4 w-4" /> PDF</Button>
                  )}
                  {status === 'sent' && q.client_token && (
                    <Button size="sm" variant="outline" onClick={() => copyLink(q.client_token)}><Link2 className="h-4 w-4" /> Lien client</Button>
                  )}

                  {canReviseQuote(status) && (
                    <Button size="sm" variant="outline" onClick={() => onRevise(q)} loading={busy} title="Créer une révision du devis (nouveau brouillon)"><RotateCcw className="h-4 w-4" /> Créer une révision</Button>
                  )}
                </div>
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}

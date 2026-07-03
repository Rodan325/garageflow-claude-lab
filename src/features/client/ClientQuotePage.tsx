import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, Download, FileText, ShieldCheck, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { LoadingState, EmptyState } from '@/components/ui/feedback'
import { useToast } from '@/components/ui/toast'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { LegalFooter } from '@/components/common/LegalFooter'
import { usePublicQuote, useAcceptPublicQuote, useDeclinePublicQuote } from '@/data/quotes'
import { effectiveQuoteStatus, clientCanRespond } from '@/lib/quoteStatus'
import { euro, shortDate } from '@/lib/format'
import type { Garage, Quote, QuoteLine } from '@/types/domain'

/**
 * Public, shareable quote consultation (no login). A garage sends the client a
 * tokenised link (/devis/:token); the client can read it, download the PDF and
 * accept or refuse. Only this one quote is reachable via the token.
 */
export function ClientQuotePage() {
  const { token } = useParams()
  const toast = useToast()
  const { data: view, isLoading } = usePublicQuote(token)
  const accept = useAcceptPublicQuote()
  const decline = useDeclinePublicQuote()
  const [mode, setMode] = useState<'idle' | 'accept' | 'decline'>('idle')
  const [reason, setReason] = useState('')
  const [downloading, setDownloading] = useState(false)

  if (isLoading) return <Shell><LoadingState /></Shell>
  if (!view) {
    return (
      <Shell>
        <div className="py-16">
          <EmptyState icon={FileText} title="Devis introuvable" description="Ce lien n’est plus valide ou le devis a été supprimé. Contactez le garage." />
        </div>
      </Shell>
    )
  }

  const { quote, lines, garage } = view
  const status = effectiveQuoteStatus(quote)
  const accent = garage.accent_color || '#0f766e'
  const [vehicleName, plate] = (quote.vehicle_label ?? '').split(' · ')

  async function onAccept() {
    if (!token) return
    try { await accept.mutateAsync({ token }); setMode('idle'); toast.success('Devis accepté', 'Le garage en est informé.') }
    catch (e) { toast.error('Action impossible', (e as Error).message) }
  }
  async function onDecline() {
    if (!token) return
    try { await decline.mutateAsync({ token, reason: reason.trim() || null }); setMode('idle'); toast.success('Devis refusé', 'Le garage en est informé.') }
    catch (e) { toast.error('Action impossible', (e as Error).message) }
  }

  async function download() {
    setDownloading(true)
    try {
      const pdfQuote = {
        number: quote.number, title: quote.title, vehicle_label: quote.vehicle_label,
        client_name: quote.client_name, client_phone: quote.client_phone, client_email: quote.client_email,
        created_at: quote.created_at, valid_until: quote.valid_until,
        subtotal: quote.subtotal, tax_total: quote.tax_total, total: quote.total, conditions: quote.conditions,
      } as unknown as Quote
      const pdfLines = lines as unknown as QuoteLine[]
      const pdfGarage = garage as unknown as Garage
      const { downloadQuotePdf } = await import('@/features/pro/quotePdf')
      await downloadQuotePdf({ quote: pdfQuote, lines: pdfLines, garage: pdfGarage })
    } catch (e) {
      toast.error('Génération PDF impossible', (e as Error).message)
    } finally { setDownloading(false) }
  }

  return (
    <Shell>
      {/* Garage header */}
      <div className="flex items-center gap-3 border-b border-border pb-4">
        {garage.logo_url ? (
          <img src={garage.logo_url} alt="" className="h-12 w-12 rounded object-contain" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded text-lg font-bold text-white" style={{ background: accent }}>
            {garage.name.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold">{garage.name}</p>
          <p className="truncate text-xs text-muted-foreground">{[garage.phone, garage.email].filter(Boolean).join(' · ') || garage.city}</p>
        </div>
      </div>

      {/* Status banner */}
      {status === 'accepted' && (
        <Banner tone="success" icon={ShieldCheck} title="Vous avez accepté ce devis"
          text={`${quote.accepted_at ? `Le ${shortDate(quote.accepted_at)}. ` : ''}Le garage peut maintenant planifier l’intervention.`} />
      )}
      {status === 'declined' && (
        <Banner tone="danger" icon={X} title="Vous avez refusé ce devis"
          text={[quote.declined_at ? `Le ${shortDate(quote.declined_at)}.` : '', quote.decline_reason ? `Motif : ${quote.decline_reason}` : ''].filter(Boolean).join(' ')} />
      )}
      {status === 'expired' && (
        <Banner tone="warning" icon={FileText} title="Ce devis a expiré"
          text={`${quote.valid_until ? `Il était valable jusqu’au ${shortDate(quote.valid_until)}. ` : ''}Contactez le garage pour une version à jour.`} />
      )}

      {/* Document */}
      <Card className="mt-4">
        <CardContent className="space-y-5 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-bold" style={{ color: accent }}>Devis</p>
              <p className="text-sm font-medium">{quote.number}</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>Date : {shortDate(quote.created_at)}</p>
              {quote.valid_until && <p>Valable jusqu’au {shortDate(quote.valid_until)}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="mb-0.5 text-xs uppercase tracking-wide text-muted-foreground">Client</p>
              <p className="font-medium">{quote.client_name || '—'}</p>
              {quote.client_phone && <p className="text-muted-foreground">{quote.client_phone}</p>}
            </div>
            <div>
              <p className="mb-0.5 text-xs uppercase tracking-wide text-muted-foreground">Véhicule</p>
              <p className="font-medium">{vehicleName || '—'}</p>
              {plate && <p className="font-semibold">{plate}</p>}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold">{quote.title}</p>
            <div className="mt-2 divide-y divide-border rounded-lg border border-border">
              {lines.map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate">{l.label}</p>
                    <p className="text-xs text-muted-foreground">{l.quantity} × {euro(l.unit_price)} · TVA {l.tax_rate}%</p>
                  </div>
                  <span className="font-medium">{euro(l.line_total)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ml-auto w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total HT</span><span>{euro(quote.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">TVA</span><span>{euro(quote.tax_total)}</span></div>
            <div className="flex justify-between border-t border-border pt-1 text-base font-bold">
              <span>Total TTC</span><span style={{ color: accent }}>{euro(quote.total)}</span>
            </div>
          </div>

          {quote.conditions && (
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="mb-1 font-medium text-foreground">Conditions</p>
              <p>{quote.conditions}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="mt-4 space-y-3">
        <Button variant="outline" className="w-full" onClick={download} loading={downloading}>
          <Download className="h-4 w-4" /> Télécharger le PDF
        </Button>

        {clientCanRespond(status) && mode === 'idle' && (
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setMode('decline')}><X className="h-4 w-4" /> Refuser</Button>
            <Button onClick={() => setMode('accept')}><Check className="h-4 w-4" /> Accepter</Button>
          </div>
        )}

        {mode === 'accept' && (
          <Card><CardContent className="space-y-3 py-4">
            <p className="text-sm font-medium">Confirmer l’acceptation de ce devis ?</p>
            <p className="text-xs text-muted-foreground">
              En acceptant ce devis, vous confirmez avoir lu le devis présenté et vous acceptez sa transmission au
              garage concerné. Votre acceptation est horodatée. Les{' '}
              <Link to="/terms" target="_blank" className="font-medium text-primary hover:underline">conditions d’utilisation</Link>{' '}
              et la{' '}
              <Link to="/privacy" target="_blank" className="font-medium text-primary hover:underline">politique de confidentialité</Link>{' '}
              s’appliquent. Si le garage exige un contrat ou un ordre de réparation signé, celui-ci reste applicable.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="ghost" onClick={() => setMode('idle')}>Annuler</Button>
              <Button onClick={onAccept} loading={accept.isPending}><Check className="h-4 w-4" /> Confirmer</Button>
            </div>
          </CardContent></Card>
        )}

        {mode === 'decline' && (
          <Card><CardContent className="space-y-3 py-4">
            <p className="text-sm font-medium">Refuser ce devis</p>
            <Textarea placeholder="Motif (optionnel) : prix, délai, plus besoin…" value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Button variant="ghost" onClick={() => setMode('idle')}>Annuler</Button>
              <Button variant="danger" onClick={onDecline} loading={decline.isPending}><X className="h-4 w-4" /> Refuser le devis</Button>
            </div>
          </CardContent></Card>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">Devis émis par {garage.name} via GarageFlow.</p>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Données personnelles, confidentialité et conditions d’utilisation :{' '}
        <Link to="/privacy" className="font-medium text-primary hover:underline">Politique de confidentialité</Link>
        {' · '}
        <Link to="/terms" className="font-medium text-primary hover:underline">CGU</Link>
      </p>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur">
        <span className="text-sm font-semibold">GarageFlow</span>
        <ThemeToggle />
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</main>
      <LegalFooter className="border-t border-border" />
    </div>
  )
}

type BannerTone = 'success' | 'danger' | 'warning'
function Banner({ tone, icon: Icon, title, text }: { tone: BannerTone; icon: typeof Check; title: string; text: string }) {
  const tones: Record<BannerTone, string> = {
    success: 'border-success/40 bg-success/10 text-success',
    danger: 'border-danger/40 bg-danger/10 text-danger',
    warning: 'border-warning/40 bg-warning/10 text-warning-foreground',
  }
  return (
    <div className={`mt-4 flex items-start gap-3 rounded-lg border p-3 ${tones[tone]}`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {text && <p className="text-xs opacity-90">{text}</p>}
      </div>
    </div>
  )
}

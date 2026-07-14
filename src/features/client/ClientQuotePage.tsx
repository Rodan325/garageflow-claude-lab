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
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { getBrand, useBrand, type Brand } from '@/branding'
import { usePublicQuote, useAcceptPublicQuote, useDeclinePublicQuote } from '@/data/quotes'
import { effectiveQuoteStatus, clientCanRespond } from '@/lib/quoteStatus'
import { euro, shortDate } from '@/lib/format'
import type { Garage, Quote, QuoteLine } from '@/types/domain'
import { useLang } from '@/i18n'
import { localizeDemoText } from '@/i18n/demoContent'
import { demoPublicQuoteBrand } from '@/lib/demo'

/**
 * Public, shareable quote consultation (no login). A garage sends the client a
 * tokenised link (/devis/:token); the client can read it, download the PDF and
 * accept or refuse. Only this one quote is reachable via the token.
 */
export function ClientQuotePage() {
  const { lang, tr } = useLang()
  const { token } = useParams()
  const { brand } = useBrand()
  const quoteBrandId = demoPublicQuoteBrand(token)
  const publicBrand = quoteBrandId ? getBrand(quoteBrandId) : brand
  const isDemoPublicQuote = quoteBrandId !== null
  const toast = useToast()
  const { data: view, isLoading } = usePublicQuote(token)
  const accept = useAcceptPublicQuote()
  const decline = useDeclinePublicQuote()
  const [mode, setMode] = useState<'idle' | 'accept' | 'decline'>('idle')
  const [reason, setReason] = useState('')
  const [downloading, setDownloading] = useState(false)

  if (isLoading) return <Shell brand={publicBrand}><LoadingState /></Shell>
  if (!view) {
    return (
      <Shell brand={publicBrand}>
        <div className="py-16">
          <EmptyState icon={FileText} title={tr('Devis introuvable')} description={tr('Ce lien n’est plus valide ou le devis a été supprimé. Contactez le garage.')} />
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
    try { await accept.mutateAsync({ token }); setMode('idle'); toast.success(tr('Devis accepté'), tr('Le garage en est informé.')) }
    catch { toast.error(tr('Action impossible'), tr('L’action n’a pas pu être réalisée.')) }
  }
  async function onDecline() {
    if (!token) return
    try { await decline.mutateAsync({ token, reason: reason.trim() || null }); setMode('idle'); toast.success(tr('Devis refusé'), tr('Le garage en est informé.')) }
    catch { toast.error(tr('Action impossible'), tr('L’action n’a pas pu être réalisée.')) }
  }

  async function download() {
    setDownloading(true)
    try {
      const pdfQuote = {
        number: quote.number, title: quote.title, vehicle_label: quote.vehicle_label,
        client_name: quote.client_name, client_phone: quote.client_phone, client_email: quote.client_email,
        created_at: quote.created_at, valid_until: quote.valid_until,
        subtotal: quote.subtotal, tax_total: quote.tax_total, total: quote.total, conditions: quote.conditions,
        client_token: token,
      } as unknown as Quote
      const pdfLines = lines as unknown as QuoteLine[]
      const pdfGarage = garage as unknown as Garage
      const { downloadQuotePdf } = await import('@/features/pro/quotePdf')
      await downloadQuotePdf({ quote: pdfQuote, lines: pdfLines, garage: pdfGarage, lang })
    } catch {
      toast.error(tr('Génération PDF impossible'), tr('Le PDF n’a pas pu être généré.'))
    } finally { setDownloading(false) }
  }

  return (
    <Shell brand={publicBrand}>
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

      {!publicBrand.official && publicBrand.demoNotice && (
        <p className="mt-4 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-center text-xs font-medium text-warning-foreground">
          {tr(publicBrand.demoNotice)}
        </p>
      )}

      {/* Status banner */}
      {status === 'accepted' && (
        <Banner tone="success" icon={ShieldCheck} title={tr('Vous avez accepté ce devis')}
          text={`${quote.accepted_at ? `${tr('Le {date}.', { date: shortDate(quote.accepted_at, lang) })} ` : ''}${tr('Le garage peut maintenant planifier l’intervention.')}`} />
      )}
      {status === 'declined' && (
        <Banner tone="danger" icon={X} title={tr('Vous avez refusé ce devis')}
          text={[quote.declined_at ? tr('Le {date}.', { date: shortDate(quote.declined_at, lang) }) : '', quote.decline_reason ? tr('Motif : {reason}', { reason: localizeDemoText(quote.decline_reason, lang, isDemoPublicQuote) }) : ''].filter(Boolean).join(' ')} />
      )}
      {status === 'expired' && (
        <Banner tone="warning" icon={FileText} title={tr('Ce devis a expiré')}
          text={`${quote.valid_until ? `${tr('Il était valable jusqu’au {date}.', { date: shortDate(quote.valid_until, lang) })} ` : ''}${tr('Contactez le garage pour une version à jour.')}`} />
      )}

      {/* Document */}
      <Card className="mt-4">
        <CardContent className="space-y-5 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-bold" style={{ color: accent }}>{tr('Devis')}</p>
              <p className="text-sm font-medium">{quote.number}</p>
            </div>
            <div className="text-end text-xs text-muted-foreground">
              <p>{tr('Date : {date}', { date: shortDate(quote.created_at, lang) })}</p>
              {quote.valid_until && <p>{tr('Valable jusqu’au {date}', { date: shortDate(quote.valid_until, lang) })}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="mb-0.5 text-xs uppercase tracking-wide text-muted-foreground">{tr('Client')}</p>
              <p className="font-medium">{quote.client_name || '—'}</p>
              {quote.client_phone && <p className="text-muted-foreground">{quote.client_phone}</p>}
            </div>
            <div>
              <p className="mb-0.5 text-xs uppercase tracking-wide text-muted-foreground">{tr('Véhicule')}</p>
              <p className="font-medium">{vehicleName || '—'}</p>
              {plate && <p className="font-semibold">{plate}</p>}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold">{localizeDemoText(quote.title, lang, isDemoPublicQuote)}</p>
            <div className="mt-2 divide-y divide-border rounded-lg border border-border">
              {lines.map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate">{localizeDemoText(l.label, lang, isDemoPublicQuote)}</p>
                    <p className="text-xs text-muted-foreground">{tr('{quantity} × {price} · TVA {rate} %', { quantity: l.quantity, price: euro(l.unit_price, lang), rate: l.tax_rate })}</p>
                  </div>
                  <span className="font-medium">{euro(l.line_total, lang)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ms-auto w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{tr('Total HT')}</span><span>{euro(quote.subtotal, lang)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{tr('TVA')}</span><span>{euro(quote.tax_total, lang)}</span></div>
            <div className="flex justify-between border-t border-border pt-1 text-base font-bold">
              <span>{tr('Total TTC')}</span><span style={{ color: accent }}>{euro(quote.total, lang)}</span>
            </div>
          </div>

          {quote.conditions && (
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="mb-1 font-medium text-foreground">{tr('Conditions')}</p>
              <p>{localizeDemoText(quote.conditions, lang, isDemoPublicQuote)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="mt-4 space-y-3">
        <Button variant="outline" className="w-full" onClick={download} loading={downloading}>
          <Download className="h-4 w-4" /> {tr('Télécharger le PDF')}
        </Button>

        {clientCanRespond(status) && mode === 'idle' && (
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setMode('decline')}><X className="h-4 w-4" /> {tr('Refuser')}</Button>
            <Button onClick={() => setMode('accept')}><Check className="h-4 w-4" /> {tr('Accepter')}</Button>
          </div>
        )}

        {mode === 'accept' && (
          <Card><CardContent className="space-y-3 py-4">
            <p className="text-sm font-medium">{tr('Confirmer l’acceptation de ce devis ?')}</p>
            <p className="text-xs text-muted-foreground">
              {tr('En acceptant ce devis, vous confirmez l’avoir lu et acceptez sa transmission au garage concerné. Votre acceptation est horodatée. Les')}{' '}
              <Link to="/terms" target="_blank" className="font-medium text-primary hover:underline">{tr('conditions d’utilisation')}</Link>{' '}
              {tr('et la')}{' '}
              <Link to="/privacy" target="_blank" className="font-medium text-primary hover:underline">{tr('politique de confidentialité')}</Link>{' '}
              {tr('s’appliquent. Si le garage exige un contrat ou un ordre de réparation signé, celui-ci reste applicable.')}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="ghost" onClick={() => setMode('idle')}>{tr('Annuler')}</Button>
              <Button onClick={onAccept} loading={accept.isPending}><Check className="h-4 w-4" /> {tr('Confirmer')}</Button>
            </div>
          </CardContent></Card>
        )}

        {mode === 'decline' && (
          <Card><CardContent className="space-y-3 py-4">
            <p className="text-sm font-medium">{tr('Refuser ce devis')}</p>
            <Textarea placeholder={tr('Motif (optionnel) : prix, délai, plus besoin…')} value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Button variant="ghost" onClick={() => setMode('idle')}>{tr('Annuler')}</Button>
              <Button variant="danger" onClick={onDecline} loading={decline.isPending}><X className="h-4 w-4" /> {tr('Refuser le devis')}</Button>
            </div>
          </CardContent></Card>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">{tr('Devis émis par {garage} via {app}.', { garage: garage.name, app: publicBrand.appName })}</p>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {tr('Données personnelles, confidentialité et conditions d’utilisation :')}{' '}
        <Link to="/privacy" className="font-medium text-primary hover:underline">{tr('Politique de confidentialité')}</Link>
        {' · '}
        <Link to="/terms" className="font-medium text-primary hover:underline">{tr('CGU')}</Link>
      </p>
    </Shell>
  )
}

function Shell({ children, brand }: { children: React.ReactNode; brand: Brand }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur">
        <span className="text-sm font-semibold">{brand.appName}</span>
        <div className="flex items-center gap-1"><LanguageSwitcher /><ThemeToggle /></div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</main>
      <LegalFooter className="border-t border-border" brandOverride={brand} />
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

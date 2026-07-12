import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Printer } from 'lucide-react'
import { LoadingState, EmptyState } from '@/components/ui/feedback'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/features/auth/AuthProvider'
import { useQuote, useQuoteLines } from '@/data/quotes'
import { useCustomers } from '@/data/proData'
import { euro, shortDate } from '@/lib/format'

/**
 * Standalone, print-ready quote document (rendered outside the Pro shell).
 * Uses explicit document colours (not theme tokens) so it prints correctly,
 * and the browser's "Imprimer → Enregistrer en PDF" produces a clean PDF.
 */
export function QuotePrintPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { garage } = useAuth()
  const toast = useToast()
  const { data: quote, isLoading } = useQuote(id)
  const { data: lines } = useQuoteLines(id)
  const { data: customers } = useCustomers(garage?.id)
  const [downloading, setDownloading] = useState(false)
  const accent = garage?.accent_color || '#0f766e'

  async function download() {
    if (!quote) return
    setDownloading(true)
    try {
      const customer = customers?.find((c) => c.id === quote.customer_id)
      const { downloadQuotePdf } = await import('./quotePdf')
      await downloadQuotePdf({ quote, lines: lines ?? [], garage, customer })
    } catch (e) {
      toast.error('Génération PDF impossible', (e as Error).message)
    } finally {
      setDownloading(false)
    }
  }

  if (isLoading) return <LoadingState />
  if (!quote) return <div className="p-8"><EmptyState title="Devis introuvable" /></div>

  return (
    <div lang="fr" dir="ltr" className="min-h-dvh bg-slate-100 py-6 print:bg-white print:py-0">
      {/* Toolbar (hidden when printing) */}
      <div className="mx-auto mb-4 flex max-w-[800px] items-center justify-between px-4 print:hidden">
        <button onClick={() => navigate('/pro/quotes')} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Devis
        </button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Imprimer</Button>
          <Button onClick={download} loading={downloading}><Download className="h-4 w-4" /> Télécharger le PDF</Button>
        </div>
      </div>

      {/* Document */}
      <div className="mx-auto max-w-[800px] bg-white p-10 text-slate-800 shadow-sm print:max-w-none print:p-0 print:shadow-none">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 border-b-2 pb-5" style={{ borderColor: accent }}>
          <div className="flex items-center gap-4">
            {garage?.logo_url ? (
              <img src={garage.logo_url} alt="" className="h-16 w-16 rounded object-contain" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded text-2xl font-bold text-white" style={{ background: accent }}>
                {(garage?.name ?? 'G').slice(0, 1)}
              </div>
            )}
            <div>
              <p className="text-lg font-bold text-slate-900">{garage?.name ?? 'Garage'}</p>
              {garage?.address && <p className="text-sm text-slate-500">{garage.address}{garage.city ? `, ${garage.city}` : ''}</p>}
              <p className="text-sm text-slate-500">
                {[garage?.phone, garage?.email].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold" style={{ color: accent }}>DEVIS</p>
            <p className="text-sm font-medium text-slate-700">{quote.number}</p>
            <p className="text-xs text-slate-500">Date : {shortDate(quote.created_at)}</p>
            {quote.valid_until && <p className="text-xs text-slate-500">Valable jusqu’au {shortDate(quote.valid_until)}</p>}
          </div>
        </div>

        {/* Client / vehicle */}
        <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Client</p>
            <p className="font-medium text-slate-900">{quote.client_name || '—'}</p>
            {quote.client_phone && <p className="text-slate-500">{quote.client_phone}</p>}
            {quote.client_email && <p className="text-slate-500">{quote.client_email}</p>}
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Véhicule</p>
            <p className="font-medium text-slate-900">{(quote.vehicle_label || '—').split(' · ')[0]}</p>
            {quote.vehicle_label?.includes(' · ') && (
              <p className="font-semibold text-slate-900">Immatriculation : {quote.vehicle_label.split(' · ')[1]}</p>
            )}
          </div>
        </div>

        <p className="mt-6 text-base font-semibold text-slate-900">{quote.title}</p>

        {/* Lines */}
        <table className="mt-3 w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500" style={{ borderBottom: `1px solid ${accent}` }}>
              <th className="py-2">Désignation</th>
              <th className="py-2 text-right">Qté</th>
              <th className="py-2 text-right">PU HT</th>
              <th className="py-2 text-right">TVA</th>
              <th className="py-2 text-right">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {(lines ?? []).map((l) => (
              <tr key={l.id} className="border-b border-slate-100">
                <td className="py-2 pr-2">{l.label}</td>
                <td className="py-2 text-right">{l.quantity}</td>
                <td className="py-2 text-right">{euro(l.unit_price)}</td>
                <td className="py-2 text-right">{l.tax_rate}%</td>
                <td className="py-2 text-right">{euro(l.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-4 flex justify-end">
          <div className="w-60 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Total HT</span><span>{euro(quote.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">TVA</span><span>{euro(quote.tax_total)}</span></div>
            <div className="mt-1 flex justify-between border-t-2 pt-1 text-base font-bold" style={{ borderColor: accent }}>
              <span>Total TTC</span><span style={{ color: accent }}>{euro(quote.total)}</span>
            </div>
          </div>
        </div>

        {/* Conditions */}
        {quote.conditions && (
          <div className="mt-6 text-xs text-slate-500">
            <p className="mb-1 font-semibold text-slate-600">Conditions</p>
            <p>{quote.conditions}</p>
          </div>
        )}

        {/* Signature */}
        <div className="mt-8 flex items-end justify-between">
          <div className="text-[11px] text-slate-400">
            {garage?.legal_info || [garage?.legal_name, garage?.siret ? `SIRET ${garage.siret}` : null, garage?.vat_number].filter(Boolean).join(' · ')}
          </div>
          <div className="w-56 rounded border border-slate-300 p-3 text-center text-xs text-slate-500">
            <p className="font-medium text-slate-700">Bon pour accord</p>
            <p className="mt-6">Date et signature</p>
          </div>
        </div>
      </div>
    </div>
  )
}

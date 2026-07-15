import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Download, FileCheck2, LockKeyhole } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState, LoadingState } from '@/components/ui/feedback'
import { Field, Input, Textarea } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { useDeliveryReport, useSaveDeliveryReport } from '@/data/reports'
import { useAttachments } from '@/data/attachments'
import { useGarageRequests } from '@/data/requests'
import { useAuth } from '@/features/auth/AuthProvider'
import { useLang } from '@/i18n'
import { deliveryReportsEnabled } from '@/lib/features'
import type { DeliveryReport } from './model'

function splitLines(value: string) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean)
}

export function DeliveryReportPage() {
  const { requestId } = useParams()
  const { garage } = useAuth()
  const { lang, tr } = useLang()
  const toast = useToast()
  const { data: requests, isLoading: requestsLoading } = useGarageRequests(garage?.id)
  const { data: report, isLoading: reportLoading } = useDeliveryReport(requestId)
  const { data: attachments } = useAttachments(requestId)
  const save = useSaveDeliveryReport()
  const request = requests?.find((item) => item.id === requestId)
  const [form, setForm] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!request) return
    setForm({
      entry_mileage: report?.entry_mileage?.toString() ?? '',
      exit_mileage: report?.exit_mileage?.toString() ?? '',
      requested_work: (report?.requested_work ?? [request.service_name]).join('\n'),
      diagnostic_summary: report?.diagnostic_summary ?? '',
      completed_work: report?.completed_work.join('\n') ?? '',
      accepted_recommendations: report?.accepted_recommendations.join('\n') ?? '',
      deferred_recommendations: report?.deferred_recommendations.join('\n') ?? '',
      parts: report?.parts.join('\n') ?? '',
      observations: report?.observations ?? '',
      next_due_date: report?.next_due_date ?? '',
      next_due_mileage: report?.next_due_mileage?.toString() ?? '',
      warranty_terms: report?.warranty_terms ?? '',
      final_validation: report?.final_validation ?? '',
      authorized_attachment_ids: report?.authorized_attachment_ids.join(',') ?? '',
    })
  }, [report, request])

  if (!deliveryReportsEnabled()) return <EmptyState title={tr('Rapports de restitution indisponibles')} />
  if (requestsLoading || reportLoading) return <LoadingState />
  if (!request) return <EmptyState title={tr('Demande introuvable')} />
  const currentRequest = request

  const locked = report?.status === 'finalized'
  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const payload: Partial<DeliveryReport> = {
    customer_snapshot: report?.customer_snapshot ?? { name: currentRequest.contact_name ?? 'Client' },
    vehicle_snapshot: report?.vehicle_snapshot ?? { label: currentRequest.vehicle_label },
    entry_mileage: form.entry_mileage ? Number(form.entry_mileage) : null,
    exit_mileage: form.exit_mileage ? Number(form.exit_mileage) : null,
    requested_work: splitLines(form.requested_work ?? ''),
    diagnostic_summary: form.diagnostic_summary || null,
    completed_work: splitLines(form.completed_work ?? ''),
    accepted_recommendations: splitLines(form.accepted_recommendations ?? ''),
    deferred_recommendations: splitLines(form.deferred_recommendations ?? ''),
    parts: splitLines(form.parts ?? ''),
    observations: form.observations || null,
    next_due_date: form.next_due_date || null,
    next_due_mileage: form.next_due_mileage ? Number(form.next_due_mileage) : null,
    warranty_terms: form.warranty_terms || null,
    final_validation: form.final_validation || null,
    authorized_attachment_ids: (form.authorized_attachment_ids ?? '').split(',').filter(Boolean),
  }

  async function persist(finalize: boolean) {
    try {
      await save.mutateAsync({ requestId: currentRequest.id, report: payload, finalize })
      toast.success(finalize ? tr('Rapport finalisé') : tr('Brouillon enregistré'))
    } catch {
      toast.error(tr('Enregistrement impossible'), tr('Vérifiez les kilométrages et les informations du rapport.'))
    }
  }

  async function download() {
    if (!report) return
    const { downloadDeliveryReportPdf } = await import('./reportPdf')
    await downloadDeliveryReportPdf({ report, request: currentRequest, garage, lang, attachments })
  }

  return (
    <div>
      <Link to="/pro/workshop" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {tr('Retour à l’atelier')}
      </Link>
      <PageHeader
        title={tr('Rapport de restitution')}
        subtitle={`${currentRequest.reference} · ${currentRequest.vehicle_label}`}
        action={report ? <Button variant="secondary" onClick={download}><Download className="h-4 w-4" /> {tr('Télécharger le PDF')}</Button> : undefined}
      />
      {locked && (
        <Card className="mb-4 flex items-center gap-3 border-success/30 bg-success/5 p-3 text-sm">
          <LockKeyhole className="h-4 w-4 text-success" />
          <span>{tr('Ce rapport est finalisé et ne peut plus être modifié.')}</span>
        </Card>
      )}
      <Card className="space-y-5 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={tr('Kilométrage à l’entrée')}><Input type="number" min="0" value={form.entry_mileage ?? ''} onChange={(event) => set('entry_mileage', event.target.value)} disabled={locked} /></Field>
          <Field label={tr('Kilométrage à la sortie')}><Input type="number" min="0" value={form.exit_mileage ?? ''} onChange={(event) => set('exit_mileage', event.target.value)} disabled={locked} /></Field>
        </div>
        <ReportField label={tr('Travaux demandés')} value={form.requested_work} onChange={(value) => set('requested_work', value)} disabled={locked} />
        <ReportField label={tr('Diagnostic')} value={form.diagnostic_summary} onChange={(value) => set('diagnostic_summary', value)} disabled={locked} />
        <ReportField label={tr('Prestations réalisées')} value={form.completed_work} onChange={(value) => set('completed_work', value)} disabled={locked} />
        <div className="grid gap-4 sm:grid-cols-2">
          <ReportField label={tr('Recommandations acceptées')} value={form.accepted_recommendations} onChange={(value) => set('accepted_recommendations', value)} disabled={locked} />
          <ReportField label={tr('Recommandations refusées ou reportées')} value={form.deferred_recommendations} onChange={(value) => set('deferred_recommendations', value)} disabled={locked} />
        </div>
        <ReportField label={tr('Pièces utilisées')} value={form.parts} onChange={(value) => set('parts', value)} disabled={locked} />
        {!!attachments?.filter((item) => item.visibility !== 'internal').length && (
          <Field label={tr('Photos et documents autorisés')}>
            <div className="grid gap-2 sm:grid-cols-2">
              {attachments.filter((item) => item.visibility !== 'internal').map((attachment) => {
                const selected = (form.authorized_attachment_ids ?? '').split(',').includes(attachment.id)
                return (
                  <label key={attachment.id} className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={locked}
                      onChange={(event) => {
                        const ids = (form.authorized_attachment_ids ?? '').split(',').filter(Boolean)
                        set('authorized_attachment_ids', event.target.checked ? [...ids, attachment.id].join(',') : ids.filter((id) => id !== attachment.id).join(','))
                      }}
                    />
                    <span className="truncate">{attachment.file_name}</span>
                  </label>
                )
              })}
            </div>
          </Field>
        )}
        <ReportField label={tr('Observations')} value={form.observations} onChange={(value) => set('observations', value)} disabled={locked} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={tr('Prochaine échéance')}><Input type="date" value={form.next_due_date ?? ''} onChange={(event) => set('next_due_date', event.target.value)} disabled={locked} /></Field>
          <Field label={tr('Prochain kilométrage')}><Input type="number" min="0" value={form.next_due_mileage ?? ''} onChange={(event) => set('next_due_mileage', event.target.value)} disabled={locked} /></Field>
        </div>
        <ReportField label={tr('Garantie')} value={form.warranty_terms} onChange={(value) => set('warranty_terms', value)} disabled={locked} />
        <ReportField label={tr('Validation finale')} value={form.final_validation} onChange={(value) => set('final_validation', value)} disabled={locked} />
        {!locked && (
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" loading={save.isPending} onClick={() => persist(false)}>{tr('Enregistrer le brouillon')}</Button>
            <Button loading={save.isPending} onClick={() => persist(true)}><FileCheck2 className="h-4 w-4" /> {tr('Finaliser le rapport')}</Button>
          </div>
        )}
      </Card>
    </div>
  )
}

function ReportField({ label, value = '', onChange, disabled }: { label: string; value?: string; onChange: (value: string) => void; disabled: boolean }) {
  return <Field label={label}><Textarea value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} /></Field>
}

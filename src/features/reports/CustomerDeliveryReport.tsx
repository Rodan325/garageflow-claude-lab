import { Download, FileCheck2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useDeliveryReport } from '@/data/reports'
import { useAttachments } from '@/data/attachments'
import { useGarages } from '@/data/garagePublic'
import { useLang } from '@/i18n'
import type { ServiceRequest } from '@/types/domain'

export function CustomerDeliveryReport({ request }: { request: ServiceRequest }) {
  const { lang, tr } = useLang()
  const { data: report } = useDeliveryReport(request.id, true)
  const { data: attachments } = useAttachments(request.id, true)
  const { data: garages } = useGarages()
  const garage = garages?.find((item) => item.id === request.garage_id) ?? null
  if (!report) return null

  async function download() {
    const { downloadDeliveryReportPdf } = await import('./reportPdf')
    await downloadDeliveryReportPdf({ report: report!, request, garage, lang, attachments })
  }

  return (
    <Card className="mt-5 flex flex-wrap items-center gap-3 p-4">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-success/10 text-success"><FileCheck2 className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{tr('Rapport de restitution')}</p>
        <p className="text-xs text-muted-foreground">{report.report_number}</p>
      </div>
      <Button size="sm" variant="secondary" onClick={download}><Download className="h-4 w-4" /> {tr('Télécharger le PDF')}</Button>
    </Card>
  )
}

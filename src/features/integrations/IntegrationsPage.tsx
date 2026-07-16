import { useState } from 'react'
import { FileSpreadsheet, PlugZap, ShieldCheck } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/input'
import { useLang } from '@/i18n'
import { integrationsEnabled } from '@/lib/features'
import { isDemo } from '@/lib/demo'
import type { ImportReport } from './adapters'
import type { CsvImportPreview } from './csvImport'
import { DemoCsvImportAdapter } from './DemoCsvImportAdapter'

const SAMPLE = `entity_type,name,city,first_name,last_name,email,brand,model,registration,customer_email,title,starts_at,category,duration_minutes,price_from
center,Atelier Est,Lyon,,,,,,,,,,,,
customer,,,Nora,Martin,nora@example.fr,,,,,,,,,
vehicle,,,,,,Renault,Clio,AA-123-AA,nora@example.fr,,,,,
appointment,,,,,,,,,nora@example.fr,Revision,2026-08-10T09:00:00Z,,,
service,Revision,,,,,,,,,,,Entretien,60,99`

export function IntegrationsPage() {
  const { tr } = useLang()
  const [source, setSource] = useState(SAMPLE)
  const [preview, setPreview] = useState<CsvImportPreview | null>(null)
  const [report, setReport] = useState<ImportReport | null>(null)
  const adapter = new DemoCsvImportAdapter()
  if (!integrationsEnabled()) return <Navigate to="/pro" replace />

  async function inspect() {
    setPreview(await adapter.preview(source))
    setReport(null)
  }

  async function execute() {
    if (!preview || !isDemo()) return
    setReport(await adapter.import(preview.rows))
  }

  return (
    <div>
      <PageHeader
        title={tr('Intégrations et imports')}
        subtitle={tr('Préparez vos données avec des adaptateurs génériques, sans dépendre d’un fournisseur.')}
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <div><p className="font-semibold">{tr('Import CSV')}</p><p className="text-xs text-muted-foreground">{tr('Établissements, clients, véhicules, rendez-vous et prestations')}</p></div>
          </div>
          <Textarea
            value={source}
            onChange={(event) => setSource(event.target.value)}
            className="min-h-64 font-mono text-xs"
            dir="ltr"
            aria-label={tr('Contenu CSV')}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={inspect}>{tr('Prévisualiser')}</Button>
            <Button variant="outline" onClick={() => { setSource(SAMPLE); setPreview(null); setReport(null) }}>{tr('Charger l’exemple')}</Button>
          </div>
          {preview && (
            <div className="mt-5 space-y-3" data-testid="csv-import-preview">
              <div className="flex flex-wrap gap-2">
                <Badge tone="success">{tr('{count} ligne(s) valide(s)', { count: preview.rows.length })}</Badge>
                <Badge tone={preview.issues.length ? 'warning' : 'neutral'}>{tr('{count} erreur(s)', { count: preview.issues.length })}</Badge>
                <Badge>{tr('{count} doublon(s)', { count: preview.duplicateRows })}</Badge>
              </div>
              {preview.rows.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-start text-sm">
                    <thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="p-2 text-start">{tr('Ligne')}</th><th className="p-2 text-start">{tr('Type')}</th><th className="p-2 text-start">{tr('Identifiant de dédoublonnage')}</th></tr></thead>
                    <tbody>{preview.rows.map((row) => <tr key={row.line} className="border-t border-border"><td className="p-2">{row.line}</td><td className="p-2">{tr(row.entityType)}</td><td className="p-2 font-mono text-xs">{row.duplicateKey}</td></tr>)}</tbody>
                  </table>
                </div>
              )}
              {preview.issues.length > 0 && (
                <ul className="space-y-1 rounded-lg bg-warning/10 p-3 text-sm text-warning-foreground">
                  {preview.issues.map((issue, index) => <li key={`${issue.line}-${index}`}>{tr('Ligne {line} : {message}', { line: issue.line, message: tr(issue.message) })}</li>)}
                </ul>
              )}
              {isDemo() ? (
                <Button onClick={execute} disabled={preview.rows.length === 0}>{tr('Simuler l’import validé')}</Button>
              ) : (
                <p className="text-sm text-muted-foreground">{tr('Aucun adaptateur serveur n’est connecté. La prévisualisation reste disponible sans envoyer de données.')}</p>
              )}
            </div>
          )}
          {report && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-success/10 p-3 text-sm text-success" role="status">
              <ShieldCheck className="h-4 w-4" /> {tr('Simulation terminée : {count} ligne(s) importée(s).', { count: report.imported })}
            </div>
          )}
        </Card>
        <Card className="h-fit p-4">
          <PlugZap className="h-6 w-6 text-primary" />
          <p className="mt-3 font-semibold">{tr('Adaptateurs disponibles')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{tr('CSV, API REST, webhook, DMS, CRM, calendrier, email et SMS.')}</p>
          <p className="mt-3 text-xs text-muted-foreground">{tr('Seul l’import CSV de démonstration est actif. Aucun service externe n’est appelé.')}</p>
        </Card>
      </div>
    </div>
  )
}

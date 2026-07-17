import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, CircleAlert, ExternalLink, ScrollText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingState } from '@/components/ui/feedback'
import { PageHeader } from '@/components/common/PageHeader'
import { useAuth } from '@/features/auth/AuthProvider'
import {
  LEGAL_DOCUMENT_META,
  LEGAL_DOCUMENT_VERSIONS,
  REQUIRED_LEGAL_DOCS,
  legalConfig,
} from '@/config/legal'
import { listOwnLegalAcceptances } from './legalAcceptance'
import { LOCALES, useLang } from '@/i18n'

/**
 * Garage-side legal status: which documents apply, which versions were
 * accepted and when. Demo accounts show the product-facing document set only.
 * Reads ONLY the connected user's own acceptances (RLS).
 */
export function LegalStatusPage() {
  const { lang, tr } = useLang()
  const { userId, demo } = useAuth()
  const { data: acceptances, isLoading } = useQuery({
    queryKey: ['legal-acceptances', userId],
    enabled: !!userId && !demo,
    queryFn: () => listOwnLegalAcceptances(userId!),
  })

  const required = demo
    ? REQUIRED_LEGAL_DOCS.garage.filter((doc) => doc !== 'pilot_agreement')
    : REQUIRED_LEGAL_DOCS.garage

  return (
    <div>
      <PageHeader
        title={tr('Statut légal')}
        subtitle={tr('Documents applicables et preuve de votre acceptation (versions + dates).')}
      />

      {demo ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            {tr('Le compte de démonstration n’enregistre aucune acceptation. Avec un compte connecté, cette page liste les documents acceptés, leur version et leur date d’acceptation.')}
          </CardContent>
        </Card>
      ) : isLoading ? (
        <LoadingState />
      ) : (
        <Card className="divide-y divide-border">
          {required.map((doc) => {
            const meta = LEGAL_DOCUMENT_META[doc]
            const currentVersion = LEGAL_DOCUMENT_VERSIONS[doc]
            const match = (acceptances ?? []).find(
              (a) => a.document_type === doc && a.document_version === currentVersion,
            )
            const older = (acceptances ?? []).find((a) => a.document_type === doc)
            return (
              <div key={doc} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium">
                    <ScrollText className="h-4 w-4 text-muted-foreground" />
                    {tr(meta.label)}
                    <Link to={meta.route} target="_blank" className="text-primary hover:underline" aria-label={tr('Ouvrir {document}', { document: tr(meta.label) })}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {tr('Version applicable : {version}', { version: currentVersion })}
                    {match
                      ? ` · ${tr('Acceptée le {date}', { date: new Date(match.accepted_at).toLocaleString(LOCALES[lang]) })}`
                      : older
                        ? ` · ${tr('Ancienne version acceptée ({version}) — nouvelle acceptation requise', { version: older.document_version })}`
                        : ` · ${tr('Aucune acceptation enregistrée')}`}
                  </p>
                </div>
                {match ? (
                  <Badge tone="success"><CheckCircle2 className="me-1 h-3.5 w-3.5" /> {tr('Acceptée')}</Badge>
                ) : (
                  <Badge tone="warning"><CircleAlert className="me-1 h-3.5 w-3.5" /> {tr('Manquante')}</Badge>
                )}
              </div>
            )
          })}
        </Card>
      )}

      <Card className="mt-5">
        <CardHeader><CardTitle>{tr('Documents contractuels')}</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link to="/terms" className="font-medium text-primary hover:underline">{tr('Conditions d’utilisation')}</Link>
          {!demo && <Link to="/pilot-agreement" className="font-medium text-primary hover:underline">{tr('Conditions du pilote garage')}</Link>}
          <Link to="/dpa" className="font-medium text-primary hover:underline">{tr('Accord de sous-traitance RGPD')}</Link>
          <Link to="/privacy" className="font-medium text-primary hover:underline">{tr('Politique de confidentialité')}</Link>
          <Link to="/legal" className="font-medium text-primary hover:underline">{tr('Mentions légales')}</Link>
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">
        {tr('Contact : {email} · Les acceptations sont conservées dans un journal horodaté (version du document, date, contexte).', { email: legalConfig.contactEmail })}
      </p>
    </div>
  )
}

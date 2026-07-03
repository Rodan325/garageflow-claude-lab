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

/**
 * Garage-side legal status: which documents apply, which versions were
 * accepted, when — proof that the pilot garage accepted the pilot terms.
 * Reads ONLY the connected user's own acceptances (RLS).
 */
export function LegalStatusPage() {
  const { userId, demo } = useAuth()
  const { data: acceptances, isLoading } = useQuery({
    queryKey: ['legal-acceptances', userId],
    enabled: !!userId && !demo,
    queryFn: () => listOwnLegalAcceptances(userId!),
  })

  const required = REQUIRED_LEGAL_DOCS.garage

  return (
    <div>
      <PageHeader
        title="Statut légal"
        subtitle="Documents applicables au pilote et preuve de votre acceptation (versions + dates)."
      />

      {demo ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Mode démo local : aucune acceptation n’est enregistrée. Avec un compte garage réel, cette page liste les
            documents acceptés, leur version et la date d’acceptation.
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
                    {meta.label}
                    <Link to={meta.route} target="_blank" className="text-primary hover:underline" aria-label={`Ouvrir ${meta.label}`}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Version applicable : {currentVersion}
                    {match
                      ? ` · Acceptée le ${new Date(match.accepted_at).toLocaleString('fr-FR')}`
                      : older
                        ? ` · Ancienne version acceptée (${older.document_version}) — nouvelle acceptation requise`
                        : ' · Aucune acceptation enregistrée'}
                  </p>
                </div>
                {match ? (
                  <Badge tone="success"><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Acceptée</Badge>
                ) : (
                  <Badge tone="warning"><CircleAlert className="mr-1 h-3.5 w-3.5" /> Manquante</Badge>
                )}
              </div>
            )
          })}
        </Card>
      )}

      <Card className="mt-5">
        <CardHeader><CardTitle>Documents du pilote</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link to="/terms" className="font-medium text-primary hover:underline">Conditions d’utilisation</Link>
          <Link to="/pilot-agreement" className="font-medium text-primary hover:underline">Conditions du pilote garage</Link>
          <Link to="/dpa" className="font-medium text-primary hover:underline">Accord de sous-traitance RGPD</Link>
          <Link to="/privacy" className="font-medium text-primary hover:underline">Politique de confidentialité</Link>
          <Link to="/legal" className="font-medium text-primary hover:underline">Mentions légales</Link>
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">
        Contact : {legalConfig.contactEmail} · Les acceptations sont conservées dans un journal horodaté (version du
        document, date, contexte).
      </p>
    </div>
  )
}

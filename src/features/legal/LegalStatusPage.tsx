import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, CircleAlert, ExternalLink, ScrollText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui/feedback'
import { useToast } from '@/components/ui/toast'
import { PageHeader } from '@/components/common/PageHeader'
import { useAuth } from '@/features/auth/AuthProvider'
import {
  LEGAL_DOCUMENT_META,
  LEGAL_DOCUMENT_VERSIONS,
  REQUIRED_LEGAL_DOCS,
  legalConfig,
  legalDocumentRoute,
} from '@/config/legal'
import { LEGAL_V2_DOCUMENTS } from '@/config/legalV2'
import { legalAcceptanceV2Enabled } from '@/lib/features'
import {
  getLegalV2AcceptanceStatuses,
  listOwnLegalAcceptances,
  recordLegalV2Acceptance,
  type AcceptableLegalV2DocumentId,
  type LegalV2AcceptanceStatus,
} from './legalAcceptance'
import { LOCALES, useLang } from '@/i18n'

const V2_STATUS_LABELS: Record<AcceptableLegalV2DocumentId, string> = {
  terms_pro: 'Conditions d’utilisation professionnelles',
  terms_client: 'Conditions d’utilisation',
  dpa: 'Accord de sous-traitance RGPD',
}

/**
 * Garage-side legal status: which documents apply, which versions were
 * accepted and when. Demo accounts show the product-facing document set only.
 * Reads ONLY the connected user's own acceptances (RLS).
 */
export function LegalStatusPage() {
  const { lang, tr } = useLang()
  const { userId, demo, membership, garage } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [submittingDocument, setSubmittingDocument] = useState<AcceptableLegalV2DocumentId | null>(null)
  const useV2 = legalAcceptanceV2Enabled()
  const organizationId = membership?.garage_id ?? garage?.id ?? null
  const acceptancesQuery = useQuery({
    queryKey: ['legal-acceptances', userId],
    enabled: !!userId && !demo,
    queryFn: () => listOwnLegalAcceptances(userId!),
  })
  const statusQuery = useQuery<LegalV2AcceptanceStatus[]>({
    queryKey: ['legal-status-v2', userId, organizationId, lang],
    enabled: !!userId && !demo && useV2,
    queryFn: () => getLegalV2AcceptanceStatuses('garage', organizationId, lang),
  })
  const acceptances = acceptancesQuery.data
  const isLoading = acceptancesQuery.isLoading || (useV2 && statusQuery.isLoading)
  const isError = acceptancesQuery.isError || (useV2 && statusQuery.isError)

  const required = REQUIRED_LEGAL_DOCS.garage
  const historicalAcceptances = (acceptances ?? []).filter((acceptance) => {
    if (useV2 && ['terms_pro', 'terms_client', 'dpa'].includes(acceptance.document_type)) {
      const current = (statusQuery.data ?? []).find(
        (status) => status.document_key === acceptance.document_type,
      )
      return !current
        || acceptance.document_version !== current.document_version
        || acceptance.document_sha256 !== current.document_sha256
    }
    const type = acceptance.document_type as keyof typeof LEGAL_DOCUMENT_VERSIONS
    return type === 'pilot_agreement' || LEGAL_DOCUMENT_VERSIONS[type] !== acceptance.document_version
  })

  async function acceptCurrentDocument(documentId: AcceptableLegalV2DocumentId) {
    const document = LEGAL_V2_DOCUMENTS[documentId]
    setSubmittingDocument(documentId)
    try {
      await recordLegalV2Acceptance(documentId, {
        displayedLanguage: lang,
        organizationId: document.acceptanceScope === 'organization' ? organizationId : null,
      })
      await queryClient.invalidateQueries({ queryKey: ['legal-status-v2'] })
      await queryClient.invalidateQueries({ queryKey: ['legal-acceptances'] })
    } catch {
      toast.error(tr('Enregistrement impossible'), tr('L’enregistrement n’a pas pu être terminé.'))
    } finally {
      setSubmittingDocument(null)
    }
  }

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
      ) : isError ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            {tr('Une erreur est survenue')}
          </CardContent>
        </Card>
      ) : (
        <Card className="divide-y divide-border">
          {useV2
            ? (statusQuery.data ?? []).map((status) => (
                <V2StatusRow
                  key={status.document_key}
                  status={status}
                  lang={lang}
                  tr={tr}
                  loading={submittingDocument === status.document_key}
                  onAccept={() => acceptCurrentDocument(status.document_key)}
                />
              ))
            : required.map((doc) => {
                const meta = LEGAL_DOCUMENT_META[doc]
                const currentVersion = LEGAL_DOCUMENT_VERSIONS[doc]
                const match = (acceptances ?? []).find(
                  (acceptance) => acceptance.document_type === doc
                    && acceptance.document_version === currentVersion,
                )
                const older = (acceptances ?? []).find((acceptance) => acceptance.document_type === doc)
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
          <Link to={useV2 ? '/terms/pro' : '/terms'} className="font-medium text-primary hover:underline">{tr('Conditions d’utilisation')}</Link>
          <Link to="/dpa" className="font-medium text-primary hover:underline">{tr('Accord de sous-traitance RGPD')}</Link>
          <Link to="/privacy" className="font-medium text-primary hover:underline">{tr('Politique de confidentialité')}</Link>
          <Link to="/legal" className="font-medium text-primary hover:underline">{tr('Mentions légales')}</Link>
        </CardContent>
      </Card>

      {!demo && historicalAcceptances.length > 0 && (
        <Card className="mt-5">
          <CardHeader><CardTitle>{tr('Acceptations historiques')}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              {tr('Ces documents sont conservés comme preuve des versions antérieurement acceptées. Ils ne sont plus proposés aux nouveaux utilisateurs.')}
            </p>
            {historicalAcceptances.map((acceptance) => {
              const type = acceptance.document_type as keyof typeof LEGAL_DOCUMENT_META
              const v2Type = acceptance.document_type as AcceptableLegalV2DocumentId
              const meta = v2Type in V2_STATUS_LABELS
                ? { label: V2_STATUS_LABELS[v2Type], route: LEGAL_V2_DOCUMENTS[v2Type].route }
                : LEGAL_DOCUMENT_META[type]
              if (!meta) return null
              return (
                <Link
                  key={acceptance.id}
                  to={legalDocumentRoute(type, acceptance.document_version)}
                  target="_blank"
                  className="flex min-h-10 items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-primary hover:bg-muted/40 hover:underline"
                >
                  <span>{tr(meta.label)}</span>
                  <bdi dir="ltr" className="text-xs text-muted-foreground">{acceptance.document_version}</bdi>
                </Link>
              )
            })}
          </CardContent>
        </Card>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        {tr('Contact : {email} · Les acceptations sont conservées dans un journal horodaté (version du document, date, contexte).', { email: legalConfig.contactEmail })}
      </p>
    </div>
  )
}

function V2StatusRow({
  status,
  lang,
  tr,
  loading,
  onAccept,
}: {
  status: LegalV2AcceptanceStatus
  lang: 'fr' | 'en' | 'ar'
  tr: (source: string, variables?: Record<string, string | number>) => string
  loading: boolean
  onAccept: () => void
}) {
  const definition = LEGAL_V2_DOCUMENTS[status.document_key]
  const label = V2_STATUS_LABELS[status.document_key]
  const statusDetail = status.accepted && status.accepted_at
    ? tr('Acceptée le {date}', { date: new Date(status.accepted_at).toLocaleString(LOCALES[lang]) })
    : status.current
      ? tr('Acceptation requise')
      : tr('Aucune version applicable publiée')

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-medium">
          <ScrollText className="h-4 w-4 text-muted-foreground" />
          {tr(label)}
          <Link
            to={definition.route}
            target="_blank"
            className="text-primary hover:underline"
            aria-label={tr('Ouvrir {document}', { document: tr(label) })}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {status.document_version
            ? tr('Version applicable : {version}', { version: status.document_version })
            : tr('Version applicable non publiée')}
          {` · ${statusDetail}`}
        </p>
        {!status.accepted && status.current && !status.can_accept && (
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
            {tr('Seul un propriétaire ou représentant habilité de l’organisation peut accepter ce document.')}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {status.accepted ? (
          <Badge tone="success"><CheckCircle2 className="me-1 h-3.5 w-3.5" /> {tr('Acceptée')}</Badge>
        ) : (
          <Badge tone="warning"><CircleAlert className="me-1 h-3.5 w-3.5" /> {tr('Manquante')}</Badge>
        )}
        {!status.accepted && status.current && status.can_accept && (
          <Button size="sm" loading={loading} onClick={onAccept}>
            {tr('Accepter la version courante')}
          </Button>
        )}
      </div>
    </div>
  )
}

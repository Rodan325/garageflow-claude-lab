import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, ShieldCheck } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/feedback'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/features/auth/AuthProvider'
import { isSupabaseConfigured } from '@/lib/supabase'
import { LegalFooter } from '@/components/common/LegalFooter'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import {
  LEGAL_DOCUMENT_META,
  LEGAL_DOCUMENT_VERSIONS,
  legalConfig,
  type LegalDocumentType,
  type LegalRole,
} from '@/config/legal'
import { LEGAL_V2_DOCUMENTS } from '@/config/legalV2'
import { legalAcceptanceV2Enabled } from '@/lib/features'
import {
  getMissingLegalDocuments,
  getMissingLegalV2Documents,
  recordLegalV2Acceptance,
  recordMultipleLegalAcceptances,
  type AcceptableLegalV2DocumentId,
} from './legalAcceptance'
import { LOCALES, useLang } from '@/i18n'
import { isAuthorizedDpaRepresentative } from './DpaAccessGuard'

const GATE_TEXT: Record<'client' | 'garage', string> = {
  client:
    'Pour continuer, vous devez accepter les Conditions d’utilisation et reconnaître avoir pris connaissance de la Politique de confidentialité.',
  garage:
    'Pour continuer, vous devez accepter les Conditions d’utilisation, reconnaître avoir pris connaissance de la Politique de confidentialité et accepter l’Accord de sous-traitance des données.',
}

type GateDocument = LegalDocumentType | AcceptableLegalV2DocumentId

const V2_LABELS: Record<AcceptableLegalV2DocumentId, string> = {
  terms_pro: 'Conditions d’utilisation',
  terms_client: 'Conditions d’utilisation',
  dpa: 'Accord de sous-traitance RGPD',
}

function gateDocumentMeta(documentId: GateDocument, useV2: boolean) {
  if (useV2) {
    const id = documentId as AcceptableLegalV2DocumentId
    const document = LEGAL_V2_DOCUMENTS[id]
    return { label: V2_LABELS[id], route: document.route, version: document.version }
  }
  const id = documentId as LegalDocumentType
  return { ...LEGAL_DOCUMENT_META[id], version: LEGAL_DOCUMENT_VERSIONS[id] }
}

/**
 * Blocking gate: after login, the user must have accepted the CURRENT version
 * of every legal document required for their role. Nothing is pre-checked —
 * the user ticks each box, and each acceptance is recorded (version, date,
 * user-agent, context) in `legal_acceptances`. Demo mode and unconfigured
 * environments pass through (nothing to record without Supabase).
 */
export function LegalAcceptanceGate({ role, children }: { role: LegalRole; children: React.ReactNode }) {
  const { lang, tr } = useLang()
  const { demo, userId, membership, garage, signOut } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)

  const useV2 = legalAcceptanceV2Enabled()
  const organizationId = role === 'garage' ? (membership?.garage_id ?? garage?.id ?? null) : null
  const canAcceptDpa = isAuthorizedDpaRepresentative({
    role: membership?.role ?? null,
    organizationRole: membership?.organization_role ?? null,
    centerId: membership?.center_id ?? null,
  })
  const enabled = !demo && isSupabaseConfigured && !!userId
  const { data: missing, isLoading, isError } = useQuery<GateDocument[]>({
    queryKey: ['legal-missing', useV2 ? 'v2' : 'legacy', userId, role, organizationId],
    enabled,
    queryFn: async () => useV2
      ? await getMissingLegalV2Documents(userId!, role, organizationId)
      : await getMissingLegalDocuments(userId!, role),
  })

  if (!enabled) return <>{children}</>
  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Spinner className="h-7 w-7" />
      </div>
    )
  }
  if (isError) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <h1 className="font-semibold">{tr('Une erreur est survenue')}</h1>
          <Button className="mt-4" onClick={() => qc.invalidateQueries({ queryKey: ['legal-missing'] })}>
            {tr('Réessayer')}
          </Button>
        </Card>
      </div>
    )
  }
  if (!missing || missing.length === 0) return <>{children}</>

  const hasUnauthorizedDpa = useV2 && missing.includes('dpa') && !canAcceptDpa
  const allChecked = !hasUnauthorizedDpa && missing.every((doc) => checked[doc])

  async function accept() {
    if (!allChecked || !missing) return
    setSubmitting(true)
    try {
      if (useV2) {
        for (const documentId of missing as AcceptableLegalV2DocumentId[]) {
          const document = LEGAL_V2_DOCUMENTS[documentId]
          await recordLegalV2Acceptance(documentId, role, 'legal_gate', {
            displayedLanguage: lang,
            organizationId: document.acceptanceScope === 'organization' ? organizationId : null,
          })
        }
      } else {
        await recordMultipleLegalAcceptances(
          (missing as LegalDocumentType[]).map((doc) => ({ documentType: doc, version: LEGAL_DOCUMENT_VERSIONS[doc] })),
          role,
          'legal_gate',
          {
            displayedLanguage: lang,
            organizationId: null,
          },
        )
      }
      await qc.invalidateQueries({ queryKey: ['legal-missing'] })
    } catch {
      toast.error(tr('Enregistrement impossible'), tr('L’enregistrement n’a pas pu être terminé.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-muted/40">
      <div className="flex justify-end p-4"><LanguageSwitcher /></div>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center p-4 pt-0">
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{tr('Documents à accepter')}</h1>
              <p className="text-xs text-muted-foreground">{legalConfig.appName} · {tr('Service professionnel')}</p>
            </div>
          </div>

          {!useV2 && <p className="text-sm text-muted-foreground">{tr(GATE_TEXT[role === 'garage' ? 'garage' : 'client'])}</p>}

          <div className="mt-4 space-y-2">
            {(missing as GateDocument[]).map((doc) => {
              const meta = gateDocumentMeta(doc, useV2)
              if (useV2 && doc === 'dpa' && !canAcceptDpa) {
                return (
                  <div key={doc} className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                    <p className="font-medium">{tr(meta.label)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {tr('Seul un propriétaire ou représentant habilité de l’organisation peut accepter ce document.')}
                    </p>
                    <Link to={meta.route} target="_blank" className="mt-2 inline-block font-medium text-primary hover:underline">
                      {tr('Consulter le document')}
                    </Link>
                  </div>
                )
              }
              return (
                <label
                  key={doc}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/40"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-input"
                    checked={!!checked[doc]}
                    onChange={(e) => setChecked((c) => ({ ...c, [doc]: e.target.checked }))}
                  />
                  <span className="min-w-0 text-sm">
                    <span className="font-medium">{tr('J’accepte :')} </span>
                    <Link to={meta.route} target="_blank" className="font-medium text-primary hover:underline">
                      {tr(meta.label)}
                    </Link>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      <FileText className="mr-1 inline h-3 w-3" />
                      {tr('Version du document : {version}', { version: meta.version })}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            {tr('Votre acceptation est horodatée ({date}) et conservée dans un journal d’acceptation, avec la version du document.', { date: new Intl.DateTimeFormat(LOCALES[lang]).format(new Date()) })}
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" disabled={!allChecked} loading={submitting} onClick={accept}>
              {tr('J’accepte et je continue')}
            </Button>
            <Button variant="ghost" onClick={() => signOut()}>{tr('Se déconnecter')}</Button>
          </div>
        </Card>
      </main>
      <LegalFooter />
    </div>
  )
}

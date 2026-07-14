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
import { getMissingLegalDocuments, recordMultipleLegalAcceptances } from './legalAcceptance'
import { LOCALES, useLang } from '@/i18n'

const GATE_TEXT: Record<'client' | 'garage', string> = {
  client:
    'Pour continuer, vous devez accepter les Conditions d’utilisation et reconnaître avoir pris connaissance de la Politique de confidentialité.',
  garage:
    'Pour continuer en tant que garage pilote, vous devez accepter les Conditions d’utilisation, reconnaître avoir pris connaissance de la Politique de confidentialité, accepter les Conditions du pilote garage et l’Accord de sous-traitance RGPD.',
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
  const { demo, userId, signOut } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)

  const enabled = !demo && isSupabaseConfigured && !!userId
  const { data: missing, isLoading } = useQuery({
    queryKey: ['legal-missing', userId, role],
    enabled,
    queryFn: () => getMissingLegalDocuments(userId!, role),
  })

  if (!enabled) return <>{children}</>
  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Spinner className="h-7 w-7" />
      </div>
    )
  }
  if (!missing || missing.length === 0) return <>{children}</>

  const allChecked = missing.every((doc) => checked[doc])

  async function accept() {
    if (!allChecked || !missing) return
    setSubmitting(true)
    try {
      await recordMultipleLegalAcceptances(
        missing.map((doc) => ({ documentType: doc, version: LEGAL_DOCUMENT_VERSIONS[doc] })),
        role,
        'legal_gate',
      )
      await qc.invalidateQueries({ queryKey: ['legal-missing', userId, role] })
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
              <p className="text-xs text-muted-foreground">{legalConfig.appName} · {legalConfig.pilotVersion}</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">{tr(GATE_TEXT[role === 'garage' ? 'garage' : 'client'])}</p>

          <div className="mt-4 space-y-2">
            {missing.map((doc: LegalDocumentType) => {
              const meta = LEGAL_DOCUMENT_META[doc]
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
                      {tr('Version du document : {version}', { version: LEGAL_DOCUMENT_VERSIONS[doc] })}
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

import { legalConfig as c } from '@/config/legal'
import { useLang } from '@/i18n'
import { LegalLayout, H2, P } from './LegalLayout'
import { legalContent, type LegalDocumentKey } from './legalContent'

export function LocalizedLegalPage({ document, version }: { document: LegalDocumentKey; version: string }) {
  const { lang, tr } = useLang()
  const content = legalContent[lang === 'ar' ? 'ar' : 'en'][document]

  return (
    <LegalLayout title={content.title} version={version}>
      {content.sections.map((section) => (
        <section key={section.title}>
          <H2>{section.title}</H2>
          {section.paragraphs.map((paragraph) => <P key={paragraph}>{paragraph}</P>)}
        </section>
      ))}

      <section className="mt-8 rounded-xl border border-border bg-muted/30 p-4 text-sm">
        <h2 className="font-semibold">{tr('Identité légale officielle')}</h2>
        <dl className="mt-3 grid gap-2 text-muted-foreground sm:grid-cols-2">
          <div><dt className="font-medium text-foreground">{tr('Éditeur')}</dt><dd>{c.tradingName} — {c.editorName}</dd></div>
          <div><dt className="font-medium text-foreground">SIREN / SIRET</dt><dd>{c.siren} / {c.siret}</dd></div>
          <div><dt className="font-medium text-foreground">{tr('Adresse')}</dt><dd>{c.editorAddress}</dd></div>
          <div><dt className="font-medium text-foreground">{tr('Contact')}</dt><dd>{c.contactEmail} · {c.contactPhone}</dd></div>
          <div><dt className="font-medium text-foreground">{tr('Service')}</dt><dd>Clikarage</dd></div>
          <div><dt className="font-medium text-foreground">{tr('Version pilote')}</dt><dd>{tr(c.pilotVersion)}</dd></div>
        </dl>
      </section>
    </LegalLayout>
  )
}

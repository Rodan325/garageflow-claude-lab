import { useEffect } from 'react'
import { LEGAL_V2_DOCUMENTS, legalDocumentRecord } from '@/config/legalV2'
import { useLang } from '@/i18n'
import { CommercialLegalLayout, LegalParagraph, LegalSectionTitle } from './CommercialLegalLayout'
import type { ClientLegalV2DocumentId } from './legalV2Content'
import { getCanonicalLegalDocument } from './legalCanonicalDocument'

export function LegalV2DocumentPage({ documentId }: { documentId: ClientLegalV2DocumentId }) {
  const { lang } = useLang()
  const definition = LEGAL_V2_DOCUMENTS[documentId]
  const record = legalDocumentRecord(documentId, lang)
  const canonicalDocument = getCanonicalLegalDocument(documentId, lang)

  useEffect(() => {
    const previousTitle = document.title
    const previousRobots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')
    const previousRobotsContent = previousRobots?.content
    const robots = previousRobots ?? document.createElement('meta')
    robots.name = 'robots'
    robots.content = definition.status === 'effective' ? 'index,follow' : 'noindex,nofollow'
    if (!previousRobots) document.head.appendChild(robots)
    document.title = `${canonicalDocument.title} — Clikarage`
    return () => {
      document.title = previousTitle
      if (previousRobots) previousRobots.content = previousRobotsContent ?? ''
      else robots.remove()
    }
  }, [canonicalDocument.title, definition.status])

  return (
    <CommercialLegalLayout
      title={canonicalDocument.title}
      version={record.version}
      presentation={canonicalDocument.presentation}
    >
      <article
        data-legal-v2="true"
        data-legal-document={record.documentId}
        data-legal-version={record.version}
        data-legal-language={record.language}
        data-legal-status={record.status}
        data-legal-sha256={record.sha256}
      >
        {canonicalDocument.presentation.reviewNotice && (
          <aside role="status" className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-100">
            <p className="font-bold">{canonicalDocument.presentation.reviewNotice.title}</p>
            <p className="mt-1 leading-6">{canonicalDocument.presentation.reviewNotice.body}</p>
          </aside>
        )}

        {canonicalDocument.introduction && <p className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm font-medium leading-7">{canonicalDocument.introduction}</p>}

        {canonicalDocument.sections.map((item) => (
          <section key={item.id} id={item.id} data-clause-id={item.id}>
            <LegalSectionTitle>{item.title}</LegalSectionTitle>
            {item.paragraphs.map((paragraph) => <LegalParagraph key={paragraph}>{paragraph}</LegalParagraph>)}
            {!!item.items.length && (
              <ul className="mt-3 list-disc space-y-1 ps-5 text-sm leading-7 text-muted-foreground">
                {item.items.map((entry) => <li key={entry}>{entry}</li>)}
              </ul>
            )}
            {item.tables.map((table) => <LegalTable key={table.id} table={table} />)}
          </section>
        ))}

        {canonicalDocument.annexes.map((annex) => (
          <section key={annex.id} id={annex.id} data-annex-id={annex.id}>
            <LegalSectionTitle>{annex.title}</LegalSectionTitle>
            {annex.paragraphs.map((paragraph) => <LegalParagraph key={paragraph}>{paragraph}</LegalParagraph>)}
            {annex.tables.map((table) => <LegalTable key={table.id} table={table} />)}
          </section>
        ))}

        <section className="mt-8 rounded-xl border border-border bg-muted/30 p-4 text-sm">
          <h2 className="font-semibold">{canonicalDocument.identity.title}</h2>
          <dl className="mt-3 grid gap-3 text-muted-foreground sm:grid-cols-2">
            {canonicalDocument.identity.entries.map((entry) => (
              <Identity
                key={entry.id}
                label={entry.label}
                value={entry.value}
                ltr={entry.direction === 'ltr'}
              />
            ))}
          </dl>
        </section>
      </article>
    </CommercialLegalLayout>
  )
}

function LegalTable({
  table,
}: {
  table: { columns: string[]; rows: string[][] }
}) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full border-collapse text-start text-sm">
        <thead>
          <tr>{table.columns.map((column) => <th key={column} className="border border-border p-2 text-start">{column}</th>)}</tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.join('\u0000')}>
              {row.map((cell, index) => <td key={`${index}:${cell}`} className="border border-border p-2 align-top">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Identity({ label, value, ltr = false }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div>
      <dt className="font-medium text-foreground">{label}</dt>
      <dd dir={ltr ? 'ltr' : undefined} className={ltr ? 'text-left [unicode-bidi:plaintext]' : undefined}>{value}</dd>
    </div>
  )
}

import { useEffect } from 'react'
import { LEGAL_V2_DOCUMENTS, legalDocumentRecord } from '@/config/legalV2'
import { legalConfig } from '@/config/legal'
import { useLang, type Lang } from '@/i18n'
import { CommercialLegalLayout, LegalParagraph, LegalSectionTitle } from './CommercialLegalLayout'
import { getLegalV2Document, type ClientLegalV2DocumentId } from './legalV2Content'

const stagedCopy: Record<Lang, { title: string; body: string }> = {
  fr: {
    title: 'Projet — non encore en vigueur',
    body: 'Ce document est intégré pour revue. Il ne remplace pas les conditions actuellement applicables et ne déclenche aucune nouvelle acceptation.',
  },
  en: {
    title: 'Draft — not yet effective',
    body: 'This document is staged for review. It does not replace the terms currently in force and triggers no new acceptance.',
  },
  ar: {
    title: 'مشروع — لم يدخل حيز النفاذ',
    body: 'أُدرج هذا المستند للمراجعة. ولا يحل محل الشروط المطبقة حاليًا ولا يطلب موافقة جديدة.',
  },
}

const identityCopy: Record<Lang, {
  title: string
  publisher: string
  publisherValue: string
  product: string
  contact: string
  vat: string
  vatValue: string
}> = {
  fr: {
    title: 'Identité de l’éditeur', publisher: 'Éditeur et cocontractant', product: 'Produit', contact: 'Contact', vat: 'TVA',
    publisherValue: 'RODANBTECH — Anas RODRIGUEZ BENKARROUM, Entrepreneur individuel',
    vatValue: 'TVA non applicable, article 293 B du Code général des impôts, sous réserve de confirmation du régime applicable.',
  },
  en: {
    title: 'Publisher identity', publisher: 'Publisher and contracting party', product: 'Product', contact: 'Contact', vat: 'VAT',
    publisherValue: 'RODANBTECH — Anas RODRIGUEZ BENKARROUM, sole trader',
    vatValue: 'VAT not applicable under Article 293 B of the French General Tax Code, subject to confirmation of the applicable tax regime.',
  },
  ar: {
    title: 'هوية الناشر', publisher: 'الناشر والطرف المتعاقد', product: 'المنتج', contact: 'الاتصال', vat: 'ضريبة القيمة المضافة',
    publisherValue: 'RODANBTECH — Anas RODRIGUEZ BENKARROUM، مقاول فردي',
    vatValue: 'لا تطبق ضريبة القيمة المضافة وفقًا للمادة 293 B من قانون الضرائب الفرنسي، مع مراعاة تأكيد النظام الضريبي المطبق.',
  },
}

export function LegalV2DocumentPage({ documentId }: { documentId: ClientLegalV2DocumentId }) {
  const { lang } = useLang()
  const definition = LEGAL_V2_DOCUMENTS[documentId]
  const record = legalDocumentRecord(documentId, lang)
  const content = getLegalV2Document(documentId, lang)
  const notice = stagedCopy[lang]
  const identity = identityCopy[lang]

  useEffect(() => {
    const previousTitle = document.title
    const previousRobots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')
    const previousRobotsContent = previousRobots?.content
    const robots = previousRobots ?? document.createElement('meta')
    robots.name = 'robots'
    robots.content = definition.status === 'effective' ? 'index,follow' : 'noindex,nofollow'
    if (!previousRobots) document.head.appendChild(robots)
    document.title = `${content.title} — Clikarage`
    return () => {
      document.title = previousTitle
      if (previousRobots) previousRobots.content = previousRobotsContent ?? ''
      else robots.remove()
    }
  }, [content.title, definition.status])

  return (
    <CommercialLegalLayout title={content.title} version={record.version}>
      <article
        data-legal-v2="true"
        data-legal-document={record.documentId}
        data-legal-version={record.version}
        data-legal-language={record.language}
        data-legal-status={record.status}
        data-legal-sha256={record.sha256}
      >
        {record.status !== 'effective' && (
          <aside role="status" className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-100">
            <p className="font-bold">{notice.title}</p>
            <p className="mt-1 leading-6">{notice.body}</p>
          </aside>
        )}

        {content.introduction && <p className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm font-medium leading-7">{content.introduction}</p>}

        {content.sections.map((item) => (
          <section key={item.id} id={item.id} data-clause-id={item.id}>
            <LegalSectionTitle>{item.title}</LegalSectionTitle>
            {item.paragraphs.map((paragraph) => <LegalParagraph key={paragraph}>{paragraph}</LegalParagraph>)}
            {!!item.items.length && (
              <ul className="mt-3 list-disc space-y-1 ps-5 text-sm leading-7 text-muted-foreground">
                {item.items.map((entry) => <li key={entry}>{entry}</li>)}
              </ul>
            )}
          </section>
        ))}

        <section className="mt-8 rounded-xl border border-border bg-muted/30 p-4 text-sm">
          <h2 className="font-semibold">{identity.title}</h2>
          <dl className="mt-3 grid gap-3 text-muted-foreground sm:grid-cols-2">
            <Identity label={identity.publisher} value={identity.publisherValue} />
            <Identity label="SIREN / SIRET" value="103 878 187 · 103 878 187 00014" ltr />
            <Identity label={identity.product} value="Clikarage" ltr />
            <Identity label={identity.contact} value={legalConfig.contactEmail} ltr />
            <Identity label={identity.vat} value={identity.vatValue} />
          </dl>
        </section>
      </article>
    </CommercialLegalLayout>
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

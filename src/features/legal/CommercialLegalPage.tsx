import { legalConfig as c } from '@/config/legal'
import { useLang, type Lang } from '@/i18n'
import { CommercialLegalLayout, LegalParagraph, LegalSectionTitle } from './CommercialLegalLayout'
import {
  getCommercialLegalDocument,
  type CommercialLegalDocumentKey,
} from './commercialLegalContent'

const identityLabels: Record<Lang, Record<string, string>> = {
  fr: {
    title: 'Identité légale officielle', publisher: 'Éditeur', status: 'Forme juridique', address: 'Adresse',
    contact: 'Contact', director: 'Directeur de publication', service: 'Produit logiciel', identifiers: 'Identifiants',
  },
  en: {
    title: 'Official legal identity', publisher: 'Publisher', status: 'Legal form', address: 'Address',
    contact: 'Contact', director: 'Publication director', service: 'Software product', identifiers: 'Registration details',
  },
  ar: {
    title: 'الهوية القانونية الرسمية', publisher: 'الناشر', status: 'الشكل القانوني', address: 'العنوان',
    contact: 'الاتصال', director: 'مدير النشر', service: 'المنتج البرمجي', identifiers: 'بيانات التسجيل',
  },
}

export function CommercialLegalPage({
  document,
  version,
}: {
  document: CommercialLegalDocumentKey
  version: string
}) {
  const { lang } = useLang()
  const content = getCommercialLegalDocument(document, lang)
  const labels = identityLabels[lang]

  return (
    <CommercialLegalLayout title={content.title} version={version}>
      <article data-legal-document={document} data-legal-version={version}>
        {content.introduction && <p className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm font-medium leading-7">{content.introduction}</p>}

        {content.sections.map((section) => (
          <section key={section.id} id={section.id}>
            <LegalSectionTitle>{section.title}</LegalSectionTitle>
            {section.paragraphs.map((paragraph) => <LegalParagraph key={paragraph}>{paragraph}</LegalParagraph>)}
            {!!section.items.length && (
              <ul className="mt-3 list-disc space-y-1 ps-5 text-sm leading-7 text-muted-foreground">
                {section.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            )}
          </section>
        ))}

        <section className="mt-8 rounded-xl border border-border bg-muted/30 p-4 text-sm">
          <h2 className="font-semibold">{labels.title}</h2>
          <dl className="mt-3 grid gap-3 text-muted-foreground sm:grid-cols-2">
            <IdentityItem label={labels.publisher} value={`${c.editorName} · ${c.tradingName}`} />
            <IdentityItem label={labels.status} value={c.editorLegalStatus} />
            <IdentityItem label={labels.identifiers} value={`SIREN ${c.siren} · SIRET ${c.siret}`} ltr />
            <IdentityItem label={labels.address} value={c.editorAddress} ltr />
            <IdentityItem label={labels.contact} value={`${c.contactEmail} · ${c.contactPhone}`} ltr />
            <IdentityItem label={labels.director} value={c.publicationDirector} />
            <IdentityItem label={labels.service} value="Clikarage" ltr />
          </dl>
        </section>
      </article>
    </CommercialLegalLayout>
  )
}

function IdentityItem({ label, value, ltr = false }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div>
      <dt className="font-medium text-foreground">{label}</dt>
      <dd dir={ltr ? 'ltr' : undefined} className={ltr ? 'text-left [unicode-bidi:plaintext]' : undefined}>{value}</dd>
    </div>
  )
}

import { legalConfig } from '@/config/legal'
import {
  LEGAL_V2_DOCUMENTS,
  type LegalAcceptanceScope,
  type LegalDocumentStatus,
} from '@/config/legalV2'
import type { Lang } from '@/i18n'
import {
  getLegalV2Document,
  type ClientLegalV2DocumentId,
} from './legalV2Content'

export interface CanonicalLegalTable {
  id: string
  columns: string[]
  rows: string[][]
}

export interface CanonicalLegalAnnex {
  id: string
  title: string
  paragraphs: string[]
  tables: CanonicalLegalTable[]
}

export interface CanonicalLegalSection {
  id: string
  title: string
  paragraphs: string[]
  items: string[]
  tables: CanonicalLegalTable[]
}

export interface CanonicalLegalIdentityEntry {
  id: string
  label: string
  value: string
  direction: 'ltr' | 'auto'
}

export interface CanonicalLegalPresentation {
  versionLabel: string
  translationNotice: string | null
  referenceLabel: string | null
  footerNote: string
  reviewNotice: {
    title: string
    body: string
  } | null
}

export interface CanonicalLegalDocument {
  schema: 'clikarage-legal-document-v1'
  documentKey: ClientLegalV2DocumentId
  version: string
  language: Lang
  status: LegalDocumentStatus
  publishedAt: string | null
  effectiveAt: string | null
  supersedes: string | null
  requiresAcceptance: boolean
  acceptanceScope: LegalAcceptanceScope
  title: string
  introduction: string | null
  sections: CanonicalLegalSection[]
  annexes: CanonicalLegalAnnex[]
  identity: {
    title: string
    entries: CanonicalLegalIdentityEntry[]
  }
  presentation: CanonicalLegalPresentation
}

const localized = {
  fr: {
    identityTitle: 'Identité de l’éditeur',
    publisher: 'Éditeur et cocontractant',
    publisherValue: `${legalConfig.tradingName} — ${legalConfig.editorName}, ${legalConfig.editorLegalStatus}`,
    address: 'Adresse',
    registration: 'SIREN / SIRET',
    activity: 'Activité / code APE',
    director: 'Directeur de publication',
    product: 'Produit',
    contact: 'Contact',
    vat: 'TVA',
    vatValue: 'TVA non applicable, article 293 B du Code général des impôts, sous réserve de confirmation du régime applicable.',
    versionLabel: 'Version du document',
    translationNotice: null,
    referenceLabel: null,
    footerNote: 'Clikarage est un service édité par RODANBTECH. Les documents applicables sont accessibles depuis le pied de page.',
    reviewTitle: 'Projet — non encore en vigueur',
    reviewBody: 'Ce document est intégré pour revue. Il ne remplace pas les conditions actuellement applicables et ne déclenche aucune nouvelle acceptation.',
  },
  en: {
    identityTitle: 'Publisher identity',
    publisher: 'Publisher and contracting party',
    publisherValue: `${legalConfig.tradingName} — ${legalConfig.editorName}, sole trader`,
    address: 'Address',
    registration: 'SIREN / SIRET',
    activity: 'Activity / APE code',
    director: 'Publication director',
    product: 'Product',
    contact: 'Contact',
    vat: 'VAT',
    vatValue: 'VAT not applicable under Article 293 B of the French General Tax Code, subject to confirmation of the applicable tax regime.',
    versionLabel: 'Document version',
    translationNotice: 'This translation is provided for information purposes. In the event of a discrepancy, the French version prevails.',
    referenceLabel: 'Open the reference French version',
    footerNote: 'Clikarage is a service published by RODANBTECH. Applicable documents are available from the footer.',
    reviewTitle: 'Draft — not yet effective',
    reviewBody: 'This document is staged for review. It does not replace the terms currently in force and triggers no new acceptance.',
  },
  ar: {
    identityTitle: 'هوية الناشر',
    publisher: 'الناشر والطرف المتعاقد',
    publisherValue: `${legalConfig.tradingName} — ${legalConfig.editorName}، مقاول فردي`,
    address: 'العنوان',
    registration: 'SIREN / SIRET',
    activity: 'النشاط / رمز APE',
    director: 'مدير النشر',
    product: 'المنتج',
    contact: 'الاتصال',
    vat: 'ضريبة القيمة المضافة',
    vatValue: 'لا تطبق ضريبة القيمة المضافة وفقًا للمادة 293 B من قانون الضرائب الفرنسي، مع مراعاة تأكيد النظام الضريبي المطبق.',
    versionLabel: 'إصدار المستند',
    translationNotice: 'تُقدَّم هذه الترجمة لأغراض إعلامية. وفي حال وجود اختلاف، تكون النسخة الفرنسية هي المرجع.',
    referenceLabel: 'فتح النسخة الفرنسية المرجعية',
    footerNote: 'Clikarage خدمة تنشرها RODANBTECH. ويمكن الوصول إلى المستندات المطبقة من تذييل الصفحة.',
    reviewTitle: 'مشروع — لم يدخل حيز النفاذ',
    reviewBody: 'أُدرج هذا المستند للمراجعة. ولا يحل محل الشروط المطبقة حاليًا ولا يطلب موافقة جديدة.',
  },
} as const

export function getCanonicalLegalDocument(
  documentId: ClientLegalV2DocumentId,
  language: Lang,
): CanonicalLegalDocument {
  const definition = LEGAL_V2_DOCUMENTS[documentId]
  const content = getLegalV2Document(documentId, language)
  const copy = localized[language]

  return {
    schema: 'clikarage-legal-document-v1',
    documentKey: documentId,
    version: definition.version,
    language,
    status: definition.status,
    publishedAt: definition.publishedAt,
    effectiveAt: definition.effectiveAt,
    supersedes: definition.supersedes,
    requiresAcceptance: definition.requiresAcceptance,
    acceptanceScope: definition.acceptanceScope,
    title: content.title,
    introduction: content.introduction ?? null,
    sections: content.sections.map((section) => ({
      id: section.id,
      title: section.title,
      paragraphs: section.paragraphs,
      items: section.items,
      tables: [],
    })),
    annexes: [],
    identity: {
      title: copy.identityTitle,
      entries: [
        { id: 'publisher', label: copy.publisher, value: copy.publisherValue, direction: 'auto' },
        { id: 'address', label: copy.address, value: legalConfig.editorAddress, direction: 'ltr' },
        {
          id: 'registration',
          label: copy.registration,
          value: `${legalConfig.siren} · ${legalConfig.siret}`,
          direction: 'ltr',
        },
        {
          id: 'activity',
          label: copy.activity,
          value: `${legalConfig.activity} · ${legalConfig.nafApeCode}`,
          direction: 'auto',
        },
        {
          id: 'director',
          label: copy.director,
          value: legalConfig.publicationDirector,
          direction: 'auto',
        },
        { id: 'product', label: copy.product, value: legalConfig.appName, direction: 'ltr' },
        {
          id: 'contact',
          label: copy.contact,
          value: `${legalConfig.contactEmail} · ${legalConfig.contactPhone}`,
          direction: 'ltr',
        },
        { id: 'vat', label: copy.vat, value: copy.vatValue, direction: 'auto' },
      ],
    },
    presentation: {
      versionLabel: copy.versionLabel,
      translationNotice: copy.translationNotice,
      referenceLabel: copy.referenceLabel,
      footerNote: copy.footerNote,
      reviewNotice: definition.status === 'effective'
        ? null
        : { title: copy.reviewTitle, body: copy.reviewBody },
    },
  }
}

function normalizeCanonicalValue(value: unknown): unknown {
  if (typeof value === 'string') return value.replace(/\r\n?/g, '\n').normalize('NFC')
  if (Array.isArray(value)) return value.map(normalizeCanonicalValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right, 'en'))
        .map(([key, entry]) => [key, normalizeCanonicalValue(entry)]),
    )
  }
  return value
}

export function serializeCanonicalLegalDocument(document: CanonicalLegalDocument): string {
  return JSON.stringify(normalizeCanonicalValue(document))
}

export function serializeCanonicalLegalDocumentById(
  documentId: ClientLegalV2DocumentId,
  language: Lang,
): string {
  return serializeCanonicalLegalDocument(getCanonicalLegalDocument(documentId, language))
}

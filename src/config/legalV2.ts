import type { Lang } from '@/i18n'

export type LegalDocumentStatus = 'draft' | 'staged' | 'effective' | 'archived'
export type LegalAcceptanceScope = 'user' | 'organization' | 'none'
export type LegalV2DocumentId =
  | 'legal'
  | 'terms_pro'
  | 'terms_client'
  | 'privacy'
  | 'cookies'
  | 'dpa'
  | 'subprocessors'
  | 'security'
  | 'service_levels'
  | 'ai_policy'

export interface LegalDocumentDefinition {
  documentId: LegalV2DocumentId
  version: string
  route: string
  publishedAt: string | null
  effectiveAt: string | null
  status: LegalDocumentStatus
  supersedes: string | null
  requiresAcceptance: boolean
  acceptanceScope: LegalAcceptanceScope
  materialChange: boolean
  public: boolean
  sha256: Record<Lang, string>
}

const documentHashes: Record<LegalV2DocumentId, Record<Lang, string>> = {
  legal: {
    fr: 'b7e27190aa61dc35b44bb5b28964d35c71fce20c719725920c53d06375f5d501',
    en: '869fd4006e2cc5ab3dab293515571a65cbf37d488f0be711b90242624d142f99',
    ar: '871778353dfe8840cedd206103efa684903a0e17f943278ea54cdbffc4f49a0b',
  },
  terms_pro: {
    fr: 'bfb31cbfcb840155475d8ae6ad236893730de4558d1a3564143b4097dcadf170',
    en: 'b1e9e013d85d1c6d38f15b3bc8aae3e1953a472040b130fa6dac41dbff3c561c',
    ar: 'a98b4bd3d0a8a5f46c4744efe3417dcf6e8634a99d519e36652c975e8c77406a',
  },
  terms_client: {
    fr: '75148cb8161fa94a561ce55528d2fd9184ea2ad91f5e3a8619016f38fc6d31a7',
    en: '5b39b4616de703e7bc61f909da31dce3ce08110ed1d91d3a9aea6e063e58973d',
    ar: 'e8550f85fca2c8739096436606a6f136b3618d600988e8551c907b81e85fbcd4',
  },
  privacy: {
    fr: '46195d8d3529233cb44f8a0baafb7c23d98bedea7164564d310e100860844883',
    en: '96e2412d94aae83fb3e7abf20ca556ded21a2f8c1f7a67ae24d13ba2c6402145',
    ar: 'd9027874464a02d608dd879a89a74335bee7fdf88dc17595f1bf50156808dccb',
  },
  cookies: {
    fr: 'f9b08d5a61f7148bed5d71cc5543fd066720e08575a782a4bc92ae5dbe0e7edc',
    en: '9023e0f01e72c6478d33f7e38d9747961859d3bed0ff4b55ff09d67fc526d487',
    ar: '399121f003b970e3abe0a40a4644b519530049ad19cdd071e0635a6f9d35a319',
  },
  dpa: {
    fr: '484d5bba3263046198fb04b4326b1b683a66c386d21dc26f1ce937dc17878120',
    en: 'b2628e3c6ba4e4c82fa79976d09a0903d6f5cfb5ec769bd66d4384ca4f6b50c0',
    ar: '2b08bb7db0646c91d88a3afe3f2ff73674c0097ad8fee75b03ab6baf19cd3aec',
  },
  subprocessors: {
    fr: '04cb62ac1c520547e7d57ebb1b935436ddcdd7e93723f8d44985c7bfa916e177',
    en: '274b845ddff55ce06b64d06779692cdc28506bd875b45797471e7acced931935',
    ar: '805bf3d3ee2d7d1ea331f44dbff8f81da8f57bf522b28c9815301445c4ab950e',
  },
  security: {
    fr: '010e9cfca7ee955340cd22616947892cee19c907263038a9d52977e8328359d2',
    en: 'c37c73a0c2f721b98d051da43d88473a960f0016cfed4668f24a82fac0bf6d07',
    ar: 'f08517c191a14055f49a11681bb11cee9854cf85d3a0bac3d0842fe9daafd9e4',
  },
  service_levels: {
    fr: 'ef3a5b0058120a855a65b8e6a4bf97537c0ce41c32b6bf2e6e9728a5039568a6',
    en: '8601cd863933dad140c0202fb4ee00352eee758c2ca805a13616e975b595787b',
    ar: 'e4dc5d47ce75569fb6c7d7deb9b60c414761f8948da1779101cbc088044fca5e',
  },
  ai_policy: {
    fr: '5a412b17aec7f8804034d648fa4fcf8388fd6a9f0f3c6d376291879351223565',
    en: '67b3c47bce8ee0f6827fc9bc80b6a2ddd5c8e612175f4fbdfefe126c791b4226',
    ar: 'ef15f48fd3d1716e6714538d3dde8341138745e691bdb2d6ccf5a0ef1018f1e8',
  },
}

function staged(
  documentId: LegalV2DocumentId,
  version: string,
  route: string,
  options: Partial<LegalDocumentDefinition> = {},
): LegalDocumentDefinition {
  return {
    documentId,
    version,
    route,
    publishedAt: null,
    effectiveAt: null,
    status: 'staged',
    supersedes: '2026-07-02',
    requiresAcceptance: false,
    acceptanceScope: 'none',
    materialChange: true,
    public: true,
    sha256: documentHashes[documentId],
    ...options,
  }
}

export const LEGAL_V2_DOCUMENTS: Record<LegalV2DocumentId, LegalDocumentDefinition> = {
  legal: staged('legal', 'legal-2026-01', '/legal'),
  terms_pro: staged('terms_pro', 'terms-2026-01', '/terms/pro', {
    requiresAcceptance: true,
    acceptanceScope: 'organization',
  }),
  terms_client: staged('terms_client', 'terms-2026-01', '/terms/client', {
    requiresAcceptance: true,
    acceptanceScope: 'user',
  }),
  privacy: staged('privacy', 'privacy-2026-01', '/privacy'),
  cookies: staged('cookies', 'cookies-2026-01', '/cookies'),
  dpa: staged('dpa', 'dpa-2026-01', '/dpa', {
    requiresAcceptance: true,
    acceptanceScope: 'organization',
    public: false,
  }),
  subprocessors: staged('subprocessors', 'subprocessors-2026-01', '/subprocessors'),
  security: staged('security', 'security-2026-01', '/security'),
  service_levels: staged('service_levels', 'service-levels-2026-01', '/service-levels', { public: false }),
  ai_policy: staged('ai_policy', 'ai-policy-2026-01', '/ai-policy', {
    status: 'draft',
    supersedes: null,
    public: false,
  }),
}

export function isLegalV2DocumentId(value: string | null | undefined): value is LegalV2DocumentId {
  return Boolean(value && Object.prototype.hasOwnProperty.call(LEGAL_V2_DOCUMENTS, value))
}

export function legalV2DocumentRoute(value: string | null | undefined): string | null {
  return isLegalV2DocumentId(value) ? LEGAL_V2_DOCUMENTS[value].route : null
}

export const LEGAL_V2_FLAG_NAMES = [
  'LEGAL_DOCS_V2_ENABLED',
  'LEGAL_ACCEPTANCE_V2_ENABLED',
  'DPA_SELF_SERVICE_ENABLED',
  'SUBPROCESSOR_REGISTRY_ENABLED',
  'VERCEL_ANALYTICS_ENABLED',
  'STRIPE_ENABLED',
  'AI_FEATURES_ENABLED',
  'DOCUMENT_STORAGE_ENABLED',
  'TRANSACTIONAL_EMAIL_ENABLED',
] as const

export const LEGAL_EVIDENCE_APP_VERSION = '1.0.0'

export function legalDocumentRecord(documentId: LegalV2DocumentId, language: Lang) {
  const definition = LEGAL_V2_DOCUMENTS[documentId]
  return { ...definition, language, sha256: definition.sha256[language] }
}

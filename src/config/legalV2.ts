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
    fr: 'c4cc77044679978386ce0247204f169b261db06851b92a1476fee7042b6e25a3',
    en: 'e2963ebcbda56560431af2ad2cd3f7b01bb86389f46e209c5e8ac3af932c9492',
    ar: '05070a851c1f4721b75691670e8a3dd29ba9cf4f5b44c71255856d8b2efb6253',
  },
  terms_pro: {
    fr: '7a1e300603254a82ca2da16137b33553216e7b15f68d5bd235ae909e6baf2700',
    en: '07aa0d300a4a9d36b5d3b08cc6e110ff85b4bfae0c684014061c87d1021e5363',
    ar: 'd37594bf5ca7ad284a4b9f5d9a07040f04192d65632d4cb6e44b71647dd9e3ed',
  },
  terms_client: {
    fr: '5b2d8b1500f446459d79ee22976a0f632db2cedf2329116961c99501e97b3640',
    en: 'a5adfa398a1d9b5270a9d52062e1af6fc11a6f6fb127a6d88882e6bf956abf66',
    ar: 'b3ef8a4a140c0c1325d13b67961ce73b60da4acefda35a4707e107a44a11890e',
  },
  privacy: {
    fr: 'ce46f94d6d1f1a024fd55045f3ad8d47c1d4c5efad601b0cb2e552dcfc77a486',
    en: 'b466e1844b16a8c0b3ed15f039d3de73da66e9dc4bf8c0d7fd810da8f9aa82bd',
    ar: '2a01be149ab09dd1496cfc193a810215d414cea651a6faf7e3c3126854a83c73',
  },
  cookies: {
    fr: '6840f36df37fe2a0dd8d315ef6c3e4bec1ead3be57662863df67b78ad83c0dca',
    en: '435aba28216bd39bec6e7650963862525ecf2b73b96d3ff09455ae1ed4289fba',
    ar: '77177cf660f45c8f8f5c4cac3a01c68c1f7ee758cd60db669c71c50834a88b82',
  },
  dpa: {
    fr: '052603acbcf65a5f5797239858e236c0bfeef054469a52362e58111bf62cd0a7',
    en: '4790144261e99467ce4f75d6eb61e94813a841cac60914b377a83c9b045bd30b',
    ar: 'fc718712bfe93ce6ab4e7ee330ae3e454de682b6af317eb63c07e59ce34874e2',
  },
  subprocessors: {
    fr: '8743c142f98217ccc3373af7d75047dc6eeb0142898492dc8be8737d9bb5315a',
    en: '295cf8103ab3b01a3f9eb98d85f76a7887a19f9552a53ae44ab6445117561eae',
    ar: 'f97e3678b1d6fac05c0e86ac23742471d3ebf9b3a5a30f40a10c1d790b0dcd8a',
  },
  security: {
    fr: 'f289fc19785087f4ef5fb41f964daa987a03afd3aec6d85ed59f3874b19dae91',
    en: '0baca6fc58c22720688ffd4e38b333737891a94a41dea728036d0a4d4cc06786',
    ar: 'd9e59530d6c041f7cd2495c391ea6d6d4dc652320b43e594eed86641dcdab3ae',
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

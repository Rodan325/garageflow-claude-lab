/**
 * Informations légales PUBLIQUES centralisées (mentions légales, confidentialité,
 * CGU, confidentialité, DPA, historique pilote et footer). Source unique
 * consommée par toutes les pages légales.
 *
 * IMPORTANT : ce fichier ne doit contenir QUE des informations publiques.
 * Jamais de clé Supabase, clé API, token, secret, variable d'environnement
 * ou information sensible.
 */
export const legalConfig = {
  appName: 'Clikarage',
  serviceStatement: 'Clikarage est un service édité par RODANBTECH.',

  editorName: 'Anas RODRIGUEZ BENKARROUM',
  tradingName: 'RODANBTECH',
  legalBusinessName: 'Anas RODRIGUEZ BENKARROUM (RODANBTECH)',
  editorLegalStatus: 'Entrepreneur individuel',
  publicationDirector: 'Anas RODRIGUEZ BENKARROUM',

  editorAddress: '47 RUE VIVIENNE, 75002 PARIS, France',

  contactEmail: 'anas.rodriguez@rodanbtech.com',
  privacyContactEmail: 'anas.rodriguez@rodanbtech.com',
  contactPhone: '+33 7 81 18 93 65',

  siren: '103 878 187',
  siret: '103 878 187 00014',
  rneStatus: 'Immatriculé au Registre National des Entreprises (RNE) le 17/04/2026',
  inseeStatus: 'Inscrit à l’Insee le 17/04/2026',
  creationDate: '17/04/2026',

  rcs: 'Non applicable',
  vatNumber: 'Pas de numéro de TVA intracommunautaire valide à ce jour',
  eoriNumber: 'Pas de numéro EORI valide à ce jour',

  activity: 'Programmation informatique',
  nafApeCode: '62.01Z',
  nafApeLabel: 'Programmation informatique',
  naf2025Code: '62.10Y',
  naf2025Label: 'Activités de programmation informatique',

  employees: 'Unité non employeuse',

  // Squarespace gère le domaine (et l'email selon la config) ; il N'héberge PAS
  // l'application Clikarage — celle-ci est déployée sur Vercel.
  domainProviderName: 'Squarespace',
  domainProviderPurpose: 'Gestion du domaine et, le cas échéant, configuration de l’email professionnel',
  emailProviderName: 'Google Workspace / Squarespace, selon la configuration du domaine',

  frontendHostName: 'Vercel Inc.',
  frontendHostAddress: '440 N Barranca Ave #4133, Covina, CA 91723, États-Unis',
  frontendHostWebsite: 'https://vercel.com',
  frontendHostContact: 'Contact légal disponible via https://vercel.com',

  backendProviderName: 'Supabase, Inc.',
  backendProviderWebsite: 'https://supabase.com',
  backendPurpose: 'Base de données, authentification et infrastructure technique',
  // Région réelle du projet Supabase de production (vérifiée : eu-west-3).
  backendDataRegion: 'eu-west-3 — West EU (Paris)',
  backendDataRegionPublic:
    'Région principale Supabase : eu-west-3 — West EU (Paris). Les données principales sont hébergées dans une région européenne Supabase.',

  dpo: 'Aucun délégué à la protection des données désigné à ce stade',
  cnilWebsite: 'https://www.cnil.fr',

  // Valeurs historiques requises pour restituer sans mutation le document
  // pilote 2026-07-02. Elles ne décrivent plus l'offre commerciale courante.
  pilotVersion: 'Version pilote',
  lastUpdated: '2026-07-02',

  documentsSensitiveDisabled: true,
  analyticsEnabled: false,
  marketingCookiesEnabled: false,

  commercialOffer: {
    pilotDurationDays: 30,
    paymentEnabledInApp: false,
    onlinePaymentEnabled: false,
    sensitiveDocumentsEnabled: false,
  },
}

/**
 * Versions des documents légaux. Toute page légale affiche sa version ;
 * chaque acceptation est enregistrée AVEC la version acceptée. Incrémenter
 * une version (nouvelle date) redemande l'acceptation aux utilisateurs
 * concernés via la LegalAcceptanceGate.
 */
export const legalVersions = {
  terms: 'terms-2026-01',
  privacy: 'privacy-2026-01',
  pilotAgreement: '2026-07-02',
  dpa: 'dpa-2026-01',
  legalNotice: 'legal-2026-01',
}

export const HISTORICAL_LEGAL_VERSION = '2026-07-02'

/** No effective date is published until it has been approved for deployment. */
export const legalEffectiveDate: string | null = null

export type LegalDocumentType = 'terms' | 'privacy' | 'pilot_agreement' | 'dpa' | 'legal_notice'
export type LegalRole = 'client' | 'garage' | 'admin'

/** Version courante d'un document (clé table → clé legalVersions). */
export const LEGAL_DOCUMENT_VERSIONS: Record<LegalDocumentType, string> = {
  terms: legalVersions.terms,
  privacy: legalVersions.privacy,
  pilot_agreement: legalVersions.pilotAgreement,
  dpa: legalVersions.dpa,
  legal_notice: legalVersions.legalNotice,
}

/** Documents dont l'acceptation est OBLIGATOIRE selon le rôle. */
export const REQUIRED_LEGAL_DOCS: Record<LegalRole, LegalDocumentType[]> = {
  client: ['terms', 'privacy'],
  garage: ['terms', 'privacy', 'dpa'],
  admin: ['terms', 'privacy'],
}

/** Métadonnées d'affichage des documents (gate, page de statut, footer). */
export const LEGAL_DOCUMENT_META: Record<LegalDocumentType, { label: string; route: string }> = {
  terms: { label: 'Conditions d’utilisation', route: '/terms' },
  privacy: { label: 'Politique de confidentialité', route: '/privacy' },
  pilot_agreement: { label: 'Conditions pilote historiques', route: '/pilot-agreement' },
  dpa: { label: 'Accord de sous-traitance RGPD', route: '/dpa' },
  legal_notice: { label: 'Mentions légales', route: '/legal' },
}

export function legalDocumentRoute(documentType: LegalDocumentType, version: string) {
  const route = LEGAL_DOCUMENT_META[documentType].route
  if (documentType === 'pilot_agreement' || version === LEGAL_DOCUMENT_VERSIONS[documentType]) return route
  return `${route}?version=${encodeURIComponent(version)}`
}

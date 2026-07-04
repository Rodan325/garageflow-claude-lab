/**
 * Informations légales PUBLIQUES centralisées (mentions légales, confidentialité,
 * CGU, pilote, DPA, footer). Source unique consommée par toutes les pages légales.
 *
 * IMPORTANT : ce fichier ne doit contenir QUE des informations publiques.
 * Jamais de clé Supabase, clé API, token, secret, variable d'environnement
 * ou information sensible.
 */
export const legalConfig = {
  appName: 'GarageFlow',

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

  frontendHostName: 'Vercel Inc.',
  frontendHostAddress: '440 N Barranca Ave #4133, Covina, CA 91723, États-Unis',
  frontendHostWebsite: 'https://vercel.com',
  frontendHostContact: 'Contact légal disponible via https://vercel.com',

  backendProviderName: 'Supabase, Inc.',
  backendProviderWebsite: 'https://supabase.com',
  backendPurpose: 'Base de données, authentification et infrastructure technique',
  // Valeur interne (jamais affichée telle quelle) — les pages publiques affichent
  // une formulation propre ; la région exacte se vérifie dans le dashboard Supabase.
  backendDataRegion: 'Région Supabase du projet pilote à renseigner selon le dashboard Supabase',
  backendDataRegionPublic:
    'Région configurée dans le dashboard Supabase du projet pilote. Avant toute ouverture publique large, RODANBTECH vérifie que le choix de région et les garanties applicables sont adaptés au traitement.',

  dpo: 'Aucun délégué à la protection des données désigné à ce stade',
  cnilWebsite: 'https://www.cnil.fr',

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
  terms: '2026-07-02',
  privacy: '2026-07-02',
  pilotAgreement: '2026-07-02',
  dpa: '2026-07-02',
  legalNotice: '2026-07-02',
}

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
  garage: ['terms', 'privacy', 'pilot_agreement', 'dpa'],
  admin: ['terms', 'privacy'],
}

/** Métadonnées d'affichage des documents (gate, page de statut, footer). */
export const LEGAL_DOCUMENT_META: Record<LegalDocumentType, { label: string; route: string }> = {
  terms: { label: 'Conditions d’utilisation', route: '/terms' },
  privacy: { label: 'Politique de confidentialité', route: '/privacy' },
  pilot_agreement: { label: 'Conditions du pilote garage', route: '/pilot-agreement' },
  dpa: { label: 'Accord de sous-traitance RGPD', route: '/dpa' },
  legal_notice: { label: 'Mentions légales', route: '/legal' },
}

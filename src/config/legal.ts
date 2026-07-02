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

  backendProviderName: 'Supabase, Inc.',
  backendProviderWebsite: 'https://supabase.com',
  backendPurpose: 'Base de données, authentification et infrastructure technique',
  backendDataRegion: 'Union européenne pour l’environnement pilote lorsque le projet Supabase est configuré en région UE. Le choix de région doit être vérifié avant toute ouverture publique large.',

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

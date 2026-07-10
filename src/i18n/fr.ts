/**
 * French dictionary — the source of truth. Its shape defines `Messages`
 * (see index.ts); `en.ts` and `ar.ts` must mirror these keys exactly.
 *
 * NOTE: strings that existing tests assert on (auth errors, VerifyEmail copy,
 * the signup submit label…) must stay byte-identical here — `fr` is the default
 * language, so those tests keep passing without a provider.
 */
export const fr = {
  lang: { label: 'Langue', fr: 'Français', en: 'English', ar: 'العربية' },

  common: {
    email: 'Email',
    password: 'Mot de passe',
  },

  // Auth errors surfaced to users — never raw technical text (see mapAuthError).
  authErrors: {
    emailInUse:
      'Un compte existe peut-être déjà avec cette adresse. Essayez de vous connecter ou de réinitialiser votre mot de passe.',
    emailNotConfirmed: 'Vérifiez votre email avant de vous connecter.',
    network: 'Connexion au service impossible. Réessayez dans quelques instants.',
    generic: 'Une erreur est survenue. Réessayez dans quelques instants.',
  },

  login: {
    title: 'Se connecter',
    subtitle: 'Espace garage ou compte client.',
    asideHeading: 'Recevez vos demandes de rendez-vous en ligne et gérez-les en quelques clics.',
    asideSubtitle: 'Demandes centralisées, agenda propre, suivi client.',
    demoGarage: 'Démo garage',
    demoClient: 'Démo client',
    withoutSupabase: 'sans Supabase',
    orWithSupabase: 'ou avec un compte Supabase',
    prefillGarage: 'Pré-remplir garage',
    prefillClient: 'Pré-remplir client',
    emailPlaceholder: 'vous@garage.fr',
    submit: 'Se connecter',
    noAccount: 'Pas encore de compte client ?',
    createAccountLink: 'Créer un compte',
    errorTitle: 'Connexion impossible',
    invalidCredentials: 'Email ou mot de passe incorrect.',
  },

  signup: {
    title: 'Créer un compte client',
    subtitle: 'Pour réserver et suivre vos rendez-vous au garage.',
    fullName: 'Nom complet',
    fullNamePlaceholder: 'Julie Durand',
    emailPlaceholder: 'vous@email.fr',
    emailConfirm: 'Confirmer l’email',
    phone: 'Téléphone',
    phoneHint: 'Facultatif — utile pour vous joindre au sujet d’un rendez-vous.',
    phonePlaceholder: '06 12 34 56 78',
    passwordHint: 'Utilisez au moins 12 caractères. Une phrase de passe longue est idéale.',
    passwordPlaceholder: 'Une phrase de passe que vous retenez',
    passwordConfirm: 'Confirmer le mot de passe',
    passwordConfirmPlaceholder: 'Ressaisissez votre mot de passe',
    strengthStrong: 'Fort',
    strengthMedium: 'Moyen',
    strengthWeak: 'Faible',
    submit: 'Créer mon compte',
    horodatage: 'Votre acceptation est horodatée et conservée dans un journal d’acceptation.',
    alreadyMember: 'Déjà inscrit ?',
    loginLink: 'Se connecter',
    createdTitle: 'Compte créé',
    createdBody: 'Bienvenue sur GarageFlow.',
    errorTitle: 'Création impossible',
  },

  verifyEmail: {
    title: 'Vérifiez votre email',
    bodyPrefix: 'Nous avons envoyé un lien de confirmation à : ',
    bodyFallbackAddress: 'votre adresse email',
    bodySuffix: '. Cliquez sur le lien reçu pour activer votre compte, puis connectez-vous.',
    goToLogin: 'Aller à la connexion',
    resend: 'Renvoyer l’email',
    backHome: 'Retour à l’accueil',
    spamHint: 'Vous ne trouvez pas l’email ? Pensez à vérifier votre dossier spam.',
    resendErrorTitle: 'Envoi impossible',
    resendOkTitle: 'Email renvoyé',
    resendOkBody: 'Vérifiez votre boîte de réception (et le dossier spam).',
  },
}

export type Messages = typeof fr

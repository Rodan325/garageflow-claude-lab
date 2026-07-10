import type { Messages } from './fr'

/** English dictionary. Mirrors the keys of `fr` (typed against `Messages`). */
export const en: Messages = {
  lang: { label: 'Language', fr: 'Français', en: 'English', ar: 'العربية' },

  common: {
    email: 'Email',
    password: 'Password',
  },

  authErrors: {
    emailInUse:
      'An account may already exist with this address. Try signing in or resetting your password.',
    emailNotConfirmed: 'Please confirm your email before signing in.',
    network: 'Unable to reach the service. Please try again in a moment.',
    generic: 'Something went wrong. Please try again in a moment.',
  },

  login: {
    title: 'Sign in',
    subtitle: 'Garage workspace or client account.',
    asideHeading: 'Receive your appointment requests online and manage them in a few clicks.',
    asideSubtitle: 'Centralized requests, a clean calendar, client follow-up.',
    demoGarage: 'Garage demo',
    demoClient: 'Client demo',
    withoutSupabase: 'no Supabase',
    orWithSupabase: 'or with a Supabase account',
    prefillGarage: 'Prefill garage',
    prefillClient: 'Prefill client',
    emailPlaceholder: 'you@garage.com',
    submit: 'Sign in',
    noAccount: 'No client account yet?',
    createAccountLink: 'Create an account',
    errorTitle: 'Sign-in failed',
    invalidCredentials: 'Incorrect email or password.',
  },

  signup: {
    title: 'Create a client account',
    subtitle: 'To book and track your appointments at the garage.',
    fullName: 'Full name',
    fullNamePlaceholder: 'Julie Durand',
    emailPlaceholder: 'you@email.com',
    emailConfirm: 'Confirm email',
    phone: 'Phone',
    phoneHint: 'Optional — useful to reach you about an appointment.',
    phonePlaceholder: '06 12 34 56 78',
    passwordHint: 'Use at least 12 characters. A long passphrase is ideal.',
    passwordPlaceholder: 'A passphrase you can remember',
    passwordConfirm: 'Confirm password',
    passwordConfirmPlaceholder: 'Re-enter your password',
    strengthStrong: 'Strong',
    strengthMedium: 'Medium',
    strengthWeak: 'Weak',
    submit: 'Create my account',
    horodatage: 'Your acceptance is timestamped and kept in an acceptance log.',
    alreadyMember: 'Already registered?',
    loginLink: 'Sign in',
    createdTitle: 'Account created',
    createdBody: 'Welcome to GarageFlow.',
    errorTitle: 'Could not create account',
  },

  verifyEmail: {
    title: 'Verify your email',
    bodyPrefix: 'We sent a confirmation link to: ',
    bodyFallbackAddress: 'your email address',
    bodySuffix: '. Click the link you received to activate your account, then sign in.',
    goToLogin: 'Go to sign in',
    resend: 'Resend the email',
    backHome: 'Back to home',
    spamHint: 'Can’t find the email? Remember to check your spam folder.',
    resendErrorTitle: 'Could not send',
    resendOkTitle: 'Email resent',
    resendOkBody: 'Check your inbox (and the spam folder).',
  },
}

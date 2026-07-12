import { messagesFor, type Lang } from '@/i18n'

/**
 * Map a Supabase auth error (returned OR thrown) to a clear, user-facing
 * message in the given language (French by default). Never surfaces raw
 * technical strings like "Failed to fetch" to users.
 */
export function mapAuthError(error: unknown, lang: Lang = 'fr'): string {
  const a = messagesFor(lang).authErrors
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : typeof error === 'string'
        ? error
        : ''
  const m = message.toLowerCase()

  if (
    m.includes('already registered') ||
    m.includes('already been registered') ||
    m.includes('already exists') ||
    m.includes('user already')
  ) {
    return a.emailInUse
  }

  if (m.includes('email not confirmed') || m.includes('not confirmed') || m.includes('email_not_confirmed')) {
    return a.emailNotConfirmed
  }

  if (
    m.includes('failed to fetch') ||
    m.includes('network') ||
    m.includes('load failed') ||
    m.includes('invalid api key') ||
    m.includes('api key') ||
    m.includes('apikey')
  ) {
    return a.network
  }

  return a.generic
}

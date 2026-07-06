/**
 * Map a Supabase auth error (returned OR thrown) to a clear, user-facing French
 * message. Never surfaces raw technical strings like "Failed to fetch" to users.
 */
export function mapAuthError(error: unknown): string {
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
    return 'Un compte existe peut-être déjà avec cette adresse. Essayez de vous connecter ou de réinitialiser votre mot de passe.'
  }

  if (m.includes('failed to fetch') || m.includes('network') || m.includes('load failed')) {
    return 'Connexion au service impossible. Réessayez dans quelques instants.'
  }

  return message || 'Une erreur est survenue. Réessayez dans quelques instants.'
}

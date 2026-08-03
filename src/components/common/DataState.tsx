import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CloudOff, Lock, TimerOff } from 'lucide-react'
import { ErrorState, LoadingState } from '@/components/ui/feedback'
import { useLang } from '@/i18n'

/**
 * Why a fetch failed, from the user's point of view. The distinction matters:
 * an empty list and an unreachable backend look identical otherwise, and the
 * action to take is different in each case.
 */
export type DataErrorKind = 'network' | 'forbidden' | 'expired' | 'unknown'

/**
 * Classify a query error. Order matters: an expired session also surfaces as a
 * 401, so it is checked before the generic "access refused" branch.
 */
export function classifyDataError(error: unknown): DataErrorKind {
  if (!error) return 'unknown'
  const e = error as { code?: string; status?: number; name?: string; message?: string }
  const code = (e.code ?? '').toUpperCase()
  const status = typeof e.status === 'number' ? e.status : undefined
  const message = (e.message ?? '').toLowerCase()

  // Expired / invalid credentials → signing in again is the only way out.
  if (
    code === 'PGRST301' ||
    message.includes('jwt expired') ||
    message.includes('jwt is expired') ||
    message.includes('token is expired') ||
    message.includes('invalid refresh token') ||
    message.includes('session expired') ||
    (status === 401 && !message.includes('permission denied'))
  ) {
    return 'expired'
  }

  // Row-level security or missing grant → retrying changes nothing.
  if (
    code === '42501' ||
    status === 403 ||
    message.includes('permission denied') ||
    message.includes('row-level security') ||
    message.includes('insufficient_privilege')
  ) {
    return 'forbidden'
  }

  // Offline, DNS failure, backend unreachable. fetch() rejects with a TypeError.
  if (
    e.name === 'TypeError' ||
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    message.includes('failed to fetch') ||
    message.includes('fetch failed') ||
    message.includes('networkerror') ||
    message.includes('network request failed') ||
    message.includes('load failed')
  ) {
    return 'network'
  }

  return 'unknown'
}

/**
 * Single decision point for "what do I render for this query?", so every screen
 * distinguishes loading, a genuinely empty list, and the three failure modes
 * instead of collapsing them all into an empty state.
 *
 * Precedence: loading → error → empty → content.
 */
export function DataState({
  isLoading,
  isError,
  error,
  isEmpty,
  empty,
  onRetry,
  loadingLabel,
  children,
}: {
  isLoading?: boolean
  isError?: boolean
  error?: unknown
  /** True when the query succeeded and returned nothing. */
  isEmpty?: boolean
  /** Rendered when isEmpty — usually an <EmptyState /> written by the screen. */
  empty?: ReactNode
  onRetry?: () => void
  loadingLabel?: string
  children?: ReactNode
}) {
  const { tr } = useLang()

  if (isLoading) return <LoadingState label={loadingLabel} />

  if (isError) {
    const kind = classifyDataError(error)

    if (kind === 'expired') {
      return (
        <ErrorState
          icon={TimerOff}
          title={tr('Session expirée')}
          message={tr('Votre session a expiré. Reconnectez-vous pour continuer.')}
          action={
            <Link
              to="/login"
              className="rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium hover:bg-muted/60"
            >
              {tr('Se reconnecter')}
            </Link>
          }
        />
      )
    }

    if (kind === 'forbidden') {
      // No retry button: the request will fail again in exactly the same way.
      return (
        <ErrorState
          icon={Lock}
          title={tr('Accès refusé')}
          message={tr('Vous n’avez pas les droits nécessaires pour consulter ces informations.')}
        />
      )
    }

    if (kind === 'network') {
      return (
        <ErrorState
          icon={CloudOff}
          title={tr('Connexion indisponible')}
          message={tr('Vérifiez votre connexion internet, puis réessayez.')}
          onRetry={onRetry}
        />
      )
    }

    return (
      <ErrorState
        message={tr('Ces informations n’ont pas pu être chargées.')}
        onRetry={onRetry}
      />
    )
  }

  if (isEmpty) return <>{empty}</>
  return <>{children}</>
}

/**
 * Single source of truth for the persisted Auth session key.
 *
 * Kept in its own module — with no dependency on the Supabase client — so the
 * sign-out path and its tests can reference the real key without pulling in
 * (or mocking) the whole client.
 *
 * The historical `gf-*` / `garageflow-*` prefix is deliberate: renaming it
 * would sign every existing user out on deploy.
 */
export const AUTH_STORAGE_KEY = 'garageflow-auth'

/**
 * Remove ONLY the Clikarage Auth session from local storage.
 *
 * Needed because auth-js returns from `_signOut()` BEFORE `_removeSession()`
 * when the revocation request fails (offline, 5xx). Without this the token
 * survives and a page refresh silently restores the session the user believes
 * they closed. Never throws: storage can be unavailable (private mode, disabled
 * cookies), and a sign-out must not fail because of that.
 */
export function purgeLocalAuthSession() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    /* storage unavailable — the in-memory session is already cleared */
  }
}

/**
 * Centralised env access. The frontend only ever uses PUBLIC values
 * (Supabase URL + anon/publishable key). The service_role key must never
 * appear in client code.
 *
 * Vite exposes only variables prefixed with VITE_ via import.meta.env.
 * We defensively trim and strip accidental surrounding quotes so a value
 * like  VITE_SUPABASE_URL="https://x"  also works.
 */
function clean(value?: string): string {
  return (value ?? '').trim().replace(/^['"]|['"]$/g, '')
}

const url = clean(import.meta.env.VITE_SUPABASE_URL)
const anonKey = clean(import.meta.env.VITE_SUPABASE_ANON_KEY)

export const env = {
  supabaseUrl: url,
  supabaseAnonKey: anonKey,
  demoGarageSlug: clean(import.meta.env.VITE_DEMO_GARAGE_SLUG) || 'garage-central-lyon',
}

/**
 * True when Supabase is correctly configured. Localhost (127.0.0.1 / :5180)
 * has no effect here — only the env values matter.
 */
export const isSupabaseConfigured = Boolean(
  url &&
    anonKey &&
    url.startsWith('https://') &&
    !url.includes('YOUR_PROJECT') &&
    anonKey.length > 20 &&
    !anonKey.includes('xxx'),
)

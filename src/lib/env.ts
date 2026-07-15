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
  /**
   * Multi-center feature flag (raw). Off unless explicitly 'true'. Real Supabase
   * mode must keep this false until migrations 0022/0023 are applied, so the app
   * never queries garage_centers or sends center_id to a schema without them.
   */
  enableCenters: clean(import.meta.env.VITE_ENABLE_CENTERS) === 'true',
  enableWorkshopTimeline: clean(import.meta.env.VITE_ENABLE_WORKSHOP_TIMELINE) === 'true',
  enableRecommendations: clean(import.meta.env.VITE_ENABLE_RECOMMENDATIONS) === 'true',
  enableAttachments: clean(import.meta.env.VITE_ENABLE_ATTACHMENTS) === 'true',
  enableNotifications: clean(import.meta.env.VITE_ENABLE_NOTIFICATIONS) === 'true',
  enableDeliveryReports: clean(import.meta.env.VITE_ENABLE_DELIVERY_REPORTS) === 'true',
  enableMaintenanceReminders: clean(import.meta.env.VITE_ENABLE_MAINTENANCE_REMINDERS) === 'true',
  /** Optional white-label brand for a dedicated build/preview (e.g. 'speedy'). Empty = default. */
  brand: clean(import.meta.env.VITE_BRAND),
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

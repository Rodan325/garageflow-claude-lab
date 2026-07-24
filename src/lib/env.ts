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

export function isExplicitlyEnabled(value?: string): boolean {
  return clean(value) === 'true'
}

const url = clean(import.meta.env.VITE_SUPABASE_URL)
const anonKey = clean(import.meta.env.VITE_SUPABASE_ANON_KEY)

export function isAllowedSupabaseUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    if (parsed.protocol === 'https:') return true

    return parsed.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)
  } catch {
    return false
  }
}

export const env = {
  supabaseUrl: url,
  supabaseAnonKey: anonKey,
  demoGarageSlug: clean(import.meta.env.VITE_DEMO_GARAGE_SLUG) || 'garage-central-lyon',
  /**
   * Multi-center feature flag (raw). Off unless explicitly 'true'. Real Supabase
   * mode must keep this false until the timestamped center migrations are
   * applied, so the app never queries garage_centers or sends center_id to a
   * schema without them.
   */
  enableCenters: isExplicitlyEnabled(import.meta.env.VITE_ENABLE_CENTERS),
  enableWorkshopTimeline: isExplicitlyEnabled(import.meta.env.VITE_ENABLE_WORKSHOP_TIMELINE),
  enableRecommendations: isExplicitlyEnabled(import.meta.env.VITE_ENABLE_RECOMMENDATIONS),
  enableAttachments: isExplicitlyEnabled(import.meta.env.VITE_ENABLE_ATTACHMENTS),
  enableNotifications: isExplicitlyEnabled(import.meta.env.VITE_ENABLE_NOTIFICATIONS),
  enableDeliveryReports: isExplicitlyEnabled(import.meta.env.VITE_ENABLE_DELIVERY_REPORTS),
  enableMaintenanceReminders: isExplicitlyEnabled(import.meta.env.VITE_ENABLE_MAINTENANCE_REMINDERS),
  enableNetworkDashboard: isExplicitlyEnabled(import.meta.env.VITE_ENABLE_NETWORK_DASHBOARD),
  enableIntegrations: isExplicitlyEnabled(import.meta.env.VITE_ENABLE_INTEGRATIONS),
  enableLegalDocsV2: isExplicitlyEnabled(import.meta.env.VITE_LEGAL_DOCS_V2_ENABLED),
  enableLegalAcceptanceV2: isExplicitlyEnabled(import.meta.env.VITE_LEGAL_ACCEPTANCE_V2_ENABLED),
  enableDpaSelfService: isExplicitlyEnabled(import.meta.env.VITE_DPA_SELF_SERVICE_ENABLED),
  enableSubprocessorRegistry: isExplicitlyEnabled(import.meta.env.VITE_SUBPROCESSOR_REGISTRY_ENABLED),
  enableVercelAnalytics: isExplicitlyEnabled(import.meta.env.VITE_VERCEL_ANALYTICS_ENABLED),
  enableStripe: isExplicitlyEnabled(import.meta.env.VITE_STRIPE_ENABLED),
  enableAiFeatures: isExplicitlyEnabled(import.meta.env.VITE_AI_FEATURES_ENABLED),
  enableDocumentStorage: isExplicitlyEnabled(import.meta.env.VITE_DOCUMENT_STORAGE_ENABLED),
  enableTransactionalEmail: isExplicitlyEnabled(import.meta.env.VITE_TRANSACTIONAL_EMAIL_ENABLED),
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
    isAllowedSupabaseUrl(url) &&
    !url.includes('YOUR_PROJECT') &&
    anonKey.length > 20 &&
    !anonKey.includes('xxx'),
)

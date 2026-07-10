/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_DEMO_GARAGE_SLUG?: string
  /** Multi-center feature flag. Keep 'false' in prod until 0022/0023 are applied. */
  readonly VITE_ENABLE_CENTERS?: string
  /** Optional white-label brand for a dedicated build/preview (e.g. 'speedy'). */
  readonly VITE_BRAND?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

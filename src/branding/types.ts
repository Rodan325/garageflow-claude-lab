import type { ComponentType } from 'react'

export type BrandId = 'default' | 'speedy'

/**
 * A white-label brand / tenant. The DEFAULT brand mirrors the app's current
 * look & copy exactly (no color/favicon override), so with no brand selected
 * the product is byte-for-byte what it is today. Additional brands (e.g. a
 * Speedy demo) are pure config — no hard-coded brand name anywhere in the app.
 */
export interface Brand {
  id: BrandId
  /** Official product brand → no demo disclaimer. Non-official brands show DemoNotice. */
  official: boolean
  appName: string
  shortName: string
  /** Custom logo component (wins over logoUrl). When absent, the default wordmark renders. */
  logoComponent?: ComponentType<{ className?: string; compact?: boolean }>
  /** Optional logo image URL (used when no logoComponent). A "logo zone" to drop an authorized asset into. */
  logoUrl?: string
  /** Optional compact icon asset. Falls back to the wordmark until an authorized icon exists. */
  logoIconUrl?: string
  /** Favicon href (public path or data URI). Reverts to the app default under the default brand. */
  favicon?: string
  /** HSL triplet "H S% L%" matching index.css CSS vars. Undefined = keep the theme default (no override). */
  primaryColor?: string
  accentColor?: string
  primaryForeground?: string
  companyDisplayName: string
  supportEmail: string
  legalDisplayName: string
  /** Shown in the DemoNotice bar while a non-official brand is active. */
  demoNotice?: string
  publicAppTitle: string
  quoteFooterBranding: string
  bookingBranding: string
  loginBranding: string
}

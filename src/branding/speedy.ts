import { SpeedyLogo } from './SpeedyLogo'
import type { Brand } from './types'

// Placeholder favicon (red rounded tile + "S") — NOT the official Speedy logo.
const SPEEDY_FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23dc2626'/%3E%3Ctext x='16' y='23' font-family='Arial,Helvetica,sans-serif' font-size='20' font-weight='bold' fill='white' text-anchor='middle'%3ES%3C/text%3E%3C/svg%3E"

/**
 * Speedy DEMO brand — a white-label presentation skin. Colors are a red
 * approximation (not brand assets); the logo is a placeholder zone. Marked
 * non-official so the DemoNotice disclaimer is always shown.
 */
export const speedyBrand: Brand = {
  id: 'speedy',
  official: false,
  appName: 'Speedy',
  shortName: 'Speedy',
  logoComponent: SpeedyLogo,
  favicon: SPEEDY_FAVICON,
  // HSL triplets matching index.css CSS vars.
  primaryColor: '0 72% 45%',
  accentColor: '0 76% 96%',
  primaryForeground: '0 0% 100%',
  companyDisplayName: 'Speedy',
  supportEmail: 'demo@rodanbtech.com',
  legalDisplayName: 'Démo Speedy (non officielle)',
  demoNotice: 'Démo personnalisée à titre de présentation — non officielle',
  publicAppTitle: 'Speedy — Démo',
  quoteFooterBranding: 'Démo — document de présentation, non officiel',
  bookingBranding: 'Prenez rendez-vous dans votre centre auto.',
  loginBranding: 'Espace centre auto et compte client.',
}

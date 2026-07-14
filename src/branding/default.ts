import { legalConfig } from '@/config/legal'
import type { Brand } from './types'

/** Official Clikarage product brand. RODANBTECH remains the legal editor. */
export const defaultBrand: Brand = {
  id: 'default',
  official: true,
  appName: 'Clikarage',
  shortName: 'Clikarage',
  logoLightUrl: '/branding/clikarage-logo-light.svg',
  logoDarkUrl: '/branding/clikarage-logo-dark.svg',
  logoIconUrl: '/branding/clikarage-icon.svg',
  logoUrl: '/branding/clikarage-logo.png',
  favicon: '/branding/clikarage-logo.png',
  companyDisplayName: 'RODANBTECH',
  supportEmail: legalConfig.contactEmail,
  legalDisplayName: 'Clikarage — service édité par RODANBTECH',
  publicAppTitle: 'Clikarage',
  quoteFooterBranding: 'Document généré par Clikarage, un service édité par RODANBTECH',
  bookingBranding: 'Réservez et suivez vos rendez-vous au garage.',
  loginBranding: 'Espace garage ou compte client.',
}

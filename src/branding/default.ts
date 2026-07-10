import { legalConfig } from '@/config/legal'
import type { Brand } from './types'

/**
 * Official GarageFlow brand = the app's CURRENT look & copy. It sets NO color
 * or favicon override, so under the default brand the UI is unchanged. Values
 * come from the existing legal config / index.html so nothing drifts.
 */
export const defaultBrand: Brand = {
  id: 'default',
  official: true,
  appName: 'GarageFlow',
  shortName: 'GarageFlow',
  favicon: '/favicon.svg',
  companyDisplayName: 'GarageFlow',
  supportEmail: legalConfig.contactEmail,
  legalDisplayName: legalConfig.appName,
  publicAppTitle: 'GarageFlow',
  quoteFooterBranding: 'Document généré par GarageFlow',
  bookingBranding: 'Réservez et suivez vos rendez-vous au garage.',
  loginBranding: 'Espace garage ou compte client.',
}

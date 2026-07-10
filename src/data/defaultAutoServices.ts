/**
 * Default service catalog for a car-service center (centre auto). Used to seed
 * the demo store and, later, to bootstrap a real center's catalog. Pure data —
 * no Supabase dependency — so it is safe to import anywhere.
 */
export interface DefaultAutoService {
  name: string
  description: string
  category: string
  duration_minutes: number
  price_from: number
}

export const DEFAULT_AUTO_SERVICES: DefaultAutoService[] = [
  { name: 'Pneumatique', description: 'Montage, équilibrage et valve — au pneu.', category: 'Pneumatique', duration_minutes: 30, price_from: 25 },
  { name: 'Géométrie / équilibrage', description: 'Réglage du parallélisme et équilibrage des roues.', category: 'Pneumatique', duration_minutes: 45, price_from: 59 },
  { name: 'Vidange', description: 'Vidange huile moteur et remplacement du filtre à huile.', category: 'Entretien', duration_minutes: 45, price_from: 79 },
  { name: 'Freinage', description: 'Contrôle et remplacement des plaquettes / disques.', category: 'Freinage', duration_minutes: 60, price_from: 119 },
  { name: 'Batterie', description: 'Test de charge et remplacement de la batterie.', category: 'Électrique', duration_minutes: 30, price_from: 89 },
  { name: 'Climatisation', description: 'Recharge et contrôle du circuit de climatisation.', category: 'Confort', duration_minutes: 60, price_from: 89 },
  { name: 'Diagnostic électronique', description: 'Lecture des défauts et diagnostic moteur.', category: 'Diagnostic', duration_minutes: 30, price_from: 49 },
  { name: 'Amortisseurs', description: 'Contrôle et remplacement des amortisseurs.', category: 'Suspension', duration_minutes: 90, price_from: 149 },
  { name: 'Bougies', description: 'Remplacement des bougies d’allumage ou de préchauffage.', category: 'Entretien', duration_minutes: 45, price_from: 69 },
  { name: 'Essuie-glaces', description: 'Remplacement des balais d’essuie-glaces.', category: 'Confort', duration_minutes: 15, price_from: 19 },
]

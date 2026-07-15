/**
 * Local demo mode — lets anyone explore Clikarage WITHOUT Supabase.
 * Data lives in localStorage (shared between tabs), so a booking made in the
 * "client" demo shows up in the "garage" demo inbox. This never replaces the
 * real Supabase mode: it only activates when explicitly entered.
 */
import type {
  Appointment, ClientProfile, ClientVehicle, Customer, Garage, GarageCenter, GarageHours,
  GarageNews, GarageService, Quote, QuoteLine, Repair, ServiceRequest, ServiceRequestMessage,
  ServiceRequestTimelineEvent, Task, WorkshopStage,
} from '@/types/domain'
import type { DashboardStats, TeamMember } from '@/data/proData'
import { DEFAULT_AUTO_SERVICES } from '@/data/defaultAutoServices'
import { resolveBrandId } from '@/branding'
import { computeQuoteTotals, lineTotal } from '@/lib/quoteTotals'
import { quoteSendBlockReason } from '@/lib/quoteStatus'
import { legalVersions } from '@/config/legal'
import { assertWorkshopTransition, isWorkshopStage } from '@/features/workshop/lifecycle'
import {
  canStaffTransitionRecommendation,
  customerDecisionStatus,
  type RecommendationDecision,
  type RecommendationDecisionEvent,
  type RecommendationStatus,
  type RecommendationUrgency,
  type WorkshopRecommendation,
} from '@/features/recommendations/model'
import type { AttachmentDocumentType, AttachmentVisibility, ServiceRequestAttachment } from '@/features/attachments/model'
import type { NotificationEvent, NotificationOutboxItem } from '@/features/notifications/model'
import type { DeliveryReport } from '@/features/reports/model'
import type { MaintenanceReminder, ReminderType } from '@/features/reminders/model'

const totalsFrom = (lines: Partial<QuoteLine>[]) =>
  computeQuoteTotals(lines.map((l) => ({ quantity: Number(l.quantity) || 0, unit_price: Number(l.unit_price) || 0, tax_rate: Number(l.tax_rate) || 0 })))

export const DEMO_GARAGE_ID = 'demo-garage'
export const DEMO_STAFF_ID = 'demo-staff'
export const DEMO_CLIENT_ID = 'demo-client'

// Active role is PER-TAB (sessionStorage) so two tabs can run different roles
// (client + garage) side by side; the demo DATA is shared (localStorage).
const KIND_KEY = 'gf-demo'
// Base key; brand-scoped at runtime (see storeKey()) so the default Clikarage
// demo and the Speedy demo keep completely separate data.
// v6: brand-scoped store; default brand reverts to the original catalog.
export const STORE_KEY = 'gf-demo-store-v6'
export const SPEEDY_STORE_KEY = `${STORE_KEY}-speedy`

export type DemoKind = 'garage' | 'client'

/** Which demo dataset to use: 'speedy' (car-service network) or 'default'. */
export type DemoBrand = 'default' | 'speedy'
export function getDemoBrand(): DemoBrand {
  return resolveBrandId() === 'speedy' ? 'speedy' : 'default'
}
function storeKey(brand: DemoBrand = getDemoBrand()): string {
  return brand === 'speedy' ? SPEEDY_STORE_KEY : STORE_KEY
}

export function getDemoKind(): DemoKind | null {
  if (typeof window === 'undefined') return null
  const v = sessionStorage.getItem(KIND_KEY)
  return v === 'garage' || v === 'client' ? v : null
}
export function isDemo() {
  return getDemoKind() !== null
}
export function setDemoKind(kind: DemoKind) {
  ensureStore()
  sessionStorage.setItem(KIND_KEY, kind) // per-tab → never propagated to other tabs
  window.dispatchEvent(new Event('gf-demo-role'))
}
export function clearDemo() {
  sessionStorage.removeItem(KIND_KEY)
  window.dispatchEvent(new Event('gf-demo-role'))
}

/**
 * A demo quote share-link may be opened in a NEW tab that hasn't entered demo
 * mode (the active role lives in sessionStorage, per-tab). Demo tokens always
 * start with "demo"; a real Supabase token is 64 hex chars and can never start
 * with "demo" (it contains no 'm'/'o'), so this never shadows a real link.
 */
export function isDemoQuoteToken(token?: string | null): boolean {
  return !!token && token.startsWith('demo')
}

/** True when a demo token can be resolved from THIS browser's local store. */
export function canResolveDemoPublicQuote(token?: string | null): boolean {
  if (!token || !isDemoQuoteToken(token)) return false
  if (typeof window === 'undefined') return false
  return findStoredQuote(token) !== null
}

/** Owning dataset for a stored public demo quote, without changing active branding. */
export function demoPublicQuoteBrand(token?: string | null): DemoBrand | null {
  if (!token || !isDemoQuoteToken(token)) return null
  if (typeof window === 'undefined') return null
  return findStoredQuote(token)?.brand ?? null
}

/** Discreet note shown when a demo garage copies a client quote link. */
export const DEMO_QUOTE_LINK_HINT =
  'Ce lien de présentation est disponible depuis ce navigateur.'

const uid = () => 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
const today = () => new Date()
const isoIn = (days: number) => {
  const d = today()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

interface Store {
  garages: Garage[]
  centers: GarageCenter[]
  services: GarageService[]
  news: GarageNews[]
  hours: GarageHours[]
  customers: Customer[]
  vehicles: Vehicle[]
  clientVehicles: ClientVehicle[]
  requests: ServiceRequest[]
  messages: ServiceRequestMessage[]
  workshopTimeline: ServiceRequestTimelineEvent[]
  recommendations: WorkshopRecommendation[]
  recommendationDecisions: RecommendationDecisionEvent[]
  attachments: ServiceRequestAttachment[]
  notificationOutbox: NotificationOutboxItem[]
  deliveryReports: DeliveryReport[]
  maintenanceReminders: MaintenanceReminder[]
  appointments: Appointment[]
  repairs: Repair[]
  tasks: Task[]
  quotes: Quote[]
  quoteLines: QuoteLine[]
  clientProfile: ClientProfile
  reqSeq: number
  quoteSeq: number
}
type Vehicle = Customer extends never ? never : import('@/types/domain').Vehicle

// Original Clikarage demo catalog — kept for the DEFAULT brand so its demo is
// unchanged. The Speedy demo uses DEFAULT_AUTO_SERVICES (car-service catalog).
const ORIGINAL_SERVICES = [
  { name: 'Révision constructeur', description: 'Vidange, filtres et points de contrôle complets.', category: 'Entretien', duration_minutes: 90, price_from: 149 },
  { name: 'Vidange + filtre', description: 'Vidange huile et remplacement du filtre à huile.', category: 'Entretien', duration_minutes: 45, price_from: 79 },
  { name: 'Plaquettes de frein', description: 'Contrôle et remplacement des plaquettes avant.', category: 'Freinage', duration_minutes: 60, price_from: 119 },
  { name: 'Diagnostic électronique', description: 'Lecture des défauts et diagnostic moteur.', category: 'Diagnostic', duration_minutes: 30, price_from: 49 },
  { name: 'Recharge climatisation', description: 'Recharge et contrôle du circuit de climatisation.', category: 'Confort', duration_minutes: 60, price_from: 89 },
  { name: 'Pneu monté (unité)', description: 'Montage, équilibrage et valve neuve.', category: 'Pneumatiques', duration_minutes: 20, price_from: 25 },
]

function seed(brand: DemoBrand = 'default'): Store {
  const isSpeedy = brand === 'speedy'
  const g: Garage = {
    id: DEMO_GARAGE_ID, slug: 'garage-central-lyon',
    name: isSpeedy ? 'Speedy Lyon' : 'Garage Central Lyon',
    legal_name: 'Garage Central SARL', siret: null, vat_number: null,
    phone: '+33 4 78 00 00 00', email: 'contact@garage-central.fr', website: null,
    address: '12 rue de la Mécanique', city: 'Lyon', postal_code: '69003', country: 'FR',
    description: 'Entretien, révision et réparation toutes marques au cœur de Lyon. Devis clair, délais respectés.',
    specialties: ['Entretien', 'Révision', 'Pneumatiques', 'Diagnostic', 'Climatisation'],
    logo_url: null, accent_color: null, legal_info: null, maps_url: null,
    is_public: true, settings: {}, created_at: today().toISOString(),
  }
  const ctr = (slug: string, name: string, city: string, postal_code: string, sort_order: number): GarageCenter => ({
    id: uid(), garage_id: DEMO_GARAGE_ID, slug, name,
    address: null, city, postal_code, phone: g.phone,
    is_active: true, sort_order, created_at: today().toISOString(),
  })
  // Centers exist ONLY in the multi-center (Speedy) demo. The plain Clikarage
  // demo has none → the booking flow stays the legacy 3-step flow.
  const centers: GarageCenter[] = isSpeedy
    ? [
        ctr('lyon-part-dieu', 'Centre Part-Dieu', 'Lyon', '69003', 1),
        ctr('villeurbanne', 'Centre Villeurbanne', 'Villeurbanne', '69100', 2),
        ctr('lyon-gerland', 'Centre Gerland', 'Lyon', '69007', 3),
      ]
    : []
  const svc = (name: string, description: string, category: string, duration_minutes: number, price_from: number, sort_order: number): GarageService => ({
    id: uid(), garage_id: DEMO_GARAGE_ID, name, description, category, duration_minutes,
    price_from, is_active: true, sort_order, created_at: today().toISOString(),
    tax_rate: 20, labor_hours: null, price_type: 'from', default_lines: [],
  })
  // Speedy demo → car-service catalog; default demo → the original catalog.
  const serviceDefs = isSpeedy ? DEFAULT_AUTO_SERVICES : ORIGINAL_SERVICES
  const services = serviceDefs.map((s, i) =>
    svc(s.name, s.description, s.category, s.duration_minutes, s.price_from, i + 1),
  )
  const freinage = services.find((s) => s.category === 'Freinage') ?? services[0]
  const cust = (first_name: string, last_name: string, city: string): Customer => ({
    id: uid(), garage_id: DEMO_GARAGE_ID, linked_user_id: null, first_name, last_name,
    company_name: null, phone: '+33 6 12 34 56 78', email: `${first_name.toLowerCase()}@example.fr`,
    address: null, city, postal_code: null, source: null, notes: null, marketing_consent: false,
    created_at: today().toISOString(),
  })
  const customers = [cust('Marc', 'Petit', 'Lyon'), cust('Inès', 'Lefort', 'Villeurbanne')]
  const veh = (customer_id: string, brand: string, model: string, year: number, mileage: number, fuel: string, registration: string, status: string): Vehicle => ({
    id: uid(), garage_id: DEMO_GARAGE_ID, customer_id, brand, model, version: null, year, mileage,
    fuel, gearbox: null, vin: null, registration, color: null, notes: null, status,
    created_at: today().toISOString(), updated_at: today().toISOString(),
  })
  const vehicles = [
    veh(customers[0].id, 'Renault', 'Clio IV', 2018, 86000, 'Essence', 'AB-123-CD', 'active'),
    veh(customers[1].id, 'Peugeot', '308', 2020, 52000, 'Diesel', 'EF-456-GH', 'in_service'),
  ]
  const clientVehicles: ClientVehicle[] = [
    { id: 'demo-cv-1', client_id: DEMO_CLIENT_ID, brand: 'Volkswagen', model: 'Golf 7', year: 2017, fuel: 'Diesel', mileage: 98000, registration: 'IJ-789-KL', notes: null, archived: false, created_at: today().toISOString() },
  ]
  const requests: ServiceRequest[] = [
    {
      id: uid(), reference: 'GF-00001', garage_id: DEMO_GARAGE_ID, client_id: DEMO_CLIENT_ID,
      center_id: isSpeedy ? centers[0].id : null, client_stage: isSpeedy ? 'request_sent' : null,
      service_id: freinage.id, service_name: freinage.name,
      client_vehicle_id: 'demo-cv-1', vehicle_label: 'Volkswagen Golf 7 · IJ-789-KL',
      requested_date: isoIn(3), requested_time: '09:00', proposed_date: null, proposed_time: null,
      note: 'Bruit au freinage côté avant droit.', contact_name: 'Julie Durand',
      contact_phone: '+33 6 55 44 33 22', contact_email: 'client@demo.fr', status: 'pending',
      customer_id: null, appointment_id: null, created_at: today().toISOString(), updated_at: today().toISOString(),
      workshop_stage: 'diagnosis_in_progress', estimated_completion_at: new Date(Date.now() + 4 * 3600000).toISOString(),
      vehicle_checked_in_at: new Date(Date.now() - 2 * 3600000).toISOString(), vehicle_delivered_at: null,
    },
  ]
  const workshopTimeline: ServiceRequestTimelineEvent[] = [
    {
      id: uid(), request_id: requests[0].id, garage_id: DEMO_GARAGE_ID,
      center_id: requests[0].center_id, previous_stage: null, new_stage: 'appointment_confirmed',
      changed_by: DEMO_STAFF_ID, occurred_at: new Date(Date.now() - 26 * 3600000).toISOString(),
      internal_note: null, customer_message: 'Votre rendez-vous est confirmé.',
      estimated_completion_at: null, visible_to_customer: true, notification_status: 'simulated',
    },
    {
      id: uid(), request_id: requests[0].id, garage_id: DEMO_GARAGE_ID,
      center_id: requests[0].center_id, previous_stage: 'appointment_confirmed', new_stage: 'vehicle_expected',
      changed_by: DEMO_STAFF_ID, occurred_at: new Date(Date.now() - 24 * 3600000).toISOString(),
      internal_note: null, customer_message: null, estimated_completion_at: null,
      visible_to_customer: true, notification_status: 'simulated',
    },
    {
      id: uid(), request_id: requests[0].id, garage_id: DEMO_GARAGE_ID,
      center_id: requests[0].center_id, previous_stage: 'vehicle_expected', new_stage: 'vehicle_checked_in',
      changed_by: DEMO_STAFF_ID, occurred_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      internal_note: 'Kilométrage et état du véhicule relevés.', customer_message: 'Votre véhicule a bien été déposé.',
      estimated_completion_at: requests[0].estimated_completion_at, visible_to_customer: true,
      notification_status: 'simulated',
    },
    {
      id: uid(), request_id: requests[0].id, garage_id: DEMO_GARAGE_ID,
      center_id: requests[0].center_id, previous_stage: 'vehicle_checked_in', new_stage: 'vehicle_received',
      changed_by: DEMO_STAFF_ID, occurred_at: new Date(Date.now() - 100 * 60000).toISOString(),
      internal_note: null, customer_message: null, estimated_completion_at: requests[0].estimated_completion_at,
      visible_to_customer: true, notification_status: 'simulated',
    },
    {
      id: uid(), request_id: requests[0].id, garage_id: DEMO_GARAGE_ID,
      center_id: requests[0].center_id, previous_stage: 'vehicle_received', new_stage: 'diagnosis_in_progress',
      changed_by: DEMO_STAFF_ID, occurred_at: new Date(Date.now() - 70 * 60000).toISOString(),
      internal_note: 'Contrôle du train avant en cours.', customer_message: 'Le diagnostic de votre véhicule a commencé.',
      estimated_completion_at: requests[0].estimated_completion_at, visible_to_customer: true,
      notification_status: 'simulated',
    },
  ]
  const recommendations: WorkshopRecommendation[] = [
    {
      id: uid(), garage_id: DEMO_GARAGE_ID, center_id: requests[0].center_id,
      service_request_id: requests[0].id, title: 'Remplacement des disques de frein avant',
      description: 'Usure avancée constatée pendant le diagnostic. Le remplacement est recommandé avec les plaquettes.',
      category: 'Freinage', urgency: 'recommended', reason: 'Épaisseur proche de la limite constructeur.',
      estimated_price: 289, estimated_duration_minutes: 90, affects_delivery_time: true,
      proposed_delivery_at: new Date(Date.now() + 6 * 3600000).toISOString(), status: 'proposed',
      created_by: DEMO_STAFF_ID, created_at: new Date(Date.now() - 45 * 60000).toISOString(),
      decided_at: null, customer_decision_note: null,
    },
  ]
  const recommendationDecisions: RecommendationDecisionEvent[] = [
    {
      id: uid(), recommendation_id: recommendations[0].id, garage_id: DEMO_GARAGE_ID,
      service_request_id: requests[0].id, action: 'proposed', previous_status: 'draft',
      new_status: 'proposed', decided_by: DEMO_STAFF_ID,
      occurred_at: recommendations[0].created_at, legal_terms_version: null,
      legal_privacy_version: null, displayed_language: null, note: null, visible_to_customer: true,
    },
  ]
  const attachments: ServiceRequestAttachment[] = [
    {
      id: uid(), garage_id: DEMO_GARAGE_ID, center_id: requests[0].center_id,
      service_request_id: requests[0].id, recommendation_id: recommendations[0].id,
      uploaded_by: DEMO_STAFF_ID, file_name: 'controle-freins-avant.jpg',
      mime_type: 'image/jpeg', file_size: 248000, storage_path: 'demo://controle-freins-avant.jpg',
      visibility: 'both', document_type: 'photo', created_at: recommendations[0].created_at,
    },
  ]
  const notificationOutbox: NotificationOutboxItem[] = [
    {
      id: uid(), garage_id: DEMO_GARAGE_ID, center_id: requests[0].center_id,
      service_request_id: requests[0].id, recipient_user_id: DEMO_CLIENT_ID,
      recipient_address: null, channel: 'in_app', template_key: 'vehicle_received',
      language: 'fr', payload: { stage: 'vehicle_received' }, status: 'simulated',
      provider: 'demo-simulator', provider_message_id: `simulated-vehicle_received-in_app`,
      attempts: 1, scheduled_at: new Date(Date.now() - 100 * 60000).toISOString(),
      sent_at: new Date(Date.now() - 100 * 60000).toISOString(), failed_at: null,
      error_code: null, created_at: new Date(Date.now() - 100 * 60000).toISOString(),
    },
    {
      id: uid(), garage_id: DEMO_GARAGE_ID, center_id: requests[0].center_id,
      service_request_id: requests[0].id, recipient_user_id: DEMO_CLIENT_ID,
      recipient_address: null, channel: 'in_app', template_key: 'recommendation_available',
      language: 'fr', payload: { recommendation_id: recommendations[0].id }, status: 'simulated',
      provider: 'demo-simulator', provider_message_id: `simulated-recommendation_available-in_app`,
      attempts: 1, scheduled_at: recommendations[0].created_at, sent_at: recommendations[0].created_at,
      failed_at: null, error_code: null, created_at: recommendations[0].created_at,
    },
  ]
  const deliveryReports: DeliveryReport[] = [
    {
      id: uid(), garage_id: DEMO_GARAGE_ID, center_id: requests[0].center_id,
      service_request_id: requests[0].id, report_number: `RI-${today().getFullYear()}-0001`,
      status: 'finalized', customer_snapshot: { name: 'Julie Durand', phone: '+33 6 55 44 33 22' },
      vehicle_snapshot: { label: 'Volkswagen Golf 7', registration: 'IJ-789-KL' },
      entry_mileage: 98000, exit_mileage: 98008,
      checked_in_at: requests[0].vehicle_checked_in_at,
      delivered_at: new Date(Date.now() - 12 * 3600000).toISOString(),
      requested_work: ['Contrôle du freinage avant'],
      diagnostic_summary: 'Usure des plaquettes et des disques avant constatée.',
      completed_work: ['Remplacement des plaquettes de frein avant', 'Contrôle du liquide de frein'],
      accepted_recommendations: ['Remplacement des disques de frein avant'],
      deferred_recommendations: ['Contrôle des pneumatiques sous 3 000 km'],
      parts: ['Jeu de plaquettes avant'], authorized_attachment_ids: [attachments[0].id],
      observations: 'Essai routier et contrôle final conformes.', next_due_date: isoIn(180),
      next_due_mileage: 108000, warranty_terms: 'Pièces et main-d’œuvre garanties 12 mois.',
      final_validation: 'Contrôle qualité validé par Sophie Martin.', finalized_by: DEMO_STAFF_ID,
      finalized_at: new Date(Date.now() - 12 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 13 * 3600000).toISOString(), updated_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    },
  ]
  const maintenanceReminders: MaintenanceReminder[] = [
    {
      id: uid(), garage_id: DEMO_GARAGE_ID, center_id: requests[0].center_id,
      client_id: DEMO_CLIENT_ID, vehicle_id: null, client_vehicle_id: clientVehicles[0].id,
      service_request_id: requests[0].id, reminder_type: 'date_or_mileage',
      title: 'Prochaine révision', due_date: isoIn(180), due_mileage: 108000,
      status: 'scheduled', scheduled_at: isoIn(170), sent_at: null,
      converted_request_id: null, source: 'delivery_report', created_by: DEMO_STAFF_ID,
      created_at: new Date().toISOString(),
    },
  ]
  const repair = (title: string, status: string, vehicle_id: string | null, symptom: string): Repair => ({
    id: uid(), garage_id: DEMO_GARAGE_ID, vehicle_id, customer_id: null, appointment_id: null,
    title, symptom, diagnostic: null, status, assigned_to: null, notes: null,
    created_at: today().toISOString(), updated_at: today().toISOString(),
  })
  const repairs = [
    repair('Remplacement plaquettes', 'in_progress', vehicles[1].id, 'Freinage bruyant'),
    repair('Diagnostic voyant moteur', 'to_diagnose', vehicles[0].id, 'Voyant moteur allumé'),
    repair('Révision 80 000 km', 'waiting_parts', null, 'Entretien périodique'),
  ]
  const task = (title: string, priority: string, status: string): Task => ({
    id: uid(), garage_id: DEMO_GARAGE_ID, title, assigned_to: null, related_vehicle_id: null,
    priority, status, due_at: null, completed_at: null, created_at: today().toISOString(),
  })
  const tasks = [
    task('Rappeler Mme Lefort pour le devis freins', 'high', 'todo'),
    task('Commander filtres habitacle', 'normal', 'todo'),
    task('Préparer la restitution de la 308', 'normal', 'doing'),
  ]
  const news: GarageNews[] = [
    { id: uid(), garage_id: DEMO_GARAGE_ID, title: 'Offre révision avant l’été', body: 'Contrôle climatisation offert pour toute révision réservée en juin.', image_url: null, is_published: true, published_at: today().toISOString(), created_at: today().toISOString() },
    { id: uid(), garage_id: DEMO_GARAGE_ID, title: 'Nouveaux horaires', body: 'Le garage est désormais ouvert le samedi matin de 8h à 12h.', image_url: null, is_published: true, published_at: today().toISOString(), created_at: today().toISOString() },
  ]
  const hours: GarageHours[] = [1, 2, 3, 4, 5, 6, 0].map((weekday) => ({
    id: uid(), garage_id: DEMO_GARAGE_ID, weekday,
    open_time: weekday === 0 ? null : '08:00', close_time: weekday === 0 ? null : weekday === 6 ? '12:00' : '18:00',
    is_closed: weekday === 0,
  }))
  // A few quotes across the whole life-cycle so the demo feels alive (not overloaded).
  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100
  const daysAgoIso = (n: number) => new Date(Date.now() - n * 86400000).toISOString()
  const quotes: Quote[] = []
  const quoteLines: QuoteLine[] = []
  let qseq = 0
  const marc = customers[0], ines = customers[1]
  const clio = vehicles[0], p308 = vehicles[1]
  const mkQuote = (o: {
    status: string; customer: Customer; vehicle: Vehicle; title: string
    lines: { label: string; quantity: number; unit_price: number; tax_rate: number }[]
    validIn?: number | null; createdAgo?: number; token?: string | null
    sentAgo?: number | null; acceptedAgo?: number | null; declinedAgo?: number | null
    declineReason?: string | null; revisedFrom?: string | null
  }): Quote => {
    qseq += 1
    const id = uid()
    let subtotal = 0, tax = 0
    o.lines.forEach((l, i) => {
      const lt = round2(l.quantity * l.unit_price)
      subtotal += lt; tax += (lt * l.tax_rate) / 100
      quoteLines.push({ id: uid(), quote_id: id, label: l.label, quantity: l.quantity, unit_price: l.unit_price, tax_rate: l.tax_rate, line_total: lt, sort_order: i })
    })
    subtotal = round2(subtotal); tax = round2(tax)
    const q: Quote = {
      id, garage_id: DEMO_GARAGE_ID, number: 'DV-' + today().getFullYear() + '-' + String(qseq).padStart(4, '0'),
      status: o.status, title: o.title, subtotal, tax_total: tax, total: round2(subtotal + tax), discount_total: 0,
      notes: null, conditions: 'Devis valable 30 jours. Pièces et main-d’œuvre garanties. TVA 20% incluse.',
      valid_until: o.validIn == null ? null : isoIn(o.validIn),
      client_name: `${o.customer.first_name} ${o.customer.last_name}`, client_phone: o.customer.phone, client_email: o.customer.email,
      vehicle_label: `${o.vehicle.brand} ${o.vehicle.model}${o.vehicle.registration ? ` · ${o.vehicle.registration}` : ''}`,
      customer_id: o.customer.id, vehicle_id: o.vehicle.id, service_request_id: null, repair_id: null,
      created_at: daysAgoIso(o.createdAgo ?? 0),
      client_token: o.token ?? null,
      sent_at: o.sentAgo == null ? null : daysAgoIso(o.sentAgo),
      accepted_at: o.acceptedAgo == null ? null : daysAgoIso(o.acceptedAgo),
      declined_at: o.declinedAgo == null ? null : daysAgoIso(o.declinedAgo),
      decline_reason: o.declineReason ?? null,
      revised_from: o.revisedFrom ?? null,
      accepted_terms_version: o.acceptedAgo == null ? null : legalVersions.terms,
      accepted_privacy_version: o.acceptedAgo == null ? null : legalVersions.privacy,
      recommendation_id: null, supplemental_to_quote_id: null,
    }
    quotes.push(q)
    return q
  }

  // Keep seeded public tokens unique across stores without changing the
  // existing `demo...` format or any GarageFlow token.
  const scopedToken = (token: string) => isSpeedy ? `${token}speedy` : token

  mkQuote({ status: 'accepted', customer: ines, vehicle: p308, title: 'Révision constructeur', createdAgo: 6, validIn: 24, token: scopedToken('demoquoteacc' + 'a1b2c3d4e5f6a7b8'), sentAgo: 5, acceptedAgo: 4,
    lines: [{ label: 'Révision constructeur (vidange + filtres)', quantity: 1, unit_price: 149, tax_rate: 20 }, { label: 'Main-d’œuvre', quantity: 1, unit_price: 60, tax_rate: 20 }] })
  mkQuote({ status: 'sent', customer: marc, vehicle: clio, title: 'Plaquettes de frein avant', createdAgo: 2, validIn: 28, token: scopedToken('demoquotesent' + 'b2c3d4e5f6a7b8c9'), sentAgo: 1,
    lines: [{ label: 'Plaquettes de frein avant (jeu)', quantity: 1, unit_price: 119, tax_rate: 20 }, { label: 'Main-d’œuvre', quantity: 1, unit_price: 50, tax_rate: 20 }] })
  mkQuote({ status: 'draft', customer: marc, vehicle: clio, title: 'Diagnostic électronique', createdAgo: 0, validIn: null,
    lines: [{ label: 'Diagnostic électronique', quantity: 1, unit_price: 49, tax_rate: 20 }] })
  const declined = mkQuote({ status: 'declined', customer: ines, vehicle: p308, title: 'Recharge climatisation', createdAgo: 9, validIn: 12, token: scopedToken('demoquotedec' + 'c3d4e5f6a7b8c9d0'), sentAgo: 8, declinedAgo: 6, declineReason: 'Reporté à l’automne.',
    lines: [{ label: 'Recharge climatisation', quantity: 1, unit_price: 89, tax_rate: 20 }] })
  mkQuote({ status: 'sent', customer: marc, vehicle: clio, title: 'Pneus avant (x2) + montage', createdAgo: 40, validIn: -6, token: scopedToken('demoquoteexp' + 'd4e5f6a7b8c9d0e1'), sentAgo: 39,
    lines: [{ label: 'Pneu 205/55 R16 (monté)', quantity: 2, unit_price: 95, tax_rate: 20 }] })
  mkQuote({ status: 'draft', customer: ines, vehicle: p308, title: 'Recharge climatisation', createdAgo: 0, validIn: 30, revisedFrom: declined.id,
    lines: [{ label: 'Recharge climatisation (offre revue)', quantity: 1, unit_price: 75, tax_rate: 20 }] })

  return {
    garages: [g], centers, services, news, hours, customers, vehicles, clientVehicles, requests,
    messages: [], workshopTimeline, recommendations, recommendationDecisions,
    attachments, notificationOutbox, deliveryReports, maintenanceReminders,
    appointments: [], repairs, tasks, quotes, quoteLines,
    clientProfile: { id: DEMO_CLIENT_ID, default_garage_id: DEMO_GARAGE_ID, marketing_consent: true, created_at: today().toISOString() },
    reqSeq: 1, quoteSeq: qseq,
  }
}

/** New quote fields added over time — backfilled onto legacy stored quotes. */
const QUOTE_LIFECYCLE_DEFAULTS = {
  client_token: null, sent_at: null, accepted_at: null, declined_at: null,
  decline_reason: null, revised_from: null,
  accepted_terms_version: null, accepted_privacy_version: null,
  recommendation_id: null, supplemental_to_quote_id: null,
} as const

/**
 * Defensive hydration: an older demo store saved before recent features
 * may miss keys (e.g. `quotes`, `quoteSeq`) or newer quote columns. Merge it
 * with a fresh seed so arrays/sequences always exist and never crash the UI.
 * A corrupt / non-object payload falls back to a full reseed.
 */
export function ensureStoreShape(raw: unknown, brand: DemoBrand = 'default'): Store {
  if (!raw || typeof raw !== 'object') return seed(brand)
  const base = seed(brand)
  const r = raw as Record<string, unknown>
  // Missing arrays default to [] and missing sequences to 0 (predictable, never
  // inherits seed rows that could reference entities the stored data lacks).
  const arr = <K extends keyof Store>(k: K): Store[K] =>
    (Array.isArray(r[k as string]) ? (r[k as string] as Store[K]) : ([] as unknown as Store[K]))
  const num = (k: keyof Store): number =>
    (typeof r[k as string] === 'number' ? (r[k as string] as number) : 0)

  const store: Store = {
    garages: arr('garages'),
    centers: arr('centers'),
    services: arr('services'),
    news: arr('news'),
    hours: arr('hours'),
    customers: arr('customers'),
    vehicles: arr('vehicles'),
    clientVehicles: arr('clientVehicles'),
    requests: arr('requests'),
    messages: arr('messages'),
    workshopTimeline: arr('workshopTimeline'),
    recommendations: arr('recommendations'),
    recommendationDecisions: arr('recommendationDecisions'),
    attachments: arr('attachments'),
    notificationOutbox: arr('notificationOutbox'),
    deliveryReports: arr('deliveryReports'),
    maintenanceReminders: arr('maintenanceReminders'),
    appointments: arr('appointments'),
    repairs: arr('repairs'),
    tasks: arr('tasks'),
    quotes: arr('quotes'),
    quoteLines: arr('quoteLines'),
    clientProfile: (r.clientProfile && typeof r.clientProfile === 'object'
      ? (r.clientProfile as ClientProfile) : base.clientProfile),
    reqSeq: num('reqSeq'),
    quoteSeq: num('quoteSeq'),
  }
  // Backfill quote columns introduced after the store was first saved.
  store.quotes = store.quotes.map((q) => ({ ...QUOTE_LIFECYCLE_DEFAULTS, ...q }) as Quote)
  store.requests = store.requests.map((request) => Object.assign({
    workshop_stage: null,
    estimated_completion_at: null,
    vehicle_checked_in_at: null,
    vehicle_delivered_at: null,
  }, request))
  return store
}

/** Read one existing brand store without creating, seeding or changing another. */
function readStoredStore(brand: DemoBrand): Store | null {
  try {
    const raw = localStorage.getItem(storeKey(brand))
    return raw ? ensureStoreShape(JSON.parse(raw), brand) : null
  } catch {
    return null
  }
}

/** Locate a token in its owning store. The active brand wins only on a collision. */
function findStoredQuote(token: string): { brand: DemoBrand; store: Store } | null {
  const activeBrand = getDemoBrand()
  const brands: DemoBrand[] = activeBrand === 'speedy' ? ['speedy', 'default'] : ['default', 'speedy']
  for (const brand of brands) {
    const store = readStoredStore(brand)
    if (store?.quotes.some((quote) => quote.client_token === token)) return { brand, store }
  }
  return null
}

function saveStoredStore(brand: DemoBrand, store: Store) {
  localStorage.setItem(storeKey(brand), JSON.stringify(store))
  if (cacheBrand === brand) cache = store
}

let cache: Store | null = null
let cacheBrand: DemoBrand | null = null
function load(): Store {
  const brand = getDemoBrand()
  // Re-hydrate when the active brand changed (the store is brand-scoped).
  if (cache && cacheBrand === brand) return cache
  cacheBrand = brand
  try {
    const raw = localStorage.getItem(storeKey(brand))
    if (raw) {
      cache = ensureStoreShape(JSON.parse(raw), brand)
      // Persist the upgraded shape so the on-disk store is migrated once.
      localStorage.setItem(storeKey(brand), JSON.stringify(cache))
    } else {
      cache = seed(brand)
    }
  } catch {
    cache = seed(brand)
  }
  return cache!
}
function save() {
  if (cache && cacheBrand) localStorage.setItem(storeKey(cacheBrand), JSON.stringify(cache))
}
function ensureStore() {
  const brand = getDemoBrand()
  if (!localStorage.getItem(storeKey(brand))) {
    cache = seed(brand)
    cacheBrand = brand
    save()
  }
}
export function resetDemoData(brand: DemoBrand = getDemoBrand()) {
  cache = seed(brand)
  cacheBrand = brand
  save()
  window.dispatchEvent(new Event('gf-demo-data'))
}
/** Drop the in-memory store so the next read re-hydrates from localStorage —
 *  used when another tab changed the shared demo data, or the brand changed. */
export function reloadDemoCache() {
  cache = null
  cacheBrand = null
}

/** Return fresh copies so React Query's structural sharing detects changes
 *  (the store mutates items in place, unlike the real Supabase rows). */
const clone = <T>(v: T): T =>
  typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v))

export const demoGarage = (): Garage => load().garages[0]

export function demoProfile(kind: DemoKind) {
  return {
    id: kind === 'garage' ? DEMO_STAFF_ID : DEMO_CLIENT_ID,
    full_name: kind === 'garage' ? 'Sophie Martin' : 'Julie Durand',
    phone: kind === 'garage' ? null : '+33 6 55 44 33 22',
    avatar_url: null,
    account_type: kind === 'garage' ? 'staff' : 'client',
    created_at: today().toISOString(),
  }
}

/** Build the tokenised public-quote payload (mirror of get_quote_public). */
function buildPublicQuote(s: Store, token: string) {
  const q = s.quotes.find((x) => x.client_token === token)
  if (!q) return null
  const g = s.garages[0]
  return clone({
    quote: {
      id: q.id, number: q.number, title: q.title, status: q.status,
      subtotal: q.subtotal, tax_total: q.tax_total, total: q.total,
      notes: q.notes, conditions: q.conditions, valid_until: q.valid_until,
      client_name: q.client_name, client_phone: q.client_phone, client_email: q.client_email,
      vehicle_label: q.vehicle_label, created_at: q.created_at,
      sent_at: q.sent_at, accepted_at: q.accepted_at, declined_at: q.declined_at, decline_reason: q.decline_reason,
    },
    lines: s.quoteLines.filter((l) => l.quote_id === q.id).sort((a, b) => a.sort_order - b.sort_order)
      .map((l) => ({ id: l.id, label: l.label, quantity: l.quantity, unit_price: l.unit_price, tax_rate: l.tax_rate, line_total: l.line_total, sort_order: l.sort_order })),
    garage: {
      name: g.name, logo_url: g.logo_url, accent_color: g.accent_color,
      address: g.address, city: g.city, phone: g.phone, email: g.email,
      legal_name: g.legal_name, siret: g.siret, vat_number: g.vat_number, legal_info: g.legal_info,
    },
  })
}

function queueDemoNotification(
  store: Store,
  input: {
    garageId: string
    centerId?: string | null
    requestId?: string | null
    recipientUserId?: string | null
    templateKey: NotificationEvent
    payload?: Record<string, unknown>
  },
) {
  const now = new Date().toISOString()
  const row: NotificationOutboxItem = {
    id: uid(), garage_id: input.garageId, center_id: input.centerId ?? null,
    service_request_id: input.requestId ?? null, recipient_user_id: input.recipientUserId ?? null,
    recipient_address: null, channel: 'in_app', template_key: input.templateKey,
    language: 'fr', payload: input.payload ?? {}, status: 'simulated', provider: 'demo-simulator',
    provider_message_id: `simulated-${input.templateKey}-in_app`, attempts: 1,
    scheduled_at: now, sent_at: now, failed_at: null, error_code: null, created_at: now,
  }
  store.notificationOutbox.unshift(row)
  return row
}

// ---------- query helpers (mirror the real hooks) ----------
export const demo = {
  garages: () => clone(load().garages),
  garageById: (id: string) => clone(load().garages.find((g) => g.id === id) ?? null),
  centers: () => clone([...load().centers].filter((c) => c.is_active).sort((a, b) => a.sort_order - b.sort_order)),
  allCenters: () => clone([...load().centers].sort((a, b) => a.sort_order - b.sort_order)),
  services: () => clone(load().services.filter((s) => s.is_active).sort((a, b) => a.sort_order - b.sort_order)),
  allServices: () => clone([...load().services].sort((a, b) => a.sort_order - b.sort_order)),
  news: () => clone(load().news),
  hours: () => clone(load().hours),
  garageRequests: () => clone([...load().requests].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))),
  clientRequests: () => clone(load().requests.filter((r) => r.client_id === DEMO_CLIENT_ID).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))),
  requestMessages: (requestId: string) => clone(load().messages.filter((m) => m.request_id === requestId)),
  workshopTimeline: (requestId: string) => clone(
    load().workshopTimeline
      .filter((event) => event.request_id === requestId)
      .sort((a, b) => +new Date(a.occurred_at) - +new Date(b.occurred_at)),
  ),
  recommendations: (requestId: string, customerView = false) => clone(
    load().recommendations.filter((item) => item.service_request_id === requestId
      && (!customerView || !['draft', 'cancelled'].includes(item.status))),
  ),
  recommendationDecisions: (recommendationId: string, customerView = false) => clone(
    load().recommendationDecisions.filter((event) => event.recommendation_id === recommendationId
      && (!customerView || event.visible_to_customer)),
  ),
  attachments: (requestId: string, customerView = false) => clone(
    load().attachments.filter((attachment) => attachment.service_request_id === requestId
      && (!customerView || ['customer', 'both'].includes(attachment.visibility))),
  ),
  notificationOutbox: (garageId: string) => clone(
    load().notificationOutbox.filter((item) => item.garage_id === garageId)
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
  ),
  deliveryReport: (requestId: string, customerView = false) => clone(
    load().deliveryReports.find((report) => report.service_request_id === requestId
      && (!customerView || report.status === 'finalized')) ?? null,
  ),
  maintenanceReminders: (garageId?: string, clientId?: string) => clone(
    load().maintenanceReminders.filter((reminder) => (!garageId || reminder.garage_id === garageId)
      && (!clientId || reminder.client_id === clientId))
      .sort((a, b) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at)),
  ),
  clientVehicles: () => clone(load().clientVehicles),
  clientProfile: () => clone(load().clientProfile),
  vehicles: () => clone([...load().vehicles].sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))),
  customers: () => clone([...load().customers].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))),
  repairs: () => clone(load().repairs),
  tasks: () => clone(load().tasks),
  appointments: () => clone([...load().appointments].sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at))),
  quotes: () => clone([...load().quotes].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))),
  quote: (id: string) => clone(load().quotes.find((q) => q.id === id) ?? null),
  quoteLines: (quoteId: string) => clone(load().quoteLines.filter((l) => l.quote_id === quoteId).sort((a, b) => a.sort_order - b.sort_order)),
  team: (): TeamMember[] => [
    { id: 't1', garage_id: DEMO_GARAGE_ID, center_id: null, user_id: DEMO_STAFF_ID, role: 'owner', status: 'active', invited_at: null, created_at: today().toISOString(), profile: demoProfile('garage') as never },
    { id: 't2', garage_id: DEMO_GARAGE_ID, center_id: null, user_id: 'demo-mecano', role: 'mechanic', status: 'active', invited_at: null, created_at: today().toISOString(), profile: { ...demoProfile('garage'), id: 'demo-mecano', full_name: 'Karim Benali' } as never },
  ],
  dashboardStats: (): DashboardStats => {
    const s = load()
    const t = new Date().toDateString()
    return {
      pendingRequests: s.requests.filter((r) => r.status === 'pending').length,
      todayAppointments: s.appointments.filter((a) => new Date(a.starts_at).toDateString() === t).length,
      openRepairs: s.repairs.filter((r) => r.status !== 'delivered').length,
      openTasks: s.tasks.filter((x) => x.status !== 'done').length,
      vehicles: s.vehicles.length,
      customers: s.customers.length,
    }
  },

  // ---------- mutations ----------
  createRequest: (input: Partial<ServiceRequest>): ServiceRequest => {
    const s = load()
    s.reqSeq += 1
    const row: ServiceRequest = {
      id: uid(), reference: 'GF-' + String(s.reqSeq).padStart(5, '0'),
      garage_id: DEMO_GARAGE_ID, center_id: input.center_id ?? null, client_id: DEMO_CLIENT_ID,
      client_stage: 'request_sent', service_id: input.service_id ?? null,
      service_name: input.service_name ?? 'Prestation', client_vehicle_id: input.client_vehicle_id ?? null,
      vehicle_label: input.vehicle_label ?? null, requested_date: input.requested_date ?? null,
      requested_time: input.requested_time ?? null, proposed_date: null, proposed_time: null,
      note: input.note ?? null, contact_name: input.contact_name ?? 'Julie Durand',
      contact_phone: input.contact_phone ?? null, contact_email: input.contact_email ?? 'client@demo.fr',
      status: 'pending', customer_id: null, appointment_id: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      workshop_stage: null, estimated_completion_at: null,
      vehicle_checked_in_at: null, vehicle_delivered_at: null,
    }
    s.requests.unshift(row)
    save()
    return row
  },
  updateRequestStatus: (id: string, patch: Partial<ServiceRequest>) => {
    const s = load()
    const r = s.requests.find((x) => x.id === id)
    if (r) Object.assign(r, patch, { updated_at: new Date().toISOString() })
    save()
    return r
  },
  transitionWorkshopStage: (input: {
    requestId: string
    newStage: WorkshopStage
    internalNote?: string | null
    customerMessage?: string | null
    estimatedCompletionAt?: string | null
    visibleToCustomer?: boolean
  }): ServiceRequestTimelineEvent => {
    const s = load()
    const request = s.requests.find((row) => row.id === input.requestId)
    if (!request) throw new Error('Service request not found')
    const previousStage = isWorkshopStage(request.workshop_stage) ? request.workshop_stage : null
    assertWorkshopTransition(previousStage, input.newStage)
    const occurredAt = new Date().toISOString()
    const event: ServiceRequestTimelineEvent = {
      id: uid(), request_id: request.id, garage_id: request.garage_id,
      center_id: request.center_id, previous_stage: previousStage, new_stage: input.newStage,
      changed_by: DEMO_STAFF_ID, occurred_at: occurredAt,
      internal_note: input.internalNote?.trim() || null,
      customer_message: input.customerMessage?.trim() || null,
      estimated_completion_at: input.estimatedCompletionAt ?? request.estimated_completion_at,
      visible_to_customer: input.visibleToCustomer ?? true,
      notification_status: 'simulated',
    }
    request.workshop_stage = input.newStage
    request.estimated_completion_at = input.estimatedCompletionAt ?? request.estimated_completion_at
    if (input.newStage === 'vehicle_checked_in' && !request.vehicle_checked_in_at) {
      request.vehicle_checked_in_at = occurredAt
    }
    if (input.newStage === 'vehicle_delivered' && !request.vehicle_delivered_at) {
      request.vehicle_delivered_at = occurredAt
    }
    request.updated_at = occurredAt
    s.workshopTimeline.push(event)
    const notificationByStage: Partial<Record<WorkshopStage, NotificationEvent>> = {
      appointment_confirmed: 'appointment_confirmed', vehicle_received: 'vehicle_received',
      customer_approval_required: 'approval_required', vehicle_ready: 'vehicle_ready',
      vehicle_delivered: 'vehicle_delivered',
    }
    const templateKey = notificationByStage[input.newStage]
    if (templateKey && event.visible_to_customer) {
      queueDemoNotification(s, {
        garageId: request.garage_id, centerId: request.center_id, requestId: request.id,
        recipientUserId: request.client_id, templateKey, payload: { stage: input.newStage },
      })
    }
    save()
    return clone(event)
  },
  createRecommendation: (input: {
    requestId: string
    title: string
    description?: string | null
    category?: string | null
    urgency?: RecommendationUrgency
    reason?: string | null
    estimatedPrice?: number | null
    estimatedDurationMinutes?: number | null
    affectsDeliveryTime?: boolean
    proposedDeliveryAt?: string | null
  }): WorkshopRecommendation => {
    const s = load()
    const request = s.requests.find((row) => row.id === input.requestId)
    if (!request) throw new Error('Service request not found')
    if (!input.title.trim()) throw new Error('Recommendation title is required')
    const row: WorkshopRecommendation = {
      id: uid(), garage_id: request.garage_id, center_id: request.center_id,
      service_request_id: request.id, title: input.title.trim(),
      description: input.description?.trim() || null, category: input.category?.trim() || null,
      urgency: input.urgency ?? 'recommended', reason: input.reason?.trim() || null,
      estimated_price: input.estimatedPrice ?? null,
      estimated_duration_minutes: input.estimatedDurationMinutes ?? null,
      affects_delivery_time: input.affectsDeliveryTime ?? false,
      proposed_delivery_at: input.proposedDeliveryAt ?? null,
      status: 'draft', created_by: DEMO_STAFF_ID, created_at: new Date().toISOString(),
      decided_at: null, customer_decision_note: null,
    }
    if ((row.estimated_price ?? 0) < 0 || (row.estimated_duration_minutes ?? 0) < 0) {
      throw new Error('Invalid recommendation estimate')
    }
    s.recommendations.push(row)
    save()
    return clone(row)
  },
  setRecommendationStatus: (recommendationId: string, newStatus: RecommendationStatus, note?: string | null) => {
    const s = load()
    const recommendation = s.recommendations.find((item) => item.id === recommendationId)
    if (!recommendation) throw new Error('Recommendation not found')
    const previousStatus = recommendation.status
    if (!canStaffTransitionRecommendation(previousStatus, newStatus)) {
      throw new Error(`Invalid recommendation transition from ${previousStatus} to ${newStatus}`)
    }
    recommendation.status = newStatus
    const event: RecommendationDecisionEvent = {
      id: uid(), recommendation_id: recommendation.id, garage_id: recommendation.garage_id,
      service_request_id: recommendation.service_request_id,
      action: newStatus as RecommendationDecisionEvent['action'], previous_status: previousStatus,
      new_status: newStatus, decided_by: DEMO_STAFF_ID, occurred_at: new Date().toISOString(),
      legal_terms_version: null, legal_privacy_version: null, displayed_language: null,
      note: note?.trim() || null, visible_to_customer: true,
    }
    s.recommendationDecisions.push(event)
    if (newStatus === 'proposed') {
      const request = s.requests.find((item) => item.id === recommendation.service_request_id)
      queueDemoNotification(s, {
        garageId: recommendation.garage_id, centerId: recommendation.center_id,
        requestId: recommendation.service_request_id, recipientUserId: request?.client_id,
        templateKey: 'recommendation_available', payload: { recommendation_id: recommendation.id },
      })
    }
    save()
    return clone(recommendation)
  },
  decideRecommendation: (input: {
    recommendationId: string
    action: RecommendationDecision
    note?: string | null
    language: 'fr' | 'en' | 'ar'
  }) => {
    const s = load()
    const recommendation = s.recommendations.find((item) => item.id === input.recommendationId)
    if (!recommendation) throw new Error('Recommendation not found')
    if (input.action === 'question' && !input.note?.trim()) throw new Error('A question is required')
    const previousStatus = recommendation.status
    const newStatus = customerDecisionStatus(input.action, previousStatus)
    recommendation.status = newStatus
    recommendation.customer_decision_note = input.note?.trim() || null
    if (input.action !== 'question') recommendation.decided_at = new Date().toISOString()
    const event: RecommendationDecisionEvent = {
      id: uid(), recommendation_id: recommendation.id, garage_id: recommendation.garage_id,
      service_request_id: recommendation.service_request_id, action: input.action,
      previous_status: previousStatus, new_status: newStatus, decided_by: DEMO_CLIENT_ID,
      occurred_at: new Date().toISOString(), legal_terms_version: legalVersions.terms,
      legal_privacy_version: legalVersions.privacy, displayed_language: input.language,
      note: input.note?.trim() || null, visible_to_customer: true,
    }
    s.recommendationDecisions.push(event)
    queueDemoNotification(s, {
      garageId: recommendation.garage_id, centerId: recommendation.center_id,
      requestId: recommendation.service_request_id, recipientUserId: DEMO_STAFF_ID,
      templateKey: 'message_received',
      payload: { recommendation_id: recommendation.id, action: input.action },
    })
    save()
    return clone(recommendation)
  },
  linkRecommendationQuote: (recommendationId: string, quoteId: string, parentQuoteId?: string | null) => {
    const s = load()
    const recommendation = s.recommendations.find((item) => item.id === recommendationId)
    const quote = s.quotes.find((item) => item.id === quoteId)
    const parent = parentQuoteId ? s.quotes.find((item) => item.id === parentQuoteId) : null
    if (!recommendation || !quote) throw new Error('Recommendation or quote not found')
    if (recommendation.garage_id !== quote.garage_id
      || recommendation.service_request_id !== quote.service_request_id) {
      throw new Error('Recommendation and quote do not belong to the same case')
    }
    if (parentQuoteId && (!parent || parent.garage_id !== quote.garage_id
      || parent.service_request_id !== quote.service_request_id)) {
      throw new Error('Invalid parent quote')
    }
    quote.recommendation_id = recommendation.id
    quote.supplemental_to_quote_id = parentQuoteId ?? null
    save()
    return clone(quote)
  },
  addAttachment: (input: {
    requestId: string
    recommendationId?: string | null
    fileName: string
    mimeType: string
    fileSize: number
    visibility: AttachmentVisibility
    documentType: AttachmentDocumentType
  }): ServiceRequestAttachment => {
    const s = load()
    const request = s.requests.find((item) => item.id === input.requestId)
    if (!request) throw new Error('Service request not found')
    if (s.attachments.filter((item) => item.service_request_id === request.id).length >= 20) {
      throw new Error('Attachment limit reached')
    }
    if (input.recommendationId && !s.recommendations.some((item) => item.id === input.recommendationId
      && item.service_request_id === request.id)) {
      throw new Error('Invalid recommendation attachment')
    }
    const row: ServiceRequestAttachment = {
      id: uid(), garage_id: request.garage_id, center_id: request.center_id,
      service_request_id: request.id, recommendation_id: input.recommendationId ?? null,
      uploaded_by: DEMO_STAFF_ID, file_name: input.fileName, mime_type: input.mimeType,
      file_size: input.fileSize, storage_path: `demo://${uid()}-${input.fileName}`,
      visibility: input.visibility, document_type: input.documentType,
      created_at: new Date().toISOString(),
    }
    s.attachments.push(row)
    save()
    return clone(row)
  },
  saveDeliveryReport: (requestId: string, patch: Partial<DeliveryReport>, finalize = false) => {
    const s = load()
    const request = s.requests.find((item) => item.id === requestId)
    if (!request) throw new Error('Service request not found')
    const existing = s.deliveryReports.find((item) => item.service_request_id === requestId)
    if (existing?.status === 'finalized') throw new Error('Finalized delivery report is immutable')
    const now = new Date().toISOString()
    const row: DeliveryReport = Object.assign(existing ? { ...existing } : {
      id: uid(), garage_id: request.garage_id, center_id: request.center_id,
      service_request_id: request.id, report_number: `RI-${today().getFullYear()}-${String(s.deliveryReports.length + 1).padStart(4, '0')}`,
      status: 'draft' as const, customer_snapshot: {}, vehicle_snapshot: {},
      entry_mileage: null, exit_mileage: null, checked_in_at: request.vehicle_checked_in_at,
      delivered_at: request.vehicle_delivered_at, requested_work: [], diagnostic_summary: null,
      completed_work: [], accepted_recommendations: [], deferred_recommendations: [], parts: [],
      authorized_attachment_ids: [], observations: null, next_due_date: null,
      next_due_mileage: null, warranty_terms: null, final_validation: null,
      finalized_by: null, finalized_at: null, created_at: now, updated_at: now,
    }, patch, {
      status: finalize ? 'finalized' : 'draft', finalized_by: finalize ? DEMO_STAFF_ID : null,
      finalized_at: finalize ? now : null, updated_at: now,
    })
    if ((row.entry_mileage ?? 0) < 0 || (row.exit_mileage ?? 0) < 0
      || (row.entry_mileage !== null && row.exit_mileage !== null && row.exit_mileage < row.entry_mileage)) {
      throw new Error('Invalid report mileage')
    }
    if (existing) Object.assign(existing, row)
    else s.deliveryReports.push(row)
    save()
    return clone(row)
  },
  createMaintenanceReminder: (input: {
    garageId: string
    centerId?: string | null
    clientId: string
    vehicleId?: string | null
    clientVehicleId?: string | null
    serviceRequestId?: string | null
    reminderType: ReminderType
    title: string
    dueDate?: string | null
    dueMileage?: number | null
    scheduledAt?: string
    source?: string
    language?: 'fr' | 'en' | 'ar'
  }) => {
    const s = load()
    if (!input.dueDate && input.dueMileage == null) throw new Error('A date or mileage is required')
    const row: MaintenanceReminder = {
      id: uid(), garage_id: input.garageId, center_id: input.centerId ?? null,
      client_id: input.clientId, vehicle_id: input.vehicleId ?? null,
      client_vehicle_id: input.clientVehicleId ?? null,
      service_request_id: input.serviceRequestId ?? null, reminder_type: input.reminderType,
      title: input.title, due_date: input.dueDate ?? null, due_mileage: input.dueMileage ?? null,
      status: 'scheduled', scheduled_at: input.scheduledAt ?? new Date().toISOString(),
      sent_at: null, converted_request_id: null, source: input.source ?? 'manual',
      created_by: DEMO_STAFF_ID, created_at: new Date().toISOString(),
    }
    s.maintenanceReminders.push(row)
    const notificationTime = new Date().toISOString()
    s.notificationOutbox.unshift({
      id: uid(), garage_id: input.garageId, center_id: input.centerId ?? null,
      service_request_id: input.serviceRequestId ?? null, recipient_user_id: input.clientId,
      recipient_address: 'client@demo.fr', channel: 'in_app', template_key: 'maintenance_reminder',
      language: input.language ?? 'fr', payload: { reminder_id: row.id }, status: 'simulated',
      provider: 'demo-simulator', provider_message_id: `simulated-maintenance_reminder-in_app`,
      attempts: 1, scheduled_at: notificationTime, sent_at: notificationTime,
      failed_at: null, error_code: null, created_at: notificationTime,
    })
    save()
    return clone(row)
  },
  convertMaintenanceReminder: (reminderId: string) => {
    const s = load()
    const reminder = s.maintenanceReminders.find((item) => item.id === reminderId)
    if (!reminder) throw new Error('Reminder not found')
    s.reqSeq += 1
    const vehicle = s.clientVehicles.find((item) => item.id === reminder.client_vehicle_id)
    const request: ServiceRequest = {
      id: uid(), reference: 'GF-' + String(s.reqSeq).padStart(5, '0'), garage_id: reminder.garage_id,
      center_id: reminder.center_id, client_id: reminder.client_id, client_stage: 'request_sent',
      service_id: null, service_name: reminder.title, client_vehicle_id: reminder.client_vehicle_id,
      vehicle_label: vehicle ? `${vehicle.brand} ${vehicle.model} · ${vehicle.registration ?? ''}`.trim() : null,
      requested_date: reminder.due_date, requested_time: null, proposed_date: null, proposed_time: null,
      note: 'Demande créée depuis un rappel d’entretien.', contact_name: 'Julie Durand',
      contact_phone: '+33 6 55 44 33 22', contact_email: 'client@demo.fr', status: 'pending',
      customer_id: null, appointment_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      workshop_stage: null, estimated_completion_at: null, vehicle_checked_in_at: null, vehicle_delivered_at: null,
    }
    s.requests.unshift(request)
    reminder.status = 'converted'
    reminder.converted_request_id = request.id
    save()
    return { reminder: clone(reminder), request: clone(request) }
  },
  addRequestMessage: (input: Partial<ServiceRequestMessage>): ServiceRequestMessage => {
    const s = load()
    const row: ServiceRequestMessage = {
      id: uid(), request_id: input.request_id!, garage_id: DEMO_GARAGE_ID,
      sender: input.sender ?? 'garage', author_id: input.author_id ?? null,
      body: input.body ?? '', created_at: new Date().toISOString(),
    }
    s.messages.push(row)
    save()
    return row
  },
  convertRequest: (requestId: string) => {
    const s = load()
    const r = s.requests.find((x) => x.id === requestId)
    if (!r) return { appointment_id: '', customer_id: '' }
    const customer: Customer = {
      id: uid(), garage_id: DEMO_GARAGE_ID, linked_user_id: DEMO_CLIENT_ID,
      first_name: (r.contact_name ?? 'Client').split(' ')[0], last_name: (r.contact_name ?? '').split(' ').slice(1).join(' '),
      company_name: null, phone: r.contact_phone, email: r.contact_email, address: null, city: null,
      postal_code: null, source: 'reservation', notes: null, marketing_consent: false, created_at: new Date().toISOString(),
    }
    s.customers.unshift(customer)
    const date = r.proposed_date ?? r.requested_date ?? isoIn(2)
    const time = (r.proposed_time ?? r.requested_time ?? '09:00').slice(0, 5)
    const appt: Appointment = {
      id: uid(), garage_id: DEMO_GARAGE_ID, customer_id: customer.id, vehicle_id: null,
      service_request_id: r.id, assigned_to: null, title: `${r.service_name} — ${r.vehicle_label ?? ''}`.trim(),
      starts_at: new Date(`${date}T${time}:00`).toISOString(), ends_at: null, status: 'scheduled',
      notes: null, created_at: new Date().toISOString(),
    }
    s.appointments.push(appt)
    Object.assign(r, { status: 'confirmed', customer_id: customer.id, appointment_id: appt.id, updated_at: new Date().toISOString() })
    save()
    return { appointment_id: appt.id, customer_id: customer.id }
  },
  upsertClientVehicle: (input: Partial<ClientVehicle>): ClientVehicle => {
    const s = load()
    const row: ClientVehicle = {
      id: uid(), client_id: DEMO_CLIENT_ID, brand: input.brand ?? '', model: input.model ?? '',
      year: input.year ?? null, fuel: input.fuel ?? null, mileage: input.mileage ?? null,
      registration: input.registration ?? null, notes: input.notes ?? null,
      archived: input.archived ?? false, created_at: new Date().toISOString(),
    }
    s.clientVehicles.unshift(row)
    save()
    return row
  },
  updateClientVehicle: (id: string, patch: Partial<ClientVehicle>): ClientVehicle => {
    const s = load()
    const v = s.clientVehicles.find((x) => x.id === id)
    if (!v) throw new Error('Véhicule introuvable')
    Object.assign(v, patch)
    save()
    return clone(v)
  },
  deleteClientVehicle: (id: string) => {
    const s = load()
    s.clientVehicles = s.clientVehicles.filter((v) => v.id !== id)
    save()
  },
  updateClientProfile: (patch: Partial<ClientProfile>) => {
    const s = load()
    Object.assign(s.clientProfile, patch)
    save()
  },
  createVehicle: (input: Partial<Vehicle>): Vehicle => {
    const s = load()
    const row = {
      id: uid(), garage_id: DEMO_GARAGE_ID, customer_id: input.customer_id ?? null,
      brand: input.brand ?? '', model: input.model ?? '', version: null, year: input.year ?? null,
      mileage: input.mileage ?? null, fuel: input.fuel ?? null, gearbox: null, vin: null,
      registration: input.registration ?? null, color: null, notes: null, status: 'active',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    } as Vehicle
    s.vehicles.unshift(row)
    save()
    return row
  },
  createCustomer: (input: Partial<Customer>): Customer => {
    const s = load()
    const row: Customer = {
      id: uid(), garage_id: DEMO_GARAGE_ID, linked_user_id: null, first_name: input.first_name ?? null,
      last_name: input.last_name ?? null, company_name: null, phone: input.phone ?? null, email: input.email ?? null,
      address: null, city: input.city ?? null, postal_code: null, source: null, notes: null,
      marketing_consent: input.marketing_consent ?? false, created_at: new Date().toISOString(),
    }
    s.customers.unshift(row)
    save()
    return row
  },
  createRepair: (input: Partial<Repair>): Repair => {
    const s = load()
    const row: Repair = {
      id: uid(), garage_id: DEMO_GARAGE_ID, vehicle_id: input.vehicle_id ?? null, customer_id: null,
      appointment_id: null, title: input.title ?? '', symptom: input.symptom ?? null, diagnostic: null,
      status: 'to_diagnose', assigned_to: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }
    s.repairs.unshift(row)
    save()
    return row
  },
  updateRepairStatus: (id: string, status: string) => {
    const s = load()
    const r = s.repairs.find((x) => x.id === id)
    if (r) r.status = status
    save()
  },
  createTask: (input: Partial<Task>): Task => {
    const s = load()
    const row: Task = {
      id: uid(), garage_id: DEMO_GARAGE_ID, title: input.title ?? '', assigned_to: null,
      related_vehicle_id: null, priority: input.priority ?? 'normal', status: 'todo', due_at: null,
      completed_at: null, created_at: new Date().toISOString(),
    }
    s.tasks.unshift(row)
    save()
    return row
  },
  toggleTask: (id: string, status: string) => {
    const s = load()
    const t = s.tasks.find((x) => x.id === id)
    if (t) {
      t.status = status
      t.completed_at = status === 'done' ? new Date().toISOString() : null
    }
    save()
  },
  createAppointment: (input: Partial<Appointment>): Appointment => {
    const s = load()
    const row: Appointment = {
      id: uid(), garage_id: DEMO_GARAGE_ID, customer_id: null, vehicle_id: null, service_request_id: null,
      assigned_to: null, title: input.title ?? '', starts_at: input.starts_at ?? new Date().toISOString(),
      ends_at: null, status: input.status ?? 'scheduled', notes: input.notes ?? null, created_at: new Date().toISOString(),
    }
    s.appointments.push(row)
    save()
    return row
  },
  createService: (input: Partial<GarageService>): GarageService => {
    const s = load()
    const row = {
      id: uid(), garage_id: DEMO_GARAGE_ID, name: input.name ?? '', description: input.description ?? null,
      category: input.category ?? null, duration_minutes: input.duration_minutes ?? 60,
      price_from: input.price_from ?? null, is_active: input.is_active ?? true,
      sort_order: input.sort_order ?? (s.services.length + 1), created_at: new Date().toISOString(),
      tax_rate: input.tax_rate ?? 20, labor_hours: input.labor_hours ?? null,
      price_type: input.price_type ?? 'from', default_lines: input.default_lines ?? [],
    } as GarageService
    s.services.push(row)
    save()
    return row
  },
  updateService: (id: string, patch: Partial<GarageService>) => {
    const s = load()
    const row = s.services.find((x) => x.id === id)
    if (row) Object.assign(row, patch)
    save()
  },
  deleteService: (id: string) => {
    const s = load()
    s.services = s.services.filter((x) => x.id !== id)
    save()
  },
  updateGarage: (patch: Partial<Garage>) => {
    const s = load()
    Object.assign(s.garages[0], patch)
    save()
  },
  nextQuoteNumber: () => {
    const s = load()
    s.quoteSeq += 1
    save()
    return 'DV-' + new Date().getFullYear() + '-' + String(s.quoteSeq).padStart(4, '0')
  },
  createQuote: (quote: Partial<Quote>, lines: Partial<QuoteLine>[]): Quote => {
    const s = load()
    const id = uid()
    const number = quote.number ?? 'DV-' + new Date().getFullYear() + '-' + String((s.quoteSeq += 1)).padStart(4, '0')
    const t = totalsFrom(lines) // recompute (mirror the server)
    const row: Quote = {
      id, garage_id: DEMO_GARAGE_ID, customer_id: quote.customer_id ?? null, vehicle_id: quote.vehicle_id ?? null,
      repair_id: null, number,
      status: quote.status ?? 'draft', title: quote.title ?? 'Devis',
      subtotal: t.subtotal, tax_total: t.tax_total, discount_total: 0,
      total: t.total, notes: quote.notes ?? null, created_at: new Date().toISOString(),
      client_name: quote.client_name ?? null, vehicle_label: quote.vehicle_label ?? null,
      conditions: quote.conditions ?? null, valid_until: quote.valid_until ?? null,
      service_request_id: quote.service_request_id ?? null,
      client_phone: quote.client_phone ?? null, client_email: quote.client_email ?? null,
      client_token: null, sent_at: null, accepted_at: null, declined_at: null,
      decline_reason: null, revised_from: null,
      accepted_terms_version: null, accepted_privacy_version: null,
      recommendation_id: quote.recommendation_id ?? null,
      supplemental_to_quote_id: quote.supplemental_to_quote_id ?? null,
    }
    s.quotes.unshift(row)
    lines.forEach((l, i) =>
      s.quoteLines.push({
        id: uid(), quote_id: id, label: l.label ?? '', quantity: l.quantity ?? 1,
        unit_price: l.unit_price ?? 0, tax_rate: l.tax_rate ?? 20,
        line_total: lineTotal({ quantity: Number(l.quantity) || 0, unit_price: Number(l.unit_price) || 0, tax_rate: Number(l.tax_rate) || 0 }),
        sort_order: i,
      }),
    )
    save()
    return row
  },
  updateQuoteStatus: (id: string, status: string) => {
    const s = load()
    const q = s.quotes.find((x) => x.id === id)
    if (q) q.status = status
    save()
  },
  updateQuoteFull: (id: string, patch: Partial<Quote>, lines: Partial<QuoteLine>[]) => {
    const s = load()
    const q = s.quotes.find((x) => x.id === id)
    const t = totalsFrom(lines)
    if (q) Object.assign(q, patch, { subtotal: t.subtotal, tax_total: t.tax_total, total: t.total })
    s.quoteLines = s.quoteLines.filter((l) => l.quote_id !== id)
    lines.forEach((l, i) =>
      s.quoteLines.push({
        id: uid(), quote_id: id, label: l.label ?? '', quantity: l.quantity ?? 1,
        unit_price: l.unit_price ?? 0, tax_rate: l.tax_rate ?? 20,
        line_total: lineTotal({ quantity: Number(l.quantity) || 0, unit_price: Number(l.unit_price) || 0, tax_rate: Number(l.tax_rate) || 0 }),
        sort_order: i,
      }),
    )
    save()
  },
  // ---- Quote life-cycle (mirror of the server RPCs) ----
  sendQuote: (id: string): Quote => {
    const s = load()
    const q = s.quotes.find((x) => x.id === id)
    if (!q) throw new Error('Devis introuvable')
    if (q.status !== 'draft') throw new Error('Seul un brouillon peut être envoyé')
    if (s.quoteLines.filter((l) => l.quote_id === id).length === 0) throw new Error('Devis vide : ajoutez au moins une ligne')
    const blocked = quoteSendBlockReason(q.valid_until)
    if (blocked) throw new Error(blocked)
    q.status = 'sent'
    q.sent_at = new Date().toISOString()
    q.client_token = q.client_token ?? ('demo' + uid().replace(/-/g, '') + uid().replace(/-/g, ''))
    if (q.service_request_id) {
      const request = s.requests.find((item) => item.id === q.service_request_id)
      if (request) {
        queueDemoNotification(s, {
          garageId: q.garage_id, centerId: request.center_id, requestId: request.id,
          recipientUserId: request.client_id, templateKey: 'quote_available', payload: { quote_id: q.id },
        })
      }
    }
    save()
    return clone(q)
  },
  reviseQuote: (id: string): Quote => {
    const s = load()
    const src = s.quotes.find((x) => x.id === id)
    if (!src) throw new Error('Devis introuvable')
    const newId = uid()
    const number = 'DV-' + new Date().getFullYear() + '-' + String((s.quoteSeq += 1)).padStart(4, '0')
    const row: Quote = {
      ...src, id: newId, number, status: 'draft', created_at: new Date().toISOString(),
      client_token: null, sent_at: null, accepted_at: null, declined_at: null, decline_reason: null, revised_from: src.id,
      accepted_terms_version: null, accepted_privacy_version: null,
    }
    s.quotes.unshift(row)
    s.quoteLines.filter((l) => l.quote_id === id).forEach((l, i) =>
      s.quoteLines.push({ ...l, id: uid(), quote_id: newId, sort_order: i }))
    save()
    return clone(row)
  },
  getPublicQuote: (token: string) => {
    const found = findStoredQuote(token)
    return found ? buildPublicQuote(found.store, token) : null
  },
  acceptPublicQuote: (token: string) => {
    const found = findStoredQuote(token)
    if (!found) throw new Error('Devis introuvable')
    const s = found.store
    const q = s.quotes.find((x) => x.client_token === token)
    if (!q) throw new Error('Devis introuvable')
    if (q.status === 'sent') {
      if (q.valid_until && q.valid_until < new Date().toISOString().slice(0, 10)) throw new Error('Devis expiré')
      q.status = 'accepted'; q.accepted_at = new Date().toISOString()
      q.accepted_terms_version = legalVersions.terms; q.accepted_privacy_version = legalVersions.privacy
      saveStoredStore(found.brand, s)
    } else if (q.status !== 'accepted') throw new Error('Devis non disponible')
    return buildPublicQuote(s, token)!
  },
  declinePublicQuote: (token: string, reason: string | null) => {
    const found = findStoredQuote(token)
    if (!found) throw new Error('Devis introuvable')
    const s = found.store
    const q = s.quotes.find((x) => x.client_token === token)
    if (!q) throw new Error('Devis introuvable')
    if (q.status === 'sent') {
      q.status = 'declined'; q.declined_at = new Date().toISOString(); q.decline_reason = reason?.trim() || null
      saveStoredStore(found.brand, s)
    } else if (q.status !== 'declined') throw new Error('Devis non disponible')
    return buildPublicQuote(s, token)!
  },
}

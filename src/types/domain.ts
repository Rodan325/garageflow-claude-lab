import type { Tables } from './database.types'

// Semantic row aliases used across the app.
export type Garage = Tables<'garages'>
export type Profile = Tables<'profiles'>
export type GarageMember = Tables<'garage_members'>
export type ClientProfile = Tables<'client_profiles'>
export type Customer = Tables<'customers'>
export type Vehicle = Tables<'vehicles'>
export type ClientVehicle = Tables<'client_vehicles'>
export type GarageService = Tables<'garage_services'>
export type GarageNews = Tables<'garage_news'>
export type GarageHours = Tables<'garage_hours'>
export type ServiceRequest = Tables<'service_requests'>
export type ServiceRequestMessage = Tables<'service_request_messages'>
export type Appointment = Tables<'appointments'>
export type Repair = Tables<'repairs'>
export type Quote = Tables<'quotes'>
export type QuoteLine = Tables<'quote_lines'>
export type Task = Tables<'tasks'>

/** A default quote line stored on a service (garage_services.default_lines). */
export interface DefaultLine {
  label: string
  quantity: number
  unit_price: number
  tax_rate: number
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired'
export const QUOTE_STATUS_META: Record<QuoteStatus, { label: string; tone: Tone }> = {
  draft: { label: 'Brouillon', tone: 'neutral' },
  sent: { label: 'Envoyé', tone: 'info' },
  accepted: { label: 'Accepté', tone: 'success' },
  declined: { label: 'Refusé', tone: 'danger' },
  expired: { label: 'Expiré', tone: 'warning' },
}

export type GarageRole = 'owner' | 'admin' | 'advisor' | 'mechanic' | 'front_desk'

export type RequestStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'reschedule_proposed'
  | 'confirmed'
  | 'completed'
  | 'cancelled'

export type RepairStatus =
  | 'to_diagnose'
  | 'diagnosed'
  | 'in_progress'
  | 'waiting_parts'
  | 'ready'
  | 'delivered'

export type Tone = 'neutral' | 'primary' | 'info' | 'success' | 'warning' | 'danger'

export const REQUEST_STATUS_META: Record<RequestStatus, { label: string; tone: Tone }> = {
  pending: { label: 'En attente', tone: 'warning' },
  accepted: { label: 'Acceptée', tone: 'info' },
  reschedule_proposed: { label: 'Autre créneau proposé', tone: 'primary' },
  confirmed: { label: 'Confirmée', tone: 'success' },
  completed: { label: 'Terminée', tone: 'neutral' },
  declined: { label: 'Refusée', tone: 'danger' },
  cancelled: { label: 'Annulée', tone: 'neutral' },
}

export const REPAIR_STATUS_META: Record<RepairStatus, { label: string; tone: Tone }> = {
  to_diagnose: { label: 'À diagnostiquer', tone: 'neutral' },
  diagnosed: { label: 'Diagnostiqué', tone: 'info' },
  in_progress: { label: 'En cours', tone: 'primary' },
  waiting_parts: { label: 'Attente pièces', tone: 'warning' },
  ready: { label: 'Prêt', tone: 'success' },
  delivered: { label: 'Restitué', tone: 'neutral' },
}

export const REPAIR_COLUMNS: RepairStatus[] = [
  'to_diagnose',
  'diagnosed',
  'in_progress',
  'waiting_parts',
  'ready',
  'delivered',
]

export const ROLE_LABEL: Record<GarageRole, string> = {
  owner: 'Gérant',
  admin: 'Administrateur',
  advisor: 'Conseiller',
  mechanic: 'Mécanicien',
  front_desk: 'Réception',
}

export const WEEKDAY_LABEL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

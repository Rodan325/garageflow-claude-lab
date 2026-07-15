import { env } from '@/lib/env'
import { getDemoOrganizationKind, isDemo } from '@/lib/demo'

/**
 * Whether the multi-center feature is active in the CURRENT context.
 *
 * Enabled only for a generic network demo account or by an explicit deployment
 * flag once the center migrations are applied. Branding never changes business
 * capabilities. This gates BOTH reads (garage_centers) AND writes
 * (center_id / client_stage on service_requests), so a production DB without
 * the migrations is never queried with columns/tables it does not have.
 *
 * Belt-and-suspenders: read hooks additionally swallow "relation/column does
 * not exist" errors (see isMissingSchemaError) and degrade to empty results.
 */
export function centersEnabled(): boolean {
  return (isDemo() && getDemoOrganizationKind() === 'network') || env.enableCenters || env.enableNetworkDashboard
}

export function networkDashboardEnabled(): boolean {
  return (isDemo() && getDemoOrganizationKind() === 'network') || env.enableNetworkDashboard
}

/**
 * The lifecycle tables are opt-in in real deployments until their additive
 * migration has been applied. Local demo stores implement the same contract
 * without touching Supabase, so they can safely exercise the complete flow.
 */
export function workshopTimelineEnabled(): boolean {
  return isDemo() || env.enableWorkshopTimeline
}

export function recommendationsEnabled(): boolean {
  return isDemo() || env.enableRecommendations
}

export function attachmentsEnabled(): boolean {
  return isDemo() || env.enableAttachments
}

export function notificationsEnabled(): boolean {
  return isDemo() || env.enableNotifications
}

export function deliveryReportsEnabled(): boolean {
  return isDemo() || env.enableDeliveryReports
}

export function maintenanceRemindersEnabled(): boolean {
  return isDemo() || env.enableMaintenanceReminders
}

/**
 * True when a PostgREST/Postgres error means the queried table or column does
 * not exist yet (migration not applied). Used to fail soft instead of throwing.
 */
export function isMissingSchemaError(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null
  const code = e?.code ?? ''
  const msg = (e?.message ?? '').toLowerCase()
  // 42P01 undefined_table, 42703 undefined_column; PGRST205 unknown table,
  // PGRST204 unknown column (schema cache).
  return (
    code === '42P01' ||
    code === '42703' ||
    code === 'PGRST205' ||
    code === 'PGRST204' ||
    msg.includes('does not exist') ||
    msg.includes('could not find the table') ||
    msg.includes('could not find the') // column ... in the schema cache
  )
}

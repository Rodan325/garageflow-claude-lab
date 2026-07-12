import { env } from '@/lib/env'
import { getActiveBrand } from '@/branding'

/**
 * Whether the multi-center feature is active in the CURRENT context.
 *
 * Enabled ONLY when:
 *  - the active brand is `speedy` (the multi-center demo skin), OR
 *  - VITE_ENABLE_CENTERS='true' (a real deployment where 0022/0023 are applied).
 *
 * The plain Clikarage demo is therefore UNCHANGED: no center step, no forced
 * car-service catalog. This gates BOTH reads (garage_centers) AND writes
 * (center_id / client_stage on service_requests), so a production DB without
 * the migrations is never queried with columns/tables it does not have.
 *
 * Belt-and-suspenders: read hooks additionally swallow "relation/column does
 * not exist" errors (see isMissingSchemaError) and degrade to empty results.
 */
export function centersEnabled(): boolean {
  return getActiveBrand().id === 'speedy' || env.enableCenters
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

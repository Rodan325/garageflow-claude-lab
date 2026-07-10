import { env } from '@/lib/env'
import { isDemo } from '@/lib/demo'

/**
 * Whether the multi-center feature is active in the CURRENT mode.
 *
 * - Demo mode: always on — centers live in the in-memory demo store, so there
 *   is no Supabase schema to depend on.
 * - Real Supabase mode: only when VITE_ENABLE_CENTERS='true'. This gates BOTH
 *   reads (garage_centers) AND writes (center_id / client_stage on
 *   service_requests) so a production DB without migrations 0022/0023 is never
 *   queried with columns/tables it does not have.
 *
 * Belt-and-suspenders: read hooks additionally swallow "relation/column does
 * not exist" errors (see isMissingSchemaError) and degrade to empty results.
 */
export function centersEnabled(): boolean {
  return isDemo() || env.enableCenters
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

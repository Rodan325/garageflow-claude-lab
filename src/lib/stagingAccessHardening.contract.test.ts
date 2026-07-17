import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const migration = readFileSync(
  join(root, 'supabase', 'migrations', '20260717010000_staging_access_hardening.sql'),
  'utf8',
)
const cascadeCleanup = readFileSync(
  join(root, 'supabase', 'migrations', '20260717020000_transfer_event_cascade_cleanup.sql'),
  'utf8',
)

describe('staging access hardening contract', () => {
  it('removes inherited Data API grants and gives anon read-only catalog access', () => {
    expect(migration).toContain(
      'revoke all privileges on all tables in schema public from anon, authenticated;',
    )
    expect(migration).toMatch(
      /grant select on public\.garages,[\s\S]+public\.garage_centers to anon, authenticated;/,
    )
    expect(migration).not.toMatch(/grant\s+(?:all|insert|update|delete)[^;]+\bto\s+anon\b/i)
  })

  it('scopes public catalog rows to a garage visible through RLS', () => {
    for (const policy of [
      'garage_centers_visible_garage_scope',
      'garage_services_visible_garage_scope',
      'garage_news_visible_garage_scope',
      'garage_hours_visible_garage_scope',
    ]) {
      expect(migration).toContain(`create policy ${policy}`)
    }
    expect(migration.match(/as restrictive/g)).toHaveLength(4)
  })

  it('lets a client resolve only their configured private organization', () => {
    expect(migration).toContain('create policy garages_select_client_default')
    expect(migration).toContain('client.default_garage_id = garages.id')
  })

  it('removes Data API execution from trigger-only functions', () => {
    for (const signature of [
      'public.guard_quote_transition()',
      'public.share_vehicle_on_request()',
      'public.prevent_transfer_event_mutation()',
    ]) {
      expect(migration).toContain(
        `revoke all on function ${signature} from public, anon, authenticated;`,
      )
    }
  })

  it('keeps transfer events append-only while permitting parent cascades', () => {
    expect(cascadeCleanup).toContain("if tg_op = 'DELETE' and pg_trigger_depth() > 1 then")
    expect(cascadeCleanup).toContain("raise exception 'Transfer events are append-only'")
    expect(cascadeCleanup).toContain(
      'revoke all on function public.prevent_transfer_event_mutation()',
    )
  })
})

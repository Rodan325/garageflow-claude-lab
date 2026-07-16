import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(
  join(process.cwd(), 'supabase/migrations/20260715060000_center_transfers_integrations.sql'),
  'utf8',
).toLowerCase()

describe('center transfer and integration migration', () => {
  it('keeps transfers inside one organization with composite foreign keys', () => {
    expect(sql).toContain('foreign key (service_request_id, garage_id)')
    expect(sql).toContain('foreign key (from_center_id, garage_id)')
    expect(sql).toContain('foreign key (to_center_id, garage_id)')
    expect(sql).toContain('destination center is invalid')
    expect(sql).toContain('transfer source is stale')
  })

  it('requires customer confirmation and journals transitions append-only', () => {
    expect(sql).toContain('customer confirmation is required')
    expect(sql).toContain('service_request_transfer_events_append_only')
    expect(sql).toContain("status <> 'customer_confirmed'")
  })

  it('keeps table writes behind authenticated RPCs and RLS', () => {
    expect(sql).toContain('enable row level security')
    expect(sql).toContain('revoke all on public.service_request_transfers from public, anon, authenticated')
    expect(sql).toContain('grant execute on function public.propose_center_transfer')
    expect(sql).not.toMatch(/grant\s+(insert|update|delete|all)\s+on\s+public\./)
  })

  it('stores only non-sensitive integration configuration', () => {
    expect(sql).toContain('public_config')
    expect(sql).toContain('provider credentials must remain in a server-side secret store')
    expect(sql).not.toContain('api_key')
    expect(sql).not.toContain('access_token')
  })

  it('is additive', () => {
    expect(sql).not.toMatch(/\bdrop\s+(table|column|constraint|function|policy)\b/)
    expect(sql).not.toMatch(/\btruncate\b/)
  })
})

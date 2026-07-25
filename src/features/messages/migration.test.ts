import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationPath = join(
  process.cwd(),
  'supabase/migrations/20260725205059_secure_service_request_messages.sql',
)
const sql = readFileSync(migrationPath, 'utf8')

describe('service request message isolation migration', () => {
  it('aborts on historical tenant mismatches without repairing data', () => {
    expect(sql).toContain('inconsistent historical row(s)')
    expect(sql).toMatch(/left join public\.service_requests request[\s\S]+request\.id = message\.request_id[\s\S]+request\.garage_id = message\.garage_id/)
    expect(sql).not.toMatch(/\b(update|delete)\s+public\.service_request_messages\b/i)
  })

  it('binds each message to the exact request and garage pair', () => {
    expect(sql).toMatch(/foreign key \(request_id, garage_id\)[\s\S]+references public\.service_requests \(id, garage_id\)/)
    expect(sql).toContain('service_request_messages_request_garage_fk')
    expect(sql).toContain("array['id', 'garage_id']::name[]")
  })

  it('derives read access from the referenced request and center', () => {
    expect(sql).toMatch(/alter policy req_messages_select[\s\S]+request\.id = service_request_messages\.request_id[\s\S]+request\.garage_id = service_request_messages\.garage_id/)
    expect(sql).toContain('request.client_id = (select auth.uid())')
    expect(sql).toContain('public.can_manage_garage_center(request.garage_id, request.center_id)')
  })

  it('revokes direct writes and keeps the historical insert policy inert', () => {
    expect(sql).toMatch(/alter policy req_messages_insert[\s\S]+with check \(false\)/)
    expect(sql).toMatch(/revoke insert, update, delete[\s\S]+from anon, authenticated/)
  })

  it('exposes only the minimal authenticated RPC signature', () => {
    expect(sql).toMatch(/post_service_request_message\(\s*p_request_id uuid,\s*p_body text\s*\)/)
    expect(sql).not.toMatch(/\bp_(garage_id|sender|author_id|id|created_at|organization_id|center_id)\b/)
    expect(sql).toMatch(/revoke all[\s\S]+post_service_request_message\(uuid, text\)[\s\S]+from public, anon, authenticated/)
    expect(sql).toMatch(/grant execute[\s\S]+post_service_request_message\(uuid, text\)[\s\S]+to authenticated/)
  })

  it('locks the request and derives security metadata on the server', () => {
    expect(sql).toContain('security definer')
    expect(sql).toContain("set search_path = ''")
    expect(sql).toContain('current_user_id uuid := (select auth.uid())')
    expect(sql).toMatch(/where request\.id = p_request_id\s+for update/)
    expect(sql).toMatch(/values \(\s*current_request\.id,\s*current_request\.garage_id,\s*resolved_sender,\s*current_user_id,\s*btrim\(p_body\)/)
  })

  it('enforces ownership, center scope, and the approved writable statuses', () => {
    expect(sql).toContain('current_request.client_id is distinct from current_user_id')
    expect(sql).toContain('public.can_manage_garage_center(')
    for (const status of [
      'pending',
      'accepted',
      'reschedule_proposed',
      'confirmed',
      'completed',
    ]) {
      expect(sql).toContain(`'${status}'`)
    }
    expect(sql).toContain("current_request.workshop_stage = 'closed'")
    expect(sql).not.toMatch(/current_request\.status[\s\S]{0,120}'cancelled'/)
  })

  it('rejects anonymous, missing-profile, and blank-body calls', () => {
    expect(sql).toContain('if current_user_id is null')
    expect(sql).toContain('if current_account_type is null')
    expect(sql).toContain('length(btrim(p_body)) = 0')
  })

  it('documents the absence of a historical database message length limit', () => {
    expect(sql).toContain('Message length remains unconstrained by the historical schema.')
  })
})

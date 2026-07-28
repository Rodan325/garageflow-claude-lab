import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationsDirectory = resolve('supabase/migrations')
const migrationName = /_enforce_core_data_api_capabilities\.sql$/

function loadMigration() {
  const matches = readdirSync(migrationsDirectory).filter((file) => migrationName.test(file))
  expect(matches).toHaveLength(1)

  const path = resolve(migrationsDirectory, matches[0])
  expect(existsSync(path)).toBe(true)

  return readFileSync(path, 'utf8').replace(/\r\n?/g, '\n')
}

describe('core Data API capability migration contract', () => {
  it('installs a fail-closed canonical capability resolver', () => {
    const sql = loadMigration()

    expect(sql).toMatch(
      /create or replace function public\.has_core_capability\s*\(\s*p_garage_id uuid,\s*p_center_id uuid,\s*p_capability text\s*\)/i,
    )
    expect(sql).toMatch(/security definer\s+set search_path = ''/i)
    expect(sql).toMatch(/count\(\*\)\s*=\s*1/i)
    expect(sql).toMatch(/member\.organization_role in \(\s*'organization_owner',\s*'network_admin'\s*\)/i)
    expect(sql).toMatch(/member\.center_role = 'center_manager'/i)
    expect(sql).toContain('else false')
    expect(sql).not.toMatch(/unique\s*\(\s*user_id\s*\)/i)
    expect(sql).not.toMatch(/member\.role\s*=/i)
    expect(sql).not.toMatch(/regional_manager[^;]*then true/is)
  })

  it('blocks ambiguous active memberships without backfilling them', () => {
    const sql = loadMigration()

    expect(sql).toContain('Core capability migration blocked')
    expect(sql).toMatch(/member\.organization_role is not null[\s\S]*member\.center_role is not null/i)
    expect(sql).toMatch(/group by member\.user_id, member\.garage_id[\s\S]*having count\(\*\) > 1/i)
    expect(sql).toMatch(/center\.garage_id is distinct from member\.garage_id/i)
    expect(sql).not.toMatch(/update\s+public\.garage_members/i)
    expect(sql).not.toMatch(/delete\s+from\s+public\.garage_members/i)
  })

  it('replaces broad ALL policies with explicit per-verb policies', () => {
    const sql = loadMigration()

    for (const policy of [
      'customers_rw',
      'vehicles_rw',
      'appointments_rw',
      'repairs_rw',
      'tasks_rw',
      'services_manage',
      'requests_select',
      'requests_insert_client',
      'requests_update',
      'requests_delete_member',
    ]) {
      expect(sql).toContain(`drop policy if exists ${policy}`)
    }

    for (const table of [
      'customers',
      'vehicles',
      'appointments',
      'repairs',
      'tasks',
      'garage_services',
    ]) {
      for (const verb of ['select', 'insert', 'update', 'delete']) {
        expect(sql).toMatch(
          new RegExp(`create policy ${table}_${verb}_capability[\\s\\S]*?for ${verb}`, 'i'),
        )
      }
    }

    expect(sql).not.toMatch(/create policy (customers|vehicles|appointments|repairs|tasks)_[^\n]+[\s\S]{0,120}for all/i)
    expect(sql).not.toMatch(/is_garage_member\s*\(\s*garage_id\s*\)/i)
  })

  it('removes physical request deletion and hardens client updates', () => {
    const sql = loadMigration()

    expect(sql).toMatch(
      /revoke delete on table public\.service_requests\s+from public, anon, authenticated/i,
    )
    expect(sql).not.toMatch(/create policy requests_[^\n]+[\s\S]{0,100}for delete/i)
    expect(sql).toMatch(/create or replace function public\.guard_request_transition\(\)/i)
    expect(sql).toMatch(/to_jsonb\(new\)\s*-\s*array\['status',\s*'updated_at'\]/i)
    expect(sql).toContain("errcode = '42501'")
  })

  it('keeps public active services readable and minimizes grants', () => {
    const sql = loadMigration()

    expect(sql).toMatch(
      /create policy services_select[\s\S]*?for select to anon[\s\S]*?using \(is_active = true\)/i,
    )
    expect(sql).toMatch(
      /revoke insert, update, delete on table[\s\S]*?public\.(customers|vehicles|appointments|repairs|tasks|garage_services)[\s\S]*?from public, anon/i,
    )
    expect(sql).toMatch(
      /revoke all on function public\.has_core_capability\(uuid, uuid, text\)[\s\S]*from public, anon, authenticated/i,
    )
    expect(sql).toMatch(
      /grant execute on function public\.has_core_capability\(uuid, uuid, text\)\s+to authenticated/i,
    )
    expect(sql).toMatch(
      /revoke all on function public\.core_appointment_center\(uuid, uuid\)[\s\S]*?from public, anon, authenticated/i,
    )
    expect(sql).not.toMatch(
      /grant execute on function public\.core_appointment_center\(uuid, uuid\)/i,
    )
  })
})

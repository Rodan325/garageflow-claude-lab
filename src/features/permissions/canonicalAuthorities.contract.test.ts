import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationsDirectory = resolve('supabase/migrations')
const migrationName = /_enforce_canonical_local_authorities\.sql$/

function loadMigration() {
  const matches = readdirSync(migrationsDirectory).filter((file) => migrationName.test(file))
  expect(matches).toHaveLength(1)

  const path = resolve(migrationsDirectory, matches[0])
  expect(existsSync(path)).toBe(true)
  return readFileSync(path, 'utf8').replace(/\r\n?/g, '\n')
}

function functionSection(sql: string, name: string, nextName: string) {
  const start = sql.indexOf(`create or replace function ${name}`)
  const end = sql.indexOf(`create or replace function ${nextName}`, start + 1)
  expect(start).toBeGreaterThanOrEqual(0)
  expect(end).toBeGreaterThan(start)
  return sql.slice(start, end)
}

describe('canonical local authority migration contract', () => {
  it('resolves one active canonical scope without consulting legacy roles', () => {
    const sql = loadMigration()
    const resolver = functionSection(
      sql,
      'private.resolve_canonical_actor',
      'public.has_organization_capability',
    )

    expect(resolver).toMatch(/count\(\*\)[\s\S]*<> 1/i)
    expect(resolver).toMatch(/candidate\.status = 'active'/i)
    expect(resolver).toMatch(/center\.garage_id = p_garage_id/i)
    expect(resolver).not.toMatch(/candidate\.role|member\.role/i)
    expect(resolver).not.toContain('regional_manager')
    expect(resolver).not.toContain('service_advisor')
    expect(resolver).not.toContain('front_desk')
  })

  it('keeps network capabilities explicit and removes local core mutations', () => {
    const sql = loadMigration()
    const organization = functionSection(
      sql,
      'public.has_organization_capability',
      'public.has_center_capability',
    )
    const core = functionSection(
      sql,
      'public.has_core_capability',
      'public.has_garage_role',
    )
    const networkBlock = core.slice(
      core.indexOf("if actor.organization_role = 'network_admin'"),
      core.indexOf('if actor.organization_role is null'),
    )

    expect(organization).toContain("'network.dashboard.read'")
    expect(organization).toContain("'members.manage_lower'")
    expect(networkBlock).toMatch(/organization_role = 'network_admin'[\s\S]*return false/i)
    expect(networkBlock).not.toMatch(/(customers|vehicles|appointments|repairs|tasks|garage_services)\.(insert|update|delete)/i)
  })

  it('turns legacy helpers into canonical compatibility shims', () => {
    const sql = loadMigration()
    const garageRole = functionSection(
      sql,
      'public.has_garage_role',
      'public.can_manage_garage_center',
    )
    const centerManager = functionSection(
      sql,
      'public.can_manage_garage_center',
      'public.can_view_network_dashboard',
    )
    const networkDashboard = functionSection(
      sql,
      'public.can_view_network_dashboard',
      'private.resolve_workshop_actor',
    )

    expect(garageRole).toContain("'organization.local_operations'")
    expect(garageRole).not.toMatch(/\.role\b/i)
    expect(centerManager).toContain("'center.manage'")
    expect(centerManager).not.toContain('network_admin')
    expect(centerManager).not.toContain('regional_manager')
    expect(networkDashboard).toContain("'network.dashboard.read'")
    expect(networkDashboard).not.toContain('regional_manager')
  })

  it('uses a dedicated customer messaging capability for receptionist scope', () => {
    const sql = loadMigration()

    expect(sql).toContain("'service_requests.message'")
    expect(sql).toMatch(/alter policy req_messages_select[\s\S]*has_center_capability/i)
    expect(sql).toMatch(
      /create or replace function public\.post_service_request_message[\s\S]*'service_requests\.message'/i,
    )
  })

  it('delegates workshop role resolution to the canonical resolver', () => {
    const sql = loadMigration()
    const workshopResolver = sql.slice(
      sql.indexOf('create or replace function private.resolve_workshop_actor'),
      sql.indexOf('alter function private.resolve_canonical_actor'),
    )

    expect(workshopResolver).toContain('private.resolve_canonical_actor')
    expect(workshopResolver).toMatch(/organization_owner|center_manager|receptionist|technician/)
    expect(workshopResolver).not.toContain('network_admin')
    expect(workshopResolver).not.toContain('regional_manager')
    expect(workshopResolver).not.toMatch(/\.role\b/i)
  })

  it('uses empty search paths, minimal grants, and performs no data rewrite', () => {
    const sql = loadMigration()

    expect(sql).toMatch(/security definer\s+set search_path = ''/i)
    expect(sql).toMatch(/revoke all on function private\.resolve_canonical_actor[\s\S]*from public, anon, authenticated, service_role/i)
    expect(sql).toMatch(/grant execute on function public\.has_organization_capability[\s\S]*to authenticated, service_role/i)
    expect(sql).toMatch(/grant execute on function public\.has_center_capability[\s\S]*to authenticated, service_role/i)
    expect(sql).not.toMatch(/\b(update|insert into|delete from)\s+public\.(garage_members|customers|vehicles|appointments|repairs|tasks|garage_services)\b/i)
  })
})

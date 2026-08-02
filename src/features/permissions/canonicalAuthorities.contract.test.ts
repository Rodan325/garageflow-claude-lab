import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationsDirectory = resolve('supabase/migrations')
const migrationName = /_enforce_canonical_local_authorities\.sql$/
const correctionMigrationName = /_close_residual_local_authorities\.sql$/
const dbContractPath = resolve('scripts/core-data-api-capabilities-db-contract.sql')

function loadMigration() {
  const matches = readdirSync(migrationsDirectory).filter((file) => migrationName.test(file))
  expect(matches).toHaveLength(1)

  const path = resolve(migrationsDirectory, matches[0])
  expect(existsSync(path)).toBe(true)
  return readFileSync(path, 'utf8').replace(/\r\n?/g, '\n')
}

function loadCorrectionMigration() {
  const matches = readdirSync(migrationsDirectory).filter((file) => correctionMigrationName.test(file))
  expect(matches).toHaveLength(1)

  const path = resolve(migrationsDirectory, matches[0])
  expect(existsSync(path)).toBe(true)
  return readFileSync(path, 'utf8').replace(/\r\n?/g, '\n')
}

function loadDbContract() {
  expect(existsSync(dbContractPath)).toBe(true)
  return readFileSync(dbContractPath, 'utf8').replace(/\r\n?/g, '\n')
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

describe('residual local authority correction contract', () => {
  it('uses explicit capabilities without granting network or legacy roles local mutations', () => {
    const sql = loadCorrectionMigration()
    const resolver = functionSection(
      sql,
      'public.has_local_business_capability',
      'public.has_quote_capability',
    )

    expect(resolver).toContain("actor.organization_role = 'organization_owner'")
    expect(resolver).toContain("actor.center_role = 'center_manager'")
    expect(resolver).toContain("actor.center_role = 'receptionist'")
    expect(resolver).not.toContain('network_admin')
    expect(resolver).not.toContain('regional_manager')
    expect(resolver).not.toContain('front_desk')
    expect(resolver).not.toContain('service_advisor')
    expect(resolver).not.toMatch(/actor\.role|member\.role/i)

    const receptionistBlock = resolver.slice(
      resolver.indexOf("actor.center_role = 'receptionist'"),
      resolver.indexOf('return false;', resolver.indexOf("actor.center_role = 'receptionist'")),
    )
    expect(receptionistBlock).toContain("'quotes.select'")
    expect(receptionistBlock).not.toContain("'quotes.manage'")
  })

  it('forces quote creation through the server-owned draft workflow', () => {
    const sql = loadCorrectionMigration()
    const createQuote = functionSection(
      sql,
      'public.create_quote_with_lines',
      'public.update_quote_with_lines',
    )
    const updateQuote = functionSection(
      sql,
      'public.update_quote_with_lines',
      'public.send_quote',
    )

    expect(createQuote).toMatch(/p_quote->>'status'[\s\S]*<> 'draft'[\s\S]*raise exception/i)
    expect(createQuote).toMatch(/accepted_at[\s\S]*declined_at[\s\S]*client_token/i)
    expect(createQuote).toMatch(/jsonb_object_keys[\s\S]*unsupported quote creation field/i)
    expect(createQuote).toMatch(/insert into public\.quotes[\s\S]*\n\s*'draft',/i)
    expect(createQuote).not.toMatch(/coalesce\(p_quote->>'status',\s*'draft'\)/i)
    expect(updateQuote).toMatch(/p_quote->>'status'[\s\S]*<> 'draft'[\s\S]*raise exception/i)
    expect(updateQuote).toMatch(/jsonb_object_keys[\s\S]*unsupported quote composition field/i)
    expect(updateQuote).not.toMatch(/status\s*=\s*coalesce\(p_quote->>'status'/i)
  })

  it('binds reminder recipients to a request or an owner CRM relationship', () => {
    const sql = loadCorrectionMigration()
    const reminder = functionSection(
      sql,
      'public.create_maintenance_reminder',
      'public.mark_maintenance_reminder_converted',
    )

    expect(reminder).toMatch(/from public\.service_requests[\s\S]*for (?:key )?share/i)
    expect(reminder).toMatch(/request\.client_id\s+is distinct from\s+p_client_id/i)
    expect(reminder).toMatch(/customer\.garage_id\s*=\s*p_garage_id/i)
    expect(reminder).toMatch(/customer\.linked_user_id\s*=\s*p_client_id/i)
    expect(reminder).toMatch(/customer\.linked_user_id[\s\S]*for share/i)
    expect(reminder).toMatch(
      /organization_role\s+is\s+distinct\s+from\s+'organization_owner'/i,
    )
  })

  it('specializes every discovered historical mutation surface', () => {
    const sql = loadCorrectionMigration()
    const redefinedFunctions = [
      'public.next_quote_number',
      'public.create_quote_with_lines',
      'public.update_quote_with_lines',
      'public.send_quote',
      'public.revise_quote',
      'public.save_delivery_report',
      'public.create_maintenance_reminder',
      'public.mark_maintenance_reminder_converted',
      'public.register_service_request_attachment',
      'public.propose_center_transfer',
      'public.complete_center_transfer',
    ]

    for (const functionName of redefinedFunctions) {
      expect(sql).toContain(`create or replace function ${functionName}`)
    }

    expect(sql).toMatch(/drop policy if exists quotes_rw/i)
    expect(sql).toMatch(/drop policy if exists quote_lines_rw/i)
    expect(sql).toMatch(/drop policy if exists documents_rw/i)
    expect(sql).toMatch(/drop policy if exists garage_logos_member_(insert|update|delete)/i)
    expect(sql).toMatch(/drop policy if exists (garages_update_admin|centers_manage|news_manage|hours_manage)/i)
  })

  it('dynamically rejects mutative RPCs that regress to generic legacy helpers', () => {
    const contract = loadDbContract()

    expect(contract).toMatch(/function_row\.prosrc\s*~\* '\\m\(insert\|update\|delete\|merge\)\\M'/i)
    expect(contract).toMatch(
      /function_row\.prosrc[\s\S]*~\* '\(is_garage_member\|has_garage_role\|can_manage_garage_center\)'/i,
    )
    expect(contract).not.toMatch(/function_row\.proname\s*=\s*any\(array\[/i)
  })

  it('keeps mutative policies specialized and quote creation/update RPC-only', () => {
    const sql = loadCorrectionMigration()
    const mutationPolicies = [
      'garages_update_canonical',
      'centers_insert_canonical',
      'centers_update_canonical',
      'centers_delete_canonical',
      'news_insert_canonical',
      'news_update_canonical',
      'news_delete_canonical',
      'hours_insert_canonical',
      'hours_update_canonical',
      'hours_delete_canonical',
      'quotes_delete_canonical',
      'documents_insert_canonical',
      'documents_update_canonical',
      'documents_delete_canonical',
      'garage_logos_owner_insert',
      'garage_logos_owner_update',
      'garage_logos_owner_delete',
      'service_attachments_staff_insert_objects',
      'service_attachments_staff_delete_objects',
    ]

    for (const policyName of mutationPolicies) {
      const start = sql.indexOf(`create policy ${policyName}`)
      const end = sql.indexOf(';', start)
      expect(start).toBeGreaterThanOrEqual(0)
      expect(end).toBeGreaterThan(start)
      expect(sql.slice(start, end)).not.toMatch(
        /is_garage_member|has_garage_role|can_manage_garage_center/i,
      )
    }
    expect(sql).toMatch(
      /revoke insert, update on table public\.quotes from public, anon, authenticated/i,
    )
    expect(sql).toMatch(/create policy quotes_delete_canonical[\s\S]*status = 'draft'/i)
  })

  it('uses empty search paths, qualified authorities, and minimal execution grants', () => {
    const sql = loadCorrectionMigration()
    const functionDefinitions = sql.match(
      /create or replace function [\s\S]*?\$\$;/gi,
    ) ?? []

    expect(functionDefinitions).toHaveLength(14)
    for (const definition of functionDefinitions) {
      expect(definition).toMatch(/set search_path = ''/i)
    }
    expect(sql).toMatch(
      /revoke all on function public\.next_quote_number\(uuid\)[\s\S]*from public, anon, authenticated, service_role/i,
    )
    expect(sql).not.toMatch(/grant execute on function public\.next_quote_number\(uuid\)/i)
    expect(sql).not.toMatch(/\bgrant execute[\s\S]*\bto (?:public|anon)\b/i)
  })

  it('does not rewrite memberships or business data', () => {
    const sql = loadCorrectionMigration()

    expect(sql).not.toMatch(
      /\b(?:insert into|update|delete from)\s+public\.(?:garage_members|customers|vehicles|tasks|garage_services)\b/i,
    )
    expect(sql).not.toMatch(/\b(?:insert into|update|delete from)\s+auth\./i)
  })

  it('keeps document mutations owner-only until a center-bound contract exists', () => {
    const sql = loadCorrectionMigration()

    expect(sql).toMatch(/documents table has no center binding/i)
    expect(sql).toMatch(/no mutative frontend consumer/i)
    expect(sql).toMatch(/future specialized[\s\S]*center\/document relationship/i)
    expect(sql).toMatch(
      /create policy documents_insert_canonical[\s\S]*'organization\.documents\.manage'/i,
    )
  })
})

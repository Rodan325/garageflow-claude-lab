import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationsDirectory = resolve('supabase/migrations')
const migrationFile = readdirSync(migrationsDirectory).filter(
  (file) => /_enforce_canonical_workshop_capabilities\.sql$/.test(file),
)

expect(migrationFile).toHaveLength(1)

const sql = readFileSync(resolve(migrationsDirectory, migrationFile[0]), 'utf8')
  .replace(/\r\n?/g, '\n')
const resolver = sql.slice(
  sql.indexOf('create or replace function private.resolve_workshop_actor'),
  sql.indexOf('create or replace function private.workshop_technician_assigned'),
)
const technicianAssignment = sql.slice(
  sql.indexOf('create or replace function private.workshop_technician_assigned'),
  sql.indexOf('create or replace function public.has_workshop_capability'),
)

describe('canonical workshop capability contract', () => {
  it('adds receptionist without backfilling a legacy role', () => {
    expect(sql).toMatch(/garage_members_center_role_check[\s\S]*'receptionist'/)
    expect(sql).not.toMatch(/update\s+public\.garage_members/i)
    expect(resolver).not.toMatch(/candidate\.role|member\.role/)
    expect(resolver).not.toContain('service_advisor')
    expect(resolver).not.toContain('front_desk')
    expect(resolver).not.toContain('regional_manager')
  })

  it('derives technician authority only from a unique repair assignment', () => {
    expect(technicianAssignment).toMatch(/appointment\.service_request_id = p_request_id/)
    expect(technicianAssignment).toMatch(/repair\.assigned_to = p_actor_id/)
    expect(technicianAssignment).toMatch(/linked_appointment_count = 1/)
    expect(technicianAssignment).toMatch(/linked_repair_count = 1/)
    expect(technicianAssignment).not.toContain('appointment.assigned_to')
  })

  it('keeps special stages behind dedicated workflows', () => {
    expect(sql).toMatch(/p_new_stage in \([\s\S]*'customer_approval_required'[\s\S]*'work_authorized'[\s\S]*'closed'/)
    expect(sql).toMatch(/create or replace function public\.close_workshop_request/)
    expect(sql).toMatch(/create or replace function public\.reopen_workshop_request/)
    expect(sql).toMatch(/current_request\.workshop_stage = 'closed'[\s\S]*p_return_stage = 'vehicle_delivered'/)
    expect(sql).toMatch(/nullif\(btrim\(p_reason\), ''\) is null/)
  })

  it('makes recommendation price and quote linkage owner-only', () => {
    expect(sql).toMatch(/Estimated price is owner-only/)
    expect(sql).toMatch(/case when owner_access then recommendation\.estimated_price else null end/)
    expect(sql).toMatch(/actor_role is distinct from 'organization_owner'[\s\S]*Quote link not permitted/)
    expect(sql).toMatch(/case when client_access then null else decision\.note end/)
  })

  it('uses RPC projections and a narrowly bounded old-schema fallback', () => {
    const recommendationService = readFileSync(resolve('src/data/recommendations.ts'), 'utf8')
    const workshopService = readFileSync(resolve('src/data/workshop.ts'), 'utf8')

    expect(recommendationService).toContain("rpc('get_workshop_recommendations'")
    expect(recommendationService).toContain("rpc('get_workshop_recommendation_decisions'")
    expect(recommendationService).toContain("error?.code === 'PGRST202'")
    expect(workshopService).toContain("rpc('close_workshop_request'")
    expect(workshopService).toContain("error?.code === 'PGRST202'")
    expect(sql).toMatch(/revoke all on table public\.workshop_recommendations[\s\S]*from public, anon, authenticated/)
    expect(sql).toMatch(/revoke all on table public\.recommendation_decisions[\s\S]*from public, anon, authenticated/)
  })

  it('uses empty search paths and minimal public RPC grants', () => {
    const securityDefinerCount = (sql.match(/security definer/g) ?? []).length
    const emptySearchPathCount = (sql.match(/set search_path = ''/g) ?? []).length

    expect(securityDefinerCount).toBeGreaterThan(0)
    expect(emptySearchPathCount).toBeGreaterThanOrEqual(securityDefinerCount)
    expect(sql).toMatch(/revoke all on function private\.resolve_workshop_actor[\s\S]*from public, anon, authenticated, service_role/)
    expect(sql).toMatch(/grant execute on function public\.has_workshop_capability\(uuid, text\)[\s\S]*to authenticated, service_role/)
  })
})

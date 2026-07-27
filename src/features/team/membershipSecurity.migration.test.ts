import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationPath = join(
  process.cwd(),
  'supabase/migrations/20260726203204_prevent_membership_privilege_escalation.sql',
)
const sql = readFileSync(migrationPath, 'utf8')
const preflight = sql.slice(0, sql.indexOf('create or replace function'))
const membershipAdminRpcs = sql.slice(
  sql.indexOf('create or replace function public.promote_member_to_network_admin'),
)

describe('membership privilege escalation migration', () => {
  it('aborts on incompatible legacy authority without backfilling memberships', () => {
    expect(sql).toContain('incompatible active membership')
    expect(sql).toContain('organization without an active explicit owner')
    expect(preflight).not.toMatch(/\b(?:insert|update|delete)\s+(?:into|from\s+)?public\.garage_members\b/i)
  })

  it('removes direct Data API membership mutations', () => {
    expect(sql).toMatch(/drop policy if exists members_manage_admin on public\.garage_members/)
    expect(sql).toMatch(
      /revoke insert, update, delete on table public\.garage_members\s+from public, anon, authenticated/,
    )
  })

  it('exposes only explicit authenticated membership administration RPCs', () => {
    for (const signature of [
      'promote_member_to_network_admin(uuid)',
      'assign_member_to_center(uuid, uuid, text)',
      'deactivate_organization_member(uuid)',
    ]) {
      expect(sql).toMatch(
        new RegExp(
          `revoke all on function public\\.${signature.replace(/[().]/g, '\\$&')}\\s+from public, anon, authenticated`,
        ),
      )
      expect(sql).toMatch(
        new RegExp(
          `grant execute on function public\\.${signature.replace(/[().]/g, '\\$&')}\\s+to authenticated`,
        ),
      )
    }
    expect(membershipAdminRpcs).not.toMatch(
      /\bp_(organization_id|garage_id|actor_user_id|actor_role)\b/,
    )
  })

  it('derives and locks actor, target, tenant, role, and center on the server', () => {
    expect(sql).toContain('current_user_id uuid := (select auth.uid())')
    expect(sql).toMatch(
      /perform 1\s+from public\.garage_members locked_member[\s\S]+order by locked_member\.id\s+for update/,
    )
    expect(sql).toMatch(
      /select target\.\*\s+into strict target_row\s+from public\.garage_members target/,
    )
    expect(sql).toMatch(
      /select actor\.\*\s+into actor_row\s+from public\.garage_members actor/,
    )
    expect(sql).toMatch(/from public\.garage_centers center_row[\s\S]+for share/)
    expect(sql).toContain("set search_path = ''")
  })

  it('blocks self changes, owner assignment, platform roles, and last-owner mutation', () => {
    expect(sql).toContain('Self membership changes are forbidden')
    expect(sql).toContain('Owner membership changes require the dedicated ownership workflow')
    expect(sql).toContain('Only an organization owner can promote a network administrator')
    expect(sql).not.toMatch(/insert\s+into\s+public\.platform_admins/i)
    expect(sql).not.toMatch(/\bset\s+organization_role\s*=\s*'organization_owner'/i)
  })

  it('fails closed for inactive, ambiguous, and unscoped operational memberships', () => {
    expect(sql).toContain('Membership scope is missing or inconsistent')
    expect(sql).toMatch(/create or replace function public\.is_garage_member[\s\S]+organization_role is not null/)
    expect(sql).toMatch(/create or replace function public\.can_manage_garage_center[\s\S]+member\.center_role is not null/)
    expect(sql).not.toContain('member.organization_role is null and member.center_id is null')
  })

  it('keeps anonymous catalog policies independent from authenticated helpers', () => {
    expect(sql).toMatch(
      /alter policy garages_select_public[\s\S]+to anon[\s\S]+using \(is_public = true\)/,
    )
    expect(sql).toMatch(
      /create policy centers_select_authenticated[\s\S]+to authenticated[\s\S]+public\.is_garage_member/,
    )
    expect(sql).not.toMatch(
      /alter policy (?:garages_select_public|centers_select|services_select|news_select)[\s\S]{0,100}to anon[\s\S]{0,100}is_garage_member/,
    )
  })
})

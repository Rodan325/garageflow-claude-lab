import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(join(process.cwd(), 'supabase/migrations/20260715050000_organization_roles_network.sql'), 'utf8')

describe('organization and network migration safeguards', () => {
  it('preserves legacy roles while adding generic role scopes', () => {
    expect(sql).toContain('add column organization_role text')
    expect(sql).toContain('add column center_role text')
    expect(sql).toContain("member.role in ('owner', 'admin')")
    expect(sql).not.toMatch(/drop\s+(column|table|type)/i)
  })

  it('adds a nullable, organization-safe center reference to appointments', () => {
    expect(sql).toContain('alter table public.appointments add column center_id uuid')
    expect(sql).toContain('appointments_center_garage_fk')
    expect(sql).toContain('references public.garage_centers (id, garage_id)')
  })

  it('protects the aggregate RPC with server-side role checks', () => {
    expect(sql).toContain('can_view_network_dashboard')
    expect(sql).toContain("errcode = '42501'")
    expect(sql).toMatch(/revoke all on function public\.get_network_dashboard[\s\S]+from public, anon/)
    expect(sql).toMatch(/grant execute on function public\.get_network_dashboard[\s\S]+to authenticated/)
  })
})

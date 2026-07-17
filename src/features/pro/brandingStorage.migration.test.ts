import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(
  join(process.cwd(), 'supabase/migrations/20260717131215_harden_branding_storage_and_performance.sql'),
  'utf8',
)

describe('branding storage and advisor hardening migration', () => {
  it('keeps branding public but constrains its content', () => {
    expect(sql).toContain("where id = 'garage-logos'")
    expect(sql).toContain('public = true')
    expect(sql).toContain('file_size_limit = 2097152')
    expect(sql).toContain("array['image/png', 'image/jpeg', 'image/webp']")
    expect(sql).not.toContain('image/svg+xml')
  })

  it('restricts writes to a canonical logo path and manager roles', () => {
    expect(sql).toContain("/logo\\.(png|jpe?g|webp)$")
    expect(sql).toContain("array['owner', 'admin']::text[]")
    expect(sql).toMatch(/alter policy garage_logos_member_update[\s\S]*using \([\s\S]*with check \(/)
    expect(sql).toContain('create policy garage_logos_manager_select')
  })

  it('reserves global quote expiry for the server role', () => {
    expect(sql).toContain('revoke execute on function public.expire_quotes() from public, anon, authenticated')
    expect(sql).toContain('grant execute on function public.expire_quotes() to service_role')
  })

  it('adds foreign-key indexes and initplan-safe auth checks', () => {
    expect(sql.match(/create index if not exists idx_/g)).toHaveLength(32)
    expect(sql).toContain('(select auth.uid())')
    expect(sql).not.toMatch(/= auth\.uid\(\)/)
  })
})

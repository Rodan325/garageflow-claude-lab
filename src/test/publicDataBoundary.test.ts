// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function read(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

const publicData = read('src/data/garagePublic.ts')
const centers = read('src/data/centers.ts')
const catalog = read('src/data/catalog.ts')
const authProvider = read('src/features/auth/AuthProvider.tsx')
const migration = read(
  'supabase/migrations/20260817191516_harden_public_data_boundary.sql',
)
const normalizedMigration = migration.replace(/\s+/g, ' ').trim().toLowerCase()

describe('public data boundary', () => {
  it('uses one atomic feature migration', () => {
    const featureMigrations = readdirSync(resolve(process.cwd(), 'supabase/migrations'))
      .filter((name) => name.includes('public_data_boundary') || name.includes('authenticated_public_catalog_boundary'))

    expect(featureMigrations).toEqual([
      '20260817191516_harden_public_data_boundary.sql',
    ])
    expect(normalizedMigration.startsWith('begin;')).toBe(true)
    expect(normalizedMigration.endsWith('commit;')).toBe(true)
  })

  it('uses explicit minimized projections for every public catalog read', () => {
    expect(publicData).not.toContain(".select('*')")
    expect(publicData).toContain(
      'id,slug,name,phone,website,address,city,postal_code,country,description,specialties,logo_url,accent_color,maps_url',
    )
    expect(publicData).toContain(
      'id,garage_id,name,description,category,duration_minutes,price_from,price_type,is_active,sort_order',
    )
    expect(publicData).toContain('id,garage_id,title,body,image_url,published_at')
    expect(publicData).toContain('id,garage_id,weekday,open_time,close_time,is_closed')

    const publicCenters = centers.slice(0, centers.indexOf('export function useManageCenters'))
    expect(publicCenters).not.toContain(".select('*')")
    expect(publicCenters).toContain(
      'id,garage_id,slug,name,address,city,postal_code,phone,is_active,sort_order',
    )
    expect(centers).not.toContain(".select('*')")
    expect(catalog).not.toContain(".select('*')")
  })

  it('minimizes direct reads for public, anon, and authenticated roles', () => {
    expect(normalizedMigration).toContain('revoke select on table')
    expect(normalizedMigration).toContain('from public, anon, authenticated;')
    expect(normalizedMigration).toContain(
      'legal_name, siret, vat_number, email, is_public, settings, created_at, legal_info',
    )
    expect(normalizedMigration).toContain(
      'created_at, tax_rate, labor_hours, default_lines',
    )
    expect(normalizedMigration).toContain(
      'on table public.garages to anon, authenticated',
    )
    expect(normalizedMigration).toContain(
      'on table public.garage_services to anon, authenticated',
    )
    expect(normalizedMigration).toContain('to service_role;')
  })

  it('binds every anonymous child policy to an active public parent', () => {
    expect(normalizedMigration).toContain('function public.is_public_catalog_garage')
    expect(normalizedMigration).toContain("set search_path = ''")
    expect(normalizedMigration).toContain('garage_centers_select_public_boundary')
    expect(normalizedMigration).toContain('garage_services_select_public_boundary')
    expect(normalizedMigration).toContain('garage_news_select_public_boundary')
    expect(normalizedMigration).toContain('garage_hours_select_public_boundary')
    expect(normalizedMigration).toContain(
      'is_active and public.is_public_catalog_garage(garage_id)',
    )
    expect(normalizedMigration).toContain(
      'is_published and public.is_public_catalog_garage(garage_id)',
    )
  })

  it('does not expose private-schema helpers to anonymous callers', () => {
    expect(normalizedMigration).toContain('revoke usage on schema private from anon')
    expect(normalizedMigration).not.toContain('grant usage on schema private to anon')
    expect(normalizedMigration).not.toContain(
      'create or replace function private.is_public_garage',
    )
    expect(normalizedMigration).not.toContain(
      'grant execute on function private.is_public_garage',
    )
    expect(normalizedMigration).toContain(
      'revoke all on function public.is_public_catalog_garage(uuid) from public, anon, authenticated, service_role',
    )
    expect(normalizedMigration).toContain(
      'grant execute on function public.is_public_catalog_garage(uuid) to anon',
    )
  })

  it('routes full management reads through server-authoritative RPCs', () => {
    expect(normalizedMigration).toContain('function public.get_managed_garage(')
    expect(normalizedMigration).toContain('public.is_garage_member(p_garage_id)')
    expect(normalizedMigration).toContain('function public.get_managed_garage_services(')
    expect(normalizedMigration).toContain("'garage_services.select'")
    expect(normalizedMigration).toContain(
      'revoke all on function public.get_managed_garage(uuid) from public, anon, authenticated, service_role',
    )
    expect(normalizedMigration).toContain(
      'grant execute on function public.get_managed_garage(uuid) to authenticated',
    )
    expect(authProvider).toContain(".rpc('get_managed_garage'")
    expect(catalog).toContain(".rpc('get_managed_garage_services'")
  })
})

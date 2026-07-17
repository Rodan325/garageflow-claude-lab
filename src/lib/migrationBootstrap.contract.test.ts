import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const migrationsDirectory = join(root, 'supabase', 'migrations')
const historicalSeedName = '20260613125843_seed.sql'
const migration0004 = readFileSync(join(migrationsDirectory, historicalSeedName), 'utf8')
const seed = readFileSync(join(root, 'supabase', 'seed.sql'), 'utf8')

function insertStatement(table: string) {
  const match = seed.match(new RegExp(`insert into public\\.${table}\\b[\\s\\S]*?;`, 'i'))
  expect(match, `missing seed statement for ${table}`).not.toBeNull()
  return match?.[0] ?? ''
}

describe('historical seed migration bootstrap', () => {
  it('keeps migration 0004 as a non-mutating historical marker', () => {
    expect(migration0004).toContain('Historical migration marker')
    expect(migration0004).not.toMatch(/\binsert\s+into\b|\bupdate\b|\bdelete\s+from\b/i)
  })

  it('seeds the historical client vehicle with valid fuel and mileage values', () => {
    const vehicle = seed.match(
      /\('e1111111-0000-4000-8000-000000000001',\s*'c0000000-0000-4000-8000-000000000001',\s*'Volkswagen',\s*'Golf 7',\s*(\d+),\s*'([^']+)',\s*(\d+),\s*'IJ-789-KL'\)/,
    )

    expect(vehicle).not.toBeNull()
    expect(vehicle?.[1]).toBe('2017')
    expect(['Diesel', 'Essence', 'Petrol', 'Hybrid', 'Electric']).toContain(vehicle?.[2])
    expect(Number.isInteger(Number(vehicle?.[3]))).toBe(true)
    expect(Number(vehicle?.[3])).toBe(98000)
    expect(seed).not.toMatch(/'Golf 7',\s*2017,\s*98000,\s*'Diesel'/)
  })

  it('keeps moved fixtures deterministic and safe to seed repeatedly', () => {
    const movedTables = [
      'garages',
      'garage_services',
      'garage_news',
      'garage_hours',
      'garage_members',
      'customers',
      'vehicles',
      'tasks',
      'client_vehicles',
    ]

    for (const table of movedTables) {
      expect(insertStatement(table)).toMatch(/on conflict/i)
    }

    const authFixtures = seed.match(
      /with fixture_users\(id, email, full_name, account_type, password\) as \(\s*values([\s\S]*?)\)\s*insert into auth\.users/i,
    )?.[1]
    const emails = [...(authFixtures ?? '').matchAll(/'[^']+'::uuid,\s*'([^']+)'/g)].map(
      (match) => match[1],
    )

    expect(emails).toHaveLength(14)
    expect(new Set(emails).size).toBe(emails.length)
  })

  it('marks trigger-generated seed notifications as simulated', () => {
    const simulationUpdate = seed.match(
      /update public\.notification_outbox[\s\S]*?and provider is null;/i,
    )?.[0]

    expect(simulationUpdate).toBeDefined()
    expect(simulationUpdate).toContain("status = 'simulated'")
    expect(simulationUpdate).toContain("provider = 'demo-simulator'")
    expect(simulationUpdate).toContain("'appointment_confirmed'")
    expect(simulationUpdate).toContain("'approval_required'")
    expect(simulationUpdate).toContain("'vehicle_ready'")
  })

  it('seeds delivery report list fields as renderable strings', () => {
    expect(seed).toContain("'[\"Completed service\"]'")
    expect(seed).toContain("'[\"Routine maintenance\"]'")
    expect(seed).toContain("'[\"Demo filter\"]'")
    expect(seed).not.toMatch(/'\[\{"label":/)
  })

  it('does not make later migrations depend on demonstration fixture IDs', () => {
    const names = readdirSync(migrationsDirectory).sort()
    const after0004 = names
      .slice(names.indexOf(historicalSeedName) + 1)
      .map((name) => readFileSync(join(migrationsDirectory, name), 'utf8'))
      .join('\n')
    const historicalIds = [
      '11111111-1111-4111-8111-111111111111',
      'a0000000-0000-4000-8000-000000000001',
      'c0000000-0000-4000-8000-000000000001',
      'e1111111-0000-4000-8000-000000000001',
    ]

    for (const id of historicalIds) {
      expect(after0004).not.toContain(id)
      expect(seed).toContain(id)
    }

    expect(seed.indexOf("insert into public.garages")).toBeLessThan(
      seed.indexOf("insert into public.garage_centers"),
    )
    expect(seed.indexOf("insert into auth.users")).toBeLessThan(
      seed.indexOf("insert into public.garage_members"),
    )
    expect(seed.indexOf("insert into public.client_vehicles")).toBeLessThan(
      seed.indexOf("insert into public.service_requests"),
    )
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  SPEEDY_STORE_KEY,
  STORE_KEY,
  ensureStoreShape,
  getDemoAccount,
  getDemoOrganizationKind,
  setDemoAccount,
} from './demo'

const root = process.cwd()
const read = (...parts: string[]) => readFileSync(join(root, ...parts), 'utf8')

const capabilityMigrations = [
  '20260715010000_workshop_lifecycle.sql',
  '20260715020000_workshop_recommendations.sql',
  '20260715030000_attachments_notifications.sql',
  '20260715040000_delivery_reports_reminders.sql',
  '20260715050000_organization_roles_network.sql',
  '20260715060000_center_transfers_integrations.sql',
]

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('commercial product contract', () => {
  it('keeps prototype language and technical controls out of presentation screens', () => {
    const visibleSources = [
      read('src', 'features', 'marketing', 'HomePage.tsx'),
      read('src', 'features', 'marketing', 'SolutionsPage.tsx'),
      read('src', 'features', 'auth', 'LoginPage.tsx'),
      read('src', 'components', 'common', 'DemoBanner.tsx'),
    ].join('\n')

    expect(visibleSources).not.toMatch(
      /programme pilote|offre pilote|sans engagement|démo locale|prototype|\bMVP\b|expérimentation|localStorage|réinitialiser les données|quitter la démo/i,
    )
    expect(read('src', 'App.tsx')).toContain('<Route path="/pilote" element={<Navigate to="/solutions" replace />} />')
    expect(read('src', 'features', 'demo', 'BrandDemoEntry.tsx')).toContain("key === 'reset'")
  })

  it('keeps all prepared production capabilities explicitly disabled by default', () => {
    const example = read('.env.example')
    const flags = [
      'VITE_ENABLE_CENTERS',
      'VITE_ENABLE_WORKSHOP_TIMELINE',
      'VITE_ENABLE_RECOMMENDATIONS',
      'VITE_ENABLE_ATTACHMENTS',
      'VITE_ENABLE_NOTIFICATIONS',
      'VITE_ENABLE_DELIVERY_REPORTS',
      'VITE_ENABLE_MAINTENANCE_REMINDERS',
      'VITE_ENABLE_NETWORK_DASHBOARD',
      'VITE_ENABLE_INTEGRATIONS',
    ]

    for (const flag of flags) expect(example).toContain(`${flag}=false`)
  })

  it('lets operational dashboard cards shrink on narrow RTL layouts', () => {
    const dashboard = read('src', 'features', 'pro', 'DashboardPage.tsx')
    expect(dashboard).toContain('<Card className="min-w-0 lg:col-span-2">')
    expect(dashboard).toContain('<Card className="min-w-0">')
  })

  it('keeps Clikarage and white-label stores isolated with identical capabilities', () => {
    expect(STORE_KEY).toBe('gf-demo-store-v6')
    expect(SPEEDY_STORE_KEY).toBe('gf-demo-store-v6-speedy')

    const clikarage = ensureStoreShape('force-reseed', 'default')
    const whiteLabel = ensureStoreShape('force-reseed', 'speedy')
    expect(whiteLabel.services.map((service) => service.name)).toEqual(
      clikarage.services.map((service) => service.name),
    )
    expect(whiteLabel).not.toBe(clikarage)
    expect(whiteLabel.services).not.toBe(clikarage.services)
  })

  it('exposes independent and network presentation profiles without brand coupling', () => {
    setDemoAccount('independent_garage')
    expect([getDemoAccount(), getDemoOrganizationKind()]).toEqual(['independent_garage', 'independent'])

    setDemoAccount('network_garage')
    expect([getDemoAccount(), getDemoOrganizationKind()]).toEqual(['network_garage', 'network'])

    setDemoAccount('network_manager')
    expect([getDemoAccount(), getDemoOrganizationKind()]).toEqual(['network_manager', 'network'])

    setDemoAccount('client')
    expect([getDemoAccount(), getDemoOrganizationKind()]).toEqual(['client', 'independent'])
  })
})

describe('prepared database contract', () => {
  it('keeps capability migrations unique and strictly ordered', () => {
    const names = readdirSync(join(root, 'supabase', 'migrations'))
      .filter((name) => /^202607150\d{5}_.+\.sql$/.test(name))
      .sort()

    expect(names).toEqual(capabilityMigrations)
    const versions = names.map((name) => Number(name.slice(0, 14)))
    expect(new Set(versions).size).toBe(versions.length)
    expect(versions).toEqual([...versions].sort((a, b) => a - b))
  })

  it('keeps every capability migration additive and blocks public writes', () => {
    for (const name of capabilityMigrations) {
      const sql = read('supabase', 'migrations', name)
      expect(sql).not.toMatch(/\bdrop\b|\btruncate\b|delete\s+from|alter\s+table[^;]+\brename\b/i)
      expect(sql).not.toMatch(/grant\s+(?:all|insert|update|delete)[^;]+\bto\s+anon\b/i)
    }
  })

  it('enables RLS on every new table in the public schema', () => {
    for (const name of capabilityMigrations) {
      const sql = read('supabase', 'migrations', name)
      const tables = [...sql.matchAll(/create table public\.([a-z0-9_]+)/gi)].map((match) => match[1])
      for (const table of tables) {
        expect(sql.toLowerCase()).toContain(`alter table public.${table} enable row level security`)
      }
    }
  })
})

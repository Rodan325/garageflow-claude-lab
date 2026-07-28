import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationsDirectory = resolve('supabase/migrations')
const migrationName = /_remove_overbroad_garage_services_visibility\.sql$/

describe('garage service visibility corrective migration', () => {
  it('only removes the legacy garage-scope SELECT policy', () => {
    const matches = readdirSync(migrationsDirectory).filter((file) => migrationName.test(file))
    expect(matches).toHaveLength(1)

    const path = resolve(migrationsDirectory, matches[0])
    expect(existsSync(path)).toBe(true)

    const sql = readFileSync(path, 'utf8')
      .replace(/\r\n?/g, '\n')
      .trim()

    expect(sql).toBe(
      'drop policy if exists garage_services_visible_garage_scope\n'
      + '  on public.garage_services;',
    )
  })
})

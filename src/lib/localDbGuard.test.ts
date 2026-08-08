import { describe, expect, it, vi } from 'vitest'
// @ts-expect-error -- plain ESM helpers shared with the npm scripts
import { assertLocalPostgresUrl, LOOPBACK_HOSTS } from '../../scripts/rls-target-guard.mjs'
// @ts-expect-error -- plain ESM helper
import { buildChildEnv, run } from '../../scripts/seed-local.mjs'

/**
 * The seeding workflow creates an organization_owner. Naming the npm script
 * "local" is not a safeguard, so the target is parsed and rejected before psql
 * is ever spawned. These tests use a fake spawn: nothing connects anywhere.
 */

const LOCAL = 'postgresql://postgres:pw@127.0.0.1:54322/postgres'

describe('local database guard — accepted targets', () => {
  const accepted: Array<[string, string]> = [
    ['localhost', 'postgresql://postgres:pw@localhost:54322/postgres'],
    ['127.0.0.1', LOCAL],
    ['IPv6 loopback', 'postgresql://postgres:pw@[::1]:54322/postgres'],
    ['the postgres: scheme', 'postgres://postgres:pw@127.0.0.1:54322/postgres'],
    ['a non-default port', 'postgresql://postgres:pw@127.0.0.1:5433/postgres'],
    ['no credentials in the URL', 'postgresql://127.0.0.1:54322/postgres'],
  ]

  it.each(accepted)('accepts %s', (_label, url) => {
    const target = assertLocalPostgresUrl(url) as { host: string; port: string; database: string }
    expect(LOOPBACK_HOSTS.has(target.host)).toBe(true)
    expect(target.database).toBe('postgres')
    expect(target.port).toMatch(/^\d+$/)
  })
})

describe('local database guard — refused targets', () => {
  const refused: Array<[string, string | undefined]> = [
    ['a missing variable', undefined],
    ['an empty string', ''],
    ['whitespace only', '   '],
    ['a malformed URL', 'not-a-url'],
    ['a non-PostgreSQL scheme', 'https://127.0.0.1:54322/postgres'],
    ['a Supabase hostname', 'postgresql://postgres:pw@db.abcdefghijklm.supabase.co:5432/postgres'],
    ['a pooler hostname', 'postgresql://postgres.ref@aws-0-eu-west-3.pooler.supabase.com:5432/postgres'],
    ['a public IP', 'postgresql://postgres:pw@203.0.113.10:5432/postgres'],
    ['a private but non-loopback IP', 'postgresql://postgres:pw@192.168.1.10:5432/postgres'],
    ['a link-local IP', 'postgresql://postgres:pw@169.254.10.10:5432/postgres'],
    ['localhost as a subdomain prefix', 'postgresql://postgres:pw@localhost.evil.example:5432/postgres'],
    ['127.0.0.1 as a subdomain prefix', 'postgresql://postgres:pw@127.0.0.1.evil.example:5432/postgres'],
    ['a host that merely contains localhost', 'postgresql://postgres:pw@notlocalhost:5432/postgres'],
    ['userinfo shaped like a local host', 'postgresql://127.0.0.1@evil.example:5432/postgres'],
    ['an embedded newline', 'postgresql://postgres:pw@127.0.0.1:54322/postgres\nDROP'],
    ['no port', 'postgresql://postgres:pw@127.0.0.1/postgres'],
    ['a non-numeric port', 'postgresql://postgres:pw@127.0.0.1:abc/postgres'],
    ['no database name', 'postgresql://postgres:pw@127.0.0.1:54322/'],
  ]

  it.each(refused)('refuses %s', (_label, url) => {
    expect(() => assertLocalPostgresUrl(url)).toThrow()
  })

  it.each(refused)('never spawns psql for %s', (_label, url) => {
    const spawn = vi.fn()
    expect(() => run({ env: { SUPABASE_LOCAL_DB_URL: url } as never, spawn })).toThrow()
    expect(spawn).not.toHaveBeenCalled()
  })

  it('never echoes the URL or the password in the message', () => {
    const url = 'postgresql://postgres:hunter2secretvalue@db.abcdefghijklm.supabase.co:5432/postgres'
    try {
      assertLocalPostgresUrl(url)
      throw new Error('should have thrown')
    } catch (error) {
      const message = (error as Error).message
      expect(message).not.toContain('hunter2secretvalue')
      expect(message).not.toContain('supabase.co')
      expect(message).not.toContain(url)
      expect(message).toMatch(/loopback/i)
    }
  })
})

describe('local database guard — how psql is invoked', () => {
  it('passes connection details through the environment, not argv', () => {
    const spawn = vi.fn().mockReturnValue({ status: 0 })
    const status = run({
      env: { SUPABASE_LOCAL_DB_URL: LOCAL, SEED_FIXTURE_PASSWORD: 'kept-for-the-child' } as never,
      spawn,
    })

    expect(status).toBe(0)
    const [command, args, options] = spawn.mock.calls[0]
    expect(command).toBe('psql')
    expect(options.shell).toBe(false)
    // No connection string, no password, anywhere in argv.
    const argv = [command, ...args].join(' ')
    expect(argv).not.toContain('postgresql://')
    expect(argv).not.toContain('pw')
    expect(args).toContain('ON_ERROR_STOP=1')

    expect(options.env.PGHOST).toBe('127.0.0.1')
    expect(options.env.PGPORT).toBe('54322')
    expect(options.env.PGDATABASE).toBe('postgres')
    expect(options.env.PGUSER).toBe('postgres')
    // The parsed URL is not handed down; the fixture password is.
    expect(options.env.SUPABASE_LOCAL_DB_URL).toBeUndefined()
    expect(options.env.SEED_FIXTURE_PASSWORD).toBe('kept-for-the-child')
  })

  it('drops PGPASSWORD when the URL carries no password', () => {
    const env = buildChildEnv(
      { PGPASSWORD: 'inherited' },
      { host: '127.0.0.1', port: '54322', database: 'postgres', user: 'postgres', password: '' },
    ) as Record<string, string | undefined>
    expect(env.PGPASSWORD).toBeUndefined()
  })

  it('propagates the exit code of psql', () => {
    const spawn = vi.fn().mockReturnValue({ status: 3 })
    expect(run({ env: { SUPABASE_LOCAL_DB_URL: LOCAL } as never, spawn })).toBe(3)
  })

  it('explains what to do when psql is missing', () => {
    const spawn = vi.fn().mockReturnValue({ error: Object.assign(new Error('spawn psql ENOENT'), { code: 'ENOENT' }) })
    expect(() => run({ env: { SUPABASE_LOCAL_DB_URL: LOCAL } as never, spawn })).toThrow(/WSL|PostgreSQL client/i)
  })

  it('reports a child terminated by a signal', () => {
    const spawn = vi.fn().mockReturnValue({ status: null, signal: 'SIGINT' })
    expect(() => run({ env: { SUPABASE_LOCAL_DB_URL: LOCAL } as never, spawn })).toThrow(/SIGINT/)
  })
})

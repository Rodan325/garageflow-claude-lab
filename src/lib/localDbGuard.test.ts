import { describe, expect, it, vi } from 'vitest'
// @ts-expect-error -- plain ESM helpers shared with the npm scripts
import { assertLocalPostgresUrl, LOOPBACK_HOSTS } from '../../scripts/rls-target-guard.mjs'
// @ts-expect-error -- plain ESM helper shared with local runners
import { findLocalSupabaseDatabase } from '../../scripts/local-supabase-docker.mjs'
// @ts-expect-error -- plain ESM helper
import { buildAtomicSeedSql, buildChildEnv, loadLocalSeedTarget, run } from '../../scripts/seed-local.mjs'

const LOCAL = 'postgresql://postgres:db-secret@127.0.0.1:54322/postgres'
const LOCAL_METADATA = [
  'VITE_SUPABASE_URL=http://127.0.0.1:54321',
  `SUPABASE_LOCAL_DB_URL=${LOCAL}`,
  '',
].join('\n')

function inspection(overrides: Record<string, unknown> = {}) {
  return {
    Id: 'local-db-id',
    Config: { Labels: { 'com.supabase.cli.project': 'garageflow-claude-lab' } },
    State: { Running: true, Health: { Status: 'healthy' } },
    NetworkSettings: {
      Ports: {
        '5432/tcp': [
          { HostIp: '0.0.0.0', HostPort: '54322' },
          { HostIp: '::', HostPort: '54322' },
        ],
      },
    },
    ...overrides,
  }
}

function dockerInspectionSpawn({
  names = ['supabase_db_garageflow-claude-lab'],
  inspected = inspection(),
} = {}) {
  return vi.fn((_command: string, args: string[]) => {
    if (args[0] === 'ps') {
      return { status: 0, stdout: `${names.join('\n')}\n`, stderr: '' }
    }
    if (args[0] === 'inspect') {
      return { status: 0, stdout: JSON.stringify(inspected), stderr: '' }
    }
    throw new Error(`unexpected Docker operation: ${args[0]}`)
  })
}

function fixtureRead(path: string) {
  const normalized = path.replace(/\\/g, '/')
  if (normalized.endsWith('/.env.local')) return LOCAL_METADATA
  if (normalized.endsWith('/supabase/seed.sql')) return "select 'baseline seed';"
  if (normalized.endsWith('/scripts/rls-fixtures.sql')) return "select 'RLS fixtures';"
  throw new Error(`unexpected read: ${normalized}`)
}

describe('local database URL guard', () => {
  it.each([
    ['localhost', 'postgresql://postgres:pw@localhost:54322/postgres'],
    ['127.0.0.1', LOCAL],
    ['IPv6 loopback', 'postgresql://postgres:pw@[::1]:54322/postgres'],
    ['the postgres scheme', 'postgres://postgres:pw@127.0.0.1:54322/postgres'],
  ])('accepts %s', (_label, url) => {
    const target = assertLocalPostgresUrl(url) as { host: string; port: string; database: string }
    expect(LOOPBACK_HOSTS.has(target.host)).toBe(true)
  })

  it.each([
    ['a missing variable', undefined],
    ['a malformed URL', 'not-a-url'],
    ['a non-PostgreSQL scheme', 'https://127.0.0.1:54322/postgres'],
    ['a hosted Supabase database', 'postgresql://postgres:pw@db.example.supabase.co:5432/postgres'],
    ['a private network address', 'postgresql://postgres:pw@192.168.1.10:54322/postgres'],
    ['a deceptive localhost suffix', 'postgresql://postgres:pw@localhost.evil.example:54322/postgres'],
    ['an embedded newline', 'postgresql://postgres:pw@127.0.0.1:54322/postgres\nDROP'],
    ['no explicit port', 'postgresql://postgres:pw@127.0.0.1/postgres'],
    ['no database', 'postgresql://postgres:pw@127.0.0.1:54322/'],
  ])('refuses %s', (_label, url) => {
    expect(() => assertLocalPostgresUrl(url)).toThrow()
  })

  it('enforces the seed-specific port and database', () => {
    const options = { expectedPort: '54322', expectedDatabase: 'postgres' }
    expect(() => assertLocalPostgresUrl(
      'postgresql://127.0.0.1:54323/postgres',
      'SUPABASE_LOCAL_DB_URL',
      options,
    )).toThrow(/54322/)
    expect(() => assertLocalPostgresUrl(
      'postgresql://127.0.0.1:54322/other',
      'SUPABASE_LOCAL_DB_URL',
      options,
    )).toThrow(/database postgres/)
    expect(assertLocalPostgresUrl(LOCAL, 'SUPABASE_LOCAL_DB_URL', options).port).toBe('54322')
  })

  it('does not expose a refused URL or password', () => {
    const url = 'postgresql://postgres:hunter2secret@db.example.supabase.co:5432/postgres'
    expect(() => assertLocalPostgresUrl(url)).toThrowError(
      expect.not.objectContaining({ message: expect.stringContaining('hunter2secret') }),
    )
    try {
      assertLocalPostgresUrl(url)
    } catch (error) {
      expect((error as Error).message).not.toContain(url)
      expect((error as Error).message).not.toContain('supabase.co')
    }
  })
})

describe('exact local Supabase Docker database guard', () => {
  const strict = {
    projectId: 'garageflow-claude-lab',
    expectedHostPort: '54322',
    requireHealthy: true,
  }

  it('accepts the exact running healthy project database and mapping', () => {
    const spawn = dockerInspectionSpawn()
    const database = findLocalSupabaseDatabase({ ...strict, spawn })
    expect(database.containerName).toBe('supabase_db_garageflow-claude-lab')
    expect(database.containerPort).toBe('5432')
    expect(spawn).toHaveBeenCalledTimes(2)
  })

  it('refuses zero or multiple matching database containers', () => {
    expect(() => findLocalSupabaseDatabase({
      ...strict,
      spawn: dockerInspectionSpawn({ names: [] }),
    })).toThrow(/found 0/)
    expect(() => findLocalSupabaseDatabase({
      ...strict,
      spawn: dockerInspectionSpawn({ names: ['supabase_db_one', 'supabase_db_two'] }),
    })).toThrow(/found 2/)
  })

  it('refuses a mismatched project label', () => {
    const inspected = inspection({
      Config: { Labels: { 'com.supabase.cli.project': 'rls-pilot-audit' } },
    })
    expect(() => findLocalSupabaseDatabase({
      ...strict,
      spawn: dockerInspectionSpawn({ inspected }),
    })).toThrow(/wrong Supabase project label/)
  })

  it('refuses a stopped or unhealthy database', () => {
    expect(() => findLocalSupabaseDatabase({
      ...strict,
      spawn: dockerInspectionSpawn({
        inspected: inspection({ State: { Running: false, Health: { Status: 'healthy' } } }),
      }),
    })).toThrow(/not running/)
    expect(() => findLocalSupabaseDatabase({
      ...strict,
      spawn: dockerInspectionSpawn({
        inspected: inspection({ State: { Running: true, Health: { Status: 'unhealthy' } } }),
      }),
    })).toThrow(/not healthy/)
  })

  it('refuses a missing, wrong, or ambiguous host-port mapping', () => {
    expect(() => findLocalSupabaseDatabase({
      ...strict,
      spawn: dockerInspectionSpawn({
        inspected: inspection({ NetworkSettings: { Ports: { '5432/tcp': null } } }),
      }),
    })).toThrow(/does not publish/)
    expect(() => findLocalSupabaseDatabase({
      ...strict,
      spawn: dockerInspectionSpawn({
        inspected: inspection({
          NetworkSettings: { Ports: { '5432/tcp': [{ HostPort: '54323' }] } },
        }),
      }),
    })).toThrow(/54322 -> 5432/)
    expect(() => findLocalSupabaseDatabase({
      ...strict,
      spawn: dockerInspectionSpawn({
        inspected: inspection({
          NetworkSettings: {
            Ports: { '5432/tcp': [{ HostPort: '54322' }, { HostPort: '54323' }] },
          },
        }),
      }),
    })).toThrow(/54322 -> 5432/)
  })
})

describe('baseline target provenance and process safety', () => {
  it('loads only the established loopback API and exact local DB metadata', () => {
    const target = loadLocalSeedTarget({ readFile: fixtureRead as never })
    expect(target).toMatchObject({ host: '127.0.0.1', port: '54322', database: 'postgres' })
  })

  it('refuses a shared fixture password before Docker or SQL', () => {
    const spawn = vi.fn()
    const readFile = vi.fn()
    expect(() => run({
      env: { [['SEED_FIXTURE_', 'PASSWORD'].join('')]: 'must-not-be-used' } as never,
      spawn,
      readFile,
    })).toThrow(/not accepted/)
    expect(spawn).not.toHaveBeenCalled()
    expect(readFile).not.toHaveBeenCalled()
  })

  it('streams one atomic SQL unit through verified container psql', () => {
    const spawn = vi.fn().mockReturnValue({ status: 0, stdout: '', stderr: '' })
    const findDatabase = vi.fn().mockReturnValue({
      containerName: 'supabase_db_garageflow-claude-lab',
    })
    const env = {
      SUPABASE_LOCAL_DB_URL: 'postgresql://remote:remote@remote.example:5432/remote',
      VITE_SUPABASE_URL: 'https://remote.example',
      PGSERVICE: 'production',
      PGHOSTADDR: '203.0.113.10',
      [['PG', 'PASSWORD'].join('')]: ['inherited', 'value'].join('-'),
      PATH: 'kept',
    }

    expect(run({
      env: env as never,
      spawn,
      readFile: fixtureRead as never,
      findDatabase,
    })).toBe(0)

    expect(findDatabase).toHaveBeenCalledWith(expect.objectContaining({
      projectId: 'garageflow-claude-lab',
      expectedHostPort: '54322',
      requireHealthy: true,
    }))
    const [command, args, options] = spawn.mock.calls[0]
    expect(command).toBe('docker')
    expect(args).toEqual([
      'exec',
      '-i',
      'supabase_db_garageflow-claude-lab',
      'psql',
      '-X',
      '-v',
      'ON_ERROR_STOP=1',
      '-U',
      'postgres',
      '-d',
      'postgres',
    ])
    const argv = [command, ...args].join(' ')
    expect(argv).not.toContain('postgresql://')
    expect(argv).not.toContain('db-secret')
    expect(argv).not.toContain('inherited-secret')
    expect(options.input).toMatch(/^\\set ON_ERROR_STOP on\nbegin;/)
    expect(options.input.indexOf("select 'baseline seed';")).toBeLessThan(
      options.input.indexOf("select 'RLS fixtures';"),
    )
    expect(options.input.trimEnd()).toMatch(/commit;$/)
    expect(options.env.PGSERVICE).toBeUndefined()
    expect(options.env.PGHOSTADDR).toBeUndefined()
    expect(options.env.PGPASSWORD).toBeUndefined()
    expect(options.env.SUPABASE_LOCAL_DB_URL).toBeUndefined()
    expect(options.env.VITE_SUPABASE_URL).toBeUndefined()
    expect(options.env.PATH).toBe('kept')
  })

  it('constructs failure-prone second-component SQL inside the same transaction', () => {
    const sql = buildAtomicSeedSql(
      'create temporary table synthetic_first(value integer);',
      "insert into synthetic_first values (1); raise exception 'synthetic failure';",
    )
    expect(sql.match(/^begin;$/gim)).toHaveLength(1)
    expect(sql.match(/^commit;$/gim)).toHaveLength(1)
    expect(sql.indexOf('begin;')).toBeLessThan(sql.indexOf('create temporary table'))
    expect(sql.indexOf('raise exception')).toBeLessThan(sql.lastIndexOf('commit;'))
    expect(sql).toContain('\\set ON_ERROR_STOP on')
  })

  it('rejects nested transaction control in either seed component', () => {
    expect(() => buildAtomicSeedSql('begin; select 1;', 'select 2;')).toThrow(/transaction control/)
    expect(() => buildAtomicSeedSql('select 1;', 'rollback;')).toThrow(/transaction control/)
  })

  it('removes every inherited PostgreSQL and target secret from the Docker child', () => {
    const child = buildChildEnv({
      PGHOST: 'remote',
      pgservice: 'production',
      [['PG', 'PASSWORD'].join('')]: ['local', 'placeholder'].join('-'),
      SUPABASE_LOCAL_DB_URL: LOCAL,
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_ANON_KEY: 'not-forwarded',
      SUPABASE_SERVICE_ROLE_KEY: ['not', 'forwarded'].join('-'),
      [['SEED_FIXTURE_', 'PASSWORD'].join('')]: 'not-forwarded',
      PATH: 'kept',
    }) as Record<string, string | undefined>
    expect(Object.keys(child).filter((key) => /^PG/i.test(key))).toEqual([])
    expect(child.SUPABASE_LOCAL_DB_URL).toBeUndefined()
    expect(child.VITE_SUPABASE_URL).toBeUndefined()
    expect(child.VITE_SUPABASE_ANON_KEY).toBeUndefined()
    expect(child.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined()
    expect(child.SEED_FIXTURE_PASSWORD).toBeUndefined()
    expect(child.PATH).toBe('kept')
  })
})

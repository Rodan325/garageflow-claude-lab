import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error -- plain ESM helper shared with scripts/security-scan.mjs
import { findCredentialIssues, looksBinary, trackedTextFiles } from '../../scripts/credential-patterns.mjs'
import {
  buildFixtureRekeySql,
  fixtureCredentials,
  RLS_FIXTURE_ACCOUNTS,
  validateFixtureRekeyPassword,
// @ts-expect-error -- plain ESM fixture contract shared with Node RLS scripts
} from '../../scripts/rls-fixture-accounts.mjs'

/**
 * The fixture password must never come back into the repository, and the
 * baseline workflow must reject a usable shared password. The authenticated
 * RLS suites may read an ephemeral value later, but no tracked file may persist
 * it or put it in a command line.
 *
 * The sweep below walks every tracked file rather than a list someone has to
 * remember to extend — a credential added to a brand-new file is exactly the
 * regression this is here to stop.
 */

const TRACKED: string[] = trackedTextFiles()

function textOf(rel: string): string | null {
  let raw: Buffer
  try {
    raw = readFileSync(resolve(rel))
  } catch {
    return null
  }
  if (looksBinary(raw)) return null
  return raw.toString('utf8')
}

/** Files that document the local password workflow. */
const WORKFLOW_FILES = [
  'supabase/seed.sql',
  'scripts/rls-fixtures.sql',
  'scripts/seed-local.sql',
  'scripts/rls-fixture-accounts.mjs',
  'scripts/rls-fixture-admin.mjs',
  'scripts/rls-antileak.mjs',
  'scripts/legal-v2-rls.mjs',
] as const

describe('no credential anywhere in the tracked tree', () => {
  it('sweeps a realistic number of files', () => {
    expect(TRACKED.length).toBeGreaterThan(100)
    expect(TRACKED).toContain('supabase/seed.sql')
  })

  it('finds no hardcoded credential in any tracked file', () => {
    const findings: Array<{ rel: string; line: number; name: string }> = []
    for (const rel of TRACKED) {
      const text = textOf(rel)
      if (text === null) continue
      findings.push(...findCredentialIssues(rel, text))
    }
    // Locations only — the values are never surfaced.
    expect(findings.map((f) => `${f.rel}:${f.line} — ${f.name}`)).toEqual([])
  })

  it('also scans the new canonical fixture module before it is tracked', () => {
    const rel = 'scripts/rls-fixture-accounts.mjs'
    const source = textOf(rel)
    expect(source).not.toBeNull()
    expect(findCredentialIssues(rel, source ?? '')).toEqual([])
  })

  it('never exports the fixture password into the shell', () => {
    for (const rel of TRACKED) {
      const text = textOf(rel)
      if (text === null) continue
      expect(text, rel).not.toMatch(/\bexport\s+SEED_FIXTURE_PASSWORD\b/)
    }
  })

  it('no longer names the retired fixture account outside its own guard', () => {
    // Both contract tests assert the address is gone, so they must name it.
    const guards = new Set([
      'src/lib/fixtureUuidCollisions.contract.test.ts',
      'src/lib/fixtureCredentialHandling.contract.test.ts',
    ])
    const offenders = TRACKED.filter((rel) => {
      if (guards.has(rel)) return false
      const text = textOf(rel)
      return text !== null && text.includes('ownerb@demo-garage.fr')
    })
    expect(offenders).toEqual([])
  })
})

describe('the documented workflow keeps its shape', () => {
  const read = (rel: string) => textOf(rel) ?? ''

  it('disables direct SQL wrapper execution and never uses PGOPTIONS', () => {
    const wrapper = read('scripts/seed-local.sql')
    expect(wrapper).toContain('Direct seed-local.sql execution is disabled')
    expect(wrapper).toContain('\\quit 3')
    expect(wrapper).not.toContain('\\getenv')
    expect(wrapper).not.toContain('\\ir ')
    for (const rel of WORKFLOW_FILES) {
      expect(read(rel), rel).not.toMatch(/PGOPTIONS\s*=\s*"/)
    }
  })

  it('keeps the baseline random-only and streams SQL without temporary files', () => {
    const runner = read('scripts/seed-local.mjs')
    expect(runner).toContain('SEED_FIXTURE_PASSWORD is not accepted')
    expect(runner).toContain("'docker'")
    expect(runner).toContain("'exec'")
    expect(runner).toContain('input: sql')
    expect(runner).not.toMatch(/writeFile|mkdtemp|tmpdir/)
    expect(runner).not.toMatch(/SEED_FIXTURE_PASSWORD[^\n]*args/i)

    for (const rel of ['supabase/seed.sql', 'scripts/rls-fixtures.sql']) {
      const sql = read(rel)
      expect(sql).toContain("current_setting('seed.fixture_password', true)")
      expect(sql).toContain('gen_random_bytes')
    }
  })

  it('reads the value from the environment in the harness', () => {
    for (const rel of ['scripts/rls-antileak.mjs', 'scripts/legal-v2-rls.mjs']) {
      expect(read(rel), rel).toContain('process.env.SEED_FIXTURE_PASSWORD')
    }
  })

  it('states that replaying the files rotates nothing', () => {
    for (const rel of ['supabase/seed.sql', 'scripts/rls-fixtures.sql']) {
      const text = read(rel)
      expect(text, rel).toMatch(/NOT A ROTATION MECHANISM|not a rotation mechanism/i)
      expect(text, rel).toContain('supabase db reset --local')
      expect(text, rel).not.toContain('Safe to re-run')
      // …and warns at run time rather than only in a comment.
      expect(text, rel).toMatch(/raise warning/i)
    }
  })

  it('documents that baseline creation does not create a shared login', () => {
    const seed = read('supabase/seed.sql')
    expect(seed).toMatch(/rejects SEED_FIXTURE_PASSWORD/i)
    expect(seed).toMatch(/separate, explicit workflow/i)
    expect(seed).not.toMatch(/SEED_FIXTURE_PASSWORD=.*npm run db:seed:local/i)
  })
})

describe('the explicit local fixture rekey contract', () => {
  const admin = textOf('scripts/rls-fixture-admin.mjs') ?? ''
  const runner = textOf('scripts/run-rls-tests.mjs') ?? ''
  const SENTINEL = 'Synthetic-Rekey-Only-Value'

  it('accepts a synthetic in-memory password without persisting or reporting it', () => {
    expect(validateFixtureRekeyPassword(SENTINEL)).toBe(SENTINEL)
    const credentials = fixtureCredentials(SENTINEL) as Record<string, readonly [string, string]>
    expect(Object.values(credentials).every((entry) => entry[1] === SENTINEL)).toBe(true)
    expect(textOf('scripts/rls-fixture-accounts.mjs')).not.toContain(SENTINEL)
    expect(admin).not.toContain(SENTINEL)
  })

  it('rejects missing, short, and control-character passwords without echoing them', () => {
    for (const invalid of [undefined, '', 'short', 'valid-but\nmultiline']) {
      try {
        validateFixtureRekeyPassword(invalid)
        throw new Error('validation unexpectedly succeeded')
      } catch (error) {
        if (String(invalid).length > 0) {
          expect(String((error as Error).message)).not.toContain(String(invalid))
        }
      }
    }
  })

  it('builds one exact, atomic encrypted-password-only update', () => {
    const sql = buildFixtureRekeySql(SENTINEL)
    expect(sql).toContain(SENTINEL)
    expect(sql).toMatch(/begin;[\s\S]*commit;/i)
    expect(sql.indexOf('canonical fixture user is missing or mismatched'))
      .toBeLessThan(sql.indexOf('update auth.users'))
    expect(sql.indexOf('canonical fixture identity is missing or mismatched'))
      .toBeLessThan(sql.indexOf('update auth.users'))
    expect(sql).toContain('\\copy pg_temp.fixture_rekey_secret (password) from stdin with (format csv)')
    const sqlLines = sql.split(/\r?\n/)
    const copyLine = sqlLines.indexOf('\\copy pg_temp.fixture_rekey_secret (password) from stdin with (format csv)')
    expect(sqlLines[copyLine + 1]).toBe(`"${SENTINEL}"`)
    expect(sql.match(new RegExp(SENTINEL, 'g'))).toHaveLength(1)
    expect(sql).not.toContain('set_config(')
    expect(sql).not.toContain("current_setting('seed.fixture_password'")
    expect(sql.match(/\bupdate\s+auth\.users\b/gi)).toHaveLength(1)
    expect(sql).toMatch(/set encrypted_password\s*=/i)
    expect(sql).not.toMatch(/\bupdate\s+public\./i)
    expect(sql).not.toMatch(/\b(?:insert|delete)\s+(?:into|from)\s+auth\.users/i)
    expect(sql).not.toMatch(/\b(?:garages|garage_members|profiles|service_requests)\b/i)
    expect(sql).toContain('FIXTURE_TARGET_COUNT=')
    expect(sql).toContain('FIXTURE_REKEY_COUNT=')
    expect(sql).toContain(`<> ${RLS_FIXTURE_ACCOUNTS.length}`)
    expect(sql).toContain('NON_FIXTURE_AUTH_ROWS_CHANGED=0')
    for (const fixture of RLS_FIXTURE_ACCOUNTS) {
      expect(sql.match(new RegExp(fixture.id, 'g'))).toHaveLength(1)
    }
    expect(sql).not.toContain('ffffffff-ffff-4fff-8fff-ffffffffffff')
  })

  it('fails before commit for missing, mismatched, skipped, or unexpected targets', () => {
    const sql = buildFixtureRekeySql(SENTINEL)
    const updateAt = sql.indexOf('update auth.users')
    const commitAt = sql.lastIndexOf('commit;')

    expect(sql).toMatch(/left join auth\.users[\s\S]*fixture_user\.id is null/i)
    expect(sql).toMatch(/fixture_user\.email is distinct from target\.email/i)
    expect(sql).toMatch(/count\(\*\)[\s\S]*auth\.identities[\s\S]*<> 1/i)
    expect(sql).toMatch(/identity\.provider = 'email'/i)
    expect(sql).toMatch(/identity\.identity_data ->> 'email' = target\.email/i)
    expect(sql).toMatch(/where fixture_user\.id = target\.id/i)
    expect(sql).toMatch(/fixture rekey secret transport failed/i)
    expect(sql).toMatch(/fixture rekey affected count mismatch/i)
    expect(sql).toMatch(/fixture rekey changed a non-canonical user/i)
    expect(sql).toMatch(/fixture rekey skipped a canonical user/i)
    expect(updateAt).toBeGreaterThan(0)
    expect(commitAt).toBeGreaterThan(updateAt)
    expect(sql.slice(updateAt, commitAt)).toContain(`<> ${RLS_FIXTURE_ACCOUNTS.length}`)
  })

  it('reuses the exact local Docker and PostgreSQL guards before building SQL', () => {
    const start = admin.indexOf('function executeLocalRekey()')
    const rekey = admin.slice(start, admin.indexOf("\nif (action === 'rekey')", start))
    expect(rekey).toContain("targetMode !== 'local'")
    expect(rekey).toContain("assertSupabaseTestTarget(process.env.VITE_SUPABASE_URL, { mode: 'local' })")
    expect(rekey).toContain('assertLocalPostgresUrl(process.env.SUPABASE_LOCAL_DB_URL')
    expect(rekey).toContain('expectedPort: LOCAL_SUPABASE_DB_PORT')
    expect(rekey).toContain("expectedDatabase: 'postgres'")
    expect(rekey).toContain('projectId: LOCAL_SUPABASE_PROJECT_ID')
    expect(rekey).toContain('expectedHostPort: LOCAL_SUPABASE_DB_PORT')
    expect(rekey).toContain('requireHealthy: true')
    expect(rekey.indexOf('findLocalSupabaseDatabase({'))
      .toBeLessThan(rekey.indexOf('buildFixtureRekeySql(password)'))
  })

  it('keeps the password out of argv, child environment, files, and raw logs', () => {
    const start = admin.indexOf('function executeLocalRekey()')
    const rekey = admin.slice(start, admin.indexOf("\nif (action === 'rekey')", start))
    const args = rekey.match(/spawnSync\(\s*'docker',\s*(\[[\s\S]*?\]),\s*\{/)?.[1] ?? ''
    expect(args).toContain("'exec', '-i', database.containerName")
    expect(args).not.toContain('password')
    expect(args).not.toContain('SEED_FIXTURE_PASSWORD')
    expect(rekey).toContain('input: sql')
    expect(rekey).toContain('env: rekeyChildEnvironment(process.env)')
    expect(admin).toContain('SEED_FIXTURE_PASSWORD$')
    expect(rekey).not.toContain('writeFileSync')
    expect(rekey).not.toContain('tmpdir()')
    expect(rekey).not.toMatch(/console\.(?:log|error)\(postgres\.(?:stdout|stderr)/)
    expect(rekey).not.toMatch(/throw new Error\(postgres\.(?:stdout|stderr)/)
  })

  it('leaves prepare and cleanup independent from password rekeying', () => {
    expect(admin).toContain("['prepare', 'cleanup', 'rekey']")
    expect(admin).toContain("if (action === 'rekey')")
    expect(runner).toContain("runNodeScript(fixtureHelper, ['prepare'])")
    expect(runner).toContain("runNodeScript(fixtureHelper, ['cleanup'])")
    expect(runner).not.toContain("runNodeScript(fixtureHelper, ['rekey'])")
    const cleanup = admin.slice(admin.indexOf('const cleanupSql'), admin.indexOf('const prepareLegalSql'))
    expect(cleanup).not.toContain('auth.users')
    expect(cleanup).not.toContain('encrypted_password')
  })
})

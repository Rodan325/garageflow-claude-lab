import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The fixture password must never come back into the repository, and the
 * documented way of supplying one locally must stay narrow: no `export`, which
 * would leave the value in the parent shell and hand it to every later process,
 * and nothing that puts it in a command line.
 *
 * These files are the ones that talk about the password.
 */
const SOURCES = [
  'supabase/seed.sql',
  'scripts/rls-fixtures.sql',
  'scripts/rls-antileak.mjs',
  'scripts/legal-v2-rls.mjs',
].map((path) => [path, readFileSync(resolve(path), 'utf8')] as const)

describe('fixture credential handling', () => {
  it.each(SOURCES)('%s never exports the password into the shell', (_path, sql) => {
    expect(sql).not.toMatch(/\bexport\s+SEED_FIXTURE_PASSWORD\b/)
  })

  it.each(SOURCES)('%s never hands a literal to crypt()', (_path, sql) => {
    expect(sql).not.toMatch(/crypt\(\s*['"]/i)
  })

  it.each(SOURCES)('%s declares no literal PASSWORD constant', (_path, sql) => {
    // `const PASSWORD = process.env.…` is the supported form.
    expect(sql).not.toMatch(/\b(?:const|let|var)\s+PASSWORD\s*=\s*['"]/i)
  })

  it.each(SOURCES)('%s never puts the password in a command line', (_path, sql) => {
    // psql -c "set seed.fixture_password = '…'" lands in argv.
    expect(sql).not.toMatch(/-c\s+["']?\s*set\s+seed\.fixture_password/i)
    // Any assignment of the parameter must read a shell variable, never a literal.
    for (const [assignment] of sql.matchAll(/seed\.fixture_password=(\S*)/g)) {
      expect(assignment).toMatch(/seed\.fixture_password=\$/)
    }
  })

  it.each(SOURCES)('%s no longer names the retired fixture account', (_path, sql) => {
    expect(sql).not.toContain('ownerb@demo-garage.fr')
  })

  it('still allows the supported forms', () => {
    const [seed, fixtures, antileak, legal] = SOURCES.map(([, sql]) => sql)
    // Reading the value from the environment inside the harness.
    expect(antileak).toContain('process.env.SEED_FIXTURE_PASSWORD')
    expect(legal).toContain('process.env.SEED_FIXTURE_PASSWORD')
    // A per-command assignment, which does not survive into the parent shell.
    expect(antileak).toContain('SEED_FIXTURE_PASSWORD="$fixture_pw" npm run test:rls')
    expect(seed).toContain('SEED_FIXTURE_PASSWORD="$fixture_pw" npm run test:rls')
    // PGOPTIONS carrying a shell variable, not a literal.
    for (const sql of [seed, fixtures, antileak, legal]) {
      expect(sql).toContain('PGOPTIONS="-c seed.fixture_password=$fixture_pw"')
    }
    // And the cleanup the reader is told to run.
    expect(seed).toContain('unset fixture_pw')
    expect(fixtures).toContain('unset fixture_pw')
  })

  it('states the residual exposure instead of claiming invisibility', () => {
    const [seed] = SOURCES.map(([, sql]) => sql)
    expect(seed).toMatch(/not\s+invisible/i)
    expect(seed).toMatch(/environment/i)
    // No absolute claim that ps cannot see it.
    expect(seed).not.toMatch(/never reaches (argv|`?ps`?) or/i)
  })
})

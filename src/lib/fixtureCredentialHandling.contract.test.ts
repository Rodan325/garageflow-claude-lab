import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error -- plain ESM helper shared with scripts/security-scan.mjs
import { findCredentialIssues, looksBinary, trackedTextFiles } from '../../scripts/credential-patterns.mjs'

/**
 * The fixture password must never come back into the repository, and the
 * documented way of supplying one locally must stay narrow: no `export`, which
 * would leave the value in the parent shell and hand it to every later process,
 * and nothing that puts it in a command line.
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

  it('routes the password through the wrapper, never PGOPTIONS', () => {
    const wrapper = read('scripts/seed-local.sql')
    expect(wrapper).toContain('\\getenv fixture_password SEED_FIXTURE_PASSWORD')
    expect(wrapper).toContain(":'fixture_password'")
    expect(wrapper).toContain('\\ir ../supabase/seed.sql')
    expect(wrapper).toContain('\\ir rls-fixtures.sql')
    for (const rel of WORKFLOW_FILES) {
      expect(read(rel), rel).not.toMatch(/PGOPTIONS\s*=\s*"/)
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

  it('describes the residual exposure without claiming invisibility', () => {
    const seed = read('supabase/seed.sql')
    expect(seed).toMatch(/not invisible/i)
    expect(seed).toMatch(/log_statement/)
    expect(seed).not.toMatch(/a space breaks startup/i)
  })
})

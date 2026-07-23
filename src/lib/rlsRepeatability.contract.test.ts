// @vitest-environment node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function read(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('local RLS fixture lifecycle', () => {
  it('always invokes the local cleanup after validation', () => {
    const runner = read('scripts/run-rls-tests.mjs')

    expect(runner).toContain('finally {')
    expect(runner).toContain("runNodeScript(localFixtureHelper, ['prepare'])")
    expect(runner).toContain("runNodeScript(localFixtureHelper, ['cleanup'])")
    expect(runner).toContain('RLS_FIXTURE_RUN_ID')
  })

  it('keeps privileged fixture management local and verifies zero residue', () => {
    const helper = read('scripts/local-rls-fixtures.mjs')

    expect(helper).toContain("assertSupabaseTestTarget(process.env.VITE_SUPABASE_URL, { mode: 'local' })")
    expect(helper).toContain("refusing a non-local test target")
    expect(helper).toContain("label=com.supabase.cli.project=${projectName}")
    expect(helper).toContain("source like 'rls_validation:%'")
    expect(helper).toContain("application_version like 'rls-validation:%'")
    expect(helper).toContain("document_version = 'rls-validation-20260720'")
    expect(helper).toContain('residual fixtures detected')
  })

  it('gives every temporary reminder and legal proof a deterministic cleanup marker', () => {
    const general = read('scripts/rls-antileak.mjs')
    const legal = read('scripts/legal-v2-rls.mjs')
    const helper = read('scripts/local-rls-fixtures.mjs')

    expect(general).toContain('rls_validation:${fixtureRunId}:journey')
    expect(general).toContain('rls_validation:${fixtureRunId}:reminder')
    expect(general).toContain("testTarget === 'staging' ? 10 : 5")
    // Rejected direct-write payloads retain a run marker for diagnostics.
    expect(legal).toContain('rls-validation:${fixtureRunId}')
    // Successful RPC proofs derive a fixed application marker server-side and
    // are isolated by the dedicated legal fixture document version.
    expect(legal).toContain("application_version === 'legal-current-document-rpc-v1'")
    expect(legal).toContain("const VERSION = 'rls-validation-20260720'")
    expect(helper).toContain("application_version = 'legal-current-document-rpc-v1'")
  })
})

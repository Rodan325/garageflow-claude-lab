// @vitest-environment node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import {
  fixtureSnapshotDifferences,
  runWithFixtureLifecycle,
} from '../../scripts/rls-fixture-lifecycle.mjs'

function read(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('local RLS fixture lifecycle', () => {
  it('always invokes the administrative cleanup after validation', () => {
    const runner = read('scripts/run-rls-tests.mjs')

    expect(runner).toContain('runWithFixtureLifecycle')
    expect(runner).toContain("runNodeScript(fixtureHelper, ['prepare'])")
    expect(runner).toContain("runNodeScript(fixtureHelper, ['cleanup'])")
    expect(runner).toContain('RLS_FIXTURE_RUN_ID')
    expect(runner).toContain('RLS_FIXTURE_BASELINE_FILE')
  })

  it('restricts privileged fixture management to local or the approved staging ref', () => {
    const helper = read('scripts/rls-fixture-admin.mjs')

    expect(helper).toContain("!['local', 'staging'].includes(targetMode)")
    expect(helper).toContain('FORBIDDEN_PRODUCTION_REF')
    expect(helper).toContain('APPROVED_STAGING_REF')
    expect(helper).toContain("label=com.supabase.cli.project=${projectName}")
    expect(helper).toContain("'--linked'")
    expect(helper).toContain("'RLS_SNAPSHOT:'")
    expect(helper).toContain("source like 'rls_validation:'")
    expect(helper).toContain("document_version = 'rls-validation-20260720'")
    expect(helper).toContain('residual fixtures detected')
  })

  it('gives every temporary reminder and legal proof a deterministic cleanup marker', () => {
    const general = read('scripts/rls-antileak.mjs')
    const legal = read('scripts/legal-v2-rls.mjs')
    const helper = read('scripts/rls-fixture-admin.mjs')

    expect(general).toContain('rls_validation:${fixtureRunId}:journey')
    expect(general).toContain('rls_validation:${fixtureRunId}:reminder')
    expect(general).toContain("testTarget === 'staging' ? 10 : 5")
    // Rejected direct-write payloads retain a run marker for diagnostics.
    expect(legal).toContain('rls-validation:${fixtureRunId}')
    // Successful RPC proofs derive a fixed application marker server-side and
    // are isolated by the dedicated legal fixture document version.
    expect(legal).toContain("application_version === 'legal-current-document-rpc-v2'")
    expect(legal).toContain("const VERSION = 'rls-validation-20260720'")
    expect(helper).toContain("'legal-current-document-rpc-v2'")
  })

  it('detects an intentionally residual reminder and reports its identifier', () => {
    const differences = fixtureSnapshotDifferences(
      {
        counts: { maintenance_reminders: 2 },
        owned: { reminders: [] },
      },
      {
        counts: { maintenance_reminders: 3 },
        owned: { reminders: ['reminder-residue'] },
      },
    )

    expect(differences).toEqual([
      { category: 'maintenance_reminders', before: 2, after: 3 },
      { category: 'owned.reminders', identifiers: ['reminder-residue'] },
    ])
  })

  it('removes an intentionally residual reminder and restores the baseline', async () => {
    const reminders = ['historical-reminder']
    const snapshot = () => ({
      counts: { maintenance_reminders: reminders.length },
      owned: { reminders: reminders.filter((id) => id === 'run-reminder') },
    })

    await runWithFixtureLifecycle({
      prepare: async () => snapshot(),
      run: async () => {
        reminders.push('run-reminder')
        expect(fixtureSnapshotDifferences(
          { counts: { maintenance_reminders: 1 }, owned: { reminders: [] } },
          snapshot(),
        )).not.toEqual([])
      },
      cleanup: async (baseline) => {
        reminders.splice(reminders.indexOf('run-reminder'), 1)
        expect(fixtureSnapshotDifferences(baseline, snapshot())).toEqual([])
      },
    })

    expect(reminders).toEqual(['historical-reminder'])
  })

  it('runs cleanup even when an intermediate assertion fails', async () => {
    const cleanup = vi.fn().mockResolvedValue(undefined)

    await expect(runWithFixtureLifecycle({
      prepare: async () => ({ counts: {}, owned: {} }),
      run: async () => {
        throw new Error('intentional validation failure')
      },
      cleanup,
    })).rejects.toThrow('intentional validation failure')

    expect(cleanup).toHaveBeenCalledOnce()
  })
})

// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  DEPLOYMENT_STATE_CATEGORIES,
  MUTATION_OUTCOMES,
  assertForwardRelease,
  assertPromotedDeployment,
  assertStagedDeployment,
  buildCreateDeploymentRequest,
  buildPromoteDeploymentRequest,
  calculateMigrationDelta,
  createStagedProductionDeployment,
  isPromotionAllowed,
  normalizeDeploymentId,
  normalizeDeploymentUrl,
  normalizeDomain,
  normalizeSha,
  parseMigrationNameStatus,
  promoteDeployment,
  reconcileAmbiguousPromotion,
  trustedDeploymentSha,
  validateDeploymentState,
  vercelRequest,
// @ts-expect-error No declaration file is needed for this repository-local controller.
} from '../../tools/release-controller/release-control.mjs'

const ROOT = process.cwd()
const STAGE_PATH = '.github/workflows/stage-production.yml'
const PROMOTE_PATH = '.github/workflows/promote-production.yml'
const HELPER_PATH = 'tools/release-controller/release-control.mjs'
const CONTROLLER_PACKAGE_PATH = 'tools/release-controller/package.json'
const CONTROLLER_LOCK_PATH = 'tools/release-controller/package-lock.json'
const FROM_SHA = '3e863d91cb7eb992247f43e84f2abc1955415107'
const TO_SHA = 'fafff11ab75ef4a5cd15a2441d9a7a783f9fb834'
const PREVIOUS_SHA = 'a62e24655858f669cf8b272765143ee7bd42202c'
const PROJECT_ID = 'prj_HAjxJd3nHgAivBiivHpBFQuEMTiT'
const TEAM_ID = 'team_ENsdDQYn8tArdgSZlrWP2u85'
const DEPLOYMENT_ID = 'dpl_3evaVxW6kRTWpZfXXz4hc1Q9Exax'
const CHECKOUT_PIN = '11bd71901bbe5b1630ceea73d27597364c9af683'
const SETUP_NODE_PIN = '49933ea5288caeca8642d1e84afbd3f7d6820020'
const IDENTITY = { projectId: PROJECT_ID, teamId: TEAM_ID, domain: 'app.rodanbtech.com' }

const read = (path: string) => readFileSync(resolve(ROOT, path), 'utf8')
const stage = read(STAGE_PATH)
const promote = read(PROMOTE_PATH)
const helper = read(HELPER_PATH)
const rootPackage = JSON.parse(read('package.json')) as { dependencies?: object; devDependencies?: object }

function runBlocks(workflow: string) {
  const lines = workflow.split(/\r?\n/)
  const blocks: string[] = []
  for (let index = 0; index < lines.length; index += 1) {
    const match = /^(\s*)run:\s*(.*)$/.exec(lines[index])
    if (!match) continue
    const indent = match[1].length
    const block = [match[2]]
    while (index + 1 < lines.length) {
      const next = lines[index + 1]
      if (next.trim() && next.search(/\S/) <= indent) break
      block.push(next)
      index += 1
    }
    blocks.push(block.join('\n'))
  }
  return blocks
}

function job(workflow: string, name: string, nextName?: string) {
  const start = workflow.indexOf(`  ${name}:`)
  const end = nextName ? workflow.indexOf(`  ${nextName}:`, start + 1) : workflow.length
  if (start < 0 || end < 0) throw new Error(`Missing workflow job: ${name}`)
  return workflow.slice(start, end)
}

function tokenBearingSteps(workflow: string) {
  return workflow.split(/^ {6}- name:/m).slice(1)
    .filter((step) => step.includes('VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}'))
}

function dispatchInputs(workflow: string) {
  const inputSection = workflow.split('\npermissions:')[0].split('    inputs:')[1] ?? ''
  return [...inputSection.matchAll(/^ {6}([a-z][a-z0-9_]+):$/gm)].map((match) => match[1])
}

function expectManualPinnedWorkflow(workflow: string) {
  expect(workflow).toMatch(/^on:\n {2}workflow_dispatch:/m)
  expect(workflow).not.toMatch(/^ {2}(?:push|pull_request|pull_request_target|schedule|workflow_run):/m)
  expect(workflow).toContain('permissions:\n  contents: read\n  actions: read\n  checks: read')
  expect(workflow).not.toMatch(/^\s+[a-z-]+:\s*write\s*$/m)
  expect(workflow).toContain(`actions/checkout@${CHECKOUT_PIN} # v4.2.2`)
  expect(workflow).toContain(`actions/setup-node@${SETUP_NODE_PIN} # v4.4.0`)
  expect(workflow).toContain('test "$GITHUB_REF_VALUE" = "refs/heads/main"')
  expect(workflow).toContain('group: production-release')
  expect(workflow).toContain('cancel-in-progress: false')
}

function validStagedDeployment() {
  return {
    id: DEPLOYMENT_ID,
    projectId: PROJECT_ID,
    ownerId: TEAM_ID,
    readyState: 'READY',
    target: 'production',
    url: 'garageflow-controlled.vercel.app',
    alias: ['garageflow-controlled.vercel.app'],
    autoAssignCustomDomains: false,
    meta: {
      releaseSource: 'controlled-github-release',
      releaseSha: TO_SHA,
      githubCommitSha: TO_SHA,
    },
    gitSource: {
      type: 'github',
      repoId: 1269499691,
      ref: TO_SHA,
      sha: TO_SHA,
    },
  }
}

describe('release helper semantics', () => {
  it('sets redirect error on authenticated Vercel fetches', async () => {
    let fetchOptions: RequestInit | undefined
    const fetchImpl = async (_url: URL | string, options?: RequestInit) => {
      fetchOptions = options
      return new Response('{}', { status: 200 })
    }
    await vercelRequest({
      method: 'GET',
      path: `/v9/projects/${PROJECT_ID}`,
      query: {},
      expectedStatuses: [200],
    }, IDENTITY, { fetchImpl, token: 'local-test-token' })
    expect(fetchOptions?.redirect).toBe('error')
  })

  it.each([
    ['QUEUED', DEPLOYMENT_STATE_CATEGORIES.TRANSITIONAL],
    ['INITIALIZING', DEPLOYMENT_STATE_CATEGORIES.TRANSITIONAL],
    ['ANALYZING', DEPLOYMENT_STATE_CATEGORIES.TRANSITIONAL],
    ['BUILDING', DEPLOYMENT_STATE_CATEGORIES.TRANSITIONAL],
    ['DEPLOYING', DEPLOYMENT_STATE_CATEGORIES.TRANSITIONAL],
    ['READY', DEPLOYMENT_STATE_CATEGORIES.SUCCESS],
    ['ERROR', DEPLOYMENT_STATE_CATEGORIES.FAILURE],
    ['CANCELED', DEPLOYMENT_STATE_CATEGORIES.FAILURE],
    ['BLOCKED', DEPLOYMENT_STATE_CATEGORIES.FAILURE],
  ])('classifies deployment state %s as %s', (state, category) => {
    expect(validateDeploymentState({ readyState: state })).toEqual({ state, category })
    expect(validateDeploymentState({ state })).toEqual({ state, category })
    expect(validateDeploymentState({ readyState: state, state })).toEqual({ state, category })
  })

  it.each(['ERROR', 'CANCELED', 'BLOCKED'])('denies terminal staged state %s', (readyState) => {
    expect(() => assertStagedDeployment({ ...validStagedDeployment(), readyState }, IDENTITY, TO_SHA))
      .toThrow('Staged deployment is not READY')
  })

  it('denies unknown, contradictory, and present-but-malformed deployment states', () => {
    expect(() => validateDeploymentState({ readyState: 'UNKNOWN' })).toThrow('malformed or unknown')
    expect(() => validateDeploymentState({ readyState: 'READY', state: 'BUILDING' })).toThrow('conflict')
    expect(() => validateDeploymentState({ readyState: 'ANALYZING', state: 'DEPLOYING' })).toThrow('conflict')
    expect(() => validateDeploymentState({ readyState: null, state: 'READY' })).toThrow('malformed')
    expect(() => validateDeploymentState({ readyState: 'READY', state: null })).toThrow('malformed')
  })

  it('classifies create transport ambiguity and never retries the POST', async () => {
    let calls = 0
    const fetchImpl = async () => {
      calls += 1
      throw new TypeError('simulated transport loss')
    }
    const promise = createStagedProductionDeployment(TO_SHA, IDENTITY, {
      fetchImpl,
      token: 'local-test-token',
    })
    await expect(promise).rejects.toMatchObject({
      outcome: MUTATION_OUTCOMES.AMBIGUOUS_MUTATION,
    })
    await expect(promise).rejects.toThrow('a deployment may have been created; no retry was attempted')
    expect(calls).toBe(1)
  })

  it('classifies an explicit create HTTP rejection as definitive failure', async () => {
    const fetchImpl = async () => new Response('{}', { status: 500 })
    const promise = createStagedProductionDeployment(TO_SHA, IDENTITY, {
      fetchImpl,
      token: 'local-test-token',
    })
    await expect(promise).rejects.toMatchObject({
      outcome: MUTATION_OUTCOMES.DEFINITIVE_FAILURE,
    })
    await expect(promise).rejects.toThrow('Vercel API returned HTTP 500')
  })

  it('classifies an accepted promote POST as definitive success', async () => {
    const fetchImpl = async () => new Response('', { status: 202 })
    const result = await promoteDeployment(PROJECT_ID, DEPLOYMENT_ID, IDENTITY, {
      fetchImpl,
      token: 'local-test-token',
    })
    expect(result).toEqual({
      outcome: MUTATION_OUTCOMES.DEFINITIVE_SUCCESS,
      value: null,
    })
  })

  it('classifies promote transport ambiguity and never retries the POST', async () => {
    let calls = 0
    const fetchImpl = async () => {
      calls += 1
      throw new TypeError('simulated transport loss')
    }
    const result = await promoteDeployment(PROJECT_ID, DEPLOYMENT_ID, IDENTITY, {
      fetchImpl,
      token: 'local-test-token',
    })
    expect(result).toMatchObject({ outcome: MUTATION_OUTCOMES.AMBIGUOUS_MUTATION })
    expect(calls).toBe(1)
  })

  it('reconciles an ambiguous promotion only when exact intended Production is verified', async () => {
    const promoted = {
      ...validStagedDeployment(),
      alias: ['garageflow-controlled.vercel.app', IDENTITY.domain],
    }
    let verified = 0
    const result = await reconcileAmbiguousPromotion(DEPLOYMENT_ID, 'dpl_AAAAAAAAAAAAAAAAAAAA', IDENTITY, {
      resolveCurrent: async () => promoted,
      verifyIntended: (deployment: ReturnType<typeof validStagedDeployment>) => {
        verified += 1
        return assertPromotedDeployment(deployment, IDENTITY, TO_SHA)
      },
      wait: async () => {},
      intervalMs: 0,
      maxAttempts: 2,
    })
    expect(result).toMatchObject({
      outcome: MUTATION_OUTCOMES.DEFINITIVE_SUCCESS,
      reconciliation: 'PROMOTION_AMBIGUITY_RECONCILED=SUCCESS',
      deployment: promoted,
    })
    expect(verified).toBe(1)
  })

  it('leaves ambiguous promotion unresolved after a bounded old-Production poll', async () => {
    let resolutions = 0
    let waits = 0
    const previous = { id: 'dpl_AAAAAAAAAAAAAAAAAAAA' }
    const result = await reconcileAmbiguousPromotion(DEPLOYMENT_ID, previous.id, IDENTITY, {
      resolveCurrent: async () => {
        resolutions += 1
        return previous
      },
      wait: async () => {
        waits += 1
      },
      intervalMs: 0,
      maxAttempts: 3,
    })
    expect(result).toEqual({
      outcome: MUTATION_OUTCOMES.AMBIGUOUS_MUTATION,
      reconciliation: 'UNRESOLVED',
    })
    expect(resolutions).toBe(3)
    expect(waits).toBe(2)
  })

  it('rejects an unexpected third Production deployment during reconciliation', async () => {
    await expect(reconcileAmbiguousPromotion(
      DEPLOYMENT_ID,
      'dpl_AAAAAAAAAAAAAAAAAAAA',
      IDENTITY,
      {
        resolveCurrent: async () => ({ id: 'dpl_BBBBBBBBBBBBBBBBBBBB' }),
        wait: async () => {},
        intervalMs: 0,
        maxAttempts: 2,
      },
    )).rejects.toThrow('EXTERNAL_PRODUCTION_DIVERGENCE')
  })

  it('accepts a real forward release', () => {
    expect(assertForwardRelease(FROM_SHA, TO_SHA)).toEqual({ current: FROM_SHA, release: TO_SHA })
  })

  it('denies backward and diverged candidates', () => {
    expect(() => assertForwardRelease(TO_SHA, PREVIOUS_SHA)).toThrow(
      'Release is not a forward descendant of Current Production',
    )
    expect(() => assertForwardRelease(FROM_SHA, TO_SHA, ROOT, () => false)).toThrow(
      'Release is not a forward descendant of Current Production',
    )
  })

  it('accepts controlled metadata and only a clean legacy fallback', () => {
    expect(trustedDeploymentSha({ meta: { releaseSource: 'controlled-github-release', releaseSha: FROM_SHA } }))
      .toEqual({ sha: FROM_SHA, provenance: 'CONTROLLED_RELEASE' })
    expect(trustedDeploymentSha({ meta: {
      releaseSource: 'controlled-github-release',
      releaseSha: TO_SHA,
      githubCommitSha: TO_SHA,
    } })).toEqual({ sha: TO_SHA, provenance: 'CONTROLLED_RELEASE' })
    expect(trustedDeploymentSha({ meta: { githubCommitSha: FROM_SHA } }))
      .toEqual({ sha: FROM_SHA, provenance: 'LEGACY_GIT' })
  })

  it.each([
    [{ meta: { releaseSha: FROM_SHA } }, 'source absent'],
    [{ meta: { releaseSource: 'controlled-github-release' } }, 'SHA absent'],
    [{ meta: { releaseSource: 'unknown', releaseSha: FROM_SHA } }, 'unknown source'],
    [{ meta: { releaseSource: 'controlled-github-release', releaseSha: FROM_SHA, githubCommitSha: TO_SHA } }, 'conflict'],
    [{ meta: { releaseSource: '', releaseSha: FROM_SHA } }, 'empty source'],
    [{ meta: { releaseSource: null, releaseSha: null, githubCommitSha: FROM_SHA } }, 'both controlled keys null'],
    [{ meta: { releaseSource: null, githubCommitSha: FROM_SHA } }, 'source null'],
    [{ meta: { releaseSha: null, githubCommitSha: FROM_SHA } }, 'SHA null'],
    [{ meta: { releaseSource: 'controlled-github-release', releaseSha: null } }, 'controlled SHA null'],
    [{ meta: { releaseSource: null, releaseSha: FROM_SHA } }, 'source null with SHA'],
    [{ meta: { releaseSource: 'controlled-github-release', releaseSha: FROM_SHA, githubCommitSha: null } }, 'Git SHA null'],
    [{ meta: { releaseSource: undefined, releaseSha: FROM_SHA } }, 'source key undefined'],
    [{ meta: { releaseSource: 'controlled-github-release', releaseSha: undefined } }, 'SHA key undefined'],
  ])('denies malformed or conflicting deployment provenance: %s', (deployment, _reason) => {
    expect(() => trustedDeploymentSha(deployment)).toThrow()
  })

  it('builds an exact Git-SHA Production deployment request with alias prevention', () => {
    const request = buildCreateDeploymentRequest(TO_SHA)
    expect(request).toEqual({
      method: 'POST',
      path: '/v13/deployments',
      query: { forceNew: '1', skipAutoDetectionConfirmation: '1' },
      body: {
        name: 'garageflow-claude-lab',
        project: PROJECT_ID,
        target: 'production',
        autoAssignCustomDomains: false,
        withLatestCommit: false,
        gitSource: {
          type: 'github',
          repoId: 1269499691,
          ref: TO_SHA,
          sha: TO_SHA,
        },
        meta: {
          releaseSource: 'controlled-github-release',
          releaseSha: TO_SHA,
        },
      },
      expectedStatuses: [200],
    })
    expect(JSON.stringify(request)).not.toMatch(/token|authorization|secret/i)
  })

  it('builds only the exact allowlisted promote endpoint', () => {
    expect(buildPromoteDeploymentRequest(PROJECT_ID, DEPLOYMENT_ID)).toEqual({
      method: 'POST',
      path: `/v10/projects/${PROJECT_ID}/promote/${DEPLOYMENT_ID}`,
      query: {},
      body: {},
      expectedStatuses: [201, 202],
    })
    expect(() => buildPromoteDeploymentRequest('garageflow-claude-lab', DEPLOYMENT_ID)).toThrow()
    expect(() => buildPromoteDeploymentRequest(PROJECT_ID, 'latest')).toThrow()
  })

  it('validates staged response identity, Git source, provenance, state, and alias prevention', () => {
    const identity = { projectId: PROJECT_ID, teamId: TEAM_ID, domain: 'app.rodanbtech.com' }
    expect(assertStagedDeployment(validStagedDeployment(), identity, TO_SHA)).toBeTruthy()
    for (const invalid of [
      { ...validStagedDeployment(), projectId: 'prj_AAAAAAAAAAAAAAAAAAAA' },
      { ...validStagedDeployment(), ownerId: 'team_AAAAAAAAAAAAAAAAAAAA' },
      { ...validStagedDeployment(), readyState: 'ERROR' },
      { ...validStagedDeployment(), autoAssignCustomDomains: true },
      { ...validStagedDeployment(), gitSource: { ...validStagedDeployment().gitSource, sha: FROM_SHA } },
      { ...validStagedDeployment(), alias: ['app.rodanbtech.com'] },
    ]) {
      expect(() => assertStagedDeployment(invalid, identity, TO_SHA)).toThrow()
    }
  })

  it('detects every migration status and preserves the current hard block', () => {
    const parsed = parseMigrationNameStatus([
      'A\tsupabase/migrations/new.sql',
      'M\tsupabase/migrations/changed.sql',
      'D\tsupabase/migrations/deleted.sql',
      'R100\tsupabase/migrations/old.sql\tsupabase/migrations/new-name.sql',
    ].join('\n'))
    expect(parsed.map(({ status }: { status: string }) => status)).toEqual(['A', 'M', 'D', 'R100'])
    expect(isPromotionAllowed(parsed.length)).toBe(false)
    const currentDelta = calculateMigrationDelta(FROM_SHA, TO_SHA)
    expect(currentDelta.count).toBe(1)
    expect(currentDelta.present).toBe(true)
    expect(isPromotionAllowed(currentDelta.count)).toBe(false)
    expect(currentDelta.changes[0].paths).toEqual([
      'supabase/migrations/20260817191516_harden_public_data_boundary.sql',
    ])
  })

  it('validates exact operator identifier formats', () => {
    expect(() => normalizeSha('a'.repeat(40))).not.toThrow()
    expect(() => normalizeSha('abc')).toThrow()
    expect(() => normalizeDeploymentId(DEPLOYMENT_ID)).not.toThrow()
    expect(() => normalizeDeploymentId('latest')).toThrow()
    expect(() => normalizeDomain('app.rodanbtech.com')).not.toThrow()
    expect(() => normalizeDomain('https://app.rodanbtech.com/')).toThrow()
    expect(() => normalizeDeploymentUrl('https://safe-example.vercel.app')).not.toThrow()
    expect(() => normalizeDeploymentUrl('https://user:pass@safe-example.vercel.app')).toThrow()
  })
})

describe('controller and workflow trust boundaries', () => {
  it('uses only Node built-ins and has no controller dependency manifest', () => {
    expect(rootPackage.dependencies).not.toHaveProperty('vercel')
    expect(rootPackage.devDependencies).not.toHaveProperty('vercel')
    expect(existsSync(resolve(ROOT, CONTROLLER_PACKAGE_PATH))).toBe(false)
    expect(existsSync(resolve(ROOT, CONTROLLER_LOCK_PATH))).toBe(false)
    const imports = [...helper.matchAll(/^import .+ from '([^']+)'$/gm)].map((match) => match[1])
    expect(imports.length).toBeGreaterThan(0)
    expect(imports.every((specifier) => specifier.startsWith('node:'))).toBe(true)
    expect(helper).not.toMatch(/\b(?:execSync|eval)\s*\(|new Function|@vercel\/sdk/)
  })

  it('keeps workflows manual, pinned, serialized, and read-only', () => {
    for (const workflow of [stage, promote]) expectManualPinnedWorkflow(workflow)
    expect(dispatchInputs(stage)).toEqual([
      'release_sha',
      'expected_current_production_deployment_id',
      'expected_current_production_sha',
    ])
    expect(dispatchInputs(promote)).toEqual([
      'release_sha',
      'staged_deployment_id',
      'expected_current_production_deployment_id',
      'expected_current_production_sha',
    ])
  })

  it('uses the immutable controller revision without any target checkout or worktree', () => {
    for (const workflow of [stage, promote]) {
      expect(workflow).toContain('ref: ${{ github.sha }}\n          path: controller')
      const checkoutCount = (workflow.match(/uses: actions\/checkout@/g) ?? []).length
      expect(workflow.match(/persist-credentials: false/g) ?? []).toHaveLength(checkoutCount)
      expect(checkoutCount).toBe(2)
      expect(workflow).not.toMatch(/release-source|RELEASE_SOURCE_DIR|verify-head/)
    }
  })

  it('has exactly two token-bearing trusted Node transactions', () => {
    expect(tokenBearingSteps(stage)).toHaveLength(1)
    expect(tokenBearingSteps(promote)).toHaveLength(1)
    expect(tokenBearingSteps(stage)[0]).toContain('release-control.mjs stage-vercel')
    expect(tokenBearingSteps(promote)[0]).toContain('release-control.mjs promote-vercel')
    for (const workflow of [stage, promote]) {
      expect(workflow).not.toContain('--token')
      expect(workflow).not.toMatch(/^env:\n(?:.|\n)*VERCEL_TOKEN/m)
      expect(workflow).not.toMatch(/^ {4}env:\n(?: {6}.+\n)* {6}VERCEL_TOKEN:/m)
    }
  })

  it('contains no Vercel CLI, SDK, controller install, or target execution path', () => {
    const policy = `${stage}\n${promote}\n${helper}`
    const executableRuns = [...runBlocks(stage), ...runBlocks(promote)].join('\n')
    expect(executableRuns).not.toMatch(/\b(?:npx\s+)?vercel\s+(?:deploy|promote|inspect|build|pull|rollback)\b/)
    expect(policy).not.toMatch(/node_modules\/\.bin\/vercel|@vercel\/sdk/)
    expect(policy).not.toMatch(/npm\s+(?:ci|install)|pnpm|yarn|release-source/)
    expect(policy).not.toMatch(/vercel\.(?:ts|mts|js|mjs|cjs)/)
  })

  it('keeps stage creation and final promotion inside one trusted helper process each', () => {
    const protectedStage = job(stage, 'stage')
    const protectedPromote = job(promote, 'promote')
    expect(protectedStage).toContain('release-control.mjs stage-vercel')
    expect(protectedPromote).toContain('release-control.mjs promote-vercel')
    expect((helper.match(/const request = buildCreateDeploymentRequest\(releaseSha\)/g) ?? [])).toHaveLength(1)
    expect((helper.match(/await promoteDeployment\(identity\.projectId, stagedId, identity\)/g) ?? [])).toHaveLength(1)
    expect(helper).toContain("path: '/v13/deployments'")
    expect(helper).toContain('/v10/projects/${encodeURIComponent(project)}/promote/')
  })

  it('contains no database override, remote database mutation, or Git ref mutation path', () => {
    const policy = `${stage}\n${promote}\n${helper}`
    expect(policy).not.toMatch(/supabase\s+(?:db\s+push|db\s+reset|migration\s+(?:up|repair)|link)/i)
    expect(policy).not.toMatch(/SUPABASE_(?:ACCESS_TOKEN|SERVICE_ROLE|DB_PASSWORD)/)
    expect(policy).not.toMatch(/git\s+(?:push|branch\s+-[dD]|update-ref|reset)/)
    expect(policy).not.toMatch(/SKIP_MIGRATION_CHECK|DB_APPROVED|APPROVE_DB|IGNORE_RACE/)
    expect(policy).not.toMatch(/productionBranch|vercel\s+rollback/i)
  })
})

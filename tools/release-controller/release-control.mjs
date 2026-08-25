import { execFileSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const EXPECTED_REPOSITORY = 'Rodan325/garageflow-claude-lab'
const EXPECTED_REPOSITORY_ID = 1269499691
const EXPECTED_PROJECT_NAME = 'garageflow-claude-lab'
const EXPECTED_PROJECT_ID = 'prj_HAjxJd3nHgAivBiivHpBFQuEMTiT'
const EXPECTED_TEAM_ID = 'team_ENsdDQYn8tArdgSZlrWP2u85'
const EXPECTED_PRODUCTION_DOMAIN = 'app.rodanbtech.com'
const EXPECTED_NODE_VERSION = '24.x'
const VERCEL_API_ORIGIN = 'https://api.vercel.com'
const RELEASE_SOURCE = 'controlled-github-release'
const REQUIRED_CI_STEPS = ['Security scan', 'Typecheck', 'Lint', 'Tests', 'Build']
export const DEPLOYMENT_STATE_CATEGORIES = Object.freeze({
  TRANSITIONAL: 'TRANSITIONAL',
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
})
const DEPLOYMENT_STATE_CATEGORY = new Map([
  ['QUEUED', DEPLOYMENT_STATE_CATEGORIES.TRANSITIONAL],
  ['INITIALIZING', DEPLOYMENT_STATE_CATEGORIES.TRANSITIONAL],
  ['ANALYZING', DEPLOYMENT_STATE_CATEGORIES.TRANSITIONAL],
  ['BUILDING', DEPLOYMENT_STATE_CATEGORIES.TRANSITIONAL],
  ['DEPLOYING', DEPLOYMENT_STATE_CATEGORIES.TRANSITIONAL],
  ['READY', DEPLOYMENT_STATE_CATEGORIES.SUCCESS],
  ['ERROR', DEPLOYMENT_STATE_CATEGORIES.FAILURE],
  ['CANCELED', DEPLOYMENT_STATE_CATEGORIES.FAILURE],
  ['BLOCKED', DEPLOYMENT_STATE_CATEGORIES.FAILURE],
])
const TERMINAL_FAILURE_STATES = new Set(
  [...DEPLOYMENT_STATE_CATEGORY.entries()]
    .filter(([, category]) => category === DEPLOYMENT_STATE_CATEGORIES.FAILURE)
    .map(([state]) => state),
)
const DEPLOYMENT_POLL_INTERVAL_MS = 5_000
const DEPLOYMENT_POLL_TIMEOUT_MS = 15 * 60_000
const PRODUCTION_POLL_TIMEOUT_MS = 3 * 60_000
const AMBIGUOUS_PROMOTION_MAX_ATTEMPTS = Math.ceil(
  PRODUCTION_POLL_TIMEOUT_MS / DEPLOYMENT_POLL_INTERVAL_MS,
)

export const MUTATION_OUTCOMES = Object.freeze({
  DEFINITIVE_SUCCESS: 'DEFINITIVE_SUCCESS',
  DEFINITIVE_FAILURE: 'DEFINITIVE_FAILURE',
  AMBIGUOUS_MUTATION: 'AMBIGUOUS_MUTATION',
})

export class VercelMutationOutcomeError extends Error {
  constructor(outcome, message) {
    super(message)
    this.name = 'VercelMutationOutcomeError'
    this.outcome = outcome
  }
}

function fail(message) {
  throw new Error(message)
}

function own(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function plainObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    fail(`${label} must be an object`)
  }
  return value
}

export function normalizeSha(value, label = 'SHA') {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (!/^[0-9a-f]{40}$/.test(normalized)) fail(`${label} must be exactly 40 hexadecimal characters`)
  return normalized
}

export function normalizeDeploymentId(value, label = 'deployment ID') {
  const normalized = String(value ?? '').trim()
  if (!/^dpl_[A-Za-z0-9]{20,64}$/.test(normalized)) fail(`${label} has an invalid format`)
  return normalized
}

export function normalizeProjectId(value) {
  const normalized = String(value ?? '').trim()
  if (!/^prj_[A-Za-z0-9]{20,64}$/.test(normalized)) fail('Vercel project ID has an invalid format')
  return normalized
}

export function normalizeTeamId(value) {
  const normalized = String(value ?? '').trim()
  if (!/^team_[A-Za-z0-9]{20,64}$/.test(normalized)) fail('Vercel team ID has an invalid format')
  return normalized
}

export function normalizeDomain(value) {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized.includes('://') || normalized.endsWith('/')) {
    fail('Production domain must not contain a scheme or trailing slash')
  }
  if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(normalized)) {
    fail('Production domain has an invalid format')
  }
  return normalized
}

export function normalizeDeploymentUrl(value) {
  let parsed
  try {
    parsed = new URL(String(value ?? '').trim())
  } catch {
    fail('Staged deployment URL is invalid')
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash) {
    fail('Staged deployment URL must be a credential-free HTTPS URL')
  }
  if (!parsed.hostname.endsWith('.vercel.app') || parsed.pathname !== '/') {
    fail('Staged deployment URL is not a canonical Vercel deployment URL')
  }
  return parsed.toString().replace(/\/$/, '')
}

export function parseMigrationNameStatus(output) {
  return String(output ?? '')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const fields = line.split('\t')
      const status = fields[0]
      if (!/^(?:A|M|D|R\d{1,3})$/.test(status)) fail(`Unexpected migration diff status: ${status}`)
      const paths = fields.slice(1)
      if (paths.length === 0 || paths.some((path) => !path.startsWith('supabase/migrations/'))) {
        fail('Migration diff escaped the expected path boundary')
      }
      return { status, paths }
    })
}

export function isPromotionAllowed(migrationDeltaCount) {
  return Number.isInteger(migrationDeltaCount) && migrationDeltaCount === 0
}

function gitText(args, cwd = process.cwd()) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  }).trim()
}

function assertCommitExists(sha, cwd = process.cwd()) {
  const normalized = normalizeSha(sha)
  let type
  try {
    type = gitText(['cat-file', '-t', normalized], cwd)
  } catch {
    fail('Git object does not exist')
  }
  if (type !== 'commit') fail('Git object is not a commit')
  return normalized
}

export function assertCommitReachableFromMain(sha, cwd = process.cwd()) {
  const normalized = assertCommitExists(sha, cwd)
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', normalized, 'origin/main'], {
      cwd,
      stdio: 'ignore',
      windowsHide: true,
    })
  } catch {
    fail('Commit is not reachable from origin/main')
  }
  return normalized
}

function gitIsAncestor(ancestor, descendant, cwd) {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', ancestor, descendant], {
      cwd,
      stdio: 'ignore',
      windowsHide: true,
    })
    return true
  } catch {
    return false
  }
}

export function assertForwardRelease(
  currentProductionSha,
  releaseSha,
  cwd = process.cwd(),
  isAncestor = gitIsAncestor,
) {
  const current = assertCommitReachableFromMain(
    normalizeSha(currentProductionSha, 'current Production SHA'),
    cwd,
  )
  const release = assertCommitReachableFromMain(normalizeSha(releaseSha, 'release SHA'), cwd)
  if (!isAncestor(current, release, cwd)) fail('Release is not a forward descendant of Current Production')
  return { current, release }
}

export function calculateMigrationDelta(fromSha, toSha, cwd = process.cwd()) {
  const from = assertCommitReachableFromMain(normalizeSha(fromSha, 'FROM_SHA'), cwd)
  const to = assertCommitReachableFromMain(normalizeSha(toSha, 'TO_SHA'), cwd)
  const output = gitText([
    'diff',
    '--name-status',
    '--find-renames',
    from,
    to,
    '--',
    'supabase/migrations/',
  ], cwd)
  const changes = parseMigrationNameStatus(output)
  return { from, to, count: changes.length, present: changes.length > 0, changes }
}

function requiredEnv(name) {
  const value = process.env[name]
  if (!value) fail(`Missing required environment variable: ${name}`)
  return value
}

function assertMainDispatch() {
  if (requiredEnv('GITHUB_REF') !== 'refs/heads/main') fail('Workflow dispatch is restricted to main')
  if (requiredEnv('GITHUB_REPOSITORY') !== EXPECTED_REPOSITORY) fail('Unexpected GitHub repository')
}

function appendOutput(key, value) {
  if (!/^[a-z][a-z0-9_]*$/.test(key)) fail('Invalid GitHub output key')
  const normalized = String(value)
  if (/\r|\n/.test(normalized)) fail('Multiline GitHub output rejected')
  appendFileSync(requiredEnv('GITHUB_OUTPUT'), `${key}=${normalized}\n`, 'utf8')
}

function appendSummary(lines) {
  const safeLines = lines.map((line) => {
    const text = String(line)
    if (/\r|\n/.test(text)) fail('Multiline summary value rejected')
    return text
  })
  appendFileSync(requiredEnv('GITHUB_STEP_SUMMARY'), `${safeLines.join('\n')}\n`, 'utf8')
}

async function fetchJson(url, { token, provider }) {
  let response
  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'clikarage-release-control',
      },
      signal: AbortSignal.timeout(20_000),
    })
  } catch {
    fail(`${provider} API request failed`)
  }
  if (!response.ok) fail(`${provider} API returned HTTP ${response.status}`)
  try {
    return await response.json()
  } catch {
    fail(`${provider} API returned invalid JSON`)
  }
}

async function verifyExactGitHubCi(releaseSha) {
  const sha = normalizeSha(releaseSha, 'RELEASE_SHA')
  const token = requiredEnv('GITHUB_TOKEN')
  const query = new URLSearchParams({ event: 'push', head_sha: sha, per_page: '100' })
  const runs = await fetchJson(
    `https://api.github.com/repos/${EXPECTED_REPOSITORY}/actions/workflows/ci.yml/runs?${query}`,
    { token, provider: 'GitHub' },
  )
  const matching = (runs.workflow_runs ?? []).filter((run) =>
    run.head_sha === sha
      && run.head_branch === 'main'
      && run.event === 'push'
      && run.name === 'Clikarage CI'
      && run.path === '.github/workflows/ci.yml')
  if (matching.length !== 1) fail('Exact Clikarage CI run is absent or ambiguous')
  if (matching[0].status !== 'completed' || matching[0].conclusion !== 'success') {
    fail('Exact Clikarage CI run is not successfully completed')
  }

  const jobs = await fetchJson(
    `https://api.github.com/repos/${EXPECTED_REPOSITORY}/actions/runs/${matching[0].id}/jobs?filter=latest&per_page=100`,
    { token, provider: 'GitHub' },
  )
  const qualityJobs = (jobs.jobs ?? []).filter((job) =>
    job.name === 'quality' && job.status === 'completed' && job.conclusion === 'success')
  if (qualityJobs.length !== 1) fail('Successful quality job is absent or ambiguous')
  for (const stepName of REQUIRED_CI_STEPS) {
    const steps = (qualityJobs[0].steps ?? []).filter((step) => step.name === stepName)
    if (steps.length !== 1 || steps[0].status !== 'completed' || steps[0].conclusion !== 'success') {
      fail(`Required CI step did not succeed: ${stepName}`)
    }
  }
  return { runId: matching[0].id, qualityJobId: qualityJobs[0].id }
}

function preflightInputs() {
  assertMainDispatch()
  return {
    releaseSha: assertCommitReachableFromMain(normalizeSha(requiredEnv('RELEASE_SHA'), 'RELEASE_SHA')),
    expectedProductionDeploymentId: normalizeDeploymentId(
      requiredEnv('EXPECTED_CURRENT_PRODUCTION_DEPLOYMENT_ID'),
      'expected Production deployment ID',
    ),
    expectedProductionSha: assertCommitReachableFromMain(
      normalizeSha(requiredEnv('EXPECTED_CURRENT_PRODUCTION_SHA'), 'expected Production SHA'),
    ),
  }
}

async function runPreflight({ promotion }) {
  const inputs = preflightInputs()
  const stagedDeploymentId = promotion
    ? normalizeDeploymentId(requiredEnv('STAGED_DEPLOYMENT_ID'), 'staged deployment ID')
    : null
  assertForwardRelease(inputs.expectedProductionSha, inputs.releaseSha)
  await verifyExactGitHubCi(inputs.releaseSha)
  const delta = calculateMigrationDelta(inputs.expectedProductionSha, inputs.releaseSha)

  appendOutput('release_sha', inputs.releaseSha)
  appendOutput('expected_production_deployment_id', inputs.expectedProductionDeploymentId)
  appendOutput('expected_production_sha', inputs.expectedProductionSha)
  appendOutput('migration_delta_count', delta.count)
  appendOutput('migration_delta_present', delta.present)
  if (stagedDeploymentId) appendOutput('staged_deployment_id', stagedDeploymentId)
  appendSummary([
    `Release SHA: ${inputs.releaseSha}`,
    `Expected Production deployment: ${inputs.expectedProductionDeploymentId}`,
    `Expected Production code SHA: ${inputs.expectedProductionSha}`,
    `DB migration delta count: ${delta.count}`,
    `DB migration delta present: ${delta.present}`,
  ])

  if (promotion && !isPromotionAllowed(delta.count)) {
    fail(`Promotion denied: ${delta.count} Supabase migration delta(s) detected`)
  }
}

function configuredVercelIdentity() {
  const teamId = normalizeTeamId(requiredEnv('VERCEL_ORG_ID'))
  const projectId = normalizeProjectId(requiredEnv('VERCEL_PROJECT_ID'))
  const domain = normalizeDomain(requiredEnv('VERCEL_PRODUCTION_DOMAIN'))
  if (teamId !== EXPECTED_TEAM_ID || projectId !== EXPECTED_PROJECT_ID || domain !== EXPECTED_PRODUCTION_DOMAIN) {
    fail('Configured Vercel identity does not match the reviewed bootstrap')
  }
  return { teamId, projectId, domain }
}

export function buildCreateDeploymentRequest(releaseSha) {
  const sha = normalizeSha(releaseSha, 'release SHA')
  return {
    method: 'POST',
    path: '/v13/deployments',
    query: {
      forceNew: '1',
      skipAutoDetectionConfirmation: '1',
    },
    body: {
      name: EXPECTED_PROJECT_NAME,
      project: EXPECTED_PROJECT_ID,
      target: 'production',
      autoAssignCustomDomains: false,
      withLatestCommit: false,
      gitSource: {
        type: 'github',
        repoId: EXPECTED_REPOSITORY_ID,
        ref: sha,
        sha,
      },
      meta: {
        releaseSource: RELEASE_SOURCE,
        releaseSha: sha,
      },
    },
    expectedStatuses: [200],
  }
}

export function buildPromoteDeploymentRequest(projectId, deploymentId) {
  const project = normalizeProjectId(projectId)
  const deployment = normalizeDeploymentId(deploymentId)
  return {
    method: 'POST',
    path: `/v10/projects/${encodeURIComponent(project)}/promote/${encodeURIComponent(deployment)}`,
    query: {},
    body: {},
    expectedStatuses: [201, 202],
  }
}

function assertAllowedVercelRequest(request) {
  const method = request.method
  const path = request.path
  const allowed = (method === 'GET' && /^\/v9\/projects\/prj_[A-Za-z0-9]{20,64}$/.test(path))
    || (method === 'GET' && /^\/v13\/deployments\/(?:dpl_[A-Za-z0-9]{20,64}|[a-z0-9.-]{1,253})$/.test(path))
    || (method === 'POST' && path === '/v13/deployments')
    || (method === 'POST' && /^\/v10\/projects\/prj_[A-Za-z0-9]{20,64}\/promote\/dpl_[A-Za-z0-9]{20,64}$/.test(path))
  if (!allowed) fail('Vercel API request escaped the allowlist')
}

export async function vercelRequest(
  request,
  identity,
  { fetchImpl = globalThis.fetch, token } = {},
) {
  assertAllowedVercelRequest(request)
  const authToken = token ?? requiredEnv('VERCEL_TOKEN')
  const url = new URL(request.path, VERCEL_API_ORIGIN)
  if (url.origin !== VERCEL_API_ORIGIN) fail('Vercel API origin changed unexpectedly')
  url.searchParams.set('teamId', identity.teamId)
  for (const [key, value] of Object.entries(request.query ?? {})) url.searchParams.set(key, value)

  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${authToken}`,
    'User-Agent': 'clikarage-release-control',
  }
  if (request.body !== undefined) headers['Content-Type'] = 'application/json'

  let response
  try {
    response = await fetchImpl(url, {
      method: request.method,
      headers,
      body: request.body === undefined ? undefined : JSON.stringify(request.body),
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
    })
  } catch {
    if (request.method === 'POST') {
      throw new VercelMutationOutcomeError(
        MUTATION_OUTCOMES.AMBIGUOUS_MUTATION,
        'Vercel POST transport failed after transmission may have begun',
      )
    }
    fail('Vercel API request failed')
  }
  if (!request.expectedStatuses.includes(response.status)) {
    if (request.method === 'POST') {
      throw new VercelMutationOutcomeError(
        MUTATION_OUTCOMES.DEFINITIVE_FAILURE,
        `Vercel API returned HTTP ${response.status}`,
      )
    }
    fail(`Vercel API returned HTTP ${response.status}`)
  }
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    fail('Vercel API returned invalid JSON')
  }
}

export async function vercelMutationRequest(request, identity, requestOptions) {
  if (request.method !== 'POST') fail('Mutation request must use POST')
  try {
    return {
      outcome: MUTATION_OUTCOMES.DEFINITIVE_SUCCESS,
      value: await vercelRequest(request, identity, requestOptions),
    }
  } catch (error) {
    if (error instanceof VercelMutationOutcomeError) {
      return { outcome: error.outcome, error }
    }
    throw error
  }
}

async function getVercelProject(identity) {
  return vercelRequest({
    method: 'GET',
    path: `/v9/projects/${encodeURIComponent(identity.projectId)}`,
    query: {},
    expectedStatuses: [200],
  }, identity)
}

async function verifyVercelProject(identity) {
  const project = plainObject(await getVercelProject(identity), 'Vercel project response')
  if (project.id !== EXPECTED_PROJECT_ID || project.name !== EXPECTED_PROJECT_NAME) fail('Unexpected Vercel project')
  if (project.accountId !== EXPECTED_TEAM_ID) fail('Unexpected Vercel project team')
  if (project.nodeVersion !== EXPECTED_NODE_VERSION) fail('Vercel project Node runtime does not match 24.x')
  if (!Array.isArray(project.domains)) fail('Vercel project domains have an invalid shape')
  const domains = project.domains.map((domain) => typeof domain === 'string' ? domain : domain?.name)
  if (!domains.includes(identity.domain)) fail('Production domain is not configured on the expected project')
  return project
}

export function validateDeploymentState(deployment) {
  const record = plainObject(deployment, 'Deployment state response')
  const hasReadyState = own(record, 'readyState')
  const hasState = own(record, 'state')
  if (!hasReadyState && !hasState) fail('Deployment state is missing or invalid')

  for (const key of ['readyState', 'state']) {
    if (!own(record, key)) continue
    const value = record[key]
    if (typeof value !== 'string' || !DEPLOYMENT_STATE_CATEGORY.has(value)) {
      fail(`Deployment ${key} is malformed or unknown`)
    }
  }
  if (hasReadyState && hasState && record.readyState !== record.state) {
    fail('Deployment readyState and state conflict')
  }

  const state = hasReadyState ? record.readyState : record.state
  return { state, category: DEPLOYMENT_STATE_CATEGORY.get(state) }
}

function deploymentState(deployment) {
  return validateDeploymentState(deployment).state
}

function deploymentAliases(deployment) {
  const aliases = []
  for (const key of ['alias', 'aliases']) {
    if (!own(deployment, key)) continue
    if (!Array.isArray(deployment[key])) fail('Deployment aliases have an invalid shape')
    for (const value of deployment[key]) {
      const alias = typeof value === 'string' ? value : value?.alias
      if (typeof alias !== 'string') fail('Deployment alias entry has an invalid shape')
      aliases.push(alias.toLowerCase())
    }
  }
  return aliases
}

function deploymentProjectId(deployment) {
  const candidates = []
  if (own(deployment, 'projectId')) candidates.push(deployment.projectId)
  if (deployment.project !== undefined) {
    const project = plainObject(deployment.project, 'Deployment project')
    if (own(project, 'id')) candidates.push(project.id)
  }
  if (candidates.length === 0 || candidates.some((value) => typeof value !== 'string')) {
    fail('Deployment project identity is missing or invalid')
  }
  if (new Set(candidates).size !== 1) fail('Deployment project identity is ambiguous')
  return candidates[0]
}

function deploymentTeamId(deployment) {
  const candidates = []
  if (own(deployment, 'ownerId')) candidates.push(deployment.ownerId)
  if (deployment.team !== undefined) {
    const team = plainObject(deployment.team, 'Deployment team')
    if (own(team, 'id')) candidates.push(team.id)
  }
  if (candidates.length === 0 || candidates.some((value) => typeof value !== 'string')) {
    fail('Deployment team identity is missing or invalid')
  }
  if (new Set(candidates).size !== 1) fail('Deployment team identity is ambiguous')
  return candidates[0]
}

function assertDeploymentIdentity(deployment, identity) {
  const record = plainObject(deployment, 'Deployment response')
  normalizeDeploymentId(record.id, 'deployment response ID')
  if (deploymentProjectId(record) !== identity.projectId) fail('Deployment belongs to another project')
  if (deploymentTeamId(record) !== identity.teamId) fail('Deployment belongs to another team')
  return record
}

export function trustedDeploymentSha(deployment) {
  const record = plainObject(deployment, 'Deployment')
  const meta = record.meta === undefined ? {} : plainObject(record.meta, 'Deployment metadata')
  const hasReleaseSource = own(meta, 'releaseSource')
  const hasReleaseSha = own(meta, 'releaseSha')
  const hasGitSha = own(meta, 'githubCommitSha')
  const releaseSource = meta.releaseSource
  const releaseShaValue = meta.releaseSha
  const gitShaValue = meta.githubCommitSha

  if (hasReleaseSource || hasReleaseSha) {
    if (!hasReleaseSource || typeof releaseSource !== 'string' || releaseSource !== RELEASE_SOURCE) {
      fail('Deployment release source is missing or not trusted')
    }
    if (!hasReleaseSha || typeof releaseShaValue !== 'string') {
      fail('Controlled deployment release SHA is missing or malformed')
    }
    const releaseSha = normalizeSha(releaseShaValue, 'controlled deployment release SHA')
    if (hasGitSha) {
      if (typeof gitShaValue !== 'string') fail('Deployment Git SHA is malformed')
      const gitSha = normalizeSha(gitShaValue, 'deployment Git SHA')
      if (gitSha !== releaseSha) fail('Deployment release and Git SHA metadata conflict')
    }
    return { sha: releaseSha, provenance: 'CONTROLLED_RELEASE' }
  }

  if (!hasGitSha || typeof gitShaValue !== 'string') {
    fail('Deployment does not expose trustworthy release SHA metadata')
  }
  return { sha: normalizeSha(gitShaValue, 'legacy deployment Git SHA'), provenance: 'LEGACY_GIT' }
}

async function getDeployment(idOrUrl, identity) {
  let target
  if (idOrUrl.startsWith('dpl_')) {
    target = normalizeDeploymentId(idOrUrl)
  } else if (idOrUrl.startsWith('https://')) {
    target = new URL(normalizeDeploymentUrl(idOrUrl)).hostname
  } else {
    target = normalizeDomain(idOrUrl)
  }
  return vercelRequest({
    method: 'GET',
    path: `/v13/deployments/${encodeURIComponent(target)}`,
    query: { withGitRepoInfo: 'true' },
    expectedStatuses: [200],
  }, identity)
}

async function resolveCurrentProduction(identity) {
  const deployment = assertDeploymentIdentity(await getDeployment(identity.domain, identity), identity)
  if (deployment.target !== 'production' || deploymentState(deployment) !== 'READY') {
    fail('Current Production deployment is not READY with target production')
  }
  if (!deploymentAliases(deployment).includes(identity.domain)) fail('Current Production alias is missing')
  return deployment
}

function expectedProductionInputs() {
  return {
    id: normalizeDeploymentId(
      requiredEnv('EXPECTED_CURRENT_PRODUCTION_DEPLOYMENT_ID'),
      'expected Production deployment ID',
    ),
    sha: normalizeSha(requiredEnv('EXPECTED_CURRENT_PRODUCTION_SHA'), 'expected Production SHA'),
  }
}

function assertExpectedProduction(deployment, expected) {
  if (normalizeDeploymentId(deployment.id, 'live Production deployment ID') !== expected.id) {
    fail('Production race guard failed: deployment changed')
  }
  const trusted = trustedDeploymentSha(deployment)
  if (trusted.sha !== expected.sha) fail('Production race guard failed: code SHA changed')
  return trusted
}

export function assertStagedDeployment(
  deployment,
  identity,
  releaseSha,
  { allowProductionAlias = false } = {},
) {
  const record = assertDeploymentIdentity(deployment, identity)
  if (deploymentState(record) !== 'READY' || record.target !== 'production') {
    fail('Staged deployment is not READY with target production')
  }
  const trusted = trustedDeploymentSha(record)
  if (trusted.provenance !== 'CONTROLLED_RELEASE' || trusted.sha !== releaseSha) {
    fail('Staged deployment release metadata does not match')
  }
  const gitSource = plainObject(record.gitSource, 'Staged deployment Git source')
  if (gitSource.type !== 'github' || String(gitSource.repoId) !== String(EXPECTED_REPOSITORY_ID)) {
    fail('Staged deployment Git repository does not match')
  }
  if (gitSource.sha !== releaseSha || gitSource.ref !== releaseSha) {
    fail('Staged deployment Git source is not bound to the exact release SHA')
  }
  if (record.autoAssignCustomDomains !== false) {
    fail('Staged deployment did not preserve disabled custom-domain auto-assignment')
  }
  if (!allowProductionAlias && deploymentAliases(record).includes(identity.domain)) {
    fail('Staged deployment already owns Production traffic')
  }
  if (typeof record.url !== 'string') fail('Staged deployment URL is missing')
  normalizeDeploymentUrl(`https://${record.url}`)
  return record
}

export function assertPromotedDeployment(deployment, identity, releaseSha) {
  const record = assertStagedDeployment(deployment, identity, releaseSha, {
    allowProductionAlias: true,
  })
  if (!deploymentAliases(record).includes(identity.domain)) {
    fail('Promoted deployment does not own the Production domain')
  }
  return record
}

function sleep(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds))
}

async function pollDeploymentReady(deploymentId, identity) {
  const deadline = Date.now() + DEPLOYMENT_POLL_TIMEOUT_MS
  while (Date.now() < deadline) {
    const deployment = await getDeployment(deploymentId, identity)
    const state = deploymentState(plainObject(deployment, 'Deployment poll response'))
    if (state === 'READY') return deployment
    if (TERMINAL_FAILURE_STATES.has(state)) fail(`Staged deployment entered terminal state ${state}`)
    await sleep(DEPLOYMENT_POLL_INTERVAL_MS)
  }
  fail('Staged deployment did not become READY before timeout')
}

export async function createStagedProductionDeployment(releaseSha, identity, requestOptions) {
  const request = buildCreateDeploymentRequest(releaseSha)
  const mutation = await vercelMutationRequest(request, identity, requestOptions)
  if (mutation.outcome === MUTATION_OUTCOMES.AMBIGUOUS_MUTATION) {
    throw new VercelMutationOutcomeError(
      MUTATION_OUTCOMES.AMBIGUOUS_MUTATION,
      'CREATE_DEPLOYMENT_OUTCOME=AMBIGUOUS_MUTATION: a deployment may have been created; no retry was attempted; Production traffic was not intentionally changed; read-only/manual reconciliation is required before another Stage attempt',
    )
  }
  if (mutation.outcome === MUTATION_OUTCOMES.DEFINITIVE_FAILURE) throw mutation.error
  const created = plainObject(mutation.value, 'Create deployment response')
  const deploymentId = normalizeDeploymentId(created.id, 'created deployment ID')
  return pollDeploymentReady(deploymentId, identity)
}

export async function promoteDeployment(projectId, deploymentId, identity, requestOptions) {
  const request = buildPromoteDeploymentRequest(projectId, deploymentId)
  return vercelMutationRequest(request, identity, requestOptions)
}

function assertPreflightDelta(expected, releaseSha) {
  const delta = calculateMigrationDelta(expected.sha, releaseSha)
  const expectedCount = Number(requiredEnv('DB_MIGRATION_DELTA_COUNT'))
  const expectedPresent = requiredEnv('DB_MIGRATION_DELTA_PRESENT')
  if (!Number.isInteger(expectedCount) || expectedCount !== delta.count) {
    fail('Live migration delta differs from unprivileged preflight')
  }
  if (expectedPresent !== String(delta.present)) fail('Live migration presence differs from unprivileged preflight')
  return delta
}

async function runStageVercel() {
  assertMainDispatch()
  const identity = configuredVercelIdentity()
  const expected = expectedProductionInputs()
  const releaseSha = assertCommitReachableFromMain(normalizeSha(requiredEnv('RELEASE_SHA'), 'RELEASE_SHA'))
  await verifyVercelProject(identity)

  const current = await resolveCurrentProduction(identity)
  const trusted = assertExpectedProduction(current, expected)
  assertForwardRelease(trusted.sha, releaseSha)
  const delta = assertPreflightDelta(expected, releaseSha)

  const staged = assertStagedDeployment(
    await createStagedProductionDeployment(releaseSha, identity),
    identity,
    releaseSha,
  )
  const stagedId = normalizeDeploymentId(staged.id, 'staged deployment ID')
  const stagedUrl = normalizeDeploymentUrl(`https://${staged.url}`)

  const finalCurrent = await resolveCurrentProduction(identity)
  const finalTrusted = assertExpectedProduction(finalCurrent, expected)
  assertForwardRelease(finalTrusted.sha, releaseSha)

  appendOutput('staged_deployment_id', stagedId)
  appendOutput('staged_deployment_url', stagedUrl)
  appendSummary([
    `Release SHA: ${releaseSha}`,
    `Staged deployment ID: ${stagedId}`,
    `Staged deployment URL: ${stagedUrl}`,
    `Previous/current Production deployment: ${expected.id}`,
    `Previous/current Production code SHA: ${expected.sha}`,
    `DB migration delta count: ${delta.count}`,
    `DB migration delta present: ${delta.present}`,
    'Production traffic unchanged: true',
  ])
}

async function pollPromotedProduction(stagedId, expectedCurrentId, identity) {
  const deadline = Date.now() + PRODUCTION_POLL_TIMEOUT_MS
  while (Date.now() < deadline) {
    const current = await resolveCurrentProduction(identity)
    const currentId = normalizeDeploymentId(current.id, 'post-promotion Production deployment ID')
    if (currentId === stagedId) return current
    if (currentId !== expectedCurrentId) fail('Unexpected Production deployment appeared during promotion')
    await sleep(DEPLOYMENT_POLL_INTERVAL_MS)
  }
  fail('Promoted deployment did not become Current Production before timeout')
}

export async function reconcileAmbiguousPromotion(
  stagedId,
  expectedCurrentId,
  identity,
  {
    resolveCurrent = resolveCurrentProduction,
    verifyIntended = (deployment) => deployment,
    wait = sleep,
    intervalMs = DEPLOYMENT_POLL_INTERVAL_MS,
    maxAttempts = AMBIGUOUS_PROMOTION_MAX_ATTEMPTS,
  } = {},
) {
  const intendedId = normalizeDeploymentId(stagedId, 'staged deployment ID')
  const previousId = normalizeDeploymentId(expectedCurrentId, 'expected Production deployment ID')
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) fail('Reconciliation attempt bound is invalid')
  if (!Number.isFinite(intervalMs) || intervalMs < 0) fail('Reconciliation interval is invalid')

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let current
    try {
      current = await resolveCurrent(identity)
    } catch {
      current = null
    }
    if (current) {
      const currentId = normalizeDeploymentId(
        current.id,
        'ambiguous-promotion Production deployment ID',
      )
      if (currentId === intendedId) {
        const deployment = verifyIntended(current)
        return {
          outcome: MUTATION_OUTCOMES.DEFINITIVE_SUCCESS,
          reconciliation: 'PROMOTION_AMBIGUITY_RECONCILED=SUCCESS',
          deployment,
        }
      }
      if (currentId !== previousId) {
        fail('EXTERNAL_PRODUCTION_DIVERGENCE: unexpected Production deployment appeared')
      }
    }
    if (attempt < maxAttempts) await wait(intervalMs)
  }

  return {
    outcome: MUTATION_OUTCOMES.AMBIGUOUS_MUTATION,
    reconciliation: 'UNRESOLVED',
  }
}

async function runPromoteVercel() {
  assertMainDispatch()
  const identity = configuredVercelIdentity()
  const expected = expectedProductionInputs()
  const releaseSha = assertCommitReachableFromMain(normalizeSha(requiredEnv('RELEASE_SHA'), 'RELEASE_SHA'))
  const stagedId = normalizeDeploymentId(requiredEnv('STAGED_DEPLOYMENT_ID'), 'staged deployment ID')
  await verifyVercelProject(identity)

  const current = await resolveCurrentProduction(identity)
  const initiallyTrusted = assertExpectedProduction(current, expected)
  assertForwardRelease(initiallyTrusted.sha, releaseSha)
  const delta = calculateMigrationDelta(initiallyTrusted.sha, releaseSha)
  if (!isPromotionAllowed(delta.count)) fail(`Promotion denied by live migration gate: ${delta.count} delta(s)`)

  const staged = assertStagedDeployment(await getDeployment(stagedId, identity), identity, releaseSha)
  if (normalizeDeploymentId(staged.id) === normalizeDeploymentId(current.id)) {
    fail('Staged deployment is already Current Production')
  }

  // The final Production resolution and promotion remain in one trusted process.
  const finalCurrent = await resolveCurrentProduction(identity)
  const finallyTrusted = assertExpectedProduction(finalCurrent, expected)
  if (finallyTrusted.sha !== initiallyTrusted.sha) fail('Production SHA changed during promotion checks')
  const promotion = await promoteDeployment(identity.projectId, stagedId, identity)

  let promoted
  let promotionReconciliation = 'NOT_REQUIRED'
  if (promotion.outcome === MUTATION_OUTCOMES.DEFINITIVE_FAILURE) throw promotion.error
  if (promotion.outcome === MUTATION_OUTCOMES.AMBIGUOUS_MUTATION) {
    const reconciliation = await reconcileAmbiguousPromotion(stagedId, expected.id, identity, {
      verifyIntended: (deployment) => assertPromotedDeployment(deployment, identity, releaseSha),
    })
    if (reconciliation.outcome === MUTATION_OUTCOMES.AMBIGUOUS_MUTATION) {
      throw new VercelMutationOutcomeError(
        MUTATION_OUTCOMES.AMBIGUOUS_MUTATION,
        'PROMOTION_OUTCOME=AMBIGUOUS_MUTATION; RECONCILIATION=UNRESOLVED; no retry or rollback was attempted',
      )
    }
    promoted = reconciliation.deployment
    promotionReconciliation = reconciliation.reconciliation
  } else {
    promoted = await pollPromotedProduction(stagedId, expected.id, identity)
  }
  const promotedRecord = assertPromotedDeployment(promoted, identity, releaseSha)

  let smoke
  try {
    smoke = await fetch(`https://${identity.domain}`, {
      redirect: 'follow',
      signal: AbortSignal.timeout(20_000),
    })
  } catch {
    fail('Post-promotion HTTP smoke request failed')
  }
  if (smoke.status < 200 || smoke.status >= 400) fail(`Post-promotion HTTP smoke returned ${smoke.status}`)
  appendSummary([
    `Promoted deployment ID: ${stagedId}`,
    `Production release SHA: ${releaseSha}`,
    `Production domain: ${identity.domain}`,
    `Promotion ambiguity reconciliation: ${promotionReconciliation}`,
    `HTTP smoke status: ${smoke.status}`,
    'Post-promotion verification: PASS',
  ])
}

async function main() {
  const command = process.argv[2]
  switch (command) {
    case 'preflight-stage':
      await runPreflight({ promotion: false })
      break
    case 'preflight-promote':
      await runPreflight({ promotion: true })
      break
    case 'stage-vercel':
      await runStageVercel()
      break
    case 'promote-vercel':
      await runPromoteVercel()
      break
    case 'migration-delta': {
      const delta = calculateMigrationDelta(process.argv[3], process.argv[4])
      process.stdout.write(`${JSON.stringify({ count: delta.count, present: delta.present, changes: delta.changes })}\n`)
      break
    }
    default:
      fail('Unknown release-control command')
  }
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : ''
if (fileURLToPath(import.meta.url) === invokedPath) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : 'Unknown release-control failure'
    process.stderr.write(`release-control: ${message}\n`)
    process.exitCode = 1
  })
}

import { existsSync, readFileSync, unlinkSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { runWithFixtureLifecycle } from './rls-fixture-lifecycle.mjs'

const requestedEnvFile = process.env.SUPABASE_RLS_ENV_FILE || '.env.local'
const allowedEnvFiles = new Set(['.env.local', '.env.staging.local'])

if (!allowedEnvFiles.has(requestedEnvFile)) {
  console.error(`RLS SAFETY GUARD: unsupported environment file ${requestedEnvFile}`)
  process.exit(2)
}

const envFile = resolve(requestedEnvFile)
if (!existsSync(envFile)) {
  console.error(`RLS SAFETY GUARD: environment file not found: ${requestedEnvFile}`)
  process.exit(2)
}

// The selected file must win over inherited shell values, especially a
// production URL left in a developer session.
const childEnv = { ...process.env }
for (const name of [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_TEST_TARGET',
  'SUPABASE_EXPECTED_PROJECT_REF',
  'SUPABASE_FORBIDDEN_PROJECT_REF',
]) {
  delete childEnv[name]
}

function envFileValue(name) {
  const prefix = `${name}=`
  const line = readFileSync(envFile, 'utf8')
    .split(/\r?\n/)
    .find((entry) => entry.trimStart().startsWith(prefix))
  return line?.trim().slice(prefix.length)
}

const selectedTarget = envFileValue('SUPABASE_TEST_TARGET') || 'local'
const usesLocalDocker = selectedTarget === 'local'
const legalV2FixturesEnabled = usesLocalDocker || process.env.LEGAL_V2_RLS_FIXTURES === 'true'
const validationScripts = [resolve('scripts/rls-antileak.mjs')]
if (legalV2FixturesEnabled) validationScripts.push(resolve('scripts/legal-v2-rls.mjs'))
if (legalV2FixturesEnabled) childEnv.LEGAL_V2_RLS_FIXTURES = 'true'

const fixtureRunId = randomUUID()
const baselineFile = join(tmpdir(), `clikarage-rls-baseline-${fixtureRunId}.json`)
childEnv.RLS_FIXTURE_RUN_ID = fixtureRunId
childEnv.RLS_FIXTURE_BASELINE_FILE = baselineFile

function runNodeScript(script, args = []) {
  return spawnSync(
    process.execPath,
    [`--env-file=${envFile}`, script, ...args],
    { env: childEnv, stdio: 'inherit' },
  )
}

const fixtureHelper = resolve('scripts/rls-fixture-admin.mjs')

function requireSuccess(result, context) {
  if (result.error) throw new Error(`${context}: ${result.error.message}`)
  if (result.status !== 0) throw new Error(`${context}: exited with ${result.status ?? 1}`)
}

let exitStatus = 0
try {
  await runWithFixtureLifecycle({
    prepare: async () => {
      const result = runNodeScript(fixtureHelper, ['prepare'])
      requireSuccess(result, 'unable to capture the fixture baseline')
      return baselineFile
    },
    run: async () => {
    for (const validationScript of validationScripts) {
      const result = runNodeScript(validationScript)
        requireSuccess(result, `validation failed in ${validationScript}`)
    }
    },
    cleanup: async () => {
      const result = runNodeScript(fixtureHelper, ['cleanup'])
      requireSuccess(result, 'fixture cleanup did not restore the baseline')
    },
  })
} catch (error) {
  console.error(`RLS SAFETY GUARD: ${error.message}`)
  exitStatus = 1
} finally {
  if (existsSync(baselineFile)) unlinkSync(baselineFile)
}

process.exit(exitStatus)

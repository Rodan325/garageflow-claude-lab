import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'

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

const validationScripts = [resolve('scripts/rls-antileak.mjs')]
if (process.env.LEGAL_V2_RLS_FIXTURES === 'true') {
  validationScripts.push(resolve('scripts/legal-v2-rls.mjs'))
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

const fixtureRunId = randomUUID()
childEnv.RLS_FIXTURE_RUN_ID = fixtureRunId

function runNodeScript(script, args = []) {
  return spawnSync(
    process.execPath,
    [`--env-file=${envFile}`, script, ...args],
    { env: childEnv, stdio: 'inherit' },
  )
}

const localFixtureHelper = resolve('scripts/local-rls-fixtures.mjs')
let exitStatus = 0

try {
  if (usesLocalDocker) {
    const prepare = runNodeScript(localFixtureHelper, ['prepare'])
    if (prepare.error) {
      console.error(`RLS SAFETY GUARD: unable to prepare local fixtures: ${prepare.error.message}`)
      exitStatus = 2
    } else if (prepare.status !== 0) {
      exitStatus = prepare.status ?? 1
    }
  }

  if (exitStatus === 0) {
    for (const validationScript of validationScripts) {
      const result = runNodeScript(validationScript)

      if (result.error) {
        console.error(`RLS SAFETY GUARD: unable to start validation: ${result.error.message}`)
        exitStatus = 2
        break
      }
      if (result.status !== 0) {
        exitStatus = result.status ?? 1
        break
      }
    }
  }
} finally {
  if (usesLocalDocker) {
    const cleanup = runNodeScript(localFixtureHelper, ['cleanup'])
    if (cleanup.error) {
      console.error(`RLS SAFETY GUARD: unable to clean local fixtures: ${cleanup.error.message}`)
      exitStatus = 2
    } else if (cleanup.status !== 0) {
      exitStatus = cleanup.status ?? 1
    }
  }
}

process.exit(exitStatus)

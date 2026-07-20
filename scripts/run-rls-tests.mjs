import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
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

for (const validationScript of validationScripts) {
  const result = spawnSync(
    process.execPath,
    [`--env-file=${envFile}`, validationScript],
    { env: childEnv, stdio: 'inherit' },
  )

  if (result.error) {
    console.error(`RLS SAFETY GUARD: unable to start validation: ${result.error.message}`)
    process.exit(2)
  }
  if (result.status !== 0) process.exit(result.status ?? 1)
}

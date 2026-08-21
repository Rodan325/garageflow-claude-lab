import { readFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { findLocalSupabaseDatabase } from './local-supabase-docker.mjs'
import { assertSupabaseTestTarget } from './rls-target-guard.mjs'

try {
  assertSupabaseTestTarget(process.env.VITE_SUPABASE_URL, { mode: 'local' })
} catch (error) {
  console.error(`CORE CAPABILITY SAFETY GUARD: ${error.message}`)
  process.exit(2)
}

if ((process.env.SUPABASE_TEST_TARGET || 'local') !== 'local') {
  console.error('CORE CAPABILITY SAFETY GUARD: refusing a non-local target')
  process.exit(2)
}

const projectName = basename(resolve('.'))
let databaseContainer
try {
  databaseContainer = findLocalSupabaseDatabase({ projectId: projectName })
} catch (error) {
  console.error(`CORE CAPABILITY SAFETY GUARD: ${error.message}`)
  process.exit(2)
}

const contractPath = resolve('scripts/core-data-api-capabilities-db-contract.sql')
const contract = spawnSync(
  'docker',
  [
    'exec',
    '-i',
    databaseContainer.containerName,
    'psql',
    '-v',
    'ON_ERROR_STOP=1',
    '-U',
    'postgres',
    '-d',
    'postgres',
  ],
  {
    input: readFileSync(contractPath, 'utf8'),
    encoding: 'utf8',
  },
)

if (
  contract.error
  || contract.status !== 0
  || !contract.stdout.includes('CORE_DATA_API_CAPABILITIES:PASS')
) {
  console.error(
    `CORE CAPABILITY CONTRACT: ${
      contract.error?.message
      || contract.stderr?.trim()
      || contract.stdout.trim()
      || 'unknown failure'
    }`,
  )
  process.exit(1)
}

console.log('CORE CAPABILITY CONTRACT: all assertions passed; transaction rolled back')

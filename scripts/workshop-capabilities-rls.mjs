import { readFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { assertSupabaseTestTarget } from './rls-target-guard.mjs'

try {
  assertSupabaseTestTarget(process.env.VITE_SUPABASE_URL, { mode: 'local' })
} catch (error) {
  console.error(`WORKSHOP CAPABILITY SAFETY GUARD: ${error.message}`)
  process.exit(2)
}

if ((process.env.SUPABASE_TEST_TARGET || 'local') !== 'local') {
  console.error('WORKSHOP CAPABILITY SAFETY GUARD: refusing a non-local target')
  process.exit(2)
}

const projectName = basename(resolve('.'))
const dockerList = spawnSync(
  'docker',
  [
    'ps',
    '--filter', `label=com.supabase.cli.project=${projectName}`,
    '--format', '{{.Names}}',
  ],
  { encoding: 'utf8' },
)

if (dockerList.error || dockerList.status !== 0) {
  console.error(
    `WORKSHOP CAPABILITY SAFETY GUARD: ${
      dockerList.error?.message || dockerList.stderr?.trim() || 'cannot inspect Docker'
    }`,
  )
  process.exit(2)
}

const databaseContainers = dockerList.stdout
  .split(/\r?\n/)
  .map((name) => name.trim())
  .filter((name) => name.startsWith('supabase_db_'))

if (databaseContainers.length !== 1) {
  console.error(
    `WORKSHOP CAPABILITY SAFETY GUARD: expected one local database container, found ${databaseContainers.length}`,
  )
  process.exit(2)
}

const contract = spawnSync(
  'docker',
  [
    'exec',
    '-i',
    databaseContainers[0],
    'psql',
    '-v',
    'ON_ERROR_STOP=1',
    '-U',
    'postgres',
    '-d',
    'postgres',
  ],
  {
    input: readFileSync(resolve('scripts/workshop-capabilities-db-contract.sql'), 'utf8'),
    encoding: 'utf8',
  },
)

if (
  contract.error
  || contract.status !== 0
  || !contract.stdout.includes('WORKSHOP_CAPABILITIES:PASS')
) {
  console.error(
    `WORKSHOP CAPABILITY CONTRACT: ${
      contract.error?.message
      || contract.stderr?.trim()
      || contract.stdout.trim()
      || 'unknown failure'
    }`,
  )
  process.exit(1)
}

console.log('WORKSHOP CAPABILITY CONTRACT: all assertions passed; transaction rolled back')

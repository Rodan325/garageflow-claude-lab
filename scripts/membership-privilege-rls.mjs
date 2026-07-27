import { readFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { assertSupabaseTestTarget } from './rls-target-guard.mjs'

try {
  assertSupabaseTestTarget(process.env.VITE_SUPABASE_URL, { mode: 'local' })
} catch (error) {
  console.error(`PHASE 4A MEMBERSHIP SAFETY GUARD: ${error.message}`)
  process.exit(2)
}

if ((process.env.SUPABASE_TEST_TARGET || 'local') !== 'local') {
  console.error('PHASE 4A MEMBERSHIP SAFETY GUARD: refusing a non-local target')
  process.exit(2)
}

const projectName = basename(resolve('.'))
const dockerList = spawnSync(
  'docker',
  ['ps', '--filter', `label=com.supabase.cli.project=${projectName}`, '--format', '{{.Names}}'],
  { encoding: 'utf8' },
)
const databaseContainers = (dockerList.stdout || '')
  .split(/\r?\n/)
  .map((name) => name.trim())
  .filter((name) => name.startsWith('supabase_db_'))

if (dockerList.error || dockerList.status !== 0 || databaseContainers.length !== 1) {
  console.error('PHASE 4A MEMBERSHIP SAFETY GUARD: expected one local database container')
  process.exit(2)
}

const databaseContainer = databaseContainers[0]
const psqlArgs = [
  'exec',
  '-i',
  databaseContainer,
  'psql',
  '-v',
  'ON_ERROR_STOP=1',
  '-U',
  'postgres',
  '-d',
  'postgres',
  '-At',
]
const contractSql = readFileSync(
  resolve('scripts/membership-privilege-db-contract.sql'),
  'utf8',
)
const contract = spawnSync('docker', psqlArgs, {
  input: contractSql,
  encoding: 'utf8',
})

if (
  contract.error
  || contract.status !== 0
  || !contract.stdout.includes('PHASE4_MEMBERSHIP_SECURITY:36/36')
) {
  console.error(
    `PHASE 4A MEMBERSHIP CONTRACT: failed: ${
      contract.error?.message
      || contract.stderr?.trim()
      || 'missing success marker'
    }`,
  )
  process.exit(1)
}

function runConcurrentDenial(actorId, expectedMessage) {
  const sql = `
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '${actorId}', true);
select public.deactivate_organization_member((
  select member.id
  from public.garage_members member
  where member.user_id = 'b0000000-0000-4000-8000-000000000001'
));
rollback;
`

  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn('docker', psqlArgs, { stdio: ['pipe', 'pipe', 'pipe'] })
    let stderr = ''
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', (chunk) => {
      stderr += chunk
    })
    child.on('error', rejectPromise)
    child.on('close', (code) => {
      resolvePromise({
        denied: code !== 0 && stderr.includes(expectedMessage),
        stderr,
      })
    })
    child.stdin.end(sql)
  })
}

const concurrentOwnerAttempts = await Promise.all([
  runConcurrentDenial(
    'b0000000-0000-4000-8000-000000000001',
    'Self membership changes are forbidden',
  ),
  runConcurrentDenial(
    'b0000000-0000-4000-8000-000000000002',
    'Owner membership changes require the dedicated ownership workflow',
  ),
])

if (concurrentOwnerAttempts.some((attempt) => !attempt.denied)) {
  console.error('PHASE 4A MEMBERSHIP CONTRACT: concurrent last-owner denial failed')
  process.exit(1)
}

const ownerCheck = spawnSync(
  'docker',
  [
    ...psqlArgs.slice(0, -1),
    '-Atc',
    `select count(*) from public.garages garage
     where not exists (
       select 1
       from public.garage_members member
       where member.garage_id = garage.id
         and member.status = 'active'
         and member.role = 'owner'
         and member.organization_role = 'organization_owner'
     );`,
  ],
  { encoding: 'utf8' },
)

if (ownerCheck.error || ownerCheck.status !== 0 || ownerCheck.stdout.trim() !== '0') {
  console.error('PHASE 4A MEMBERSHIP CONTRACT: last-owner baseline was not preserved')
  process.exit(1)
}

console.log(
  'PHASE 4A MEMBERSHIP CONTRACT: 36/36 assertions passed; '
  + 'concurrent last-owner attempts denied; transaction rolled back',
)

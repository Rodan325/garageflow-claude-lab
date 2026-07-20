/**
 * Privileged fixture lifecycle for the local Supabase Docker stack only.
 *
 * The behavioural suites continue to use publishable/authenticated clients.
 * This helper only prepares and removes test-owned rows that the product keeps
 * immutable or persistent by design, so repeated runs start and end cleanly.
 */
import { basename, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { assertSupabaseTestTarget } from './rls-target-guard.mjs'

const mode = process.argv[2]
if (!['prepare', 'cleanup'].includes(mode)) {
  console.error('LOCAL RLS FIXTURES: expected prepare or cleanup')
  process.exit(2)
}

try {
  assertSupabaseTestTarget(process.env.VITE_SUPABASE_URL, { mode: 'local' })
} catch (error) {
  console.error(`LOCAL RLS FIXTURES: ${error.message}`)
  process.exit(2)
}

if ((process.env.SUPABASE_TEST_TARGET || 'local') !== 'local') {
  console.error('LOCAL RLS FIXTURES: refusing a non-local test target')
  process.exit(2)
}

const fixtureRunId = process.env.RLS_FIXTURE_RUN_ID
if (!fixtureRunId || !/^[0-9a-f-]{36}$/.test(fixtureRunId)) {
  console.error('LOCAL RLS FIXTURES: RLS_FIXTURE_RUN_ID must be a generated UUID')
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
  console.error(`LOCAL RLS FIXTURES: cannot inspect Docker: ${dockerList.error?.message || dockerList.stderr?.trim()}`)
  process.exit(2)
}

const databaseContainers = dockerList.stdout
  .split(/\r?\n/)
  .map((name) => name.trim())
  .filter((name) => name.startsWith('supabase_db_'))

if (databaseContainers.length !== 1) {
  console.error(`LOCAL RLS FIXTURES: expected one local database container, found ${databaseContainers.length}`)
  process.exit(2)
}

const cleanupSql = `
begin;

delete from public.maintenance_reminders
where source in ('local_validation', 'staging_journey_validation')
   or source like 'rls_validation:%';

delete from public.legal_acceptances
where application_version like 'rls-validation:%'
   or acceptance_context like 'rls_validation:%';

delete from private.legal_document_versions
where document_version = 'rls-validation-20260720';

commit;
`

const prepareLegalSql = process.env.LEGAL_V2_RLS_FIXTURES === 'true'
  ? `
insert into private.legal_document_versions (
  document_id, document_version, language, sha256, status, published_at,
  effective_at, supersedes, requires_acceptance, acceptance_scope, material_change
)
values
  (
    'terms_client', 'rls-validation-20260720', 'fr',
    '5b2d8b1500f446459d79ee22976a0f632db2cedf2329116961c99501e97b3640',
    'effective', now(), now(), null, true, 'user', true
  ),
  (
    'dpa', 'rls-validation-20260720', 'fr',
    '5c88474d7df764bf96ce8f90f2f83edc48429e47359aece2a740fce63782766e',
    'effective', now(), now(), null, true, 'organization', true
  );
`
  : ''

const verifySql = `
select json_build_object(
  'reminders', (
    select count(*) from public.maintenance_reminders
    where source in ('local_validation', 'staging_journey_validation')
       or source like 'rls_validation:%'
  ),
  'requests', (
    select count(*) from public.service_requests
    where service_name like 'Local validation %'
  ),
  'acceptances', (
    select count(*) from public.legal_acceptances
    where application_version like 'rls-validation:%'
       or acceptance_context like 'rls_validation:%'
  ),
  'documents', (
    select count(*) from private.legal_document_versions
    where document_version = 'rls-validation-20260720'
  )
)::text;
`

const sql = mode === 'prepare'
  ? `${cleanupSql}\n${prepareLegalSql}`
  : `${cleanupSql}\n${verifySql}`

const postgres = spawnSync(
  'docker',
  [
    'exec', '-i', databaseContainers[0],
    'psql', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'postgres', '-At',
  ],
  { input: sql, encoding: 'utf8' },
)

if (postgres.error || postgres.status !== 0) {
  console.error(`LOCAL RLS FIXTURES: ${mode} failed: ${postgres.error?.message || postgres.stderr?.trim()}`)
  process.exit(2)
}

if (mode === 'cleanup') {
  const resultLine = postgres.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.startsWith('{'))
  const counts = resultLine ? JSON.parse(resultLine) : null
  if (!counts || Object.values(counts).some((count) => Number(count) !== 0)) {
    console.error(`LOCAL RLS FIXTURES: residual fixtures detected: ${JSON.stringify(counts)}`)
    process.exit(1)
  }
  console.log(`LOCAL RLS FIXTURES: cleanup verified for run ${fixtureRunId}`)
} else {
  console.log(`LOCAL RLS FIXTURES: prepared run ${fixtureRunId}`)
}

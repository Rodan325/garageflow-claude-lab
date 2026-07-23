/**
 * Privileged fixture lifecycle for approved RLS validation targets.
 *
 * Application assertions still use publishable/authenticated clients. This
 * helper only snapshots and removes rows owned by one validation run. Remote
 * execution is restricted to the approved staging project linked by the CLI.
 */
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fixtureSnapshotDifferences } from './rls-fixture-lifecycle.mjs'
import {
  APPROVED_STAGING_REF,
  FORBIDDEN_PRODUCTION_REF,
  assertSupabaseTestTarget,
} from './rls-target-guard.mjs'

const action = process.argv[2]
if (!['prepare', 'cleanup'].includes(action)) {
  console.error('RLS FIXTURE ADMIN: expected prepare or cleanup')
  process.exit(2)
}

const targetMode = process.env.SUPABASE_TEST_TARGET || 'local'
const fixtureRunId = process.env.RLS_FIXTURE_RUN_ID
const baselineFile = process.env.RLS_FIXTURE_BASELINE_FILE
const legalFixturesEnabled = process.env.LEGAL_V2_RLS_FIXTURES === 'true'

if (!fixtureRunId || !/^[0-9a-f-]{36}$/.test(fixtureRunId)) {
  console.error('RLS FIXTURE ADMIN: RLS_FIXTURE_RUN_ID must be a generated UUID')
  process.exit(2)
}
if (!baselineFile || !resolve(baselineFile).startsWith(resolve(tmpdir()))) {
  console.error('RLS FIXTURE ADMIN: baseline file must stay in the operating-system temp directory')
  process.exit(2)
}

try {
  assertSupabaseTestTarget(process.env.VITE_SUPABASE_URL, {
    mode: targetMode,
    expectedRef: process.env.SUPABASE_EXPECTED_PROJECT_REF,
    forbiddenRef: process.env.SUPABASE_FORBIDDEN_PROJECT_REF,
  })
} catch (error) {
  console.error(`RLS FIXTURE ADMIN: ${error.message}`)
  process.exit(2)
}

if (!['local', 'staging'].includes(targetMode)) {
  console.error(`RLS FIXTURE ADMIN: refusing unsupported target ${targetMode}`)
  process.exit(2)
}

function quoted(value) {
  return `'${value.replaceAll("'", "''")}'`
}

function snapshotSql() {
  return `
with validation_requests as (
  select id
  from public.service_requests
  where service_name like 'Local validation %'
),
snapshot as (
  select json_build_object(
    'counts', json_build_object(
      'service_requests', (select count(*) from public.service_requests),
      'maintenance_reminders', (select count(*) from public.maintenance_reminders),
      'legal_acceptances', (select count(*) from public.legal_acceptances),
      'legal_document_versions', (select count(*) from private.legal_document_versions),
      'storage_objects', (select count(*) from storage.objects),
      'quotes', (select count(*) from public.quotes),
      'timeline', (select count(*) from public.service_request_timeline),
      'recommendations', (select count(*) from public.workshop_recommendations),
      'recommendation_decisions', (select count(*) from public.recommendation_decisions),
      'attachments', (select count(*) from public.service_request_attachments),
      'notifications', (select count(*) from public.notification_outbox),
      'delivery_reports', (select count(*) from public.delivery_reports),
      'transfers', (select count(*) from public.service_request_transfers),
      'transfer_events', (select count(*) from public.service_request_transfer_events)
    ),
    'owned', json_build_object(
      'requests', coalesce((
        select json_agg(id::text order by id)
        from validation_requests
      ), '[]'::json),
      'reminders', coalesce((
        select json_agg(id::text order by id)
        from public.maintenance_reminders
        where source like 'rls_validation:%'
      ), '[]'::json),
      'legal_acceptances', coalesce((
        select json_agg(id::text order by id)
        from public.legal_acceptances
        where document_version = 'rls-validation-20260720'
      ), '[]'::json),
      'legal_documents', coalesce((
        select json_agg(
          document_id || ':' || language || ':' || document_version
          order by document_id, language, document_version
        )
        from private.legal_document_versions
        where document_version = 'rls-validation-20260720'
      ), '[]'::json),
      'storage_objects', coalesce((
        select json_agg(object.id::text order by object.id)
        from storage.objects object
        where split_part(object.name, '/', 2) in (
          select id::text from validation_requests
        )
      ), '[]'::json)
    )
  ) as value
)
select 'RLS_SNAPSHOT:' || value::text from snapshot;
`
}

const cleanupSql = `
begin;

delete from public.maintenance_reminders
where source like 'rls_validation:' || ${quoted(fixtureRunId)} || ':%';

delete from public.legal_acceptances
where document_version = 'rls-validation-20260720'
  and (
    application_version in (
      'legal-current-document-rpc-v1',
      'legal-current-document-rpc-v2'
    )
    or application_version like 'rls-validation:%'
    or acceptance_context like 'rls_validation:%'
  );

delete from private.legal_document_versions
where document_version = 'rls-validation-20260720';

delete from public.service_requests
where service_name like 'Local validation ' || ${quoted(fixtureRunId)} || ' %';

commit;
`

const prepareLegalSql = legalFixturesEnabled
  ? `
insert into private.legal_document_versions (
  document_id, document_version, language, sha256, status, published_at,
  effective_at, supersedes, requires_acceptance, acceptance_scope, material_change
)
values
  (
    'terms_client', 'rls-validation-20260720', 'fr',
    '75148cb8161fa94a561ce55528d2fd9184ea2ad91f5e3a8619016f38fc6d31a7',
    'effective', now(), now(), null, true, 'user', true
  ),
  (
    'terms_pro', 'rls-validation-20260720', 'fr',
    'bfb31cbfcb840155475d8ae6ad236893730de4558d1a3564143b4097dcadf170',
    'effective', now(), now(), null, true, 'organization', true
  ),
  (
    'terms_pro', 'rls-validation-20260720', 'en',
    'b1e9e013d85d1c6d38f15b3bc8aae3e1953a472040b130fa6dac41dbff3c561c',
    'effective', now(), now(), null, true, 'organization', true
  ),
  (
    'terms_pro', 'rls-validation-20260720', 'ar',
    'a98b4bd3d0a8a5f46c4744efe3417dcf6e8634a99d519e36652c975e8c77406a',
    'effective', now(), now(), null, true, 'organization', true
  ),
  (
    'dpa', 'rls-validation-20260720', 'fr',
    '484d5bba3263046198fb04b4326b1b683a66c386d21dc26f1ce937dc17878120',
    'effective', now(), now(), null, true, 'organization', true
  );
`
  : ''

function assertStagingLink() {
  const projectRefFile = resolve('supabase/.temp/project-ref')
  if (!existsSync(projectRefFile)) {
    throw new Error('staging execution requires an existing Supabase CLI link')
  }
  const projectRef = readFileSync(projectRefFile, 'utf8').trim()
  if (projectRef === FORBIDDEN_PRODUCTION_REF) {
    throw new Error('refusing the forbidden production CLI link')
  }
  if (projectRef !== APPROVED_STAGING_REF) {
    throw new Error(`refusing unapproved linked project ${projectRef || '(empty)'}`)
  }
}

function executeSql(sql) {
  if (targetMode === 'local') {
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
      throw new Error(dockerList.error?.message || dockerList.stderr?.trim() || 'cannot inspect Docker')
    }
    const databaseContainers = dockerList.stdout
      .split(/\r?\n/)
      .map((name) => name.trim())
      .filter((name) => name.startsWith('supabase_db_'))
    if (databaseContainers.length !== 1) {
      throw new Error(`expected one local database container, found ${databaseContainers.length}`)
    }
    const postgres = spawnSync(
      'docker',
      [
        'exec', '-i', databaseContainers[0],
        'psql', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'postgres', '-At',
      ],
      { input: sql, encoding: 'utf8' },
    )
    if (postgres.error || postgres.status !== 0) {
      throw new Error(postgres.error?.message || postgres.stderr?.trim() || 'local SQL failed')
    }
    return postgres.stdout
  }

  assertStagingLink()
  const sqlFile = join(tmpdir(), `clikarage-rls-${fixtureRunId}-${action}.sql`)
  writeFileSync(sqlFile, sql, { encoding: 'utf8', flag: 'wx' })
  try {
    const query = spawnSync(
      'npx.cmd',
      ['supabase', 'db', 'query', '--linked', '--file', sqlFile],
      { encoding: 'utf8' },
    )
    if (query.error || query.status !== 0) {
      throw new Error(query.error?.message || query.stderr?.trim() || 'staging SQL failed')
    }
    return `${query.stdout}\n${query.stderr}`
  } finally {
    if (existsSync(sqlFile)) unlinkSync(sqlFile)
  }
}

function parseSnapshot(output) {
  const match = output.match(/RLS_SNAPSHOT:(\{.*\})/)
  if (!match) throw new Error('snapshot output marker is missing')
  return JSON.parse(match[1])
}

function describeDifferences(differences) {
  return differences.map((difference) => {
    if (difference.identifiers) {
      return `${difference.category}=[${difference.identifiers.join(',')}]`
    }
    return `${difference.category}:${difference.before}->${difference.after}`
  }).join('; ')
}

try {
  if (action === 'prepare') {
    const baseline = parseSnapshot(executeSql(snapshotSql()))
    const preexisting = Object.entries(baseline.owned)
      .filter(([, identifiers]) => Array.isArray(identifiers) && identifiers.length > 0)
      .map(([category, identifiers]) => ({ category: `owned.${category}`, identifiers }))
    if (preexisting.length > 0) {
      throw new Error(`pre-existing validation fixtures detected: ${describeDifferences(preexisting)}`)
    }
    writeFileSync(baselineFile, JSON.stringify(baseline), { encoding: 'utf8', flag: 'wx' })
    if (prepareLegalSql) executeSql(prepareLegalSql)
    console.log(`RLS FIXTURE ADMIN: baseline captured for ${targetMode} run ${fixtureRunId}`)
  } else {
    if (!existsSync(baselineFile)) throw new Error('baseline file is missing')
    const baseline = JSON.parse(readFileSync(baselineFile, 'utf8'))
    const beforeCleanup = parseSnapshot(executeSql(snapshotSql()))
    executeSql(cleanupSql)
    const current = parseSnapshot(executeSql(snapshotSql()))
    const differences = fixtureSnapshotDifferences(baseline, current)
    if (differences.length > 0) {
      const observedIdentifiers = Object.entries(beforeCleanup.owned)
        .filter(([, identifiers]) => Array.isArray(identifiers) && identifiers.length > 0)
        .map(([category, identifiers]) => ({ category: `observed.${category}`, identifiers }))
      throw new Error(`residual fixtures detected: ${describeDifferences([
        ...differences,
        ...observedIdentifiers,
      ])}`)
    }
    console.log(`RLS FIXTURE ADMIN: cleanup restored the exact baseline for ${targetMode} run ${fixtureRunId}`)
  }
} catch (error) {
  console.error(`RLS FIXTURE ADMIN: ${action} failed: ${error.message}`)
  process.exit(1)
}

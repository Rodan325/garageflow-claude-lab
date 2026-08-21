/**
 * Builds the local baseline atomically from the two tracked fixture files.
 * The command is deliberately baseline-only: usable shared fixture passwords
 * belong to a separate, explicit rekey workflow.
 */
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { parseEnv } from 'node:util'
import {
  findLocalSupabaseDatabase,
  LOCAL_SUPABASE_DB_PORT,
  LOCAL_SUPABASE_PROJECT_ID,
} from './local-supabase-docker.mjs'
import { assertLocalPostgresUrl, assertSupabaseTestTarget } from './rls-target-guard.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const ENV_FILE = join(ROOT, '.env.local')
const SEED_SQL = join(ROOT, 'supabase', 'seed.sql')
const RLS_FIXTURES_SQL = join(HERE, 'rls-fixtures.sql')

function textFrom(readFile, path) {
  return String(readFile(path, 'utf8'))
}

function nonEmptyEnvironmentValue(env, expectedName) {
  const actualName = Object.keys(env).find((key) => key.toLowerCase() === expectedName.toLowerCase())
  return actualName !== undefined && String(env[actualName]).length > 0
}

export function loadLocalSeedTarget({ readFile = readFileSync, envFilePath = ENV_FILE } = {}) {
  let metadata
  try {
    metadata = parseEnv(textFrom(readFile, envFilePath))
  } catch {
    throw new Error('Unable to read the established local environment metadata')
  }

  if (nonEmptyEnvironmentValue(metadata, 'SEED_FIXTURE_PASSWORD')) {
    throw new Error('SEED_FIXTURE_PASSWORD must not be stored in the local environment file')
  }
  assertSupabaseTestTarget(metadata.VITE_SUPABASE_URL, { mode: 'local' })
  return assertLocalPostgresUrl(metadata.SUPABASE_LOCAL_DB_URL, 'SUPABASE_LOCAL_DB_URL', {
    expectedPort: LOCAL_SUPABASE_DB_PORT,
    expectedDatabase: 'postgres',
  })
}

export function buildChildEnv(baseEnv) {
  const env = { ...baseEnv }
  for (const key of Object.keys(env)) {
    if (/^(?:PG|SUPABASE_|VITE_SUPABASE_|SEED_FIXTURE_PASSWORD$)/i.test(key)) delete env[key]
  }
  return env
}

function assertNoTransactionControl(sql, name) {
  if (/^\s*(?:begin|start\s+transaction|commit|rollback)\s*;/im.test(sql)) {
    throw new Error(`${name} must not contain its own transaction control`)
  }
}

export function buildAtomicSeedSql(seedSql, fixtureSql) {
  assertNoTransactionControl(seedSql, 'supabase/seed.sql')
  assertNoTransactionControl(fixtureSql, 'scripts/rls-fixtures.sql')
  return [
    '\\set ON_ERROR_STOP on',
    'begin;',
    "select pg_catalog.set_config('seed.fixture_password', '', false);",
    '-- BEGIN supabase/seed.sql',
    seedSql.trim(),
    '-- END supabase/seed.sql',
    '-- BEGIN scripts/rls-fixtures.sql',
    fixtureSql.trim(),
    '-- END scripts/rls-fixtures.sql',
    "select pg_catalog.set_config('seed.fixture_password', '', false);",
    'commit;',
    '',
  ].join('\n')
}

export function run({
  env = process.env,
  spawn = spawnSync,
  readFile = readFileSync,
  envFilePath = ENV_FILE,
  seedPath = SEED_SQL,
  fixturePath = RLS_FIXTURES_SQL,
  findDatabase = findLocalSupabaseDatabase,
} = {}) {
  if (nonEmptyEnvironmentValue(env, 'SEED_FIXTURE_PASSWORD')) {
    throw new Error('SEED_FIXTURE_PASSWORD is not accepted by the baseline seed workflow')
  }

  loadLocalSeedTarget({ readFile, envFilePath })
  const database = findDatabase({
    projectId: LOCAL_SUPABASE_PROJECT_ID,
    expectedHostPort: LOCAL_SUPABASE_DB_PORT,
    requireHealthy: true,
    spawn,
  })

  const sql = buildAtomicSeedSql(
    textFrom(readFile, seedPath),
    textFrom(readFile, fixturePath),
  )
  const result = spawn(
    'docker',
    [
      'exec',
      '-i',
      database.containerName,
      'psql',
      '-X',
      '-v',
      'ON_ERROR_STOP=1',
      '-U',
      'postgres',
      '-d',
      'postgres',
    ],
    {
      input: sql,
      encoding: 'utf8',
      env: buildChildEnv(env),
      shell: false,
      windowsHide: true,
    },
  )

  if (result.error) throw new Error('Unable to execute psql inside the verified local database container')
  if (typeof result.status === 'number') return result.status
  if (result.signal) throw new Error(`Local baseline psql was terminated by ${result.signal}`)
  return 1
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const status = run()
    if (status !== 0) console.error('LOCAL BASELINE SEED: failed inside the verified local database container')
    process.exit(status)
  } catch (error) {
    console.error(`LOCAL BASELINE SEED SAFETY GUARD: ${error.message}`)
    process.exit(2)
  }
}

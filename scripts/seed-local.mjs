/**
 * Applies the local fixtures — supabase/seed.sql then scripts/rls-fixtures.sql —
 * through scripts/seed-local.sql, over one psql connection.
 *
 * Why a Node wrapper rather than a shell one-liner in package.json:
 *
 *  - npm runs scripts through cmd.exe on Windows, where `"$VAR"` is not
 *    expanded and would reach psql as a literal. Node behaves the same
 *    everywhere.
 *  - The connection URL is validated before psql is spawned, so a target that
 *    is not a loopback address is refused before any SQL runs. A file name and
 *    a comment are not a safeguard.
 *  - Connection details go to the child through the environment, so neither the
 *    database password nor the fixture password appears in a command line.
 *
 * Usage — local development databases only:
 *   read -rs -p 'Fixture password: ' fixture_pw
 *   printf '\n'
 *   SEED_FIXTURE_PASSWORD="$fixture_pw" npm run db:seed:local
 *   unset fixture_pw
 *
 * Leave SEED_FIXTURE_PASSWORD unset and every fixture gets a random password
 * nobody knows. That is the default and the recommended path.
 */
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { assertLocalPostgresUrl } from './rls-target-guard.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const WRAPPER_SQL = join(HERE, 'seed-local.sql')

export function buildChildEnv(baseEnv, target) {
  const env = { ...baseEnv }
  // The URL has been parsed; the child does not need it, and it carries the
  // database password.
  delete env.SUPABASE_LOCAL_DB_URL
  env.PGHOST = target.host
  env.PGPORT = target.port
  env.PGDATABASE = target.database
  if (target.user) env.PGUSER = target.user
  if (target.password) env.PGPASSWORD = target.password
  else delete env.PGPASSWORD
  // SEED_FIXTURE_PASSWORD is deliberately left in place: seed-local.sql reads it
  // with \getenv. It is absent from argv and lives only in psql's environment.
  return env
}

export function run({ env = process.env, spawn = spawnSync, sqlPath = WRAPPER_SQL } = {}) {
  const target = assertLocalPostgresUrl(env.SUPABASE_LOCAL_DB_URL)

  const result = spawn('psql', ['-v', 'ON_ERROR_STOP=1', '-f', sqlPath], {
    env: buildChildEnv(env, target),
    stdio: 'inherit',
    shell: false,
  })

  if (result.error) {
    if (result.error.code === 'ENOENT') {
      throw new Error(
        'psql was not found on PATH.\n' +
          'Git Bash does not ship psql, so install a PostgreSQL client or run this\n' +
          'from WSL. On Windows the client must be a real executable: psql is spawned\n' +
          'without a shell — deliberately, so no argument is ever re-parsed — and a\n' +
          '.cmd or .bat wrapper cannot be resolved that way.',
      )
    }
    throw result.error
  }
  if (typeof result.status === 'number') return result.status
  if (result.signal) throw new Error(`psql was terminated by ${result.signal}`)
  return 1
}

// Only act when executed directly, so the tests can import the pieces.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    process.exit(run())
  } catch (error) {
    console.error(`\n${error.message}\n`)
    process.exit(2)
  }
}

-- Applies the local fixtures — supabase/seed.sql then scripts/rls-fixtures.sql —
-- over ONE psql connection, taking the fixture password from the environment.
--
-- LOCAL DEVELOPMENT DATABASES ONLY. Bash below; on Windows use Git Bash or WSL.
--
--   read -rs -p 'Fixture password: ' fixture_pw
--   printf '\n'
--   SEED_FIXTURE_PASSWORD="$fixture_pw" npm run db:seed:local
--   unset fixture_pw
--
-- Go through that npm script rather than calling psql yourself: it is
-- scripts/seed-local.mjs, which refuses any SUPABASE_LOCAL_DB_URL whose host is
-- not a loopback address before psql is spawned, and passes the connection
-- details through the environment so no password reaches a command line.
--
-- Leave SEED_FIXTURE_PASSWORD unset and every fixture gets its own random
-- password nobody knows. That is the default and the recommended path.
--
-- Why this file exists rather than PGOPTIONS. PGOPTIONS is parsed as a list of
-- server options, so a value containing a space becomes extra options — a
-- password of `x -c statement_timeout=999` really did set that timeout — and a
-- backslash was swallowed, yielding a different password with no error.
-- `\getenv` plus psql's `:'…'` literal quoting carries the value verbatim:
-- spaces, backslashes, quotes, newlines and a leading `-c` were all verified to
-- arrive byte-identical, with no option injected.
--
-- Residual exposure, stated plainly: the value is absent from argv and from
-- shell history, but it lives in psql's environment while it runs, and it
-- travels inside a SQL statement. Under this project's local default
-- (`log_statement = ddl`) that statement is not written to the server log;
-- raising `log_statement` to `all` would capture it. Acceptable for a throwaway
-- local password and for nothing else.

\set ON_ERROR_STOP on

-- Absent variable means "no password chosen": the fixtures fall back to random.
\set fixture_password ''
\getenv fixture_password SEED_FIXTURE_PASSWORD

-- \gset keeps the returned value in a psql variable, so both the variable that
-- carried the password in and the one that carries it back out are cleared
-- before anything else runs.
select set_config('seed.fixture_password', :'fixture_password', false) as fixture_password_configured \gset
\unset fixture_password
\unset fixture_password_configured

\ir ../supabase/seed.sql
\ir rls-fixtures.sql

-- Clear the session setting too. A DO block returns no row, so nothing echoes
-- the value and no new psql variable is created.
do $seed_local_cleanup$
begin
  perform set_config('seed.fixture_password', '', false);
end
$seed_local_cleanup$;

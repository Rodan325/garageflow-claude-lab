-- Applies the local fixtures — supabase/seed.sql then scripts/rls-fixtures.sql —
-- over ONE psql connection, taking the fixture password from the environment.
--
-- LOCAL DEVELOPMENT DATABASES ONLY. Bash below; on Windows use Git Bash or WSL.
--
--   read -rs -p 'Fixture password: ' fixture_pw
--   printf '\n'
--   SEED_FIXTURE_PASSWORD="$fixture_pw" \
--     psql "$SUPABASE_LOCAL_DB_URL" -v ON_ERROR_STOP=1 -f scripts/seed-local.sql
--   unset fixture_pw
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

select set_config('seed.fixture_password', :'fixture_password', false) as fixture_password_configured \gset
\unset fixture_password

\ir ../supabase/seed.sql
\ir rls-fixtures.sql

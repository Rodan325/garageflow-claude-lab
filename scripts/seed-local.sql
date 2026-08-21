-- Direct execution is intentionally disabled.
--
-- `npm run db:seed:local` verifies the repository's loopback metadata and the
-- exact healthy garageflow-claude-lab Docker database before it builds this
-- atomic stream over one psql connection:
--
--   BEGIN;
--   <complete supabase/seed.sql>
--   <complete scripts/rls-fixtures.sql>
--   COMMIT;
--
-- A supplied SEED_FIXTURE_PASSWORD is rejected. Newly inserted fixture users
-- receive independent random passwords that nobody knows. Do not call this
-- file with psql: that would bypass the project-identity guard.

\echo 'Direct seed-local.sql execution is disabled; use npm run db:seed:local.'
\quit 3

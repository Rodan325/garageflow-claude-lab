/**
 * Canonical authenticated accounts required by the full RLS harness.
 * Importing this module performs no environment, filesystem, database, or
 * network work. Passwords are accepted only by the explicit helper calls.
 */

function account(alias, id, email, source, suites) {
  return Object.freeze({ alias, id, email, source, suites: Object.freeze(suites) })
}

export const RLS_FIXTURE_ACCOUNTS = Object.freeze([
  account('ownerA', 'a0000000-0000-4000-8000-000000000001', 'owner@demo-garage.fr', 'supabase/seed.sql', ['rls-antileak', 'legal-v2']),
  account('frontDeskA', 'a0000000-0000-4000-8000-000000000003', 'frontdesk.independent@example.test', 'supabase/seed.sql', ['rls-antileak', 'legal-v2']),
  account('clientA1', 'c0000000-0000-4000-8000-000000000001', 'client@demo.fr', 'supabase/seed.sql', ['rls-antileak', 'legal-v2']),
  account('clientA2', 'c0000000-0000-4000-8000-000000000002', 'client.independent.two@example.test', 'supabase/seed.sql', ['rls-antileak']),
  account('ownerB', 'b0000000-0000-4000-8000-000000000001', 'owner.network@example.test', 'supabase/seed.sql', ['rls-antileak', 'legal-v2']),
  account('networkManager', 'b0000000-0000-4000-8000-000000000002', 'manager.network@example.test', 'supabase/seed.sql', ['rls-antileak']),
  account('centerNorth', 'b0000000-0000-4000-8000-000000000003', 'manager.north@example.test', 'supabase/seed.sql', ['rls-antileak', 'legal-v2']),
  account('centerCenter', 'b0000000-0000-4000-8000-000000000004', 'manager.center@example.test', 'supabase/seed.sql', ['rls-antileak']),
  account('technicianB', 'b0000000-0000-4000-8000-000000000007', 'technician.network@example.test', 'supabase/seed.sql', ['rls-antileak']),
  account('clientB1', 'c2000000-0000-4000-8000-000000000001', 'client.network.one@example.test', 'supabase/seed.sql', ['rls-antileak']),
  account('clientB2', 'c2000000-0000-4000-8000-000000000002', 'client.network.two@example.test', 'supabase/seed.sql', ['rls-antileak']),
  account('ownerTestB', 'b3333333-0000-4000-8000-000000000001', 'owner.test-b@example.test', 'scripts/rls-fixtures.sql', ['rls-antileak']),
])

export const RLS_FIXTURE_ACCOUNT_BY_ALIAS = Object.freeze(Object.fromEntries(
  RLS_FIXTURE_ACCOUNTS.map((fixture) => [fixture.alias, fixture]),
))

export const RLS_ANTILEAK_ACCOUNT_ALIASES = Object.freeze(
  RLS_FIXTURE_ACCOUNTS.map((fixture) => fixture.alias),
)

export const RLS_LEGAL_ACCOUNT_ALIASES = Object.freeze([
  'ownerA',
  'frontDeskA',
  'ownerB',
  'centerNorth',
  'clientA1',
])

export function fixtureCredentials(password) {
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('The fixture password is required')
  }
  return Object.freeze(Object.fromEntries(RLS_FIXTURE_ACCOUNTS.map((fixture) => [
    fixture.alias,
    Object.freeze([fixture.email, password]),
  ])))
}

export function validateFixtureRekeyPassword(password) {
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('SEED_FIXTURE_PASSWORD is required and must not be empty')
  }
  if (password.length < 6) {
    throw new Error('SEED_FIXTURE_PASSWORD does not meet the local Auth minimum length')
  }
  if (/[\0\r\n\t]/.test(password)) {
    throw new Error('SEED_FIXTURE_PASSWORD contains unsupported control characters')
  }
  return password
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`
}

function csvField(value) {
  return `"${String(value).replaceAll('"', '""')}"`
}

export function buildFixtureRekeySql(rawPassword) {
  const password = validateFixtureRekeyPassword(rawPassword)
  const expectedCount = RLS_FIXTURE_ACCOUNTS.length
  const targets = RLS_FIXTURE_ACCOUNTS.map((fixture) => (
    `(${sqlLiteral(fixture.alias)}, ${sqlLiteral(fixture.id)}::uuid, ${sqlLiteral(fixture.email)})`
  )).join(',\n  ')

  return `
\\set ON_ERROR_STOP on
\\set QUIET on
begin;

create temporary table fixture_rekey_targets (
  alias text primary key,
  id uuid not null unique,
  email text not null unique
) on commit drop;

insert into pg_temp.fixture_rekey_targets (alias, id, email)
values
  ${targets};

do $fixture_rekey_validate$
begin
  if (select count(*) from pg_temp.fixture_rekey_targets) <> ${expectedCount} then
    raise exception 'canonical fixture target count mismatch';
  end if;

  if exists (
    select 1
    from pg_temp.fixture_rekey_targets as target
    left join auth.users as fixture_user on fixture_user.id = target.id
    where fixture_user.id is null
       or fixture_user.email is distinct from target.email
  ) then
    raise exception 'canonical fixture user is missing or mismatched';
  end if;

  if exists (
    select 1
    from pg_temp.fixture_rekey_targets as target
    where (select count(*) from auth.identities as identity where identity.user_id = target.id) <> 1
       or not exists (
         select 1
         from auth.identities as identity
         where identity.user_id = target.id
           and identity.provider = 'email'
           and identity.identity_data ->> 'email' = target.email
       )
  ) then
    raise exception 'canonical fixture identity is missing or mismatched';
  end if;
end
$fixture_rekey_validate$;

create temporary table fixture_rekey_secret (
  password text not null
) on commit drop;

\\copy pg_temp.fixture_rekey_secret (password) from stdin with (format csv)
${csvField(password)}
\\.

do $fixture_rekey_secret_validate$
begin
  if (select count(*) from pg_temp.fixture_rekey_secret) <> 1 then
    raise exception 'fixture rekey secret transport failed';
  end if;
end
$fixture_rekey_secret_validate$;

create temporary table fixture_rekey_updated (
  id uuid primary key
) on commit drop;

with changed as (
  update auth.users as fixture_user
  set encrypted_password = extensions.crypt(
    (select password from pg_temp.fixture_rekey_secret),
    extensions.gen_salt('bf')
  )
  from pg_temp.fixture_rekey_targets as target
  where fixture_user.id = target.id
  returning fixture_user.id
)
insert into pg_temp.fixture_rekey_updated (id)
select id from changed;

do $fixture_rekey_verify$
begin
  if (select count(*) from pg_temp.fixture_rekey_updated) <> ${expectedCount} then
    raise exception 'fixture rekey affected count mismatch';
  end if;
  if exists (
    select 1
    from pg_temp.fixture_rekey_updated as changed
    left join pg_temp.fixture_rekey_targets as target on target.id = changed.id
    where target.id is null
  ) then
    raise exception 'fixture rekey changed a non-canonical user';
  end if;
  if exists (
    select 1
    from pg_temp.fixture_rekey_targets as target
    left join pg_temp.fixture_rekey_updated as changed on changed.id = target.id
    where changed.id is null
  ) then
    raise exception 'fixture rekey skipped a canonical user';
  end if;
end
$fixture_rekey_verify$;

select 'FIXTURE_TARGET_COUNT=' || count(*) from pg_temp.fixture_rekey_targets
union all
select 'FIXTURE_VALIDATED_COUNT=' || count(*) from pg_temp.fixture_rekey_targets
union all
select 'FIXTURE_REKEY_COUNT=' || count(*) from pg_temp.fixture_rekey_updated
union all
select 'NON_FIXTURE_AUTH_ROWS_CHANGED=0';

commit;
`
}

-- Test-only fixtures for the RLS anti-leak check (NOT part of the product seed).
-- A SECOND, private garage with its own owner + customer, used to prove that
-- garage A can never read garage B's rows.
--
-- NOT A ROTATION MECHANISM. Every insert is `on conflict do nothing`: missing
-- rows are created, existing ones are left untouched. An `auth.users` row that
-- already exists keeps the hash it already had, whatever password you supply —
-- silently, with no error. To get fresh credentials on a local database that
-- was seeded earlier, recreate it with `supabase db reset --local`. Never point
-- a reset, or this file, at a hosted project.
--
-- Every id here lives in a 3333… namespace of its own. It used to reuse the
-- 2222… ids that supabase/seed.sql gives to the Atlas Demo Network, so the two
-- files silently overwrote each other's identities — every insert is
-- `on conflict do nothing`, so whichever ran first won, and the same uuid named
-- a different account depending on the environment. Keep these namespaces
-- disjoint.
--
-- LOCAL DATABASES ONLY. This script creates an organization_owner; running it
-- against a hosted project grants that authority there.
--
-- Run this AFTER supabase/seed.sql: the service request below points at the
-- seed's demo client, so on an empty database that one foreign key fails.
--
-- The password is NEVER stored in this repository. By default the account gets
-- a random password nobody knows — keep that unless you actually need to sign
-- in. To do so, run scripts/seed-local.sql, which applies the seed and this
-- file over one connection with the value taken from the environment:
--
--   read -rs -p 'Fixture password: ' fixture_pw
--   printf '\n'
--   SEED_FIXTURE_PASSWORD="$fixture_pw" npm run db:seed:local
--   unset fixture_pw
--
-- Do not use PGOPTIONS: it is parsed as a list of server options, so a value
-- containing a space becomes extra options and a backslash is swallowed. See
-- scripts/seed-local.sql and supabase/seed.sql for the measurements and for the
-- residual exposure — absent from shell history and argv, present in psql's
-- environment while it runs. Local development databases only.
set search_path = public, extensions, auth;

-- Warn — never rotate — when the Test B account is already present.
do $fixture_guard$
declare
  v_existing integer;
begin
  select count(*)
  into v_existing
  from auth.users
  where id = 'b3333333-0000-4000-8000-000000000001'::uuid;

  if v_existing > 0 then
    raise warning 'rls-fixtures.sql: the Test B account already exists. Its password is NOT replaced by this run. Recreate the local database with "supabase db reset --local" if you need fresh credentials.';
  end if;
end
$fixture_guard$;

insert into public.garages (id, slug, name, city, is_public)
values ('33333333-3333-4333-8333-333333333333', 'garage-test-b', 'Garage Test B', 'Paris', false)
on conflict (id) do nothing;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000',
  'b3333333-0000-4000-8000-000000000001',
  'authenticated','authenticated','owner.test-b@example.test',
  extensions.crypt(
    coalesce(
      nullif(current_setting('seed.fixture_password', true), ''),
      pg_catalog.encode(extensions.gen_random_bytes(24), 'base64')),
    extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Bruno Test","account_type":"staff"}',
  now(), now(), '', '', '', ''
) on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (gen_random_uuid(), 'b3333333-0000-4000-8000-000000000001', 'b3333333-0000-4000-8000-000000000001',
  '{"sub":"b3333333-0000-4000-8000-000000000001","email":"owner.test-b@example.test","email_verified":true}', 'email', now(), now(), now())
on conflict do nothing;

-- The canonical role matters: every garage must keep an active member that is
-- both role = 'owner' and organization_role = 'organization_owner'. This set
-- used to attach to a garage the seed already owned, so it could omit them.
insert into public.garage_members (
  garage_id, user_id, role, status, center_id, organization_role, center_role
)
values (
  '33333333-3333-4333-8333-333333333333', 'b3333333-0000-4000-8000-000000000001',
  'owner', 'active', null, 'organization_owner', null
)
on conflict (garage_id, user_id) do nothing;

insert into public.customers (id, garage_id, first_name, last_name, city)
values ('d3333333-0000-4000-8000-000000000001','33333333-3333-4333-8333-333333333333','Secret','Clientb','Paris')
on conflict (id) do nothing;

-- A vehicle + a service_request in garage B, to test cross-garage quote links.
insert into public.vehicles (id, garage_id, customer_id, brand, model, registration)
values ('e3333333-0000-4000-8000-000000000001','33333333-3333-4333-8333-333333333333','d3333333-0000-4000-8000-000000000001','BMW','Serie 1','ZZ-999-ZZ')
on conflict (id) do nothing;

insert into public.service_requests (id, garage_id, client_id, service_name, vehicle_label, status, contact_name)
values ('f3333333-0000-4000-8000-000000000001','33333333-3333-4333-8333-333333333333','c0000000-0000-4000-8000-000000000001','Test B','BMW Serie 1','pending','Secret Clientb')
on conflict (id) do nothing;

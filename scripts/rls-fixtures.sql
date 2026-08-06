-- Test-only fixtures for the RLS anti-leak check (NOT part of the product seed).
-- A SECOND, private garage with its own owner + customer, used to prove that
-- garage A can never read garage B's rows. Safe to re-run.
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
-- a random password nobody knows. To sign in as it locally, pass the value
-- through the environment — PGOPTIONS applies the parameter when the connection
-- opens, so it is live for -f, and it never reaches argv:
--   read -rs -p 'fixture password: ' pw; echo
--   PGOPTIONS="-c seed.fixture_password=$pw" \
--     psql "$SUPABASE_LOCAL_DB_URL" -v ON_ERROR_STOP=1 -f scripts/rls-fixtures.sql
--   unset pw
-- Pick a value without spaces or backslashes: PGOPTIONS treats those as
-- separators. Do not use -c "set ... = '...'": that lands in argv, and psql
-- does not interpolate :'var' inside -c anyway.
set search_path = public, extensions, auth;

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

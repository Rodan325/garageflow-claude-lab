-- Test-only fixtures for the RLS anti-leak check (NOT part of the product seed).
-- A SECOND, private garage with its own owner + customer, used to prove that
-- garage A can never read garage B's rows. Safe to re-run.
set search_path = public, extensions, auth;

insert into public.garages (id, slug, name, city, is_public)
values ('22222222-2222-4222-8222-222222222222', 'garage-test-b', 'Garage Test B', 'Paris', false)
on conflict (id) do nothing;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000',
  'b0000000-0000-4000-8000-000000000001',
  'authenticated','authenticated','ownerb@demo-garage.fr',
  extensions.crypt('Demo1234!', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Bruno Test","account_type":"staff"}',
  now(), now(), '', '', '', ''
) on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (gen_random_uuid(), 'b0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001',
  '{"sub":"b0000000-0000-4000-8000-000000000001","email":"ownerb@demo-garage.fr","email_verified":true}', 'email', now(), now(), now())
on conflict do nothing;

insert into public.garage_members (garage_id, user_id, role, status)
values ('22222222-2222-4222-8222-222222222222','b0000000-0000-4000-8000-000000000001','owner','active')
on conflict (garage_id, user_id) do nothing;

insert into public.customers (id, garage_id, first_name, last_name, city)
values ('d2222222-0000-4000-8000-000000000001','22222222-2222-4222-8222-222222222222','Secret','Clientb','Paris')
on conflict (id) do nothing;

-- A vehicle + a service_request in garage B, to test cross-garage quote links.
insert into public.vehicles (id, garage_id, customer_id, brand, model, registration)
values ('e2222222-0000-4000-8000-000000000001','22222222-2222-4222-8222-222222222222','d2222222-0000-4000-8000-000000000001','BMW','Serie 1','ZZ-999-ZZ')
on conflict (id) do nothing;

insert into public.service_requests (id, garage_id, client_id, service_name, vehicle_label, status, contact_name)
values ('f2222222-0000-4000-8000-000000000001','22222222-2222-4222-8222-222222222222','c0000000-0000-4000-8000-000000000001','Test B','BMW Serie 1','pending','Secret Clientb')
on conflict (id) do nothing;

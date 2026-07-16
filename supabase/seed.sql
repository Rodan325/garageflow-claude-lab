-- Local validation fixtures only. Every identity and business record is fictitious.
-- Safe to re-run after a local reset; never use this file against production.
set search_path = public, extensions, auth;

-- One independent organization and one generic multi-center organization.
insert into public.garages (id, slug, name, city, country, is_public, description)
values
  ('22222222-2222-4222-8222-222222222222', 'atlas-demo-network', 'Atlas Demo Network', 'Casablanca', 'MA', false, 'Fictitious multi-center organization for local validation.')
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  city = excluded.city,
  country = excluded.country,
  is_public = excluded.is_public,
  description = excluded.description;

-- The center preparation migration creates a generic `principal` center for
-- existing garages. Replace that local-only placeholder so the independent
-- fixture remains exactly one organization with one active establishment.
delete from public.garage_centers
where garage_id = '11111111-1111-4111-8111-111111111111'
  and id <> '11111111-1111-4111-8111-11111111c001';

insert into public.garage_centers (id, garage_id, slug, name, address, city, postal_code, phone, is_active, sort_order)
values
  ('11111111-1111-4111-8111-11111111c001', '11111111-1111-4111-8111-111111111111', 'lyon-central', 'Independent Demo Center', '1 Example Street', 'Lyon', '69000', '+33 4 00 00 00 01', true, 1),
  ('22222222-2222-4222-8222-22222222c001', '22222222-2222-4222-8222-222222222222', 'atlas-north', 'Atlas North Demo', '10 Example Avenue', 'Casablanca', '20000', '+212 5 00 00 00 01', true, 1),
  ('22222222-2222-4222-8222-22222222c002', '22222222-2222-4222-8222-222222222222', 'atlas-center', 'Atlas Center Demo', '20 Example Avenue', 'Casablanca', '20100', '+212 5 00 00 00 02', true, 2),
  ('22222222-2222-4222-8222-22222222c003', '22222222-2222-4222-8222-222222222222', 'atlas-south', 'Atlas South Demo', '30 Example Avenue', 'Casablanca', '20200', '+212 5 00 00 00 03', true, 3)
on conflict (id) do update set
  name = excluded.name,
  address = excluded.address,
  city = excluded.city,
  postal_code = excluded.postal_code,
  phone = excluded.phone,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;

update public.service_requests
set center_id = '11111111-1111-4111-8111-11111111c001'
where garage_id = '11111111-1111-4111-8111-111111111111'
  and center_id is null;

update public.appointments appointment
set center_id = request.center_id
from public.service_requests request
where appointment.service_request_id = request.id
  and appointment.garage_id = request.garage_id
  and appointment.center_id is null;

-- Password for every local fixture account: LocalDemo1234!
with fixture_users(id, email, full_name, account_type) as (
  values
    ('a0000000-0000-4000-8000-000000000003'::uuid, 'frontdesk.independent@example.test', 'Alex Frontdesk Example', 'staff'),
    ('c0000000-0000-4000-8000-000000000002'::uuid, 'client.independent.two@example.test', 'Camille Client Example', 'client'),
    ('b0000000-0000-4000-8000-000000000001'::uuid, 'owner.network@example.test', 'Nora Network Owner Example', 'staff'),
    ('b0000000-0000-4000-8000-000000000002'::uuid, 'manager.network@example.test', 'Malik Network Manager Example', 'staff'),
    ('b0000000-0000-4000-8000-000000000003'::uuid, 'manager.north@example.test', 'Sam North Manager Example', 'staff'),
    ('b0000000-0000-4000-8000-000000000004'::uuid, 'manager.center@example.test', 'Lee Center Manager Example', 'staff'),
    ('b0000000-0000-4000-8000-000000000005'::uuid, 'manager.south@example.test', 'Ari South Manager Example', 'staff'),
    ('b0000000-0000-4000-8000-000000000006'::uuid, 'frontdesk.network@example.test', 'Robin Frontdesk Example', 'staff'),
    ('b0000000-0000-4000-8000-000000000007'::uuid, 'technician.network@example.test', 'Taylor Technician Example', 'staff'),
    ('c2000000-0000-4000-8000-000000000001'::uuid, 'client.network.one@example.test', 'Morgan Client Example', 'client'),
    ('c2000000-0000-4000-8000-000000000002'::uuid, 'client.network.two@example.test', 'Jordan Client Example', 'client')
)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email,
  extensions.crypt('LocalDemo1234!', extensions.gen_salt('bf')), now(),
  jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
  jsonb_build_object('full_name', full_name, 'account_type', account_type),
  now(), now(), '', '', '', ''
from fixture_users
on conflict (id) do nothing;

with fixture_users(id, email) as (
  values
    ('a0000000-0000-4000-8000-000000000003'::uuid, 'frontdesk.independent@example.test'),
    ('c0000000-0000-4000-8000-000000000002'::uuid, 'client.independent.two@example.test'),
    ('b0000000-0000-4000-8000-000000000001'::uuid, 'owner.network@example.test'),
    ('b0000000-0000-4000-8000-000000000002'::uuid, 'manager.network@example.test'),
    ('b0000000-0000-4000-8000-000000000003'::uuid, 'manager.north@example.test'),
    ('b0000000-0000-4000-8000-000000000004'::uuid, 'manager.center@example.test'),
    ('b0000000-0000-4000-8000-000000000005'::uuid, 'manager.south@example.test'),
    ('b0000000-0000-4000-8000-000000000006'::uuid, 'frontdesk.network@example.test'),
    ('b0000000-0000-4000-8000-000000000007'::uuid, 'technician.network@example.test'),
    ('c2000000-0000-4000-8000-000000000001'::uuid, 'client.network.one@example.test'),
    ('c2000000-0000-4000-8000-000000000002'::uuid, 'client.network.two@example.test')
)
insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select
  id, id, id::text,
  jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
  'email', now(), now(), now()
from fixture_users
on conflict (provider_id, provider) do nothing;

-- Independent organization roles.
update public.garage_members
set center_id = '11111111-1111-4111-8111-11111111c001',
    organization_role = case when user_id = 'a0000000-0000-4000-8000-000000000001' then 'organization_owner' else null end,
    center_role = case when user_id = 'a0000000-0000-4000-8000-000000000001' then 'center_manager' else 'technician' end
where garage_id = '11111111-1111-4111-8111-111111111111'
  and user_id in ('a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002');

insert into public.garage_members (garage_id, user_id, role, status, center_id, center_role)
values (
  '11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000003',
  'front_desk', 'active', '11111111-1111-4111-8111-11111111c001', 'front_desk'
)
on conflict (garage_id, user_id) do update set
  role = excluded.role, status = excluded.status, center_id = excluded.center_id, center_role = excluded.center_role;

-- Network organization and center-scoped roles.
insert into public.garage_members (
  garage_id, user_id, role, status, center_id, organization_role, center_role
)
values
  ('22222222-2222-4222-8222-222222222222', 'b0000000-0000-4000-8000-000000000001', 'owner', 'active', null, 'organization_owner', null),
  ('22222222-2222-4222-8222-222222222222', 'b0000000-0000-4000-8000-000000000002', 'admin', 'active', null, 'network_admin', null),
  ('22222222-2222-4222-8222-222222222222', 'b0000000-0000-4000-8000-000000000003', 'admin', 'active', '22222222-2222-4222-8222-22222222c001', null, 'center_manager'),
  ('22222222-2222-4222-8222-222222222222', 'b0000000-0000-4000-8000-000000000004', 'admin', 'active', '22222222-2222-4222-8222-22222222c002', null, 'center_manager'),
  ('22222222-2222-4222-8222-222222222222', 'b0000000-0000-4000-8000-000000000005', 'admin', 'active', '22222222-2222-4222-8222-22222222c003', null, 'center_manager'),
  ('22222222-2222-4222-8222-222222222222', 'b0000000-0000-4000-8000-000000000006', 'front_desk', 'active', '22222222-2222-4222-8222-22222222c001', null, 'front_desk'),
  ('22222222-2222-4222-8222-222222222222', 'b0000000-0000-4000-8000-000000000007', 'mechanic', 'active', '22222222-2222-4222-8222-22222222c002', null, 'technician')
on conflict (garage_id, user_id) do update set
  role = excluded.role,
  status = excluded.status,
  center_id = excluded.center_id,
  organization_role = excluded.organization_role,
  center_role = excluded.center_role;

update public.client_profiles
set default_garage_id = '11111111-1111-4111-8111-111111111111'
where id = 'c0000000-0000-4000-8000-000000000002';

update public.client_profiles
set default_garage_id = '22222222-2222-4222-8222-222222222222'
where id in ('c2000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000002');

insert into public.customers (id, garage_id, first_name, last_name, email, city)
values
  ('d2222222-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'Morgan', 'Example', 'client.network.one@example.test', 'Casablanca'),
  ('d2222222-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'Jordan', 'Example', 'client.network.two@example.test', 'Casablanca')
on conflict (id) do update set email = excluded.email, city = excluded.city;

insert into public.vehicles (id, garage_id, customer_id, brand, model, year, mileage, fuel, registration, status)
values
  ('e2222222-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'd2222222-0000-4000-8000-000000000001', 'Example Motors', 'Model N', 2021, 42000, 'Hybrid', 'DEMO-N-001', 'in_service'),
  ('e2222222-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'd2222222-0000-4000-8000-000000000002', 'Example Motors', 'Model S', 2022, 28000, 'Electric', 'DEMO-S-002', 'active')
on conflict (id) do update set mileage = excluded.mileage, status = excluded.status;

insert into public.client_vehicles (id, client_id, brand, model, year, fuel, mileage, registration)
values
  ('e0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002', 'Example Auto', 'City', 2020, 'Petrol', 36000, 'DEMO-I-002'),
  ('e2000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000001', 'Example Motors', 'Model N', 2021, 'Hybrid', 42000, 'DEMO-N-001'),
  ('e2000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000002', 'Example Motors', 'Model S', 2022, 'Electric', 28000, 'DEMO-S-002')
on conflict (id) do update set mileage = excluded.mileage;

-- Requests span the complete operational lifecycle.
insert into public.service_requests (
  id, reference, garage_id, center_id, client_id, customer_id, client_vehicle_id,
  service_name, vehicle_label, requested_date, requested_time, contact_name,
  contact_email, status, client_stage, workshop_stage, estimated_completion_at,
  vehicle_checked_in_at, vehicle_delivered_at
)
values
  ('f1111111-0000-4000-8000-000000000001', 'LOCAL-I-PENDING', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-11111111c001', 'c0000000-0000-4000-8000-000000000002', null, 'e0000000-0000-4000-8000-000000000002', 'Routine service', 'Example Auto City - DEMO-I-002', current_date + 1, '09:00', 'Camille Client Example', 'client.independent.two@example.test', 'confirmed', 'appointment_confirmed', 'appointment_confirmed', now() + interval '1 day 4 hours', null, null),
  ('f1111111-0000-4000-8000-000000000002', 'LOCAL-I-DIAGNOSIS', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-11111111c001', 'c0000000-0000-4000-8000-000000000001', 'd1111111-0000-4000-8000-000000000001', 'e1111111-0000-4000-8000-000000000001', 'Brake diagnosis', 'Volkswagen Golf 7 - IJ-789-KL', current_date, '08:00', 'Julie Durand', 'client@demo.fr', 'confirmed', 'diagnosis_in_progress', 'diagnosis_in_progress', now() + interval '3 hours', now() - interval '1 hour', null),
  ('f2222222-0000-4000-8000-000000000001', 'LOCAL-N-APPROVAL', '22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-22222222c001', 'c2000000-0000-4000-8000-000000000001', 'd2222222-0000-4000-8000-000000000001', 'e2000000-0000-4000-8000-000000000001', 'Annual service', 'Example Motors Model N - DEMO-N-001', current_date, '08:30', 'Morgan Client Example', 'client.network.one@example.test', 'confirmed', 'customer_approval_required', 'customer_approval_required', now() + interval '4 hours', now() - interval '2 hours', null),
  ('f2222222-0000-4000-8000-000000000002', 'LOCAL-N-AUTHORIZED', '22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-22222222c001', 'c2000000-0000-4000-8000-000000000002', 'd2222222-0000-4000-8000-000000000002', 'e2000000-0000-4000-8000-000000000002', 'Battery inspection', 'Example Motors Model S - DEMO-S-002', current_date, '09:00', 'Jordan Client Example', 'client.network.two@example.test', 'confirmed', 'work_authorized', 'work_authorized', now() + interval '5 hours', now() - interval '2 hours', null),
  ('f2222222-0000-4000-8000-000000000003', 'LOCAL-N-DECLINED', '22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-22222222c002', 'c2000000-0000-4000-8000-000000000001', 'd2222222-0000-4000-8000-000000000001', 'e2000000-0000-4000-8000-000000000001', 'Suspension inspection', 'Example Motors Model N - DEMO-N-001', current_date, '09:30', 'Morgan Client Example', 'client.network.one@example.test', 'confirmed', 'diagnosis_in_progress', 'diagnosis_in_progress', now() + interval '6 hours', now() - interval '90 minutes', null),
  ('f2222222-0000-4000-8000-000000000004', 'LOCAL-N-WORK', '22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-22222222c001', 'c2000000-0000-4000-8000-000000000002', 'd2222222-0000-4000-8000-000000000002', 'e2000000-0000-4000-8000-000000000002', 'Workshop repair', 'Example Motors Model S - DEMO-S-002', current_date, '10:00', 'Jordan Client Example', 'client.network.two@example.test', 'confirmed', 'work_in_progress', 'work_in_progress', now() + interval '2 hours', now() - interval '3 hours', null),
  ('f2222222-0000-4000-8000-000000000005', 'LOCAL-N-QC', '22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-22222222c002', 'c2000000-0000-4000-8000-000000000001', 'd2222222-0000-4000-8000-000000000001', 'e2000000-0000-4000-8000-000000000001', 'Quality inspection', 'Example Motors Model N - DEMO-N-001', current_date, '10:30', 'Morgan Client Example', 'client.network.one@example.test', 'confirmed', 'quality_control', 'quality_control', now() + interval '1 hour', now() - interval '4 hours', null),
  ('f2222222-0000-4000-8000-000000000006', 'LOCAL-N-READY', '22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-22222222c003', 'c2000000-0000-4000-8000-000000000002', 'd2222222-0000-4000-8000-000000000002', 'e2000000-0000-4000-8000-000000000002', 'Vehicle ready', 'Example Motors Model S - DEMO-S-002', current_date, '11:00', 'Jordan Client Example', 'client.network.two@example.test', 'confirmed', 'vehicle_ready', 'vehicle_ready', now(), now() - interval '5 hours', null),
  ('f2222222-0000-4000-8000-000000000007', 'LOCAL-N-CLOSED', '22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-22222222c003', 'c2000000-0000-4000-8000-000000000001', 'd2222222-0000-4000-8000-000000000001', 'e2000000-0000-4000-8000-000000000001', 'Completed service', 'Example Motors Model N - DEMO-N-001', current_date - 7, '08:00', 'Morgan Client Example', 'client.network.one@example.test', 'completed', 'closed', 'closed', now() - interval '7 days', now() - interval '7 days 8 hours', now() - interval '7 days')
on conflict (id) do nothing;

insert into public.service_request_timeline (
  id, request_id, garage_id, center_id, previous_stage, new_stage, changed_by,
  occurred_at, internal_note, customer_message, estimated_completion_at,
  visible_to_customer, notification_status
)
values
  ('71000000-0000-4000-8000-000000000001', 'f1111111-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-11111111c001', null, 'appointment_confirmed', 'a0000000-0000-4000-8000-000000000001', now() - interval '1 day', 'Local fixture appointment.', 'Your appointment is confirmed.', now() + interval '1 day 4 hours', true, 'simulated'),
  ('71000000-0000-4000-8000-000000000002', 'f1111111-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-11111111c001', 'vehicle_received', 'diagnosis_in_progress', 'a0000000-0000-4000-8000-000000000002', now() - interval '45 minutes', 'Technician-only diagnostic note.', 'Diagnosis is in progress.', now() + interval '3 hours', true, 'simulated'),
  ('72000000-0000-4000-8000-000000000001', 'f2222222-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-22222222c001', 'diagnosis_in_progress', 'customer_approval_required', 'b0000000-0000-4000-8000-000000000003', now() - interval '30 minutes', 'Internal approval context.', 'Your approval is required.', now() + interval '4 hours', true, 'simulated'),
  ('72000000-0000-4000-8000-000000000004', 'f2222222-0000-4000-8000-000000000004', '22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-22222222c001', 'work_authorized', 'work_in_progress', 'b0000000-0000-4000-8000-000000000007', now() - interval '2 hours', 'Technician assignment.', 'Work is in progress.', now() + interval '2 hours', true, 'simulated'),
  ('72000000-0000-4000-8000-000000000005', 'f2222222-0000-4000-8000-000000000005', '22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-22222222c002', 'work_in_progress', 'quality_control', 'b0000000-0000-4000-8000-000000000004', now() - interval '30 minutes', 'Quality checklist pending.', 'Your vehicle is undergoing quality control.', now() + interval '1 hour', true, 'simulated'),
  ('72000000-0000-4000-8000-000000000006', 'f2222222-0000-4000-8000-000000000006', '22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-22222222c003', 'quality_control', 'vehicle_ready', 'b0000000-0000-4000-8000-000000000005', now() - interval '10 minutes', null, 'Your vehicle is ready.', now(), true, 'simulated'),
  ('72000000-0000-4000-8000-000000000007', 'f2222222-0000-4000-8000-000000000007', '22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-22222222c003', 'vehicle_delivered', 'closed', 'b0000000-0000-4000-8000-000000000005', now() - interval '7 days', null, 'The service request is closed.', null, true, 'simulated')
on conflict (id) do nothing;

insert into public.workshop_recommendations (
  id, garage_id, center_id, service_request_id, title, description, category,
  urgency, reason, estimated_price, estimated_duration_minutes,
  affects_delivery_time, status, created_by, decided_at, customer_decision_note
)
values
  ('81000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-22222222c001', 'f2222222-0000-4000-8000-000000000001', 'Replace worn brake pads', 'Fictitious recommendation awaiting a decision.', 'brakes', 'critical', 'Measured wear is below the local demo threshold.', 180.00, 90, true, 'proposed', 'b0000000-0000-4000-8000-000000000003', null, null),
  ('81000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-22222222c001', 'f2222222-0000-4000-8000-000000000002', 'Battery cooling service', 'Fictitious accepted recommendation.', 'battery', 'recommended', 'Preventive local demo maintenance.', 95.00, 45, false, 'accepted', 'b0000000-0000-4000-8000-000000000003', now() - interval '1 hour', 'Accepted in local validation.'),
  ('81000000-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-22222222c002', 'f2222222-0000-4000-8000-000000000003', 'Optional alignment check', 'Fictitious declined recommendation.', 'suspension', 'preventive', 'Minor variance in the local demo reading.', 60.00, 30, false, 'declined', 'b0000000-0000-4000-8000-000000000004', now() - interval '2 hours', 'Declined in local validation.')
on conflict (id) do nothing;

insert into public.recommendation_decisions (
  id, recommendation_id, garage_id, service_request_id, action,
  previous_status, new_status, decided_by, occurred_at,
  legal_terms_version, legal_privacy_version, displayed_language, note
)
values
  ('82000000-0000-4000-8000-000000000001', '81000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'f2222222-0000-4000-8000-000000000002', 'accepted', 'proposed', 'accepted', 'c2000000-0000-4000-8000-000000000002', now() - interval '1 hour', '2026-07-02', '2026-07-02', 'en', 'Accepted in local validation.'),
  ('82000000-0000-4000-8000-000000000002', '81000000-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', 'f2222222-0000-4000-8000-000000000003', 'declined', 'proposed', 'declined', 'c2000000-0000-4000-8000-000000000001', now() - interval '2 hours', '2026-07-02', '2026-07-02', 'fr', 'Declined in local validation.')
on conflict (id) do nothing;

insert into public.service_request_attachments (
  id, garage_id, center_id, service_request_id, recommendation_id, uploaded_by,
  file_name, mime_type, file_size, storage_path, visibility, document_type
)
values (
  '83000000-0000-4000-8000-000000000001',
  '22222222-2222-4222-8222-222222222222',
  '22222222-2222-4222-8222-22222222c001',
  'f2222222-0000-4000-8000-000000000001',
  '81000000-0000-4000-8000-000000000001',
  'b0000000-0000-4000-8000-000000000003',
  'demo-brake-photo.txt', 'text/plain', 36,
  '22222222-2222-4222-8222-222222222222/f2222222-0000-4000-8000-000000000001/demo-brake-photo.txt',
  'both', 'photo'
)
on conflict (id) do nothing;

insert into public.delivery_reports (
  id, garage_id, center_id, service_request_id, report_number, status,
  customer_snapshot, vehicle_snapshot, entry_mileage, exit_mileage,
  checked_in_at, delivered_at, requested_work, diagnostic_summary,
  completed_work, accepted_recommendations, deferred_recommendations,
  parts, authorized_attachment_ids, observations, next_due_date,
  next_due_mileage, warranty_terms, final_validation, finalized_by, finalized_at
)
values (
  '84000000-0000-4000-8000-000000000001',
  '22222222-2222-4222-8222-222222222222',
  '22222222-2222-4222-8222-22222222c003',
  'f2222222-0000-4000-8000-000000000007',
  'LOCAL-REPORT-001', 'finalized',
  '{"name":"Morgan Client Example"}',
  '{"label":"Example Motors Model N","registration":"DEMO-N-001"}',
  41980, 42000, now() - interval '7 days 8 hours', now() - interval '7 days',
  '[{"label":"Completed service"}]', 'No remaining fault in this fictitious report.',
  '[{"label":"Routine maintenance"}]', '[]', '[]',
  '[{"label":"Demo filter"}]', '{}', 'Local validation report only.',
  current_date + 180, 52000, 'Demo warranty terms.', 'Validated locally.',
  'b0000000-0000-4000-8000-000000000005', now() - interval '7 days'
)
on conflict (id) do nothing;

insert into public.maintenance_reminders (
  id, garage_id, center_id, client_id, vehicle_id, client_vehicle_id,
  service_request_id, reminder_type, title, due_date, due_mileage,
  status, scheduled_at, source, created_by
)
values (
  '85000000-0000-4000-8000-000000000001',
  '22222222-2222-4222-8222-222222222222',
  '22222222-2222-4222-8222-22222222c003',
  'c2000000-0000-4000-8000-000000000001',
  'e2222222-0000-4000-8000-000000000001',
  'e2000000-0000-4000-8000-000000000001',
  'f2222222-0000-4000-8000-000000000007',
  'date_or_mileage', 'Future local maintenance reminder',
  current_date + 180, 52000, 'scheduled', now(), 'delivery_report',
  'b0000000-0000-4000-8000-000000000005'
)
on conflict (id) do nothing;

insert into public.service_request_transfers (
  id, garage_id, service_request_id, from_center_id, to_center_id,
  status, requested_by, reason, created_at, customer_confirmed_at, completed_at
)
values (
  '86000000-0000-4000-8000-000000000001',
  '22222222-2222-4222-8222-222222222222',
  'f2222222-0000-4000-8000-000000000004',
  '22222222-2222-4222-8222-22222222c001',
  '22222222-2222-4222-8222-22222222c002',
  'completed', 'b0000000-0000-4000-8000-000000000002',
  'Fictitious load-balancing transfer.', now() - interval '1 day',
  now() - interval '23 hours', now() - interval '22 hours'
)
on conflict (id) do nothing;

insert into public.service_request_transfer_events (
  id, transfer_id, garage_id, previous_status, new_status, changed_by, occurred_at, note
)
values
  ('87000000-0000-4000-8000-000000000001', '86000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', null, 'proposed', 'b0000000-0000-4000-8000-000000000002', now() - interval '1 day', 'Local transfer proposed.'),
  ('87000000-0000-4000-8000-000000000002', '86000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'proposed', 'customer_confirmed', 'c2000000-0000-4000-8000-000000000002', now() - interval '23 hours', 'Local customer confirmation.'),
  ('87000000-0000-4000-8000-000000000003', '86000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'customer_confirmed', 'completed', 'b0000000-0000-4000-8000-000000000002', now() - interval '22 hours', 'Local transfer completed.')
on conflict (id) do nothing;

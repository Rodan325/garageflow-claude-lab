-- =====================================================================
-- GarageFlow C — 0004 demo seed
-- Creates a fully usable pilot demo: 1 garage, 3 accounts, catalog,
-- CRM data and 1 pending booking request (so the inbox isn't empty).
-- Demo password for all accounts: Demo1234!
-- =====================================================================
set search_path = public, extensions, auth;

-- ---- demo garage ----
insert into public.garages
  (id, slug, name, legal_name, siret, vat_number, phone, email, website,
   address, city, postal_code, country, description, specialties, is_public)
values (
  '11111111-1111-4111-8111-111111111111',
  'garage-central-lyon',
  'Garage Central Lyon',
  'Garage Central SARL',
  '90123456700019',
  'FR12901234567',
  '+33 4 78 00 00 00',
  'contact@garage-central.fr',
  'https://garage-central.fr',
  '12 rue de la Mécanique',
  'Lyon', '69003', 'FR',
  'Entretien, révision et réparation toutes marques au cœur de Lyon. Devis clair, délais respectés.',
  array['Entretien','Révision','Pneumatiques','Diagnostic électronique','Climatisation'],
  true
);

-- ---- demo auth users (password = Demo1234!) ----
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values
(
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-4000-8000-000000000001',
  'authenticated','authenticated','owner@demo-garage.fr',
  extensions.crypt('Demo1234!', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Sophie Martin","account_type":"staff"}',
  now(), now(), '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-4000-8000-000000000002',
  'authenticated','authenticated','mecano@demo-garage.fr',
  extensions.crypt('Demo1234!', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Karim Benali","account_type":"staff"}',
  now(), now(), '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'c0000000-0000-4000-8000-000000000001',
  'authenticated','authenticated','client@demo.fr',
  extensions.crypt('Demo1234!', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Julie Durand","account_type":"client"}',
  now(), now(), '', '', '', ''
);

-- email identities (required for password sign-in)
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
(gen_random_uuid(), 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
  '{"sub":"a0000000-0000-4000-8000-000000000001","email":"owner@demo-garage.fr","email_verified":true}', 'email', now(), now(), now()),
(gen_random_uuid(), 'a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002',
  '{"sub":"a0000000-0000-4000-8000-000000000002","email":"mecano@demo-garage.fr","email_verified":true}', 'email', now(), now(), now()),
(gen_random_uuid(), 'c0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001',
  '{"sub":"c0000000-0000-4000-8000-000000000001","email":"client@demo.fr","email_verified":true}', 'email', now(), now(), now());

-- profiles + client_profiles are created by the on_auth_user_created trigger.

-- ---- staff memberships ----
insert into public.garage_members (garage_id, user_id, role, status) values
('11111111-1111-4111-8111-111111111111','a0000000-0000-4000-8000-000000000001','owner','active'),
('11111111-1111-4111-8111-111111111111','a0000000-0000-4000-8000-000000000002','mechanic','active')
on conflict (garage_id, user_id) do nothing;

update public.client_profiles
set default_garage_id = '11111111-1111-4111-8111-111111111111', marketing_consent = true
where id = 'c0000000-0000-4000-8000-000000000001';

-- ---- catalog ----
insert into public.garage_services (garage_id, name, description, category, duration_minutes, price_from, sort_order) values
('11111111-1111-4111-8111-111111111111','Révision constructeur','Vidange, filtres et points de contrôle complets.','Entretien',90,149.00,1),
('11111111-1111-4111-8111-111111111111','Vidange + filtre','Vidange huile et remplacement du filtre à huile.','Entretien',45,79.00,2),
('11111111-1111-4111-8111-111111111111','Plaquettes de frein','Contrôle et remplacement des plaquettes avant.','Freinage',60,119.00,3),
('11111111-1111-4111-8111-111111111111','Diagnostic électronique','Lecture des défauts et diagnostic moteur.','Diagnostic',30,49.00,4),
('11111111-1111-4111-8111-111111111111','Recharge climatisation','Recharge et contrôle du circuit de climatisation.','Confort',60,89.00,5),
('11111111-1111-4111-8111-111111111111','Pneu monté (l''unité)','Montage, équilibrage et valve neuve.','Pneumatiques',20,25.00,6);

insert into public.garage_news (garage_id, title, body) values
('11111111-1111-4111-8111-111111111111','Offre révision avant l''été','Contrôle climatisation offert pour toute révision réservée en juin.'),
('11111111-1111-4111-8111-111111111111','Nouveaux horaires','Le garage est désormais ouvert le samedi matin de 8h à 12h.');

insert into public.garage_hours (garage_id, weekday, open_time, close_time, is_closed) values
('11111111-1111-4111-8111-111111111111',1,'08:00','18:00',false),
('11111111-1111-4111-8111-111111111111',2,'08:00','18:00',false),
('11111111-1111-4111-8111-111111111111',3,'08:00','18:00',false),
('11111111-1111-4111-8111-111111111111',4,'08:00','18:00',false),
('11111111-1111-4111-8111-111111111111',5,'08:00','18:00',false),
('11111111-1111-4111-8111-111111111111',6,'08:00','12:00',false),
('11111111-1111-4111-8111-111111111111',0,null,null,true);

-- ---- garage CRM data ----
insert into public.customers (id, garage_id, first_name, last_name, phone, email, city) values
('d1111111-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','Marc','Petit','+33 6 12 34 56 78','marc.petit@example.fr','Lyon'),
('d1111111-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','Inès','Lefort','+33 6 98 76 54 32','ines.lefort@example.fr','Villeurbanne');

insert into public.vehicles (garage_id, customer_id, brand, model, year, mileage, fuel, registration, status) values
('11111111-1111-4111-8111-111111111111','d1111111-0000-4000-8000-000000000001','Renault','Clio IV',2018,86000,'Essence','AB-123-CD','active'),
('11111111-1111-4111-8111-111111111111','d1111111-0000-4000-8000-000000000002','Peugeot','308',2020,52000,'Diesel','EF-456-GH','in_service');

insert into public.tasks (garage_id, title, priority, status) values
('11111111-1111-4111-8111-111111111111','Rappeler Mme Lefort pour le devis freins','high','todo'),
('11111111-1111-4111-8111-111111111111','Commander filtres habitacle','normal','todo'),
('11111111-1111-4111-8111-111111111111','Préparer la restitution de la 308','normal','doing');

-- ---- client-owned vehicle + a pending booking (populates the Pro inbox) ----
insert into public.client_vehicles (id, client_id, brand, model, year, fuel, mileage, registration) values
('e1111111-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001','Volkswagen','Golf 7',2017,98000,'Diesel','IJ-789-KL');

insert into public.service_requests
  (garage_id, client_id, service_id, service_name, client_vehicle_id, vehicle_label,
   requested_date, requested_time, note, contact_name, contact_phone, contact_email, status)
select
  '11111111-1111-4111-8111-111111111111',
  'c0000000-0000-4000-8000-000000000001',
  s.id, s.name,
  'e1111111-0000-4000-8000-000000000001',
  'Volkswagen Golf 7 · IJ-789-KL',
  (current_date + 3), '09:00',
  'Bruit au freinage côté avant droit.',
  'Julie Durand', '+33 6 55 44 33 22', 'client@demo.fr',
  'pending'
from public.garage_services s
where s.garage_id = '11111111-1111-4111-8111-111111111111'
  and s.name = 'Plaquettes de frein'
limit 1;

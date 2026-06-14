-- =====================================================================
-- GarageFlow C — 0001 init schema
-- Multi-tenant core. Every business table carries garage_id for isolation.
-- =====================================================================
create extension if not exists pgcrypto with schema extensions;

-- ============ Tenancy & identity ============
create table public.garages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  legal_name text,
  siret text,
  vat_number text,
  phone text,
  email text,
  website text,
  address text,
  city text,
  postal_code text,
  country text not null default 'FR',
  description text,
  specialties text[] not null default '{}',
  logo_url text,
  is_public boolean not null default true,
  settings jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Universal mirror of auth.users (created via trigger). One row per account.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  account_type text not null default 'client' check (account_type in ('staff','client')),
  created_at timestamptz not null default now()
);

-- Staff membership: links a profile to a garage with a role.
create table public.garage_members (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references public.garages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner','admin','advisor','mechanic','front_desk')),
  status text not null default 'active' check (status in ('active','invited','disabled')),
  invited_at timestamptz,
  created_at timestamptz not null default now(),
  unique (garage_id, user_id)
);

-- End-customer (client app) extra fields. Contact name/phone live in profiles.
create table public.client_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  default_garage_id uuid references public.garages(id) on delete set null,
  marketing_consent boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============ Garage CRM (garage-owned) ============
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references public.garages(id) on delete cascade,
  linked_user_id uuid references auth.users(id) on delete set null,
  first_name text,
  last_name text,
  company_name text,
  phone text,
  email text,
  address text,
  city text,
  postal_code text,
  source text,
  notes text,
  marketing_consent boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references public.garages(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  brand text not null,
  model text not null,
  version text,
  year int,
  mileage int,
  fuel text,
  gearbox text,
  vin text,
  registration text,
  color text,
  notes text,
  status text not null default 'active' check (status in ('active','in_service','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ Client-owned vehicles (client app) ============
create table public.client_vehicles (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  brand text not null,
  model text not null,
  year int,
  fuel text,
  mileage int,
  registration text,
  created_at timestamptz not null default now()
);

-- ============ Catalog & content (public-readable) ============
create table public.garage_services (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references public.garages(id) on delete cascade,
  name text not null,
  description text,
  category text,
  duration_minutes int not null default 60,
  price_from numeric(10,2),
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.garage_news (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references public.garages(id) on delete cascade,
  title text not null,
  body text,
  image_url text,
  is_published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.garage_hours (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references public.garages(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  open_time time,
  close_time time,
  is_closed boolean not null default false,
  unique (garage_id, weekday)
);

-- ============ Booking pipeline (client <-> garage boundary) ============
create sequence if not exists public.service_request_seq;

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('GF-' || lpad(nextval('public.service_request_seq')::text, 5, '0')),
  garage_id uuid not null references public.garages(id) on delete cascade,
  client_id uuid not null references auth.users(id) on delete cascade,
  service_id uuid references public.garage_services(id) on delete set null,
  service_name text not null,
  client_vehicle_id uuid references public.client_vehicles(id) on delete set null,
  vehicle_label text,
  requested_date date,
  requested_time time,
  proposed_date date,
  proposed_time time,
  note text,
  contact_name text,
  contact_phone text,
  contact_email text,
  status text not null default 'pending'
    check (status in ('pending','accepted','declined','reschedule_proposed','confirmed','completed','cancelled')),
  customer_id uuid references public.customers(id) on delete set null,
  appointment_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.service_request_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  garage_id uuid not null references public.garages(id) on delete cascade,
  sender text not null check (sender in ('client','garage')),
  author_id uuid references auth.users(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

-- ============ Operations (garage-owned) ============
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references public.garages(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  service_request_id uuid references public.service_requests(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'scheduled'
    check (status in ('scheduled','confirmed','in_progress','done','cancelled','no_show')),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.service_requests
  add constraint service_requests_appointment_fk
  foreign key (appointment_id) references public.appointments(id) on delete set null;

create table public.repairs (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references public.garages(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  title text not null,
  symptom text,
  diagnostic text,
  status text not null default 'to_diagnose'
    check (status in ('to_diagnose','diagnosed','in_progress','waiting_parts','ready','delivered')),
  assigned_to uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references public.garages(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  repair_id uuid references public.repairs(id) on delete set null,
  number text not null,
  status text not null default 'draft' check (status in ('draft','sent','accepted','refused')),
  title text not null,
  subtotal numeric(12,2) not null default 0,
  tax_total numeric(12,2) not null default 0,
  discount_total numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  unique (garage_id, number)
);

create table public.quote_lines (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  label text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  tax_rate numeric(5,2) not null default 20,
  line_total numeric(12,2) not null default 0,
  sort_order int not null default 0
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references public.garages(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  title text not null,
  doc_type text,
  storage_key text,
  status text not null default 'ready',
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references public.garages(id) on delete cascade,
  title text not null,
  assigned_to uuid references public.profiles(id) on delete set null,
  related_vehicle_id uuid references public.vehicles(id) on delete set null,
  priority text not null default 'normal' check (priority in ('low','normal','high')),
  status text not null default 'todo' check (status in ('todo','doing','done')),
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============ Privacy & audit ============
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  garage_id uuid references public.garages(id) on delete cascade,
  consent_key text not null,
  granted boolean not null default false,
  source text not null default 'client_app',
  granted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid references public.garages(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ============ Indexes ============
create index idx_garage_members_user on public.garage_members (user_id);
create index idx_garage_members_garage on public.garage_members (garage_id, status);
create index idx_customers_garage on public.customers (garage_id, last_name, first_name);
create index idx_vehicles_garage on public.vehicles (garage_id, status);
create index idx_client_vehicles_client on public.client_vehicles (client_id);
create index idx_services_garage on public.garage_services (garage_id, is_active, sort_order);
create index idx_news_garage on public.garage_news (garage_id, is_published, published_at desc);
create index idx_requests_garage_status on public.service_requests (garage_id, status, created_at desc);
create index idx_requests_client on public.service_requests (client_id, created_at desc);
create index idx_request_messages_request on public.service_request_messages (request_id, created_at);
create index idx_appointments_garage_start on public.appointments (garage_id, starts_at);
create index idx_repairs_garage_status on public.repairs (garage_id, status);
create index idx_quotes_garage_status on public.quotes (garage_id, status);
create index idx_quote_lines_quote on public.quote_lines (quote_id);
create index idx_tasks_garage_status on public.tasks (garage_id, status, due_at);
create index idx_audit_garage_created on public.audit_logs (garage_id, created_at desc);

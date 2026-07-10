-- =====================================================================
-- GarageFlow C — 0022 garage_centers (multi-center network foundation)
-- A garage acts as a brand / enseigne; a center is one of its physical
-- locations. Additive & non-breaking: existing garage_id-scoped RLS is
-- untouched, so a member keeps seeing every center of their garage.
-- =====================================================================
create table public.garage_centers (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references public.garages(id) on delete cascade,
  slug text not null,
  name text not null,
  address text,
  city text,
  postal_code text,
  phone text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (garage_id, slug)
);

create index idx_centers_garage on public.garage_centers (garage_id, is_active, sort_order);

alter table public.garage_centers enable row level security;

-- Public directory read of active centers (mirrors garages / garage_services);
-- members read all their centers; owners & admins manage.
create policy centers_select on public.garage_centers
  for select to anon, authenticated
  using (is_active = true or public.is_garage_member(garage_id));
create policy centers_manage on public.garage_centers
  for all to authenticated
  using (public.has_garage_role(garage_id, array['owner','admin']))
  with check (public.has_garage_role(garage_id, array['owner','admin']));

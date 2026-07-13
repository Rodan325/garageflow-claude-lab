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
  unique (garage_id, slug),
  -- Referenced by composite FKs (see 0023) so a center can only ever be
  -- attached to a row of its OWN garage. Redundant with the PK on id alone,
  -- but a composite FK requires a unique constraint matching (id, garage_id).
  unique (id, garage_id)
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

-- Least-privilege Data API grants, aligned with the policies above. RLS remains
-- the real gate; these grants only expose the verbs the policies allow:
--   - anon: read only (public directory of active centers).
--   - authenticated: read + write, but writes are still restricted to
--     owner/admin by centers_manage. No write grant to anon → no public writes.
-- A 42501 (insufficient_privilege) from here is a real misconfiguration and
-- must NOT be swallowed as a "missing schema" fallback (see isMissingSchemaError).
grant select on public.garage_centers to anon, authenticated;
grant insert, update, delete on public.garage_centers to authenticated;

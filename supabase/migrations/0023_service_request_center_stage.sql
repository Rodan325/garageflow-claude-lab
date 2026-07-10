-- =====================================================================
-- GarageFlow C — 0023 attach centers to the client/booking boundary
-- Adds nullable center_id (which center handles a request / where a staff
-- member works) and a nullable client_stage (the unified, client-readable
-- after-sales timeline stage). Nullable everywhere → existing rows stay
-- valid. A default "principal" center is backfilled per garage.
-- =====================================================================
alter table public.service_requests
  add column center_id uuid,
  add column client_stage text;

alter table public.garage_members
  add column center_id uuid;

-- Composite foreign keys → a center_id can ONLY reference a center of the SAME
-- garage as the row (garage integrity). center_id stays nullable for backward
-- compatibility (a NULL composite key is not enforced, so legacy rows are fine).
-- ON DELETE SET NULL (center_id) nulls only center_id, never the NOT NULL
-- garage_id (requires PostgreSQL 15+; the project runs PG17).
alter table public.service_requests
  add constraint service_requests_center_garage_fk
  foreign key (center_id, garage_id) references public.garage_centers (id, garage_id)
  on delete set null (center_id);

alter table public.garage_members
  add constraint garage_members_center_garage_fk
  foreign key (center_id, garage_id) references public.garage_centers (id, garage_id)
  on delete set null (center_id);

create index idx_requests_center on public.service_requests (center_id, created_at desc);
create index idx_members_center on public.garage_members (center_id);

-- Backfill one default center per existing garage (idempotent via the
-- unique (garage_id, slug) constraint), then link existing requests to it.
insert into public.garage_centers (garage_id, slug, name, address, city, postal_code, phone, sort_order)
select g.id, 'principal', g.name, g.address, g.city, g.postal_code, g.phone, 0
from public.garages g
on conflict (garage_id, slug) do nothing;

update public.service_requests sr
set center_id = gc.id
from public.garage_centers gc
where gc.garage_id = sr.garage_id and gc.slug = 'principal' and sr.center_id is null;

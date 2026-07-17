-- =====================================================================
-- GarageFlow C — 0017 client vehicle dossier + consent-based sharing
-- A client owns their vehicles (strictly private). When they attach a
-- vehicle to a request, an explicit, revocable SHARE is recorded so the
-- target garage may read THAT vehicle — and only that one — for that
-- request. A garage can never read all client vehicles. RGPD-minded:
-- access is per-share, time-stamped, and revocable.
-- =====================================================================

-- 1) Extra dossier fields on the client vehicle (still owner-private).
alter table public.client_vehicles
  add column if not exists notes text,
  add column if not exists archived boolean not null default false;

-- 2) Consent ledger: who shared which vehicle, with which garage, from
--    which request, when — and whether the access was revoked.
create table if not exists public.client_vehicle_shares (
  id uuid primary key default gen_random_uuid(),
  client_vehicle_id uuid not null references public.client_vehicles(id) on delete cascade,
  garage_id uuid not null references public.garages(id) on delete cascade,
  service_request_id uuid references public.service_requests(id) on delete set null,
  shared_by uuid not null references auth.users(id) on delete cascade,
  scope text not null default 'request',
  shared_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_cvs_vehicle on public.client_vehicle_shares(client_vehicle_id);
create index if not exists idx_cvs_garage on public.client_vehicle_shares(garage_id);
-- At most one ACTIVE share per (vehicle, garage); revoked rows stay for history.
create unique index if not exists uq_cvs_active
  on public.client_vehicle_shares(client_vehicle_id, garage_id) where revoked_at is null;

alter table public.client_vehicle_shares enable row level security;

-- The client (sharer) fully manages their own shares (create / revoke / delete).
drop policy if exists cvs_client on public.client_vehicle_shares;
create policy cvs_client on public.client_vehicle_shares
  for all to authenticated
  using (shared_by = auth.uid())
  with check (shared_by = auth.uid());

-- A garage member may READ shares addressed to their garage (to know access).
drop policy if exists cvs_garage_read on public.client_vehicle_shares;
create policy cvs_garage_read on public.client_vehicle_shares
  for select to authenticated
  using (public.is_garage_member(garage_id));

-- 3) Garage read access to a client vehicle ONLY via an active share.
--    SECURITY DEFINER helper avoids RLS recursion on the shares table.
create or replace function public.vehicle_shared_with_me(p_vehicle uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.client_vehicle_shares s
    where s.client_vehicle_id = p_vehicle
      and s.revoked_at is null
      and public.is_garage_member(s.garage_id)
  );
$$;

drop policy if exists client_vehicles_shared_read on public.client_vehicles;
create policy client_vehicles_shared_read on public.client_vehicles
  for select to authenticated
  using (public.vehicle_shared_with_me(id));

-- 4) Record the consent automatically when a request carries the client's
--    OWN vehicle (never another user's vehicle). Idempotent per active pair.
create or replace function public.share_vehicle_on_request()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.client_vehicle_id is not null
     and exists (select 1 from public.client_vehicles v
                 where v.id = new.client_vehicle_id and v.client_id = new.client_id) then
    insert into public.client_vehicle_shares (client_vehicle_id, garage_id, service_request_id, shared_by, scope)
    values (new.client_vehicle_id, new.garage_id, new.id, new.client_id, 'request')
    on conflict (client_vehicle_id, garage_id) where revoked_at is null do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_share_vehicle_on_request on public.service_requests;
create trigger trg_share_vehicle_on_request
  after insert on public.service_requests
  for each row execute function public.share_vehicle_on_request();

revoke all on function public.vehicle_shared_with_me(uuid) from public, anon;
grant execute on function public.vehicle_shared_with_me(uuid) to authenticated;

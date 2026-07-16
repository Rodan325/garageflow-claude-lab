-- Generic center transfers and provider-neutral integration metadata.
-- Additive only. No existing rows or historical identifiers are changed.

create table public.service_request_transfers (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references public.garages(id) on delete cascade,
  service_request_id uuid not null,
  from_center_id uuid not null,
  to_center_id uuid not null,
  status text not null default 'proposed' check (
    status in ('proposed', 'customer_confirmed', 'completed', 'cancelled')
  ),
  requested_by uuid not null references auth.users(id),
  reason text,
  created_at timestamptz not null default now(),
  customer_confirmed_at timestamptz,
  completed_at timestamptz,
  unique (id, garage_id),
  check (from_center_id <> to_center_id),
  foreign key (service_request_id, garage_id)
    references public.service_requests(id, garage_id) on delete cascade,
  foreign key (from_center_id, garage_id)
    references public.garage_centers(id, garage_id),
  foreign key (to_center_id, garage_id)
    references public.garage_centers(id, garage_id)
);

create index service_request_transfers_request_idx
  on public.service_request_transfers(service_request_id, created_at desc);

create unique index service_request_transfers_one_open_idx
  on public.service_request_transfers(service_request_id)
  where status in ('proposed', 'customer_confirmed');

create table public.service_request_transfer_events (
  id uuid primary key default gen_random_uuid(),
  transfer_id uuid not null,
  garage_id uuid not null references public.garages(id) on delete cascade,
  previous_status text check (
    previous_status is null or previous_status in ('proposed', 'customer_confirmed', 'completed', 'cancelled')
  ),
  new_status text not null check (
    new_status in ('proposed', 'customer_confirmed', 'completed', 'cancelled')
  ),
  changed_by uuid not null references auth.users(id),
  occurred_at timestamptz not null default now(),
  note text,
  foreign key (transfer_id, garage_id)
    references public.service_request_transfers(id, garage_id) on delete cascade
);

create index service_request_transfer_events_timeline_idx
  on public.service_request_transfer_events(transfer_id, occurred_at);

create function public.prevent_transfer_event_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  raise exception 'Transfer events are append-only' using errcode = '55000';
end;
$$;

create trigger service_request_transfer_events_append_only
before update or delete on public.service_request_transfer_events
for each row execute function public.prevent_transfer_event_mutation();

alter table public.service_request_transfers enable row level security;
alter table public.service_request_transfer_events enable row level security;

create policy service_request_transfers_select on public.service_request_transfers
for select to authenticated using (
  public.is_garage_member(garage_id)
  or exists (
    select 1 from public.service_requests request
    where request.id = service_request_transfers.service_request_id
      and request.garage_id = service_request_transfers.garage_id
      and request.client_id = (select auth.uid())
  )
);

create policy service_request_transfer_events_select on public.service_request_transfer_events
for select to authenticated using (
  public.is_garage_member(garage_id)
  or exists (
    select 1
    from public.service_request_transfers transfer
    join public.service_requests request
      on request.id = transfer.service_request_id and request.garage_id = transfer.garage_id
    where transfer.id = service_request_transfer_events.transfer_id
      and transfer.garage_id = service_request_transfer_events.garage_id
      and request.client_id = (select auth.uid())
  )
);

revoke all on public.service_request_transfers from public, anon, authenticated;
revoke all on public.service_request_transfer_events from public, anon, authenticated;
grant select on public.service_request_transfers to authenticated;
grant select on public.service_request_transfer_events to authenticated;

create function public.propose_center_transfer(
  p_request_id uuid,
  p_to_center_id uuid,
  p_reason text default null
)
returns public.service_request_transfers
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid := (select auth.uid());
  v_request public.service_requests%rowtype;
  v_transfer public.service_request_transfers%rowtype;
begin
  if v_actor is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select * into v_request from public.service_requests where id = p_request_id for update;
  if not found then raise exception 'Service request not found' using errcode = 'P0002'; end if;
  if not public.is_garage_member(v_request.garage_id) then
    raise exception 'Center transfer not permitted' using errcode = '42501';
  end if;
  if v_request.center_id is null then
    raise exception 'A source center is required' using errcode = '23514';
  end if;
  if p_to_center_id = v_request.center_id then
    raise exception 'Destination must differ from source' using errcode = '23514';
  end if;
  if not exists (
    select 1 from public.garage_centers center
    where center.id = p_to_center_id
      and center.garage_id = v_request.garage_id
      and center.is_active
  ) then
    raise exception 'Destination center is invalid' using errcode = '23514';
  end if;
  if not exists (
    select 1 from public.garage_centers center
    where center.id = v_request.center_id
      and center.garage_id = v_request.garage_id
      and center.is_active
  ) then
    raise exception 'Source center is invalid' using errcode = '23514';
  end if;

  insert into public.service_request_transfers (
    garage_id, service_request_id, from_center_id, to_center_id, requested_by, reason
  ) values (
    v_request.garage_id, v_request.id, v_request.center_id, p_to_center_id, v_actor, nullif(btrim(p_reason), '')
  ) returning * into v_transfer;

  insert into public.service_request_transfer_events (
    transfer_id, garage_id, previous_status, new_status, changed_by, note
  ) values (v_transfer.id, v_transfer.garage_id, null, 'proposed', v_actor, v_transfer.reason);
  return v_transfer;
end;
$$;

create function public.decide_center_transfer(
  p_transfer_id uuid,
  p_accept boolean,
  p_note text default null
)
returns public.service_request_transfers
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid := (select auth.uid());
  v_transfer public.service_request_transfers%rowtype;
  v_client_id uuid;
  v_next_status text;
begin
  if v_actor is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select * into v_transfer
  from public.service_request_transfers where id = p_transfer_id for update;
  if not found then raise exception 'Center transfer not found' using errcode = 'P0002'; end if;
  select request.client_id into v_client_id
  from public.service_requests request
  where request.id = v_transfer.service_request_id and request.garage_id = v_transfer.garage_id;
  if v_client_id is distinct from v_actor then
    raise exception 'Customer confirmation required' using errcode = '42501';
  end if;
  if v_transfer.status <> 'proposed' then
    raise exception 'Transfer is not awaiting confirmation' using errcode = '22023';
  end if;
  v_next_status := case when p_accept then 'customer_confirmed' else 'cancelled' end;
  update public.service_request_transfers
  set status = v_next_status,
      customer_confirmed_at = case when p_accept then now() else null end
  where id = v_transfer.id returning * into v_transfer;
  insert into public.service_request_transfer_events (
    transfer_id, garage_id, previous_status, new_status, changed_by, note
  ) values (v_transfer.id, v_transfer.garage_id, 'proposed', v_next_status, v_actor, nullif(btrim(p_note), ''));
  return v_transfer;
end;
$$;

create function public.complete_center_transfer(p_transfer_id uuid)
returns public.service_request_transfers
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid := (select auth.uid());
  v_transfer public.service_request_transfers%rowtype;
begin
  if v_actor is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select * into v_transfer
  from public.service_request_transfers where id = p_transfer_id for update;
  if not found then raise exception 'Center transfer not found' using errcode = 'P0002'; end if;
  if not public.is_garage_member(v_transfer.garage_id) then
    raise exception 'Center transfer completion not permitted' using errcode = '42501';
  end if;
  if v_transfer.status <> 'customer_confirmed' then
    raise exception 'Customer confirmation is required' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.garage_centers center
    where center.id = v_transfer.to_center_id
      and center.garage_id = v_transfer.garage_id
      and center.is_active
  ) then raise exception 'Destination center is invalid' using errcode = '23514'; end if;

  update public.service_requests
  set center_id = v_transfer.to_center_id, updated_at = now()
  where id = v_transfer.service_request_id
    and garage_id = v_transfer.garage_id
    and center_id = v_transfer.from_center_id;
  if not found then
    raise exception 'Transfer source is stale' using errcode = '40001';
  end if;
  update public.appointments
  set center_id = v_transfer.to_center_id
  where service_request_id = v_transfer.service_request_id and garage_id = v_transfer.garage_id;
  update public.service_request_transfers
  set status = 'completed', completed_at = now()
  where id = v_transfer.id returning * into v_transfer;
  insert into public.service_request_transfer_events (
    transfer_id, garage_id, previous_status, new_status, changed_by
  ) values (v_transfer.id, v_transfer.garage_id, 'customer_confirmed', 'completed', v_actor);
  return v_transfer;
end;
$$;

revoke all on function public.propose_center_transfer(uuid, uuid, text) from public, anon;
revoke all on function public.decide_center_transfer(uuid, boolean, text) from public, anon;
revoke all on function public.complete_center_transfer(uuid) from public, anon;
grant execute on function public.propose_center_transfer(uuid, uuid, text) to authenticated;
grant execute on function public.decide_center_transfer(uuid, boolean, text) to authenticated;
grant execute on function public.complete_center_transfer(uuid) to authenticated;

create table public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references public.garages(id) on delete cascade,
  center_id uuid,
  integration_type text not null check (
    integration_type in ('csv', 'rest_api', 'webhook', 'dms', 'crm', 'calendar', 'email', 'sms')
  ),
  name text not null check (length(btrim(name)) > 0),
  status text not null default 'disabled' check (status in ('disabled', 'configured', 'active', 'error')),
  public_config jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, garage_id),
  foreign key (center_id, garage_id)
    references public.garage_centers(id, garage_id) on delete set null (center_id)
);

comment on column public.integration_connections.public_config is
  'Non-sensitive adapter settings only. Provider credentials must remain in a server-side secret store.';

create table public.external_entity_references (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references public.garages(id) on delete cascade,
  center_id uuid,
  entity_type text not null check (entity_type in ('center', 'customer', 'vehicle', 'appointment', 'service')),
  entity_id uuid not null,
  external_source text not null check (length(btrim(external_source)) > 0),
  external_organization_id text,
  external_center_id text,
  external_booking_id text,
  sync_status text not null default 'pending' check (sync_status in ('pending', 'synced', 'failed', 'conflict')),
  last_synced_at timestamptz,
  sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (center_id, garage_id)
    references public.garage_centers(id, garage_id) on delete set null (center_id),
  unique (garage_id, entity_type, entity_id, external_source)
);

create index external_entity_references_source_idx
  on public.external_entity_references(garage_id, external_source, sync_status);

alter table public.integration_connections enable row level security;
alter table public.external_entity_references enable row level security;

create policy integration_connections_member_select on public.integration_connections
for select to authenticated using (public.is_garage_member(garage_id));
create policy external_entity_references_member_select on public.external_entity_references
for select to authenticated using (public.is_garage_member(garage_id));

revoke all on public.integration_connections from public, anon, authenticated;
revoke all on public.external_entity_references from public, anon, authenticated;
grant select on public.integration_connections to authenticated;
grant select on public.external_entity_references to authenticated;

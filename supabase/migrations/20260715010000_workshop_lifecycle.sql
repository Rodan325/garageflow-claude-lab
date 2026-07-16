-- Additive workshop lifecycle and customer-visible timeline.
-- This migration is prepared for a non-production validation environment and
-- must only be applied after the garage_centers migrations.

alter table public.service_requests
  add column workshop_stage text,
  add column estimated_completion_at timestamptz,
  add column vehicle_checked_in_at timestamptz,
  add column vehicle_delivered_at timestamptz;

alter table public.service_requests
  add constraint service_requests_workshop_stage_check
  check (
    workshop_stage is null or workshop_stage in (
      'appointment_confirmed',
      'vehicle_expected',
      'vehicle_checked_in',
      'vehicle_received',
      'diagnosis_in_progress',
      'customer_approval_required',
      'work_authorized',
      'work_in_progress',
      'quality_control',
      'vehicle_ready',
      'vehicle_delivered',
      'closed'
    )
  );

-- A redundant composite key is required by child tables to guarantee that a
-- request id can never be paired with another organisation's garage id.
alter table public.service_requests
  add constraint service_requests_id_garage_key unique (id, garage_id);

create table public.service_request_timeline (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  garage_id uuid not null,
  center_id uuid,
  previous_stage text,
  new_stage text not null,
  changed_by uuid references auth.users(id) on delete set null,
  occurred_at timestamptz not null default now(),
  internal_note text,
  customer_message text,
  estimated_completion_at timestamptz,
  visible_to_customer boolean not null default true,
  notification_status text not null default 'pending',
  constraint service_request_timeline_request_garage_fk
    foreign key (request_id, garage_id)
    references public.service_requests (id, garage_id) on delete cascade,
  constraint service_request_timeline_center_garage_fk
    foreign key (center_id, garage_id)
    references public.garage_centers (id, garage_id)
    on delete set null (center_id),
  constraint service_request_timeline_previous_stage_check check (
    previous_stage is null or previous_stage in (
      'appointment_confirmed', 'vehicle_expected', 'vehicle_checked_in',
      'vehicle_received', 'diagnosis_in_progress',
      'customer_approval_required', 'work_authorized', 'work_in_progress',
      'quality_control', 'vehicle_ready', 'vehicle_delivered', 'closed'
    )
  ),
  constraint service_request_timeline_new_stage_check check (
    new_stage in (
      'appointment_confirmed', 'vehicle_expected', 'vehicle_checked_in',
      'vehicle_received', 'diagnosis_in_progress',
      'customer_approval_required', 'work_authorized', 'work_in_progress',
      'quality_control', 'vehicle_ready', 'vehicle_delivered', 'closed'
    )
  ),
  constraint service_request_timeline_notification_status_check check (
    notification_status in ('pending', 'simulated', 'sent', 'failed', 'skipped')
  )
);

comment on table public.service_request_timeline is
  'Append-only history of validated workshop stage transitions.';
comment on column public.service_request_timeline.internal_note is
  'Staff-only note. Never exposed by the customer RLS policy.';

create index service_request_timeline_request_occurred_idx
  on public.service_request_timeline (request_id, occurred_at);
create index service_request_timeline_garage_stage_idx
  on public.service_request_timeline (garage_id, new_stage, occurred_at desc);
create index service_request_timeline_request_garage_fk_idx
  on public.service_request_timeline (request_id, garage_id);
create index service_request_timeline_center_garage_fk_idx
  on public.service_request_timeline (center_id, garage_id)
  where center_id is not null;
create index service_request_timeline_changed_by_fk_idx
  on public.service_request_timeline (changed_by)
  where changed_by is not null;
create index service_requests_workshop_stage_idx
  on public.service_requests (garage_id, workshop_stage, updated_at desc)
  where workshop_stage is not null;

alter table public.service_request_timeline enable row level security;

-- Organization-wide legacy members have no center assignment. Center-scoped
-- members may administer only rows belonging to their assigned center.
create or replace function public.can_manage_garage_center(
  p_garage_id uuid,
  p_center_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.garage_members member
    where member.garage_id = p_garage_id
      and member.user_id = (select auth.uid())
      and member.status = 'active'
      and (member.center_id is null or member.center_id = p_center_id)
  );
$$;

revoke all on function public.can_manage_garage_center(uuid, uuid) from public, anon;
grant execute on function public.can_manage_garage_center(uuid, uuid) to authenticated;

create policy service_request_timeline_staff_select
  on public.service_request_timeline
  for select
  to authenticated
  using (public.can_manage_garage_center(garage_id, center_id));

create policy service_request_timeline_customer_select
  on public.service_request_timeline
  for select
  to authenticated
  using (
    visible_to_customer
    and exists (
      select 1
      from public.service_requests request
      where request.id = service_request_timeline.request_id
        and request.garage_id = service_request_timeline.garage_id
        and request.client_id = (select auth.uid())
    )
  );

-- Timeline rows are read and inserted only through validated RPCs. The base
-- table is not exposed through Data API grants, preventing customer access to
-- internal_note even when the event itself is customer-visible.
revoke all on public.service_request_timeline from anon, authenticated;

create or replace function public.get_workshop_timeline(p_request_id uuid)
returns table (
  id uuid,
  request_id uuid,
  garage_id uuid,
  center_id uuid,
  previous_stage text,
  new_stage text,
  changed_by uuid,
  occurred_at timestamptz,
  internal_note text,
  customer_message text,
  estimated_completion_at timestamptz,
  visible_to_customer boolean,
  notification_status text
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_request public.service_requests%rowtype;
  staff_access boolean := false;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select *
  into current_request
  from public.service_requests request
  where request.id = p_request_id;

  if not found then
    raise exception 'Service request not found' using errcode = 'P0002';
  end if;

  staff_access := public.is_garage_member(current_request.garage_id);
  if not staff_access and current_request.client_id <> current_user_id then
    raise exception 'Workshop timeline not permitted' using errcode = '42501';
  end if;

  return query
  select
    event.id,
    event.request_id,
    event.garage_id,
    event.center_id,
    event.previous_stage,
    event.new_stage,
    event.changed_by,
    event.occurred_at,
    case when staff_access then event.internal_note else null end,
    event.customer_message,
    event.estimated_completion_at,
    event.visible_to_customer,
    event.notification_status
  from public.service_request_timeline event
  where event.request_id = p_request_id
    and (staff_access or event.visible_to_customer)
  order by event.occurred_at;
end;
$$;

revoke all on function public.get_workshop_timeline(uuid) from public, anon;
grant execute on function public.get_workshop_timeline(uuid) to authenticated;

create or replace function public.transition_workshop_stage(
  p_request_id uuid,
  p_new_stage text,
  p_internal_note text default null,
  p_customer_message text default null,
  p_estimated_completion_at timestamptz default null,
  p_visible_to_customer boolean default true
)
returns public.service_request_timeline
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_request public.service_requests%rowtype;
  timeline_event public.service_request_timeline%rowtype;
  transition_allowed boolean := false;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select *
  into current_request
  from public.service_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Service request not found' using errcode = 'P0002';
  end if;

  if not public.has_garage_role(
    current_request.garage_id,
    array['owner', 'admin', 'advisor', 'front_desk', 'mechanic']
  ) or not public.can_manage_garage_center(
    current_request.garage_id,
    current_request.center_id
  ) then
    raise exception 'Workshop transition not permitted' using errcode = '42501';
  end if;

  if current_request.workshop_stage is null then
    transition_allowed := p_new_stage = 'appointment_confirmed';
  else
    transition_allowed := case current_request.workshop_stage
      when 'appointment_confirmed' then p_new_stage = 'vehicle_expected'
      when 'vehicle_expected' then p_new_stage = 'vehicle_checked_in'
      when 'vehicle_checked_in' then p_new_stage = 'vehicle_received'
      when 'vehicle_received' then p_new_stage = 'diagnosis_in_progress'
      when 'diagnosis_in_progress' then p_new_stage in ('customer_approval_required', 'work_authorized')
      when 'customer_approval_required' then p_new_stage = 'work_authorized'
      when 'work_authorized' then p_new_stage = 'work_in_progress'
      when 'work_in_progress' then p_new_stage = 'quality_control'
      when 'quality_control' then p_new_stage in ('work_in_progress', 'vehicle_ready')
      when 'vehicle_ready' then p_new_stage = 'vehicle_delivered'
      when 'vehicle_delivered' then p_new_stage = 'closed'
      else false
    end;
  end if;

  if not transition_allowed then
    raise exception 'Invalid workshop transition from % to %',
      coalesce(current_request.workshop_stage, 'none'), p_new_stage
      using errcode = '22023';
  end if;

  update public.service_requests
  set workshop_stage = p_new_stage,
      estimated_completion_at = coalesce(p_estimated_completion_at, estimated_completion_at),
      vehicle_checked_in_at = case
        when p_new_stage = 'vehicle_checked_in' then coalesce(vehicle_checked_in_at, now())
        else vehicle_checked_in_at
      end,
      vehicle_delivered_at = case
        when p_new_stage = 'vehicle_delivered' then coalesce(vehicle_delivered_at, now())
        else vehicle_delivered_at
      end,
      updated_at = now()
  where id = p_request_id;

  insert into public.service_request_timeline (
    request_id,
    garage_id,
    center_id,
    previous_stage,
    new_stage,
    changed_by,
    internal_note,
    customer_message,
    estimated_completion_at,
    visible_to_customer,
    notification_status
  ) values (
    current_request.id,
    current_request.garage_id,
    current_request.center_id,
    current_request.workshop_stage,
    p_new_stage,
    current_user_id,
    nullif(btrim(p_internal_note), ''),
    nullif(btrim(p_customer_message), ''),
    p_estimated_completion_at,
    p_visible_to_customer,
    'pending'
  )
  returning * into timeline_event;

  return timeline_event;
end;
$$;

revoke all on function public.transition_workshop_stage(uuid, text, text, text, timestamptz, boolean)
  from public, anon;
grant execute on function public.transition_workshop_stage(uuid, text, text, text, timestamptz, boolean)
  to authenticated;

-- FPV1-01-PR2: canonical, fail-closed workshop capabilities.
-- This migration performs no membership backfill and changes no business row.

do $$
declare
  invalid_memberships bigint;
  duplicate_memberships bigint;
begin
  select count(*)
  into invalid_memberships
  from public.garage_members member
  left join public.garage_centers center
    on center.id = member.center_id
  where member.status = 'active'
    and (
      (
        member.organization_role is null
        and (
          member.center_id is null
          or member.center_role is null
          or center.id is null
          or center.garage_id is distinct from member.garage_id
          or not center.is_active
        )
      )
      or (
        member.organization_role is not null
        and (
          member.center_id is not null
          or member.center_role is not null
        )
      )
      or ((member.center_id is null) <> (member.center_role is null))
    );

  select count(*)
  into duplicate_memberships
  from (
    select member.user_id, member.garage_id
    from public.garage_members member
    where member.status = 'active'
    group by member.user_id, member.garage_id
    having count(*) > 1
  ) duplicate;

  if invalid_memberships > 0 or duplicate_memberships > 0 then
    raise exception
      'Workshop capability migration blocked: % invalid active membership(s), % duplicate active user/garage scope(s)',
      invalid_memberships,
      duplicate_memberships
      using errcode = '55000';
  end if;
end;
$$;

alter table public.garage_members
  drop constraint garage_members_center_role_check;

alter table public.garage_members
  add constraint garage_members_center_role_check check (
    center_role is null or center_role in (
      'center_manager',
      'receptionist',
      'service_advisor',
      'front_desk',
      'technician',
      'viewer'
    )
  ) not valid;

alter table public.garage_members
  validate constraint garage_members_center_role_check;

create or replace function private.resolve_workshop_actor(
  p_garage_id uuid,
  p_center_id uuid
)
returns table (
  actor_id uuid,
  role_name text,
  actor_center_id uuid
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  resolved_actor_id uuid := (select auth.uid());
  active_scope_count integer;
  actor_membership record;
begin
  if resolved_actor_id is null or p_garage_id is null then
    return;
  end if;

  select count(*)
  into active_scope_count
  from public.garage_members candidate
  where candidate.user_id = resolved_actor_id
    and candidate.garage_id = p_garage_id
    and candidate.status = 'active';

  if active_scope_count <> 1 then
    return;
  end if;

  select
    candidate.organization_role,
    candidate.center_role,
    candidate.center_id
  into actor_membership
  from public.garage_members candidate
  where candidate.user_id = resolved_actor_id
    and candidate.garage_id = p_garage_id
    and candidate.status = 'active';

  if actor_membership.organization_role = 'organization_owner'
    and actor_membership.center_id is null
    and actor_membership.center_role is null
    and (
      p_center_id is null
      or exists (
        select 1
        from public.garage_centers center
        where center.id = p_center_id
          and center.garage_id = p_garage_id
          and center.is_active
      )
    )
  then
    return query
    select resolved_actor_id, 'organization_owner'::text, null::uuid;
    return;
  end if;

  if actor_membership.organization_role is null
    and actor_membership.center_role in (
      'center_manager',
      'receptionist',
      'technician'
    )
    and p_center_id is not null
    and actor_membership.center_id = p_center_id
    and exists (
      select 1
      from public.garage_centers center
      where center.id = actor_membership.center_id
        and center.garage_id = p_garage_id
        and center.is_active
    )
  then
    return query
    select
      resolved_actor_id,
      actor_membership.center_role::text,
      actor_membership.center_id::uuid;
  end if;
end;
$$;

create or replace function private.workshop_technician_assigned(
  p_request_id uuid,
  p_actor_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_request record;
  actor_role text;
  linked_appointment_count integer;
  linked_repair_count integer;
  assigned_repair_count integer;
begin
  if p_request_id is null or p_actor_id is null then
    return false;
  end if;

  select
    request.garage_id,
    request.center_id,
    request.appointment_id
  into current_request
  from public.service_requests request
  where request.id = p_request_id;

  if not found or current_request.center_id is null then
    return false;
  end if;

  select context.role_name
  into actor_role
  from private.resolve_workshop_actor(
    current_request.garage_id,
    current_request.center_id
  ) context
  where context.actor_id = p_actor_id;

  if actor_role is distinct from 'technician' then
    return false;
  end if;

  select
    count(distinct appointment.id),
    count(repair.id),
    count(repair.id) filter (where repair.assigned_to = p_actor_id)
  into
    linked_appointment_count,
    linked_repair_count,
    assigned_repair_count
  from public.appointments appointment
  left join public.repairs repair
    on repair.appointment_id = appointment.id
   and repair.garage_id = appointment.garage_id
  where appointment.service_request_id = p_request_id
    and appointment.garage_id = current_request.garage_id
    and appointment.center_id = current_request.center_id
    and (
      current_request.appointment_id is null
      or current_request.appointment_id = appointment.id
    );

  return linked_appointment_count = 1
    and linked_repair_count = 1
    and assigned_repair_count = 1;
end;
$$;

create or replace function public.has_workshop_capability(
  p_request_id uuid,
  p_capability text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  resolved_actor_id uuid := (select auth.uid());
  current_request record;
  actor_role text;
begin
  if resolved_actor_id is null
    or p_request_id is null
    or nullif(btrim(p_capability), '') is null
  then
    return false;
  end if;

  select
    request.garage_id,
    request.center_id,
    request.client_id
  into current_request
  from public.service_requests request
  where request.id = p_request_id;

  if not found
    or current_request.center_id is null
    or not exists (
      select 1
      from public.garage_centers center
      where center.id = current_request.center_id
        and center.garage_id = current_request.garage_id
        and center.is_active
    )
  then
    return false;
  end if;

  if current_request.client_id = resolved_actor_id then
    return p_capability = any(array[
      'timeline.customer',
      'recommendation.read',
      'recommendation.decision'
    ]::text[]);
  end if;

  select context.role_name
  into actor_role
  from private.resolve_workshop_actor(
    current_request.garage_id,
    current_request.center_id
  ) context;

  if actor_role = 'organization_owner' then
    return p_capability = any(array[
      'timeline.full',
      'transition.operational',
      'transition.finalize',
      'transition.close',
      'transition.reopen',
      'recommendation.read',
      'recommendation.create',
      'recommendation.status',
      'recommendation.price',
      'recommendation.quote_link',
      'assignment.repair'
    ]::text[]);
  end if;

  if actor_role = 'center_manager' then
    return p_capability = any(array[
      'timeline.full',
      'transition.operational',
      'transition.finalize',
      'transition.close',
      'transition.reopen',
      'recommendation.read',
      'recommendation.create',
      'recommendation.status',
      'assignment.repair'
    ]::text[]);
  end if;

  if actor_role = 'receptionist' then
    return p_capability = any(array[
      'timeline.reception',
      'transition.reception'
    ]::text[]);
  end if;

  if actor_role = 'technician'
    and private.workshop_technician_assigned(
      p_request_id,
      resolved_actor_id
    )
  then
    return p_capability = any(array[
      'timeline.technical',
      'transition.technician',
      'recommendation.read',
      'recommendation.create'
    ]::text[]);
  end if;

  return false;
end;
$$;

create or replace function private.record_workshop_event(
  p_request_id uuid,
  p_garage_id uuid,
  p_center_id uuid,
  p_previous_stage text,
  p_new_stage text,
  p_actor_id uuid,
  p_internal_note text,
  p_customer_message text,
  p_estimated_completion_at timestamptz,
  p_visible_to_customer boolean
)
returns public.service_request_timeline
language plpgsql
security definer
set search_path = ''
as $$
declare
  recorded_event public.service_request_timeline%rowtype;
begin
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
  )
  values (
    p_request_id,
    p_garage_id,
    p_center_id,
    p_previous_stage,
    p_new_stage,
    p_actor_id,
    nullif(btrim(p_internal_note), ''),
    nullif(btrim(p_customer_message), ''),
    p_estimated_completion_at,
    p_visible_to_customer,
    'pending'
  )
  returning * into recorded_event;

  return recorded_event;
end;
$$;

create or replace function private.guard_workshop_managed_request_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (
    new.workshop_stage is distinct from old.workshop_stage
    or new.estimated_completion_at is distinct from old.estimated_completion_at
    or new.vehicle_checked_in_at is distinct from old.vehicle_checked_in_at
    or new.vehicle_delivered_at is distinct from old.vehicle_delivered_at
  ) and not (
    current_user::text = 'postgres'
    and current_setting('app.workshop_rpc', true) = 'on'
  ) then
    raise exception 'Workshop-managed request fields require a controlled RPC'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_workshop_managed_request_fields
  on public.service_requests;
create trigger trg_guard_workshop_managed_request_fields
before update on public.service_requests
for each row execute function private.guard_workshop_managed_request_fields();

create or replace function private.guard_workshop_assignment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (
    (tg_op = 'INSERT' and new.assigned_to is not null)
    or (
      tg_op = 'UPDATE'
      and new.assigned_to is distinct from old.assigned_to
    )
  ) and not (
    current_user::text = 'postgres'
    and current_setting('app.workshop_assignment_rpc', true) = 'on'
  ) then
    raise exception 'Workshop assignment requires a controlled RPC'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_repairs_workshop_assignment
  on public.repairs;
create trigger trg_guard_repairs_workshop_assignment
before insert or update on public.repairs
for each row execute function private.guard_workshop_assignment();

drop trigger if exists trg_guard_tasks_workshop_assignment
  on public.tasks;
create trigger trg_guard_tasks_workshop_assignment
before insert or update on public.tasks
for each row execute function private.guard_workshop_assignment();

create or replace function public.guard_request_transition()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  is_staff boolean := public.has_core_capability(
    old.garage_id,
    old.center_id,
    'service_requests.update'
  );
  is_owner_client boolean := (
    old.client_id = actor_id
    and new.client_id = actor_id
  );
begin
  if new.id is distinct from old.id
    or new.garage_id is distinct from old.garage_id
  then
    raise exception 'Request tenant keys are immutable'
      using errcode = '42501';
  end if;

  if current_user::text = 'postgres'
    and current_setting('app.workshop_rpc', true) = 'on'
  then
    return new;
  end if;

  if is_staff then
    if new.status is distinct from old.status and not (
      (old.status = 'pending' and new.status in (
        'accepted',
        'declined',
        'reschedule_proposed',
        'cancelled'
      ))
      or (
        old.status = 'reschedule_proposed'
        and new.status in ('declined', 'accepted', 'cancelled')
      )
      or (
        old.status in ('accepted', 'confirmed')
        and new.status in ('confirmed', 'completed', 'cancelled')
      )
    ) then
      raise exception 'Forbidden garage request transition: % -> %',
        old.status,
        new.status
        using errcode = '42501';
    end if;
  elsif is_owner_client then
    if (
      to_jsonb(new) - array['status', 'updated_at']
    ) is distinct from (
      to_jsonb(old) - array['status', 'updated_at']
    ) then
      raise exception 'Clients may only update the request status'
        using errcode = '42501';
    end if;

    if new.status is distinct from old.status and not (
      (
        old.status = 'reschedule_proposed'
        and new.status in ('confirmed', 'cancelled')
      )
      or (
        old.status = 'accepted'
        and new.status in ('confirmed', 'cancelled')
      )
      or (
        old.status in ('pending', 'reschedule_proposed', 'accepted')
        and new.status = 'cancelled'
      )
    ) then
      raise exception 'Forbidden client request transition: % -> %',
        old.status,
        new.status
        using errcode = '42501';
    end if;
  else
    raise exception 'Request update is not permitted'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

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
set search_path = ''
as $$
declare
  resolved_actor_id uuid := (select auth.uid());
  current_request public.service_requests%rowtype;
  actor_role text;
  transition_allowed boolean := false;
  recorded_event public.service_request_timeline%rowtype;
begin
  if resolved_actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select *
  into current_request
  from public.service_requests request
  where request.id = p_request_id
  for update;

  if not found then
    raise exception 'Service request not found' using errcode = 'P0002';
  end if;

  select context.role_name
  into actor_role
  from private.resolve_workshop_actor(
    current_request.garage_id,
    current_request.center_id
  ) context;

  if actor_role is null then
    raise exception 'Workshop transition not permitted'
      using errcode = '42501';
  end if;

  if p_new_stage in (
    'customer_approval_required',
    'work_authorized',
    'closed'
  ) or (
    current_request.workshop_stage = 'quality_control'
    and p_new_stage = 'work_in_progress'
  ) then
    raise exception 'Workshop transition requires a dedicated workflow'
      using errcode = '42501';
  end if;

  if actor_role in ('organization_owner', 'center_manager') then
    if current_request.workshop_stage is null then
      transition_allowed := p_new_stage = 'appointment_confirmed';
    else
      transition_allowed := case current_request.workshop_stage
        when 'appointment_confirmed' then p_new_stage = 'vehicle_expected'
        when 'vehicle_expected' then p_new_stage = 'vehicle_checked_in'
        when 'vehicle_checked_in' then p_new_stage = 'vehicle_received'
        when 'vehicle_received' then p_new_stage = 'diagnosis_in_progress'
        when 'work_authorized' then p_new_stage = 'work_in_progress'
        when 'work_in_progress' then p_new_stage = 'quality_control'
        when 'quality_control' then p_new_stage = 'vehicle_ready'
        when 'vehicle_ready' then p_new_stage = 'vehicle_delivered'
        else false
      end;
    end if;
  elsif actor_role = 'receptionist' then
    if nullif(btrim(p_internal_note), '') is not null then
      raise exception 'Reception transitions cannot include internal notes'
        using errcode = '42501';
    end if;
    transition_allowed := (
      (current_request.workshop_stage = 'appointment_confirmed'
        and p_new_stage = 'vehicle_expected')
      or (current_request.workshop_stage = 'vehicle_expected'
        and p_new_stage = 'vehicle_checked_in')
      or (current_request.workshop_stage = 'vehicle_checked_in'
        and p_new_stage = 'vehicle_received')
      or (current_request.workshop_stage = 'vehicle_ready'
        and p_new_stage = 'vehicle_delivered')
    );
  elsif actor_role = 'technician'
    and private.workshop_technician_assigned(
      current_request.id,
      resolved_actor_id
    )
  then
    transition_allowed := (
      (current_request.workshop_stage = 'vehicle_received'
        and p_new_stage = 'diagnosis_in_progress')
      or (current_request.workshop_stage = 'work_authorized'
        and p_new_stage = 'work_in_progress')
      or (current_request.workshop_stage = 'work_in_progress'
        and p_new_stage = 'quality_control')
    );
  end if;

  if not transition_allowed then
    raise exception 'Workshop transition not permitted'
      using errcode = '42501';
  end if;

  perform set_config('app.workshop_rpc', 'on', true);

  update public.service_requests request
  set workshop_stage = p_new_stage,
      estimated_completion_at = coalesce(
        p_estimated_completion_at,
        request.estimated_completion_at
      ),
      vehicle_checked_in_at = case
        when p_new_stage = 'vehicle_checked_in'
          then coalesce(request.vehicle_checked_in_at, now())
        else request.vehicle_checked_in_at
      end,
      vehicle_delivered_at = case
        when p_new_stage = 'vehicle_delivered'
          then coalesce(request.vehicle_delivered_at, now())
        else request.vehicle_delivered_at
      end,
      updated_at = now()
  where request.id = current_request.id;

  recorded_event := private.record_workshop_event(
    current_request.id,
    current_request.garage_id,
    current_request.center_id,
    current_request.workshop_stage,
    p_new_stage,
    resolved_actor_id,
    p_internal_note,
    p_customer_message,
    p_estimated_completion_at,
    p_visible_to_customer
  );

  return recorded_event;
end;
$$;

create or replace function public.close_workshop_request(
  p_request_id uuid,
  p_internal_note text default null,
  p_customer_message text default null
)
returns public.service_request_timeline
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_actor_id uuid := (select auth.uid());
  current_request public.service_requests%rowtype;
  actor_role text;
  recorded_event public.service_request_timeline%rowtype;
begin
  if resolved_actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select *
  into current_request
  from public.service_requests request
  where request.id = p_request_id
  for update;

  if not found then
    raise exception 'Service request not found' using errcode = 'P0002';
  end if;

  select context.role_name
  into actor_role
  from private.resolve_workshop_actor(
    current_request.garage_id,
    current_request.center_id
  ) context;

  if actor_role is null
    or actor_role not in ('organization_owner', 'center_manager')
  then
    raise exception 'Workshop closure not permitted'
      using errcode = '42501';
  end if;

  if current_request.workshop_stage <> 'vehicle_delivered' then
    raise exception 'Only a delivered request can be closed'
      using errcode = '22023';
  end if;

  perform set_config('app.workshop_rpc', 'on', true);

  update public.service_requests request
  set workshop_stage = 'closed',
      updated_at = now()
  where request.id = current_request.id;

  recorded_event := private.record_workshop_event(
    current_request.id,
    current_request.garage_id,
    current_request.center_id,
    current_request.workshop_stage,
    'closed',
    resolved_actor_id,
    p_internal_note,
    p_customer_message,
    current_request.estimated_completion_at,
    true
  );

  return recorded_event;
end;
$$;

create or replace function public.reopen_workshop_request(
  p_request_id uuid,
  p_return_stage text,
  p_reason text,
  p_customer_message text default null
)
returns public.service_request_timeline
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_actor_id uuid := (select auth.uid());
  current_request public.service_requests%rowtype;
  actor_role text;
  recorded_event public.service_request_timeline%rowtype;
begin
  if resolved_actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if nullif(btrim(p_reason), '') is null then
    raise exception 'A reopening reason is required'
      using errcode = '22023';
  end if;

  select *
  into current_request
  from public.service_requests request
  where request.id = p_request_id
  for update;

  if not found then
    raise exception 'Service request not found' using errcode = 'P0002';
  end if;

  select context.role_name
  into actor_role
  from private.resolve_workshop_actor(
    current_request.garage_id,
    current_request.center_id
  ) context;

  if actor_role is null
    or actor_role not in ('organization_owner', 'center_manager')
  then
    raise exception 'Workshop reopening not permitted'
      using errcode = '42501';
  end if;

  if not (
    (
      current_request.workshop_stage = 'quality_control'
      and p_return_stage = 'work_in_progress'
    )
    or (
      current_request.workshop_stage = 'closed'
      and p_return_stage = 'vehicle_delivered'
    )
  ) then
    raise exception 'Invalid workshop reopening transition'
      using errcode = '22023';
  end if;

  perform set_config('app.workshop_rpc', 'on', true);

  update public.service_requests request
  set workshop_stage = p_return_stage,
      updated_at = now()
  where request.id = current_request.id;

  recorded_event := private.record_workshop_event(
    current_request.id,
    current_request.garage_id,
    current_request.center_id,
    current_request.workshop_stage,
    p_return_stage,
    resolved_actor_id,
    p_reason,
    p_customer_message,
    current_request.estimated_completion_at,
    nullif(btrim(p_customer_message), '') is not null
  );

  return recorded_event;
end;
$$;

create or replace function public.assign_workshop_repair(
  p_repair_id uuid,
  p_technician_user_id uuid
)
returns public.repairs
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_actor_id uuid := (select auth.uid());
  current_repair public.repairs%rowtype;
  repair_center_id uuid;
  actor_role text;
  target_count integer;
begin
  if resolved_actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select repair.*
  into current_repair
  from public.repairs repair
  where repair.id = p_repair_id
  for update;

  if not found then
    raise exception 'Repair not found' using errcode = 'P0002';
  end if;

  select appointment.center_id
  into repair_center_id
  from public.appointments appointment
  where appointment.id = current_repair.appointment_id
    and appointment.garage_id = current_repair.garage_id
    and appointment.center_id is not null
    and exists (
      select 1
      from public.garage_centers center
      where center.id = appointment.center_id
        and center.garage_id = appointment.garage_id
        and center.is_active
    );

  if repair_center_id is null then
    raise exception 'Repair center cannot be derived'
      using errcode = '42501';
  end if;

  select context.role_name
  into actor_role
  from private.resolve_workshop_actor(
    current_repair.garage_id,
    repair_center_id
  ) context;

  if actor_role is null
    or actor_role not in ('organization_owner', 'center_manager')
  then
    raise exception 'Repair assignment not permitted'
      using errcode = '42501';
  end if;

  select count(*)
  into target_count
  from public.garage_members target
  join public.garage_centers center
    on center.id = target.center_id
   and center.garage_id = target.garage_id
   and center.is_active
  where target.user_id = p_technician_user_id
    and target.garage_id = current_repair.garage_id
    and target.status = 'active'
    and target.organization_role is null
    and target.center_role = 'technician'
    and target.center_id = repair_center_id;

  if target_count <> 1 then
    raise exception 'Target technician scope is invalid or ambiguous'
      using errcode = '42501';
  end if;

  perform set_config('app.workshop_assignment_rpc', 'on', true);

  update public.repairs repair
  set assigned_to = p_technician_user_id,
      updated_at = now()
  where repair.id = current_repair.id
  returning * into current_repair;

  return current_repair;
end;
$$;

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
set search_path = ''
as $$
declare
  resolved_actor_id uuid := (select auth.uid());
  current_request public.service_requests%rowtype;
  actor_role text;
  client_access boolean := false;
begin
  if resolved_actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select *
  into current_request
  from public.service_requests request
  where request.id = p_request_id;

  if not found then
    raise exception 'Service request not found' using errcode = 'P0002';
  end if;

  client_access := current_request.client_id = resolved_actor_id;

  select context.role_name
  into actor_role
  from private.resolve_workshop_actor(
    current_request.garage_id,
    current_request.center_id
  ) context;

  if actor_role = 'technician'
    and not private.workshop_technician_assigned(
      current_request.id,
      resolved_actor_id
    )
  then
    actor_role := null;
  end if;

  if (
    actor_role is null
    or actor_role not in (
      'organization_owner',
      'center_manager',
      'receptionist',
      'technician'
    )
  ) and not client_access then
    raise exception 'Workshop timeline not permitted'
      using errcode = '42501';
  end if;

  return query
  select
    event.id,
    event.request_id,
    event.garage_id,
    event.center_id,
    event.previous_stage,
    event.new_stage,
    case
      when actor_role in ('organization_owner', 'center_manager')
        then event.changed_by
      else null
    end,
    event.occurred_at,
    case
      when actor_role in (
        'organization_owner',
        'center_manager',
        'technician'
      ) then event.internal_note
      else null
    end,
    event.customer_message,
    event.estimated_completion_at,
    event.visible_to_customer,
    case
      when actor_role in ('organization_owner', 'center_manager')
        then event.notification_status
      else null
    end
  from public.service_request_timeline event
  where event.request_id = current_request.id
    and (not client_access or event.visible_to_customer)
  order by event.occurred_at;
end;
$$;

create or replace function public.get_workshop_recommendations(
  p_request_id uuid
)
returns table (
  id uuid,
  garage_id uuid,
  center_id uuid,
  service_request_id uuid,
  title text,
  description text,
  category text,
  urgency text,
  reason text,
  estimated_price numeric,
  estimated_duration_minutes integer,
  affects_delivery_time boolean,
  proposed_delivery_at timestamptz,
  status text,
  created_by uuid,
  created_at timestamptz,
  decided_at timestamptz,
  customer_decision_note text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  resolved_actor_id uuid := (select auth.uid());
  current_request public.service_requests%rowtype;
  client_access boolean := false;
  owner_access boolean := false;
begin
  if resolved_actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select *
  into current_request
  from public.service_requests request
  where request.id = p_request_id;

  if not found then
    raise exception 'Service request not found' using errcode = 'P0002';
  end if;

  client_access := current_request.client_id = resolved_actor_id;
  owner_access := public.has_workshop_capability(
    current_request.id,
    'recommendation.price'
  );

  if not public.has_workshop_capability(
    current_request.id,
    'recommendation.read'
  ) then
    raise exception 'Recommendation access not permitted'
      using errcode = '42501';
  end if;

  return query
  select
    recommendation.id,
    recommendation.garage_id,
    recommendation.center_id,
    recommendation.service_request_id,
    recommendation.title,
    recommendation.description,
    recommendation.category,
    recommendation.urgency,
    recommendation.reason,
    case when owner_access then recommendation.estimated_price else null end,
    recommendation.estimated_duration_minutes,
    recommendation.affects_delivery_time,
    recommendation.proposed_delivery_at,
    recommendation.status,
    case when client_access then null else recommendation.created_by end,
    recommendation.created_at,
    recommendation.decided_at,
    recommendation.customer_decision_note
  from public.workshop_recommendations recommendation
  where recommendation.service_request_id = current_request.id
    and recommendation.garage_id = current_request.garage_id
    and (
      not client_access
      or recommendation.status not in ('draft', 'cancelled')
    )
  order by recommendation.created_at desc;
end;
$$;

create or replace function public.get_workshop_recommendation_decisions(
  p_recommendation_id uuid
)
returns table (
  id uuid,
  recommendation_id uuid,
  garage_id uuid,
  service_request_id uuid,
  action text,
  previous_status text,
  new_status text,
  decided_by uuid,
  occurred_at timestamptz,
  legal_terms_version text,
  legal_privacy_version text,
  displayed_language text,
  note text,
  visible_to_customer boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  resolved_actor_id uuid := (select auth.uid());
  current_recommendation public.workshop_recommendations%rowtype;
  current_request public.service_requests%rowtype;
  actor_role text;
  client_access boolean := false;
begin
  if resolved_actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select *
  into current_recommendation
  from public.workshop_recommendations recommendation
  where recommendation.id = p_recommendation_id;

  if not found then
    raise exception 'Recommendation not found' using errcode = 'P0002';
  end if;

  select *
  into current_request
  from public.service_requests request
  where request.id = current_recommendation.service_request_id
    and request.garage_id = current_recommendation.garage_id;

  if not found then
    raise exception 'Recommendation request not found'
      using errcode = 'P0002';
  end if;

  client_access := current_request.client_id = resolved_actor_id;

  select context.role_name
  into actor_role
  from private.resolve_workshop_actor(
    current_request.garage_id,
    current_request.center_id
  ) context;

  if actor_role = 'technician'
    and not private.workshop_technician_assigned(
      current_request.id,
      resolved_actor_id
    )
  then
    actor_role := null;
  end if;

  if (
    actor_role is null
    or actor_role not in (
      'organization_owner',
      'center_manager',
      'technician'
    )
  ) and not client_access then
    raise exception 'Recommendation decision history not permitted'
      using errcode = '42501';
  end if;

  return query
  select
    decision.id,
    decision.recommendation_id,
    decision.garage_id,
    decision.service_request_id,
    decision.action,
    decision.previous_status,
    decision.new_status,
    case
      when actor_role in ('organization_owner', 'center_manager')
        then decision.decided_by
      else null
    end,
    decision.occurred_at,
    case
      when actor_role in ('organization_owner', 'center_manager')
        then decision.legal_terms_version
      else null
    end,
    case
      when actor_role in ('organization_owner', 'center_manager')
        then decision.legal_privacy_version
      else null
    end,
    case
      when actor_role in ('organization_owner', 'center_manager')
        then decision.displayed_language
      else null
    end,
    case when client_access then null else decision.note end,
    decision.visible_to_customer
  from public.recommendation_decisions decision
  where decision.recommendation_id = current_recommendation.id
    and (not client_access or decision.visible_to_customer)
  order by decision.occurred_at;
end;
$$;

create or replace function public.create_workshop_recommendation(
  p_request_id uuid,
  p_title text,
  p_description text default null,
  p_category text default null,
  p_urgency text default 'recommended',
  p_reason text default null,
  p_estimated_price numeric default null,
  p_estimated_duration_minutes integer default null,
  p_affects_delivery_time boolean default false,
  p_proposed_delivery_at timestamptz default null
)
returns public.workshop_recommendations
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_actor_id uuid := (select auth.uid());
  current_request public.service_requests%rowtype;
  actor_role text;
  recommendation public.workshop_recommendations%rowtype;
begin
  if resolved_actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select *
  into current_request
  from public.service_requests request
  where request.id = p_request_id
  for update;

  if not found then
    raise exception 'Service request not found' using errcode = 'P0002';
  end if;

  select context.role_name
  into actor_role
  from private.resolve_workshop_actor(
    current_request.garage_id,
    current_request.center_id
  ) context;

  if actor_role = 'technician'
    and not private.workshop_technician_assigned(
      current_request.id,
      resolved_actor_id
    )
  then
    actor_role := null;
  end if;

  if actor_role is null
    or actor_role not in (
      'organization_owner',
      'center_manager',
      'technician'
    )
  then
    raise exception 'Recommendation creation not permitted'
      using errcode = '42501';
  end if;

  if actor_role is distinct from 'organization_owner'
    and p_estimated_price is not null
  then
    raise exception 'Estimated price is owner-only'
      using errcode = '42501';
  end if;

  if nullif(btrim(p_title), '') is null then
    raise exception 'Recommendation title is required'
      using errcode = '22023';
  end if;

  if p_urgency is null
    or p_urgency not in (
    'critical',
    'recommended',
    'preventive',
    'information'
  ) then
    raise exception 'Invalid recommendation urgency'
      using errcode = '22023';
  end if;

  if p_estimated_price is not null and p_estimated_price < 0 then
    raise exception 'Invalid estimated price'
      using errcode = '22023';
  end if;

  if p_estimated_duration_minutes is not null
    and p_estimated_duration_minutes < 0
  then
    raise exception 'Invalid estimated duration'
      using errcode = '22023';
  end if;

  insert into public.workshop_recommendations (
    garage_id,
    center_id,
    service_request_id,
    title,
    description,
    category,
    urgency,
    reason,
    estimated_price,
    estimated_duration_minutes,
    affects_delivery_time,
    proposed_delivery_at,
    created_by
  )
  values (
    current_request.garage_id,
    current_request.center_id,
    current_request.id,
    btrim(p_title),
    nullif(btrim(p_description), ''),
    nullif(btrim(p_category), ''),
    p_urgency,
    nullif(btrim(p_reason), ''),
    case
      when actor_role = 'organization_owner' then p_estimated_price
      else null
    end,
    p_estimated_duration_minutes,
    p_affects_delivery_time,
    p_proposed_delivery_at,
    resolved_actor_id
  )
  returning * into recommendation;

  return recommendation;
end;
$$;

create or replace function public.set_workshop_recommendation_status(
  p_recommendation_id uuid,
  p_new_status text,
  p_note text default null
)
returns public.workshop_recommendations
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_actor_id uuid := (select auth.uid());
  recommendation public.workshop_recommendations%rowtype;
  current_request public.service_requests%rowtype;
  actor_role text;
  transition_allowed boolean := false;
  previous_status text;
begin
  if resolved_actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select *
  into recommendation
  from public.workshop_recommendations item
  where item.id = p_recommendation_id
  for update;

  if not found then
    raise exception 'Recommendation not found' using errcode = 'P0002';
  end if;

  select *
  into current_request
  from public.service_requests request
  where request.id = recommendation.service_request_id
    and request.garage_id = recommendation.garage_id
  for update;

  if not found then
    raise exception 'Recommendation request not found'
      using errcode = 'P0002';
  end if;

  select context.role_name
  into actor_role
  from private.resolve_workshop_actor(
    current_request.garage_id,
    current_request.center_id
  ) context;

  if actor_role is null
    or actor_role not in ('organization_owner', 'center_manager')
  then
    raise exception 'Recommendation transition not permitted'
      using errcode = '42501';
  end if;

  transition_allowed := case recommendation.status
    when 'draft' then p_new_status in ('proposed', 'cancelled')
    when 'proposed' then p_new_status = 'cancelled'
    when 'callback_requested' then p_new_status in ('proposed', 'cancelled')
    when 'accepted' then p_new_status = 'completed'
    when 'declined' then p_new_status = 'cancelled'
    else false
  end;

  if not transition_allowed then
    raise exception 'Invalid recommendation transition from % to %',
      recommendation.status,
      p_new_status
      using errcode = '22023';
  end if;

  if p_new_status = 'proposed'
    and current_request.workshop_stage not in (
      'diagnosis_in_progress',
      'customer_approval_required'
    )
  then
    raise exception 'Recommendation cannot request approval from this stage'
      using errcode = '22023';
  end if;

  previous_status := recommendation.status;

  update public.workshop_recommendations item
  set status = p_new_status
  where item.id = recommendation.id
  returning * into recommendation;

  insert into public.recommendation_decisions (
    recommendation_id,
    garage_id,
    service_request_id,
    action,
    previous_status,
    new_status,
    decided_by,
    note
  )
  values (
    recommendation.id,
    recommendation.garage_id,
    recommendation.service_request_id,
    p_new_status,
    previous_status,
    p_new_status,
    resolved_actor_id,
    nullif(btrim(p_note), '')
  );

  if p_new_status = 'proposed'
    and current_request.workshop_stage = 'diagnosis_in_progress'
  then
    perform set_config('app.workshop_rpc', 'on', true);

    update public.service_requests request
    set workshop_stage = 'customer_approval_required',
        updated_at = now()
    where request.id = current_request.id;

    perform private.record_workshop_event(
      current_request.id,
      current_request.garage_id,
      current_request.center_id,
      current_request.workshop_stage,
      'customer_approval_required',
      resolved_actor_id,
      p_note,
      null,
      current_request.estimated_completion_at,
      true
    );
  end if;

  if actor_role is distinct from 'organization_owner' then
    recommendation.estimated_price := null;
  end if;

  return recommendation;
end;
$$;

create or replace function public.decide_workshop_recommendation(
  p_recommendation_id uuid,
  p_action text,
  p_note text default null,
  p_terms_version text default null,
  p_privacy_version text default null,
  p_displayed_language text default null
)
returns public.workshop_recommendations
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_actor_id uuid := (select auth.uid());
  recommendation public.workshop_recommendations%rowtype;
  current_request public.service_requests%rowtype;
  new_status text;
  previous_status text;
begin
  if resolved_actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select *
  into recommendation
  from public.workshop_recommendations item
  where item.id = p_recommendation_id
  for update;

  if not found then
    raise exception 'Recommendation not found' using errcode = 'P0002';
  end if;

  select *
  into current_request
  from public.service_requests request
  where request.id = recommendation.service_request_id
    and request.garage_id = recommendation.garage_id
  for update;

  if not found then
    raise exception 'Recommendation request not found'
      using errcode = 'P0002';
  end if;

  if current_request.client_id is distinct from resolved_actor_id then
    raise exception 'Recommendation decision not permitted'
      using errcode = '42501';
  end if;

  if recommendation.status not in ('proposed', 'callback_requested') then
    raise exception 'Recommendation is not awaiting a decision'
      using errcode = '22023';
  end if;

  if p_action is null
    or p_action not in (
    'accepted',
    'declined',
    'callback_requested',
    'question'
  ) then
    raise exception 'Invalid recommendation decision'
      using errcode = '22023';
  end if;

  if p_displayed_language is not null
    and p_displayed_language not in ('fr', 'en', 'ar')
  then
    raise exception 'Invalid displayed language'
      using errcode = '22023';
  end if;

  if p_action = 'question'
    and nullif(btrim(p_note), '') is null
  then
    raise exception 'A question is required'
      using errcode = '22023';
  end if;

  if p_action = 'accepted'
    and current_request.workshop_stage <> 'customer_approval_required'
  then
    raise exception 'Work cannot be authorized from this stage'
      using errcode = '22023';
  end if;

  previous_status := recommendation.status;
  new_status := case
    when p_action = 'question' then recommendation.status
    else p_action
  end;

  update public.workshop_recommendations item
  set status = new_status,
      decided_at = case
        when p_action = 'question' then item.decided_at
        else now()
      end,
      customer_decision_note = nullif(btrim(p_note), '')
  where item.id = recommendation.id
  returning * into recommendation;

  insert into public.recommendation_decisions (
    recommendation_id,
    garage_id,
    service_request_id,
    action,
    previous_status,
    new_status,
    decided_by,
    legal_terms_version,
    legal_privacy_version,
    displayed_language,
    note
  )
  values (
    recommendation.id,
    recommendation.garage_id,
    recommendation.service_request_id,
    p_action,
    previous_status,
    new_status,
    resolved_actor_id,
    nullif(btrim(p_terms_version), ''),
    nullif(btrim(p_privacy_version), ''),
    p_displayed_language,
    nullif(btrim(p_note), '')
  );

  if p_action = 'accepted' then
    perform set_config('app.workshop_rpc', 'on', true);

    update public.service_requests request
    set workshop_stage = 'work_authorized',
        updated_at = now()
    where request.id = current_request.id;

    perform private.record_workshop_event(
      current_request.id,
      current_request.garage_id,
      current_request.center_id,
      current_request.workshop_stage,
      'work_authorized',
      resolved_actor_id,
      null,
      null,
      current_request.estimated_completion_at,
      true
    );
  end if;

  recommendation.estimated_price := null;
  recommendation.created_by := null;
  return recommendation;
end;
$$;

create or replace function public.link_recommendation_quote(
  p_recommendation_id uuid,
  p_quote_id uuid,
  p_supplemental_to_quote_id uuid default null
)
returns public.quotes
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_actor_id uuid := (select auth.uid());
  recommendation public.workshop_recommendations%rowtype;
  current_request public.service_requests%rowtype;
  linked_quote public.quotes%rowtype;
  actor_role text;
begin
  if resolved_actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select *
  into recommendation
  from public.workshop_recommendations item
  where item.id = p_recommendation_id
  for update;

  if not found then
    raise exception 'Recommendation not found' using errcode = 'P0002';
  end if;

  select *
  into current_request
  from public.service_requests request
  where request.id = recommendation.service_request_id
    and request.garage_id = recommendation.garage_id
  for update;

  if not found then
    raise exception 'Recommendation request not found'
      using errcode = 'P0002';
  end if;

  select *
  into linked_quote
  from public.quotes quote
  where quote.id = p_quote_id
  for update;

  if not found then
    raise exception 'Quote not found' using errcode = 'P0002';
  end if;

  select context.role_name
  into actor_role
  from private.resolve_workshop_actor(
    current_request.garage_id,
    current_request.center_id
  ) context;

  if actor_role is distinct from 'organization_owner' then
    raise exception 'Quote link not permitted' using errcode = '42501';
  end if;

  if recommendation.garage_id <> linked_quote.garage_id
    or recommendation.service_request_id <> linked_quote.service_request_id
  then
    raise exception 'Recommendation and quote do not belong to the same case'
      using errcode = '23514';
  end if;

  if p_supplemental_to_quote_id is not null
    and not exists (
      select 1
      from public.quotes parent
      where parent.id = p_supplemental_to_quote_id
        and parent.garage_id = linked_quote.garage_id
        and parent.service_request_id = linked_quote.service_request_id
    )
  then
    raise exception 'Invalid parent quote' using errcode = '23514';
  end if;

  update public.quotes quote
  set recommendation_id = recommendation.id,
      supplemental_to_quote_id = p_supplemental_to_quote_id
  where quote.id = linked_quote.id
  returning * into linked_quote;

  return linked_quote;
end;
$$;

drop policy if exists service_request_timeline_staff_select
  on public.service_request_timeline;
drop policy if exists service_request_timeline_customer_select
  on public.service_request_timeline;
drop policy if exists workshop_recommendations_staff_select
  on public.workshop_recommendations;
drop policy if exists workshop_recommendations_customer_select
  on public.workshop_recommendations;
drop policy if exists recommendation_decisions_staff_select
  on public.recommendation_decisions;
drop policy if exists recommendation_decisions_customer_select
  on public.recommendation_decisions;

revoke all on table public.service_request_timeline
  from public, anon, authenticated;
revoke all on table public.workshop_recommendations
  from public, anon, authenticated;
revoke all on table public.recommendation_decisions
  from public, anon, authenticated;

alter function private.resolve_workshop_actor(uuid, uuid)
  owner to postgres;
alter function private.workshop_technician_assigned(uuid, uuid)
  owner to postgres;
alter function private.record_workshop_event(
  uuid,
  uuid,
  uuid,
  text,
  text,
  uuid,
  text,
  text,
  timestamptz,
  boolean
) owner to postgres;
alter function private.guard_workshop_managed_request_fields()
  owner to postgres;
alter function private.guard_workshop_assignment()
  owner to postgres;
alter function public.guard_request_transition()
  owner to postgres;
alter function public.has_workshop_capability(uuid, text)
  owner to postgres;
alter function public.transition_workshop_stage(
  uuid,
  text,
  text,
  text,
  timestamptz,
  boolean
) owner to postgres;
alter function public.close_workshop_request(uuid, text, text)
  owner to postgres;
alter function public.reopen_workshop_request(uuid, text, text, text)
  owner to postgres;
alter function public.assign_workshop_repair(uuid, uuid)
  owner to postgres;
alter function public.get_workshop_timeline(uuid)
  owner to postgres;
alter function public.get_workshop_recommendations(uuid)
  owner to postgres;
alter function public.get_workshop_recommendation_decisions(uuid)
  owner to postgres;
alter function public.create_workshop_recommendation(
  uuid,
  text,
  text,
  text,
  text,
  text,
  numeric,
  integer,
  boolean,
  timestamptz
) owner to postgres;
alter function public.set_workshop_recommendation_status(uuid, text, text)
  owner to postgres;
alter function public.decide_workshop_recommendation(
  uuid,
  text,
  text,
  text,
  text,
  text
) owner to postgres;
alter function public.link_recommendation_quote(uuid, uuid, uuid)
  owner to postgres;

revoke all on function private.resolve_workshop_actor(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke all on function private.workshop_technician_assigned(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke all on function private.record_workshop_event(
  uuid,
  uuid,
  uuid,
  text,
  text,
  uuid,
  text,
  text,
  timestamptz,
  boolean
) from public, anon, authenticated, service_role;
revoke all on function private.guard_workshop_managed_request_fields()
  from public, anon, authenticated, service_role;
revoke all on function private.guard_workshop_assignment()
  from public, anon, authenticated, service_role;
revoke all on function public.guard_request_transition()
  from public, anon, authenticated, service_role;

revoke all on function public.has_workshop_capability(uuid, text)
  from public, anon, authenticated;
revoke all on function public.transition_workshop_stage(
  uuid,
  text,
  text,
  text,
  timestamptz,
  boolean
) from public, anon, authenticated;
revoke all on function public.close_workshop_request(uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.reopen_workshop_request(
  uuid,
  text,
  text,
  text
) from public, anon, authenticated;
revoke all on function public.assign_workshop_repair(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.get_workshop_timeline(uuid)
  from public, anon, authenticated;
revoke all on function public.get_workshop_recommendations(uuid)
  from public, anon, authenticated;
revoke all on function public.get_workshop_recommendation_decisions(uuid)
  from public, anon, authenticated;
revoke all on function public.create_workshop_recommendation(
  uuid,
  text,
  text,
  text,
  text,
  text,
  numeric,
  integer,
  boolean,
  timestamptz
) from public, anon, authenticated;
revoke all on function public.set_workshop_recommendation_status(
  uuid,
  text,
  text
) from public, anon, authenticated;
revoke all on function public.decide_workshop_recommendation(
  uuid,
  text,
  text,
  text,
  text,
  text
) from public, anon, authenticated;
revoke all on function public.link_recommendation_quote(uuid, uuid, uuid)
  from public, anon, authenticated;

grant execute on function public.has_workshop_capability(uuid, text)
  to authenticated, service_role;
grant execute on function public.transition_workshop_stage(
  uuid,
  text,
  text,
  text,
  timestamptz,
  boolean
) to authenticated, service_role;
grant execute on function public.close_workshop_request(uuid, text, text)
  to authenticated, service_role;
grant execute on function public.reopen_workshop_request(
  uuid,
  text,
  text,
  text
) to authenticated, service_role;
grant execute on function public.assign_workshop_repair(uuid, uuid)
  to authenticated, service_role;
grant execute on function public.get_workshop_timeline(uuid)
  to authenticated, service_role;
grant execute on function public.get_workshop_recommendations(uuid)
  to authenticated, service_role;
grant execute on function public.get_workshop_recommendation_decisions(uuid)
  to authenticated, service_role;
grant execute on function public.create_workshop_recommendation(
  uuid,
  text,
  text,
  text,
  text,
  text,
  numeric,
  integer,
  boolean,
  timestamptz
) to authenticated, service_role;
grant execute on function public.set_workshop_recommendation_status(
  uuid,
  text,
  text
) to authenticated, service_role;
grant execute on function public.decide_workshop_recommendation(
  uuid,
  text,
  text,
  text,
  text,
  text
) to authenticated, service_role;
grant execute on function public.link_recommendation_quote(uuid, uuid, uuid)
  to authenticated, service_role;

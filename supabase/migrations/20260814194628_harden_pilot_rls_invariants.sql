-- Pilot RLS hardening:
-- 1. appointment/service_request links must stay in the same center
-- 2. authenticated users cannot directly append untrusted audit rows

-- Fail closed if historical rows already violate the invariant.
do $migration_guard$
begin
  if exists (
    select 1
    from public.appointments appointment
    join public.service_requests request
      on request.id = appointment.service_request_id
    where appointment.service_request_id is not null
      and (
        appointment.garage_id is distinct from request.garage_id
        or appointment.center_id is distinct from request.center_id
      )
  ) then
    raise exception
      'EXISTING_PILOT_RLS_INVARIANT_VIOLATION: appointments.service_request_id';
  end if;

  if exists (
    select 1
    from public.service_requests request
    join public.appointments appointment
      on appointment.id = request.appointment_id
    where request.appointment_id is not null
      and (
        request.garage_id is distinct from appointment.garage_id
        or request.center_id is distinct from appointment.center_id
      )
  ) then
    raise exception
      'EXISTING_PILOT_RLS_INVARIANT_VIOLATION: service_requests.appointment_id';
  end if;
end
$migration_guard$;
create or replace function public.core_references_match(
  p_entity text,
  p_capability text,
  p_garage_id uuid,
  p_center_id uuid default null,
  p_customer_id uuid default null,
  p_vehicle_id uuid default null,
  p_request_id uuid default null,
  p_appointment_id uuid default null,
  p_service_id uuid default null,
  p_assigned_to uuid default null,
  p_client_id uuid default null,
  p_client_vehicle_id uuid default null
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  resolved_center_id uuid := p_center_id;
begin
  if p_entity not in (
    'customers',
    'vehicles',
    'service_requests',
    'appointments',
    'repairs',
    'tasks',
    'garage_services'
  ) or p_garage_id is null then
    return false;
  end if;

  if p_entity = 'repairs' and p_appointment_id is not null then
    resolved_center_id := public.core_appointment_center(
      p_garage_id,
      p_appointment_id
    );

    if resolved_center_id is null then
      return false;
    end if;
  end if;

  if not public.has_core_capability(
    p_garage_id,
    resolved_center_id,
    p_capability
  ) then
    return false;
  end if;

  if resolved_center_id is not null and not exists (
    select 1
    from public.garage_centers center
    where center.id = resolved_center_id
      and center.garage_id = p_garage_id
      and center.is_active
  ) then
    return false;
  end if;

  if p_customer_id is not null and not exists (
    select 1
    from public.customers customer
    where customer.id = p_customer_id
      and customer.garage_id = p_garage_id
  ) then
    return false;
  end if;

  if p_vehicle_id is not null and not exists (
    select 1
    from public.vehicles vehicle
    where vehicle.id = p_vehicle_id
      and vehicle.garage_id = p_garage_id
  ) then
    return false;
  end if;

  if p_request_id is not null and not exists (
    select 1
    from public.service_requests request
    where request.id = p_request_id
      and request.garage_id = p_garage_id
      and (
        p_entity <> 'appointments'
        or request.center_id is not distinct from resolved_center_id
      )
  ) then
    return false;
  end if;

  if p_appointment_id is not null and not exists (
    select 1
    from public.appointments appointment
    where appointment.id = p_appointment_id
      and appointment.garage_id = p_garage_id
      and (
        p_entity <> 'service_requests'
        or appointment.center_id is not distinct from resolved_center_id
      )
  ) then
    return false;
  end if;

  if p_service_id is not null and not exists (
    select 1
    from public.garage_services service
    where service.id = p_service_id
      and service.garage_id = p_garage_id
      and (
        p_entity <> 'service_requests'
        or service.is_active
      )
  ) then
    return false;
  end if;

  if p_client_vehicle_id is not null and (
    p_client_id is null
    or not exists (
      select 1
      from public.client_vehicles client_vehicle
      where client_vehicle.id = p_client_vehicle_id
        and client_vehicle.client_id = p_client_id
    )
  ) then
    return false;
  end if;

  if p_assigned_to is not null and not exists (
    select 1
    from public.garage_members assignee
    left join public.garage_centers assignee_center
      on assignee_center.id = assignee.center_id
    where assignee.user_id = p_assigned_to
      and assignee.garage_id = p_garage_id
      and assignee.status = 'active'
      and (
        (
          assignee.organization_role in (
            'organization_owner',
            'network_admin'
          )
          and assignee.center_id is null
          and assignee.center_role is null
        )
        or (
          assignee.organization_role is null
          and assignee.center_id is not null
          and assignee.center_role in (
            'center_manager',
            'service_advisor',
            'front_desk',
            'technician',
            'viewer'
          )
          and assignee_center.garage_id = p_garage_id
          and assignee_center.is_active
          and (
            resolved_center_id is null
            or assignee.center_id = resolved_center_id
          )
        )
      )
  ) then
    return false;
  end if;

  return true;
end;
$$;

-- complete_center_transfer is SECURITY DEFINER and therefore must preserve the
-- same request/appointment center invariant enforced on Data API writes.
create or replace function public.complete_center_transfer(p_transfer_id uuid)
returns public.service_request_transfers
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  transfer public.service_request_transfers%rowtype;
  current_request public.service_requests%rowtype;
  related_appointment public.appointments%rowtype;
  related_appointment_ids uuid[] := array[]::uuid[];
  moved_appointment_count integer := 0;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select *
  into transfer
  from public.service_request_transfers item
  where item.id = p_transfer_id
  for update;

  if not found then
    raise exception 'Center transfer not found' using errcode = 'P0002';
  end if;

  if not public.has_local_business_capability(
    transfer.garage_id,
    transfer.from_center_id,
    'center_transfers.manage'
  ) or not public.has_local_business_capability(
    transfer.garage_id,
    transfer.to_center_id,
    'center_transfers.manage'
  ) then
    raise exception 'Center transfer completion not permitted'
      using errcode = '42501';
  end if;

  if transfer.status <> 'customer_confirmed' then
    raise exception 'Customer confirmation is required' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.garage_centers center
    where center.id = transfer.to_center_id
      and center.garage_id = transfer.garage_id
      and center.is_active
  ) then
    raise exception 'Destination center is invalid' using errcode = '23514';
  end if;

  -- Serialize relationship-changing writes while the transfer validates and
  -- moves the request/appointment graph. Row locks alone cannot protect
  -- against a different service_request row concurrently creating a new link.
  -- SHARE ROW EXCLUSIVE conflicts with ordinary table DML while still allowing
  -- non-locking reads.
  lock table public.service_requests in share row exclusive mode;
  lock table public.appointments in share row exclusive mode;

  -- Lock the request before discovering linked appointments. New FK links to
  -- this request must wait until this transfer transaction completes.
  select *
  into current_request
  from public.service_requests request
  where request.id = transfer.service_request_id
    and request.garage_id = transfer.garage_id
    and request.center_id = transfer.from_center_id
  for update;

  if not found then
    raise exception 'Transfer source is stale' using errcode = '40001';
  end if;

  -- Lock every appointment linked to this request in either supported
  -- direction. ORDER BY gives concurrent transfers a deterministic lock order.
  for related_appointment in
    select appointment.*
    from public.appointments appointment
    where appointment.service_request_id = transfer.service_request_id
       or appointment.id = current_request.appointment_id
    order by appointment.id
    for update
  loop
    if related_appointment.garage_id is distinct from transfer.garage_id
      or related_appointment.center_id is distinct from transfer.from_center_id
    then
      raise exception 'Linked appointment is outside the transfer source scope'
        using errcode = '23514';
    end if;

    if related_appointment.service_request_id is not null
      and related_appointment.service_request_id <> transfer.service_request_id
    then
      raise exception 'Linked appointment belongs to another service request'
        using errcode = '23514';
    end if;

    if exists (
      select 1
      from public.service_requests other_request
      where other_request.appointment_id = related_appointment.id
        and other_request.id <> transfer.service_request_id
    ) then
      raise exception 'Linked appointment is referenced by another service request'
        using errcode = '23514';
    end if;

    related_appointment_ids :=
      pg_catalog.array_append(related_appointment_ids, related_appointment.id);
  end loop;

  update public.service_requests request
  set center_id = transfer.to_center_id,
      updated_at = pg_catalog.now()
  where request.id = current_request.id
    and request.garage_id = transfer.garage_id
    and request.center_id = transfer.from_center_id;

  if not found then
    raise exception 'Transfer source is stale' using errcode = '40001';
  end if;

  if pg_catalog.cardinality(related_appointment_ids) > 0 then
    update public.appointments appointment
    set center_id = transfer.to_center_id
    where appointment.id = any(related_appointment_ids)
      and appointment.garage_id = transfer.garage_id
      and appointment.center_id is not distinct from transfer.from_center_id;

    get diagnostics moved_appointment_count = row_count;

    if moved_appointment_count <> pg_catalog.cardinality(related_appointment_ids) then
      raise exception 'Linked appointment set changed during transfer'
        using errcode = '40001';
    end if;
  end if;

  update public.service_request_transfers item
  set status = 'completed',
      completed_at = pg_catalog.now()
  where item.id = transfer.id
  returning * into transfer;

  insert into public.service_request_transfer_events (
    transfer_id, garage_id, previous_status, new_status, changed_by
  ) values (
    transfer.id,
    transfer.garage_id,
    'customer_confirmed',
    'completed',
    actor_id
  );

  return transfer;
end;
$$;
-- audit_logs is not currently a business write API.
-- Until a server-controlled append API exists, fail closed.
drop policy if exists audit_insert_member on public.audit_logs;

revoke insert on table public.audit_logs from public;
revoke insert on table public.audit_logs from authenticated;
revoke insert on table public.audit_logs from anon;

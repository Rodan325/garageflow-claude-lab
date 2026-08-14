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

-- audit_logs is not currently a business write API.
-- Until a server-controlled append API exists, fail closed.
drop policy if exists audit_insert_member on public.audit_logs;

revoke insert on table public.audit_logs from public;
revoke insert on table public.audit_logs from authenticated;
revoke insert on table public.audit_logs from anon;

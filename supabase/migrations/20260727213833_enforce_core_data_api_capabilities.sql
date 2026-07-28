-- FPV1-01-PR1: make core Data API authorization capability-based.
-- This migration is intentionally fail-closed and performs no membership backfill.

do $$
declare
  incompatible_count bigint;
  incompatible_ids text;
  duplicate_count bigint;
  duplicate_scopes text;
begin
  select count(*), string_agg(member.id::text, ',' order by member.id)
  into incompatible_count, incompatible_ids
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
          or member.center_role not in (
            'center_manager',
            'service_advisor',
            'front_desk',
            'technician',
            'viewer'
          )
          or center.id is null
          or center.garage_id is distinct from member.garage_id
          or not center.is_active
        )
      )
      or (
        member.organization_role is not null
        and (
          member.organization_role not in (
            'organization_owner',
            'network_admin'
          )
          or member.center_id is not null
          or member.center_role is not null
        )
      )
      or ((member.center_id is null) <> (member.center_role is null))
    );

  select count(*), string_agg(
    duplicate.user_id::text || ':' || duplicate.garage_id::text,
    ','
    order by duplicate.user_id, duplicate.garage_id
  )
  into duplicate_count, duplicate_scopes
  from (
    select member.user_id, member.garage_id
    from public.garage_members member
    where member.status = 'active'
    group by member.user_id, member.garage_id
    having count(*) > 1
  ) duplicate;

  if incompatible_count > 0 or duplicate_count > 0 then
    raise exception
      'Core capability migration blocked: % incompatible active membership row(s) [%], % duplicate active user/garage scope(s) [%]',
      incompatible_count,
      coalesce(incompatible_ids, ''),
      duplicate_count,
      coalesce(duplicate_scopes, '')
      using errcode = '55000';
  end if;
end;
$$;

create or replace function public.has_core_capability(
  p_garage_id uuid,
  p_center_id uuid,
  p_capability text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  member record;
begin
  if actor_id is null
    or p_garage_id is null
    or nullif(btrim(p_capability), '') is null
  then
    return false;
  end if;

  select
    candidate.organization_role,
    candidate.center_role,
    candidate.center_id
  into member
  from public.garage_members candidate
  left join public.garage_centers center
    on center.id = candidate.center_id
  where candidate.user_id = actor_id
    and candidate.garage_id = p_garage_id
    and candidate.status = 'active'
    and (
      (
        candidate.organization_role in (
          'organization_owner',
          'network_admin'
        )
        and candidate.center_id is null
        and candidate.center_role is null
      )
      or (
        candidate.organization_role is null
        and candidate.center_id is not null
        and candidate.center_role in (
          'center_manager',
          'service_advisor',
          'front_desk',
          'technician',
          'viewer'
        )
        and center.garage_id = candidate.garage_id
        and center.is_active
      )
    )
    and (
      select count(*) = 1
      from public.garage_members duplicate
      where duplicate.user_id = actor_id
        and duplicate.garage_id = p_garage_id
        and duplicate.status = 'active'
    )
  limit 1;

  if not found then
    return false;
  end if;

  if member.organization_role in (
    'organization_owner',
    'network_admin'
  ) then
    return p_capability = any(array[
      'customers.select',
      'customers.insert',
      'customers.update',
      'customers.delete',
      'vehicles.select',
      'vehicles.insert',
      'vehicles.update',
      'vehicles.delete',
      'service_requests.select',
      'service_requests.insert',
      'service_requests.update',
      'appointments.select',
      'appointments.insert',
      'appointments.update',
      'appointments.delete',
      'repairs.select',
      'repairs.insert',
      'repairs.update',
      'repairs.delete',
      'tasks.select',
      'tasks.insert',
      'tasks.update',
      'tasks.delete',
      'garage_services.select',
      'garage_services.insert',
      'garage_services.update',
      'garage_services.delete'
    ]::text[]);
  end if;

  if member.organization_role is null
    and member.center_role = 'center_manager'
    and p_center_id is not null
    and member.center_id = p_center_id
  then
    return p_capability = any(array[
      'service_requests.select',
      'service_requests.insert',
      'service_requests.update',
      'appointments.select',
      'appointments.insert',
      'appointments.update',
      'appointments.delete',
      'repairs.select',
      'repairs.insert',
      'repairs.update',
      'repairs.delete'
    ]::text[]);
  end if;

  if member.organization_role is null
    and member.center_role in ('service_advisor', 'front_desk')
    and p_center_id is not null
    and member.center_id = p_center_id
  then
    return p_capability = 'service_requests.select';
  end if;

  return case
    when p_capability is null then false
    else false
  end;
end;
$$;

create or replace function public.core_appointment_center(
  p_garage_id uuid,
  p_appointment_id uuid
)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select appointment.center_id
  from public.appointments appointment
  join public.garage_centers center
    on center.id = appointment.center_id
   and center.garage_id = appointment.garage_id
   and center.is_active
  where appointment.id = p_appointment_id
    and appointment.garage_id = p_garage_id
  limit 1;
$$;

create or replace function public.has_core_appointment_capability(
  p_garage_id uuid,
  p_appointment_id uuid,
  p_capability text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  resolved_center_id uuid;
begin
  resolved_center_id := public.core_appointment_center(
    p_garage_id,
    p_appointment_id
  );

  if resolved_center_id is null then
    return false;
  end if;

  return public.has_core_capability(
    p_garage_id,
    resolved_center_id,
    p_capability
  );
end;
$$;

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
  ) then
    return false;
  end if;

  if p_appointment_id is not null and not exists (
    select 1
    from public.appointments appointment
    where appointment.id = p_appointment_id
      and appointment.garage_id = p_garage_id
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

create or replace function public.client_request_references_match(
  p_garage_id uuid,
  p_center_id uuid,
  p_service_id uuid,
  p_client_id uuid,
  p_client_vehicle_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
begin
  if actor_id is null
    or p_garage_id is null
    or p_client_id is distinct from actor_id
  then
    return false;
  end if;

  if p_center_id is not null and not exists (
    select 1
    from public.garage_centers center
    where center.id = p_center_id
      and center.garage_id = p_garage_id
      and center.is_active
  ) then
    return false;
  end if;

  if p_service_id is not null and not exists (
    select 1
    from public.garage_services service
    where service.id = p_service_id
      and service.garage_id = p_garage_id
      and service.is_active
  ) then
    return false;
  end if;

  if p_client_vehicle_id is not null and not exists (
    select 1
    from public.client_vehicles client_vehicle
    where client_vehicle.id = p_client_vehicle_id
      and client_vehicle.client_id = actor_id
  ) then
    return false;
  end if;

  return true;
end;
$$;

alter function public.has_core_capability(uuid, uuid, text) owner to postgres;
alter function public.core_appointment_center(uuid, uuid) owner to postgres;
alter function public.has_core_appointment_capability(uuid, uuid, text)
  owner to postgres;
alter function public.core_references_match(
  text,
  text,
  uuid,
  uuid,
  uuid,
  uuid,
  uuid,
  uuid,
  uuid,
  uuid,
  uuid,
  uuid
) owner to postgres;
alter function public.client_request_references_match(
  uuid,
  uuid,
  uuid,
  uuid,
  uuid
) owner to postgres;

revoke all on function public.has_core_capability(uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.core_appointment_center(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.has_core_appointment_capability(
  uuid,
  uuid,
  text
) from public, anon, authenticated;
revoke all on function public.core_references_match(
  text,
  text,
  uuid,
  uuid,
  uuid,
  uuid,
  uuid,
  uuid,
  uuid,
  uuid,
  uuid,
  uuid
) from public, anon, authenticated;
revoke all on function public.client_request_references_match(
  uuid,
  uuid,
  uuid,
  uuid,
  uuid
) from public, anon, authenticated;

grant execute on function public.has_core_capability(uuid, uuid, text)
  to authenticated;
grant execute on function public.has_core_appointment_capability(
  uuid,
  uuid,
  text
)
  to authenticated;
grant execute on function public.core_references_match(
  text,
  text,
  uuid,
  uuid,
  uuid,
  uuid,
  uuid,
  uuid,
  uuid,
  uuid,
  uuid,
  uuid
) to authenticated;
grant execute on function public.client_request_references_match(
  uuid,
  uuid,
  uuid,
  uuid,
  uuid
) to authenticated;

create or replace function public.guard_core_tenant_key()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
    or new.garage_id is distinct from old.garage_id
  then
    raise exception 'Core tenant keys are immutable'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_core_tenant_key()
  from public, anon, authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'customers',
    'vehicles',
    'appointments',
    'repairs',
    'tasks',
    'garage_services'
  ]
  loop
    execute format(
      'drop trigger if exists %I on public.%I',
      'trg_guard_' || table_name || '_tenant_key',
      table_name
    );
    execute format(
      'create trigger %I before update on public.%I '
      || 'for each row execute function public.guard_core_tenant_key()',
      'trg_guard_' || table_name || '_tenant_key',
      table_name
    );
  end loop;
end;
$$;

create or replace function public.guard_request_transition()
returns trigger
language plpgsql
security definer
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

alter function public.guard_request_transition() owner to postgres;
revoke all on function public.guard_request_transition()
  from public, anon, authenticated;

-- Remove legacy membership-based policies before installing per-verb policies.
drop policy if exists customers_rw on public.customers;
drop policy if exists vehicles_rw on public.vehicles;
drop policy if exists appointments_rw on public.appointments;
drop policy if exists repairs_rw on public.repairs;
drop policy if exists tasks_rw on public.tasks;
drop policy if exists services_manage on public.garage_services;
drop policy if exists services_select on public.garage_services;
drop policy if exists services_select_authenticated on public.garage_services;
drop policy if exists requests_select on public.service_requests;
drop policy if exists requests_insert_client on public.service_requests;
drop policy if exists requests_update on public.service_requests;
drop policy if exists requests_delete_member on public.service_requests;

create policy customers_select_capability on public.customers
  for select to authenticated
  using (
    public.has_core_capability(garage_id, null, 'customers.select')
  );
create policy customers_insert_capability on public.customers
  for insert to authenticated
  with check (
    public.has_core_capability(garage_id, null, 'customers.insert')
  );
create policy customers_update_capability on public.customers
  for update to authenticated
  using (
    public.has_core_capability(garage_id, null, 'customers.update')
  )
  with check (
    public.has_core_capability(garage_id, null, 'customers.update')
  );
create policy customers_delete_capability on public.customers
  for delete to authenticated
  using (
    public.has_core_capability(garage_id, null, 'customers.delete')
  );

create policy vehicles_select_capability on public.vehicles
  for select to authenticated
  using (
    public.has_core_capability(garage_id, null, 'vehicles.select')
  );
create policy vehicles_insert_capability on public.vehicles
  for insert to authenticated
  with check (
    public.has_core_capability(garage_id, null, 'vehicles.insert')
    and public.core_references_match(
      'vehicles',
      'vehicles.insert',
      garage_id,
      p_customer_id => customer_id
    )
  );
create policy vehicles_update_capability on public.vehicles
  for update to authenticated
  using (
    public.has_core_capability(garage_id, null, 'vehicles.update')
  )
  with check (
    public.has_core_capability(garage_id, null, 'vehicles.update')
    and public.core_references_match(
      'vehicles',
      'vehicles.update',
      garage_id,
      p_customer_id => customer_id
    )
  );
create policy vehicles_delete_capability on public.vehicles
  for delete to authenticated
  using (
    public.has_core_capability(garage_id, null, 'vehicles.delete')
  );

create policy appointments_select_capability on public.appointments
  for select to authenticated
  using (
    public.has_core_capability(
      garage_id,
      center_id,
      'appointments.select'
    )
  );
create policy appointments_insert_capability on public.appointments
  for insert to authenticated
  with check (
    public.has_core_capability(
      garage_id,
      center_id,
      'appointments.insert'
    )
    and public.core_references_match(
      'appointments',
      'appointments.insert',
      garage_id,
      p_center_id => center_id,
      p_customer_id => customer_id,
      p_vehicle_id => vehicle_id,
      p_request_id => service_request_id,
      p_assigned_to => assigned_to
    )
  );
create policy appointments_update_capability on public.appointments
  for update to authenticated
  using (
    public.has_core_capability(
      garage_id,
      center_id,
      'appointments.update'
    )
  )
  with check (
    public.has_core_capability(
      garage_id,
      center_id,
      'appointments.update'
    )
    and public.core_references_match(
      'appointments',
      'appointments.update',
      garage_id,
      p_center_id => center_id,
      p_customer_id => customer_id,
      p_vehicle_id => vehicle_id,
      p_request_id => service_request_id,
      p_assigned_to => assigned_to
    )
  );
create policy appointments_delete_capability on public.appointments
  for delete to authenticated
  using (
    public.has_core_capability(
      garage_id,
      center_id,
      'appointments.delete'
    )
  );

create policy repairs_select_capability on public.repairs
  for select to authenticated
  using (
    public.has_core_appointment_capability(
      garage_id,
      appointment_id,
      'repairs.select'
    )
  );
create policy repairs_insert_capability on public.repairs
  for insert to authenticated
  with check (
    public.has_core_appointment_capability(
      garage_id,
      appointment_id,
      'repairs.insert'
    )
    and public.core_references_match(
      'repairs',
      'repairs.insert',
      garage_id,
      p_customer_id => customer_id,
      p_vehicle_id => vehicle_id,
      p_appointment_id => appointment_id,
      p_assigned_to => assigned_to
    )
  );
create policy repairs_update_capability on public.repairs
  for update to authenticated
  using (
    public.has_core_appointment_capability(
      garage_id,
      appointment_id,
      'repairs.update'
    )
  )
  with check (
    public.has_core_appointment_capability(
      garage_id,
      appointment_id,
      'repairs.update'
    )
    and public.core_references_match(
      'repairs',
      'repairs.update',
      garage_id,
      p_customer_id => customer_id,
      p_vehicle_id => vehicle_id,
      p_appointment_id => appointment_id,
      p_assigned_to => assigned_to
    )
  );
create policy repairs_delete_capability on public.repairs
  for delete to authenticated
  using (
    public.has_core_appointment_capability(
      garage_id,
      appointment_id,
      'repairs.delete'
    )
  );

create policy tasks_select_capability on public.tasks
  for select to authenticated
  using (
    public.has_core_capability(garage_id, null, 'tasks.select')
  );
create policy tasks_insert_capability on public.tasks
  for insert to authenticated
  with check (
    public.has_core_capability(garage_id, null, 'tasks.insert')
    and public.core_references_match(
      'tasks',
      'tasks.insert',
      garage_id,
      p_vehicle_id => related_vehicle_id,
      p_assigned_to => assigned_to
    )
  );
create policy tasks_update_capability on public.tasks
  for update to authenticated
  using (
    public.has_core_capability(garage_id, null, 'tasks.update')
  )
  with check (
    public.has_core_capability(garage_id, null, 'tasks.update')
    and public.core_references_match(
      'tasks',
      'tasks.update',
      garage_id,
      p_vehicle_id => related_vehicle_id,
      p_assigned_to => assigned_to
    )
  );
create policy tasks_delete_capability on public.tasks
  for delete to authenticated
  using (
    public.has_core_capability(garage_id, null, 'tasks.delete')
  );

create policy services_select on public.garage_services
  for select to anon
  using (is_active = true);
create policy garage_services_select_capability on public.garage_services
  for select to authenticated
  using (
    is_active = true
    or public.has_core_capability(
      garage_id,
      null,
      'garage_services.select'
    )
  );
create policy garage_services_insert_capability on public.garage_services
  for insert to authenticated
  with check (
    public.has_core_capability(
      garage_id,
      null,
      'garage_services.insert'
    )
  );
create policy garage_services_update_capability on public.garage_services
  for update to authenticated
  using (
    public.has_core_capability(
      garage_id,
      null,
      'garage_services.update'
    )
  )
  with check (
    public.has_core_capability(
      garage_id,
      null,
      'garage_services.update'
    )
  );
create policy garage_services_delete_capability on public.garage_services
  for delete to authenticated
  using (
    public.has_core_capability(
      garage_id,
      null,
      'garage_services.delete'
    )
  );

create policy service_requests_select_capability on public.service_requests
  for select to authenticated
  using (
    client_id = (select auth.uid())
    or public.has_core_capability(
      garage_id,
      center_id,
      'service_requests.select'
    )
  );
create policy service_requests_insert_capability on public.service_requests
  for insert to authenticated
  with check (
    (
      client_id = (select auth.uid())
      and status = 'pending'
      and proposed_date is null
      and proposed_time is null
      and customer_id is null
      and appointment_id is null
      and client_stage is null
      and workshop_stage is null
      and estimated_completion_at is null
      and vehicle_checked_in_at is null
      and vehicle_delivered_at is null
      and public.client_request_references_match(
        garage_id,
        center_id,
        service_id,
        client_id,
        client_vehicle_id
      )
    )
    or (
      public.has_core_capability(
        garage_id,
        center_id,
        'service_requests.insert'
      )
      and public.core_references_match(
        'service_requests',
        'service_requests.insert',
        garage_id,
        p_center_id => center_id,
        p_customer_id => customer_id,
        p_appointment_id => appointment_id,
        p_service_id => service_id,
        p_client_id => client_id,
        p_client_vehicle_id => client_vehicle_id
      )
    )
  );
create policy service_requests_update_capability on public.service_requests
  for update to authenticated
  using (
    client_id = (select auth.uid())
    or public.has_core_capability(
      garage_id,
      center_id,
      'service_requests.update'
    )
  )
  with check (
    (
      client_id = (select auth.uid())
    )
    or (
      public.has_core_capability(
        garage_id,
        center_id,
        'service_requests.update'
      )
      and public.core_references_match(
        'service_requests',
        'service_requests.update',
        garage_id,
        p_center_id => center_id,
        p_customer_id => customer_id,
        p_appointment_id => appointment_id,
        p_service_id => service_id,
        p_client_id => client_id,
        p_client_vehicle_id => client_vehicle_id
      )
    )
  );

revoke insert, update, delete on table
  public.customers,
  public.vehicles,
  public.service_requests,
  public.appointments,
  public.repairs,
  public.tasks,
  public.garage_services
from public, anon;

grant select, insert, update, delete on table
  public.customers,
  public.vehicles,
  public.appointments,
  public.repairs,
  public.tasks,
  public.garage_services
to authenticated;

grant select, insert, update on table public.service_requests
  to authenticated;
revoke delete on table public.service_requests
  from public, anon, authenticated;
grant select on table public.garage_services
  to anon, authenticated;

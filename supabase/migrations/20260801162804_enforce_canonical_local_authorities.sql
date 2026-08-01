-- PR3A: remove legacy and network-wide authority from local operations.
-- This migration rewrites authorization functions only. It performs no backfill
-- and changes no application row.

create or replace function private.resolve_canonical_actor(
  p_garage_id uuid,
  p_center_id uuid
)
returns table (
  actor_id uuid,
  organization_role text,
  center_role text,
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

  if actor_membership.organization_role in (
      'organization_owner',
      'network_admin'
    )
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
    select
      resolved_actor_id,
      actor_membership.organization_role::text,
      null::text,
      null::uuid;
    return;
  end if;

  if actor_membership.organization_role is null
    and actor_membership.center_role in (
      'center_manager',
      'receptionist',
      'technician',
      'viewer'
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
      null::text,
      actor_membership.center_role::text,
      actor_membership.center_id::uuid;
  end if;
end;
$$;

create or replace function public.has_organization_capability(
  p_garage_id uuid,
  p_capability text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor record;
begin
  if p_garage_id is null or nullif(btrim(p_capability), '') is null then
    return false;
  end if;

  select context.*
  into actor
  from private.resolve_canonical_actor(p_garage_id, null) context;

  if not found then
    return false;
  end if;

  if actor.organization_role = 'organization_owner' then
    return p_capability = any(array[
      'organization.local_operations',
      'network.dashboard.read',
      'members.manage_lower'
    ]::text[]);
  end if;

  if actor.organization_role = 'network_admin' then
    return p_capability = any(array[
      'network.dashboard.read',
      'members.manage_lower'
    ]::text[]);
  end if;

  return false;
end;
$$;

create or replace function public.has_center_capability(
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
  actor record;
begin
  if p_garage_id is null
    or p_center_id is null
    or nullif(btrim(p_capability), '') is null
  then
    return false;
  end if;

  select context.*
  into actor
  from private.resolve_canonical_actor(p_garage_id, p_center_id) context;

  if not found then
    return false;
  end if;

  if actor.organization_role = 'organization_owner' then
    return p_capability = any(array[
      'center.read',
      'center.manage',
      'center.reception',
      'service_requests.message'
    ]::text[]);
  end if;

  if actor.center_role = 'center_manager' then
    return p_capability = any(array[
      'center.read',
      'center.manage',
      'service_requests.message'
    ]::text[]);
  end if;

  if actor.center_role = 'receptionist' then
    return p_capability = any(array[
      'center.read',
      'center.reception',
      'service_requests.message'
    ]::text[]);
  end if;

  return false;
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
  actor record;
begin
  if p_garage_id is null or nullif(btrim(p_capability), '') is null then
    return false;
  end if;

  select context.*
  into actor
  from private.resolve_canonical_actor(p_garage_id, p_center_id) context;

  if not found then
    return false;
  end if;

  if actor.organization_role = 'organization_owner' then
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

  -- Network administrators retain network aggregation and lower-role
  -- membership administration only. Local business rows are never implied.
  if actor.organization_role = 'network_admin' then
    return false;
  end if;

  if actor.organization_role is null
    and actor.center_role = 'center_manager'
    and actor.actor_center_id = p_center_id
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

  return false;
end;
$$;

-- Compatibility shim for policies that still pass legacy role labels. Only a
-- canonical organization owner may satisfy the historical owner request.
create or replace function public.has_garage_role(
  p_garage_id uuid,
  p_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce('owner' = any(p_roles), false)
    and public.has_organization_capability(
      p_garage_id,
      'organization.local_operations'
    );
$$;

-- Historical consumers now resolve only canonical owners and center managers.
create or replace function public.can_manage_garage_center(
  p_garage_id uuid,
  p_center_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_center_capability(
    p_garage_id,
    p_center_id,
    'center.manage'
  );
$$;

create or replace function public.can_view_network_dashboard(p_garage_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_organization_capability(
    p_garage_id,
    'network.dashboard.read'
  )
  and 1 < (
    select count(*)
    from public.garage_centers center
    where center.garage_id = p_garage_id
      and center.is_active
  );
$$;

-- Messaging is a customer-relations capability, not generic center
-- administration. Canonical receptionists retain that narrow operation while
-- network administrators and legacy center roles fail closed.
alter policy req_messages_select on public.service_request_messages
  using (
    exists (
      select 1
      from public.service_requests request
      where request.id = service_request_messages.request_id
        and request.garage_id = service_request_messages.garage_id
        and (
          request.client_id = (select auth.uid())
          or public.has_center_capability(
            request.garage_id,
            request.center_id,
            'service_requests.message'
          )
        )
    )
  );

create or replace function public.post_service_request_message(
  p_request_id uuid,
  p_body text
)
returns public.service_request_messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_account_type text;
  current_request public.service_requests%rowtype;
  created_message public.service_request_messages%rowtype;
  resolved_sender text;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_request_id is null then
    raise exception 'Service request is required' using errcode = '22023';
  end if;

  if p_body is null or length(btrim(p_body)) = 0 then
    raise exception 'Message body is required' using errcode = '22023';
  end if;

  select profile.account_type
  into current_account_type
  from public.profiles profile
  where profile.id = current_user_id;

  if current_account_type is null
    or current_account_type not in ('staff', 'client')
  then
    raise exception 'Active user profile required' using errcode = '42501';
  end if;

  select request.*
  into current_request
  from public.service_requests request
  where request.id = p_request_id
  for update;

  if not found then
    raise exception 'Service request not found' using errcode = 'P0002';
  end if;

  if current_request.status not in (
    'pending',
    'accepted',
    'reschedule_proposed',
    'confirmed',
    'completed'
  ) or current_request.workshop_stage = 'closed' then
    raise exception 'Conversation is read-only' using errcode = '55000';
  end if;

  if current_account_type = 'client' then
    if current_request.client_id is distinct from current_user_id then
      raise exception 'Message creation not permitted' using errcode = '42501';
    end if;
    resolved_sender := 'client';
  else
    if not public.has_center_capability(
      current_request.garage_id,
      current_request.center_id,
      'service_requests.message'
    ) then
      raise exception 'Message creation not permitted' using errcode = '42501';
    end if;
    resolved_sender := 'garage';
  end if;

  insert into public.service_request_messages (
    request_id,
    garage_id,
    sender,
    author_id,
    body
  )
  values (
    current_request.id,
    current_request.garage_id,
    resolved_sender,
    current_user_id,
    btrim(p_body)
  )
  returning * into created_message;

  return created_message;
end;
$$;

-- Workshop RPCs keep their existing matrix while sharing the canonical scope
-- resolver. Network and unknown organization roles are intentionally filtered.
create or replace function private.resolve_workshop_actor(
  p_garage_id uuid,
  p_center_id uuid
)
returns table (
  actor_id uuid,
  role_name text,
  actor_center_id uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    context.actor_id,
    coalesce(context.organization_role, context.center_role) as role_name,
    context.actor_center_id
  from private.resolve_canonical_actor(p_garage_id, p_center_id) context
  where context.organization_role = 'organization_owner'
     or context.center_role in (
       'center_manager',
       'receptionist',
       'technician'
     );
$$;

alter function private.resolve_canonical_actor(uuid, uuid) owner to postgres;
alter function public.has_organization_capability(uuid, text) owner to postgres;
alter function public.has_center_capability(uuid, uuid, text) owner to postgres;
alter function public.has_core_capability(uuid, uuid, text) owner to postgres;
alter function public.has_garage_role(uuid, text[]) owner to postgres;
alter function public.can_manage_garage_center(uuid, uuid) owner to postgres;
alter function public.can_view_network_dashboard(uuid) owner to postgres;
alter function private.resolve_workshop_actor(uuid, uuid) owner to postgres;

revoke all on function private.resolve_canonical_actor(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.has_organization_capability(uuid, text)
  from public, anon, authenticated, service_role;
revoke all on function public.has_center_capability(uuid, uuid, text)
  from public, anon, authenticated, service_role;
revoke all on function public.has_core_capability(uuid, uuid, text)
  from public, anon, authenticated, service_role;
revoke all on function public.has_garage_role(uuid, text[])
  from public, anon, authenticated, service_role;
revoke all on function public.can_manage_garage_center(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.can_view_network_dashboard(uuid)
  from public, anon, authenticated, service_role;
revoke all on function private.resolve_workshop_actor(uuid, uuid)
  from public, anon, authenticated, service_role;

grant execute on function public.has_organization_capability(uuid, text)
  to authenticated, service_role;
grant execute on function public.has_center_capability(uuid, uuid, text)
  to authenticated, service_role;
grant execute on function public.has_core_capability(uuid, uuid, text)
  to authenticated, service_role;
grant execute on function public.has_garage_role(uuid, text[])
  to authenticated, service_role;
grant execute on function public.can_manage_garage_center(uuid, uuid)
  to authenticated, service_role;
grant execute on function public.can_view_network_dashboard(uuid)
  to authenticated, service_role;

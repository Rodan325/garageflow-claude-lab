-- Bind every message to the organization and center of its service request.
-- Existing evidence is never repaired silently: any inconsistent historical
-- row aborts the migration and reports only message UUIDs for manual review.

do $$
declare
  inconsistent_count bigint;
  inconsistent_message_ids uuid[];
begin
  if not exists (
    select 1
    from pg_catalog.pg_constraint constraint_row
    where constraint_row.conrelid = 'public.service_requests'::regclass
      and constraint_row.contype in ('p', 'u')
      and (
        select array_agg(attribute.attname order by key_column.ordinality)
        from unnest(constraint_row.conkey) with ordinality as key_column(attnum, ordinality)
        join pg_catalog.pg_attribute attribute
          on attribute.attrelid = constraint_row.conrelid
         and attribute.attnum = key_column.attnum
      ) = array['id', 'garage_id']::name[]
  ) then
    raise exception 'service_requests(id, garage_id) must be unique before securing messages'
      using errcode = '55000';
  end if;

  select count(*)
  into inconsistent_count
  from public.service_request_messages message
  left join public.service_requests request
    on request.id = message.request_id
   and request.garage_id = message.garage_id
  where request.id is null;

  if inconsistent_count > 0 then
    select array(
      select message.id
      from public.service_request_messages message
      left join public.service_requests request
        on request.id = message.request_id
       and request.garage_id = message.garage_id
      where request.id is null
      order by message.id
      limit 20
    )
    into inconsistent_message_ids;

    raise exception
      'service_request_messages contains % inconsistent historical row(s); sample message_ids=%',
      inconsistent_count,
      inconsistent_message_ids
      using errcode = '23514';
  end if;
end;
$$;

alter table public.service_request_messages
  add constraint service_request_messages_request_garage_fk
  foreign key (request_id, garage_id)
  references public.service_requests (id, garage_id)
  on delete cascade;

-- Reads derive authorization from the referenced request. Organization-wide
-- roles and legacy members without a center retain their current compatibility
-- access through can_manage_garage_center; center-scoped members do not.
-- Phase 4 debt: remove the unscoped legacy-member exception only after every
-- staff membership has an explicit organization or center role.
alter policy req_messages_select on public.service_request_messages
  using (
    exists (
      select 1
      from public.service_requests request
      where request.id = service_request_messages.request_id
        and request.garage_id = service_request_messages.garage_id
        and (
          request.client_id = (select auth.uid())
          or public.can_manage_garage_center(request.garage_id, request.center_id)
        )
    )
  );

-- Keep the historical policy name inert as defense in depth. Table privileges
-- below are the primary Data API boundary; only the RPC may insert.
alter policy req_messages_insert on public.service_request_messages
  with check (false);

revoke insert, update, delete
  on table public.service_request_messages
  from anon, authenticated;

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
    or current_account_type not in ('staff', 'client') then
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

  -- completed remains writable for after-service discussion. cancelled and
  -- declined are read-only; a closed workshop stage is also terminal.
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
    if not public.can_manage_garage_center(
      current_request.garage_id,
      current_request.center_id
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

comment on function public.post_service_request_message(uuid, text) is
  'Appends one request message after deriving tenant, center, actor, sender, and server timestamp. Message length remains unconstrained by the historical schema.';

revoke all
  on function public.post_service_request_message(uuid, text)
  from public, anon, authenticated;
grant execute
  on function public.post_service_request_message(uuid, text)
  to authenticated;

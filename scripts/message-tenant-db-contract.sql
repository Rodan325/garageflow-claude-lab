\set ON_ERROR_STOP on

begin;

do $$
declare
  inconsistent_count bigint;
  message_table_rls boolean;
  function_is_definer boolean;
  function_settings text;
begin
  select count(*)
  into inconsistent_count
  from public.service_request_messages message
  left join public.service_requests request
    on request.id = message.request_id
   and request.garage_id = message.garage_id
  where request.id is null;

  if inconsistent_count <> 0 then
    raise exception 'historical message/request tenant mismatch count=%', inconsistent_count;
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid = 'public.service_request_messages'::regclass
      and conname = 'service_request_messages_request_garage_fk'
      and contype = 'f'
  ) then
    raise exception 'composite message/request foreign key is missing';
  end if;

  select relrowsecurity
  into message_table_rls
  from pg_catalog.pg_class
  where oid = 'public.service_request_messages'::regclass;

  if not message_table_rls then
    raise exception 'RLS is disabled on service_request_messages';
  end if;

  if has_table_privilege('anon', 'public.service_request_messages', 'INSERT')
    or has_table_privilege('anon', 'public.service_request_messages', 'UPDATE')
    or has_table_privilege('anon', 'public.service_request_messages', 'DELETE')
    or has_table_privilege('authenticated', 'public.service_request_messages', 'INSERT')
    or has_table_privilege('authenticated', 'public.service_request_messages', 'UPDATE')
    or has_table_privilege('authenticated', 'public.service_request_messages', 'DELETE') then
    raise exception 'an application role still has direct message write privileges';
  end if;

  select procedure.prosecdef, array_to_string(procedure.proconfig, ',')
  into function_is_definer, function_settings
  from pg_catalog.pg_proc procedure
  where procedure.oid =
    'public.post_service_request_message(uuid,text)'::regprocedure;

  if not function_is_definer then
    raise exception 'message RPC is not SECURITY DEFINER';
  end if;

  if function_settings is null
    or function_settings not like 'search_path=%'
    or function_settings like '%public%' then
    raise exception 'message RPC search_path is not explicitly empty: %', function_settings;
  end if;

  if has_function_privilege(
    'public',
    'public.post_service_request_message(uuid,text)',
    'EXECUTE'
  ) or has_function_privilege(
    'anon',
    'public.post_service_request_message(uuid,text)',
    'EXECUTE'
  ) or not has_function_privilege(
    'authenticated',
    'public.post_service_request_message(uuid,text)',
    'EXECUTE'
  ) then
    raise exception 'message RPC execute grants are incorrect';
  end if;
end;
$$;

do $$
begin
  begin
    insert into public.service_request_messages (
      id,
      request_id,
      garage_id,
      sender,
      body
    )
    values (
      '91000000-0000-4000-8000-000000000001',
      'f1111111-0000-4000-8000-000000000001',
      '22222222-2222-4222-8222-222222222222',
      'garage',
      'Fictitious composite-tenant rejection probe'
    );
    raise exception 'composite foreign key accepted a mismatched garage';
  exception
    when foreign_key_violation then null;
  end;
end;
$$;

insert into public.service_request_messages (
  id,
  request_id,
  garage_id,
  sender,
  body
)
values (
  '91000000-0000-4000-8000-000000000002',
  'f1111111-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  'garage',
  'Fictitious coherent message relation probe'
);

do $$
begin
  begin
    update public.service_request_messages
    set garage_id = '22222222-2222-4222-8222-222222222222'
    where id = '91000000-0000-4000-8000-000000000002';
    raise exception 'composite foreign key allowed a relation mutation';
  exception
    when foreign_key_violation then null;
  end;
end;
$$;

rollback;

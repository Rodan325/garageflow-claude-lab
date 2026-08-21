\set ON_ERROR_STOP on

begin;

create or replace function pg_temp.assert_true(
  p_name text,
  p_condition boolean
)
returns void
language plpgsql
as $$
begin
  if not coalesce(p_condition, false) then
    raise exception 'Core capability assertion failed: %', p_name;
  end if;
  raise notice '[PASS] %', p_name;
end;
$$;

create or replace function pg_temp.expect_error(
  p_name text,
  p_sql text,
  p_expected_state text
)
returns void
language plpgsql
as $$
declare
  actual_state text;
begin
  begin
    execute p_sql;
  exception
    when others then
      actual_state := sqlstate;
      if actual_state <> p_expected_state then
        raise exception
          'Core capability assertion failed: % returned SQLSTATE %, expected %',
          p_name,
          actual_state,
          p_expected_state;
      end if;
      raise notice '[PASS] %', p_name;
      return;
  end;

  raise exception 'Core capability assertion failed: % unexpectedly succeeded', p_name;
end;
$$;

create or replace function pg_temp.expect_zero_rows(
  p_name text,
  p_sql text
)
returns void
language plpgsql
as $$
declare
  affected_rows bigint;
begin
  execute p_sql;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then
    raise exception
      'Core capability assertion failed: % affected % row(s)',
      p_name,
      affected_rows;
  end if;
  raise notice '[PASS] %', p_name;
end;
$$;

insert into public.appointments (
  id,
  garage_id,
  center_id,
  title,
  starts_at
)
values (
  'cc000000-0000-4000-8000-000000000007',
  '22222222-2222-4222-8222-222222222222',
  '22222222-2222-4222-8222-22222222c001',
  'Synthetic request-link guard',
  now()
);

insert into public.customers (id, garage_id, first_name, last_name)
values (
  'cc000000-0000-4000-8000-000000000011',
  '22222222-2222-4222-8222-222222222222',
  'Canonical',
  'Customer'
);

insert into public.vehicles (
  id,
  garage_id,
  customer_id,
  brand,
  model
)
values (
  'cc000000-0000-4000-8000-000000000012',
  '22222222-2222-4222-8222-222222222222',
  'cc000000-0000-4000-8000-000000000011',
  'Canonical',
  'Vehicle'
);

insert into public.repairs (
  id,
  garage_id,
  appointment_id,
  customer_id,
  vehicle_id,
  title
)
values (
  'cc000000-0000-4000-8000-000000000013',
  '22222222-2222-4222-8222-222222222222',
  'cc000000-0000-4000-8000-000000000007',
  'cc000000-0000-4000-8000-000000000011',
  'cc000000-0000-4000-8000-000000000012',
  'Canonical repair'
);

insert into public.tasks (
  id,
  garage_id,
  related_vehicle_id,
  title
)
values (
  'cc000000-0000-4000-8000-000000000014',
  '22222222-2222-4222-8222-222222222222',
  'cc000000-0000-4000-8000-000000000012',
  'Canonical task'
);

insert into public.garage_services (id, garage_id, name, is_active)
values (
  'cc000000-0000-4000-8000-000000000015',
  '22222222-2222-4222-8222-222222222222',
  'Canonical service',
  true
);

select set_config(
  'fpv1.core_baseline',
  md5(coalesce(string_agg(
    concat_ws('|', object_type, object_id, garage_id, payload),
    E'\n'
    order by object_type, object_id
  ), '')),
  true
)
from (
  select
    'customer'::text as object_type,
    customer.id::text as object_id,
    customer.garage_id::text as garage_id,
    to_jsonb(customer)::text as payload
  from public.customers customer
  union all
  select 'vehicle', vehicle.id::text, vehicle.garage_id::text, to_jsonb(vehicle)::text
  from public.vehicles vehicle
  union all
  select 'request', request.id::text, request.garage_id::text, to_jsonb(request)::text
  from public.service_requests request
  union all
  select 'appointment', appointment.id::text, appointment.garage_id::text, to_jsonb(appointment)::text
  from public.appointments appointment
  union all
  select 'repair', repair.id::text, repair.garage_id::text, to_jsonb(repair)::text
  from public.repairs repair
  union all
  select 'task', task.id::text, task.garage_id::text, to_jsonb(task)::text
  from public.tasks task
  union all
  select 'service', service.id::text, service.garage_id::text, to_jsonb(service)::text
  from public.garage_services service
) baseline;

-- ============================================================
-- PILOT RLS INVARIANT REGRESSIONS
-- Reproduced locally before pilot hardening.
--
-- Invariant A:
-- linked appointment/service_request rows must belong to the
-- same garage AND the same canonical center.
--
-- Invariant B:
-- an ordinary authenticated caller must not persist an audit
-- event attributed to another authenticated user.
--
-- Every successful probe is deliberately rolled back inside a
-- PL/pgSQL subtransaction before the contract continues.
-- ============================================================

savepoint pilot_rls_invariant_regressions;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'b0000000-0000-4000-8000-000000000001',
  true
);

do $pilot$
declare
  same_center_request_id uuid;
  cross_center_request_id uuid;
  failures text[] := array[]::text[];
begin
  select request.id
  into same_center_request_id
  from public.service_requests request
  where request.garage_id =
        '22222222-2222-4222-8222-222222222222'
    and request.center_id =
        '22222222-2222-4222-8222-22222222c001'
  order by request.id
  limit 1;

  select request.id
  into cross_center_request_id
  from public.service_requests request
  where request.garage_id =
        '22222222-2222-4222-8222-222222222222'
    and request.center_id is not null
    and request.center_id <>
        '22222222-2222-4222-8222-22222222c001'
  order by request.id
  limit 1;

  if same_center_request_id is null then
    raise exception
      'Pilot invariant fixture missing: no center-A request';
  end if;

  if cross_center_request_id is null then
    raise exception
      'Pilot invariant fixture missing: no cross-center request';
  end if;

  -- Positive control:
  -- same-center appointment/request links must remain valid.
  begin
    insert into public.appointments (
      garage_id,
      center_id,
      service_request_id,
      title,
      starts_at,
      status
    )
    values (
      '22222222-2222-4222-8222-222222222222',
      '22222222-2222-4222-8222-22222222c001',
      same_center_request_id,
      'Pilot invariant same-center positive control',
      now() + interval '1 day',
      'scheduled'
    );

    -- Force rollback of the successful positive-control write.
    raise exception using
      errcode = 'ZX002',
      message = 'EXPECTED_SUCCESS_ROLLBACK';
  exception
    when sqlstate 'ZX002' then
      raise notice
        '[PASS] same-center appointment/request relation remains accepted';
    when others then
      failures := array_append(
        failures,
        format(
          'positive same-center appointment/request relation failed with SQLSTATE %s',
          SQLSTATE
        )
      );
  end;

  -- A1: appointment in center A referencing a request in another
  -- center of the same organization must be denied.
  begin
    insert into public.appointments (
      garage_id,
      center_id,
      service_request_id,
      title,
      starts_at,
      status
    )
    values (
      '22222222-2222-4222-8222-222222222222',
      '22222222-2222-4222-8222-22222222c001',
      cross_center_request_id,
      'Pilot invariant cross-center negative control',
      now() + interval '1 day',
      'scheduled'
    );

    raise exception using
      errcode = 'ZX001',
      message = 'EXPECTED_DENIAL_MISSING';
  exception
    when sqlstate 'ZX001' then
      failures := array_append(
        failures,
        'A1 cross-center appointment -> service_request was accepted'
      );
    when insufficient_privilege then
      raise notice
        '[PASS] A1 cross-center appointment -> service_request denied';
    when others then
      failures := array_append(
        failures,
        format(
          'A1 denied for unexpected SQLSTATE %s',
          SQLSTATE
        )
      );
  end;

  -- A2: reciprocal link must obey the same center invariant.
  begin
    update public.service_requests
    set appointment_id =
      'cc000000-0000-4000-8000-000000000007'
    where id = cross_center_request_id;

    if not found then
      raise exception
        'Pilot invariant fixture disappeared during A2';
    end if;

    raise exception using
      errcode = 'ZX001',
      message = 'EXPECTED_DENIAL_MISSING';
  exception
    when sqlstate 'ZX001' then
      failures := array_append(
        failures,
        'A2 cross-center service_request -> appointment was accepted'
      );
    when insufficient_privilege then
      raise notice
        '[PASS] A2 cross-center service_request -> appointment denied';
    when others then
      failures := array_append(
        failures,
        format(
          'A2 denied for unexpected SQLSTATE %s',
          SQLSTATE
        )
      );
  end;

  -- B1: caller is an organization owner but claims a different
  -- fictitious actor_id.
  begin
    insert into public.audit_logs (
      garage_id,
      actor_id,
      entity_type,
      entity_id,
      action,
      metadata
    )
    values (
      '22222222-2222-4222-8222-222222222222',
      'c2000000-0000-4000-8000-000000000001',
      'rls_validation',
      null,
      'pilot_actor_integrity_member_garage',
      '{"validation":true}'::jsonb
    );

    raise exception using
      errcode = 'ZX001',
      message = 'EXPECTED_DENIAL_MISSING';
  exception
    when sqlstate 'ZX001' then
      failures := array_append(
        failures,
        'B1 authenticated caller forged audit actor_id in member garage'
      );
    when insufficient_privilege then
      raise notice
        '[PASS] B1 forged member-garage audit actor denied';
    when others then
      failures := array_append(
        failures,
        format(
          'B1 denied for unexpected SQLSTATE %s',
          SQLSTATE
        )
      );
  end;

  -- B2: NULL garage must not provide an unscoped audit-write bypass.
  begin
    insert into public.audit_logs (
      garage_id,
      actor_id,
      entity_type,
      entity_id,
      action,
      metadata
    )
    values (
      null,
      'c2000000-0000-4000-8000-000000000001',
      'rls_validation',
      null,
      'pilot_actor_integrity_null_garage',
      '{"validation":true}'::jsonb
    );

    raise exception using
      errcode = 'ZX001',
      message = 'EXPECTED_DENIAL_MISSING';
  exception
    when sqlstate 'ZX001' then
      failures := array_append(
        failures,
        'B2 authenticated caller forged unscoped NULL-garage audit event'
      );
    when insufficient_privilege then
      raise notice
        '[PASS] B2 NULL-garage direct audit insert denied';
    when others then
      failures := array_append(
        failures,
        format(
          'B2 denied for unexpected SQLSTATE %s',
          SQLSTATE
        )
      );
  end;

  if cardinality(failures) > 0 then
    raise exception
      'Pilot RLS invariant regression failed: %',
      array_to_string(failures, '; ');
  end if;

  raise notice
    '[PASS] PILOT RLS INVARIANT REGRESSIONS';
end
$pilot$;

reset role;
rollback to savepoint pilot_rls_invariant_regressions;

-- Structural contract: capabilities, policies, grants, and physical deletion.
select pg_temp.assert_true(
  'audit_logs direct writes are fail-closed',
  not has_table_privilege(
    'authenticated',
    'public.audit_logs',
    'INSERT'
  )
  and not has_table_privilege(
    'anon',
    'public.audit_logs',
    'INSERT'
  )
  and not exists (
    select 1
    from pg_catalog.pg_policies policy
    where policy.schemaname = 'public'
      and policy.tablename = 'audit_logs'
      and policy.policyname = 'audit_insert_member'
  )
);

select pg_temp.assert_true(
  'capability resolver is SECURITY DEFINER with an empty search_path',
  (
    select function_row.prosecdef
      and function_row.proconfig = array['search_path=""']::text[]
    from pg_catalog.pg_proc function_row
    join pg_catalog.pg_namespace function_schema
      on function_schema.oid = function_row.pronamespace
    where function_schema.nspname = 'public'
      and function_row.proname = 'has_core_capability'
      and pg_catalog.pg_get_function_identity_arguments(function_row.oid)
        = 'p_garage_id uuid, p_center_id uuid, p_capability text'
  )
);
select pg_temp.assert_true(
  'authenticated alone can execute the capability resolver',
  has_function_privilege(
    'authenticated',
    'public.has_core_capability(uuid,uuid,text)',
    'EXECUTE'
  )
  and not has_function_privilege(
    'anon',
    'public.has_core_capability(uuid,uuid,text)',
    'EXECUTE'
  )
);
select pg_temp.assert_true(
  'the appointment center UUID resolver is not exposed to authenticated',
  not has_function_privilege(
    'authenticated',
    'public.core_appointment_center(uuid,uuid)',
    'EXECUTE'
  )
  and has_function_privilege(
    'authenticated',
    'public.has_core_appointment_capability(uuid,uuid,text)',
    'EXECUTE'
  )
);
select pg_temp.assert_true(
  'broad core ALL policies are gone',
  not exists (
    select 1
    from pg_catalog.pg_policies policy
    where policy.schemaname = 'public'
      and policy.tablename in (
        'customers',
        'vehicles',
        'appointments',
        'repairs',
        'tasks',
        'garage_services'
      )
      and policy.cmd = 'ALL'
  )
);
select pg_temp.assert_true(
  'historical local mutation policies use specialized capabilities',
  not exists (
    select 1
    from pg_catalog.pg_policies policy
    where policy.schemaname in ('public', 'storage')
      and policy.cmd in ('ALL', 'INSERT', 'UPDATE', 'DELETE')
      and not (
        policy.schemaname = 'public'
        and policy.tablename = 'audit_logs'
        and policy.policyname = 'audit_insert_member'
      )
      and concat_ws(' ', policy.qual, policy.with_check)
        ~* '(is_garage_member|has_garage_role|can_manage_garage_center)'
  )
);
select pg_temp.assert_true(
  'historical local mutation RPCs use specialized capabilities',
  not exists (
    select 1
    from pg_catalog.pg_proc function_row
    join pg_catalog.pg_namespace function_schema
      on function_schema.oid = function_row.pronamespace
    where function_schema.nspname = 'public'
      and function_row.prokind = 'f'
      and function_row.prosrc ~* '\m(insert|update|delete|merge)\M'
      and function_row.prosrc
        ~* '(is_garage_member|has_garage_role|can_manage_garage_center)'
  )
);
select pg_temp.assert_true(
  'local business capability is fail-closed and minimally exposed',
  (
    select function_row.prosecdef
      and function_row.proconfig = array['search_path=""']::text[]
    from pg_catalog.pg_proc function_row
    join pg_catalog.pg_namespace function_schema
      on function_schema.oid = function_row.pronamespace
    where function_schema.nspname = 'public'
      and function_row.proname = 'has_local_business_capability'
      and pg_catalog.pg_get_function_identity_arguments(function_row.oid)
        = 'p_garage_id uuid, p_center_id uuid, p_capability text'
  )
  and has_function_privilege(
    'authenticated',
    'public.has_local_business_capability(uuid,uuid,text)',
    'EXECUTE'
  )
  and not has_function_privilege(
    'anon',
    'public.has_local_business_capability(uuid,uuid,text)',
    'EXECUTE'
  )
  and not has_function_privilege(
    'authenticated',
    'public.next_quote_number(uuid)',
    'EXECUTE'
  )
);
select pg_temp.assert_true(
  'quote create/update are RPC-only and line DML is revoked',
  not has_table_privilege('authenticated', 'public.quotes', 'INSERT')
  and not has_table_privilege('authenticated', 'public.quotes', 'UPDATE')
  and has_table_privilege('authenticated', 'public.quotes', 'DELETE')
  and not has_table_privilege('authenticated', 'public.quote_lines', 'INSERT')
  and not has_table_privilege('authenticated', 'public.quote_lines', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.quote_lines', 'DELETE')
  and exists (
    select 1
    from pg_catalog.pg_policies policy
    where policy.schemaname = 'public'
      and policy.tablename = 'quotes'
      and policy.policyname = 'quotes_delete_canonical'
      and policy.cmd = 'DELETE'
      and policy.qual ilike '%status =%draft%'
      and policy.qual ilike '%has_quote_capability%'
  )
);
select pg_temp.assert_true(
  'branding and attachment mutations use specialized storage policies',
  not exists (
    select 1
    from pg_catalog.pg_policies policy
    where policy.schemaname = 'storage'
      and policy.tablename = 'objects'
      and policy.policyname in (
        'garage_logos_member_insert',
        'garage_logos_member_update',
        'garage_logos_member_delete'
      )
  )
  and (
    select count(*) = 3
    from pg_catalog.pg_policies policy
    where policy.schemaname = 'storage'
      and policy.tablename = 'objects'
      and policy.policyname in (
        'garage_logos_owner_insert',
        'garage_logos_owner_update',
        'garage_logos_owner_delete'
      )
      and concat_ws(' ', policy.qual, policy.with_check)
        ilike '%has_local_business_capability%'
  )
);
select pg_temp.assert_true(
  'service request physical deletion is unavailable',
  not has_table_privilege('authenticated', 'public.service_requests', 'DELETE')
  and not exists (
    select 1
    from pg_catalog.pg_policies policy
    where policy.schemaname = 'public'
      and policy.tablename = 'service_requests'
      and policy.cmd = 'DELETE'
  )
);
select pg_temp.assert_true(
  'PUBLIC and anon have no core DML',
  not exists (
    select 1
    from unnest(array[
      'customers',
      'vehicles',
      'service_requests',
      'appointments',
      'repairs',
      'tasks',
      'garage_services'
    ]) table_name
    where has_table_privilege('anon', 'public.' || table_name, 'INSERT')
      or has_table_privilege('anon', 'public.' || table_name, 'UPDATE')
      or has_table_privilege('anon', 'public.' || table_name, 'DELETE')
  )
);

-- Public catalog visibility must never expose inactive services.
select pg_temp.assert_true(
  'legacy garage service visibility policy is absent',
  not exists (
    select 1
    from pg_catalog.pg_policies policy
    where policy.schemaname = 'public'
      and policy.tablename = 'garage_services'
      and (
        policy.policyname = 'garage_services_visible_garage_scope'
        or (
          policy.cmd = 'SELECT'
          and policy.qual ilike '%exists%from garages%'
          and policy.qual not ilike '%is_active%'
          and policy.qual not ilike '%has_core_capability%'
        )
      )
  )
);
select pg_temp.assert_true(
  'PUBLIC and anon have no garage service DML',
  not exists (
    select 1
    from information_schema.role_table_grants grant_row
    where grant_row.grantee = 'PUBLIC'
      and grant_row.table_schema = 'public'
      and grant_row.table_name = 'garage_services'
      and grant_row.privilege_type in ('INSERT', 'UPDATE', 'DELETE')
  )
  and not has_table_privilege('anon', 'public.garage_services', 'INSERT')
  and not has_table_privilege('anon', 'public.garage_services', 'UPDATE')
  and not has_table_privilege('anon', 'public.garage_services', 'DELETE')
);

savepoint garage_service_visibility;
insert into public.garage_services (
  id,
  garage_id,
  name,
  is_active
)
values
  (
    'cc000000-0000-4000-8000-000000000008',
    '11111111-1111-4111-8111-111111111111',
    'Synthetic active public service',
    true
  ),
  (
    'cc000000-0000-4000-8000-000000000009',
    '22222222-2222-4222-8222-222222222222',
    'Synthetic inactive private service',
    false
  );

set local role anon;
select pg_temp.assert_true(
  'anonymous users can select an active service',
  exists (
    select 1
    from public.garage_services service
    where service.id = 'cc000000-0000-4000-8000-000000000008'
  )
);
select pg_temp.assert_true(
  'anonymous users cannot select an inactive service',
  not exists (
    select 1
    from public.garage_services service
    where service.id = 'cc000000-0000-4000-8000-000000000009'
  )
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'cc000000-0000-4000-8000-000000000010',
  true
);
select pg_temp.assert_true(
  'authenticated users without membership cannot select an inactive service',
  not exists (
    select 1
    from public.garage_services service
    where service.id = 'cc000000-0000-4000-8000-000000000009'
  )
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'a0000000-0000-4000-8000-000000000001',
  true
);
select pg_temp.assert_true(
  'members of another garage cannot select an inactive service',
  not exists (
    select 1
    from public.garage_services service
    where service.id = 'cc000000-0000-4000-8000-000000000009'
  )
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'b0000000-0000-4000-8000-000000000001',
  true
);
select pg_temp.assert_true(
  'organization owner with catalog capability can select an inactive service',
  exists (
    select 1
    from public.garage_services service
    where service.id = 'cc000000-0000-4000-8000-000000000009'
  )
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'b0000000-0000-4000-8000-000000000007',
  true
);
select pg_temp.assert_true(
  'technician membership does not expose an inactive service',
  not exists (
    select 1
    from public.garage_services service
    where service.id = 'cc000000-0000-4000-8000-000000000009'
  )
);
reset role;

update public.garage_members
set center_role = 'viewer'
where user_id = 'b0000000-0000-4000-8000-000000000007'
  and garage_id = '22222222-2222-4222-8222-222222222222';
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'b0000000-0000-4000-8000-000000000007',
  true
);
select pg_temp.assert_true(
  'viewer membership does not expose an inactive service',
  not exists (
    select 1
    from public.garage_services service
    where service.id = 'cc000000-0000-4000-8000-000000000009'
  )
);
reset role;
rollback to savepoint garage_service_visibility;
select pg_temp.assert_true(
  'garage service visibility fixtures are fully rolled back',
  not exists (
    select 1
    from public.garage_services service
    where service.id in (
      'cc000000-0000-4000-8000-000000000008',
      'cc000000-0000-4000-8000-000000000009'
    )
  )
);

-- Canonical roles and per-garage resolution.
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000001', true);
select pg_temp.assert_true(
  'organization owner can mutate core rows in their garage',
  public.has_core_capability(
    '22222222-2222-4222-8222-222222222222',
    null,
    'customers.insert'
  )
);
select pg_temp.assert_true(
  'organization owner cannot act in another garage without membership',
  not public.has_core_capability(
    '11111111-1111-4111-8111-111111111111',
    null,
    'customers.insert'
  )
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000002', true);
select pg_temp.assert_true(
  'network admin has no local core capability',
  not exists (
    select 1
    from unnest(array[
      'customers.insert', 'customers.update', 'customers.delete',
      'vehicles.insert', 'vehicles.update', 'vehicles.delete',
      'appointments.insert', 'appointments.update', 'appointments.delete',
      'repairs.insert', 'repairs.update', 'repairs.delete',
      'tasks.insert', 'tasks.update', 'tasks.delete',
      'garage_services.insert', 'garage_services.update', 'garage_services.delete'
    ]::text[]) capability(name)
    where public.has_core_capability(
      '22222222-2222-4222-8222-222222222222',
      null,
      capability.name
    )
  )
);
select pg_temp.assert_true(
  'network admin retains explicit network-only capabilities',
  public.has_organization_capability(
    '22222222-2222-4222-8222-222222222222',
    'network.dashboard.read'
  )
  and public.has_organization_capability(
    '22222222-2222-4222-8222-222222222222',
    'members.manage_lower'
  )
  and not public.has_organization_capability(
    '22222222-2222-4222-8222-222222222222',
    'organization.local_operations'
  )
  and not public.can_manage_garage_center(
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-22222222c001'
  )
  and not public.has_garage_role(
    '22222222-2222-4222-8222-222222222222',
    array['admin']
  )
  and public.can_view_network_dashboard(
    '22222222-2222-4222-8222-222222222222'
  )
);
select pg_temp.assert_true(
  'network admin has no residual local business capability',
  not exists (
    select 1
    from unnest(array[
      'organization.settings.manage',
      'organization.centers.manage',
      'organization.content.manage',
      'organization.documents.manage',
      'quotes.select',
      'quotes.manage',
      'delivery_reports.manage',
      'maintenance_reminders.manage',
      'service_attachments.manage',
      'center_transfers.manage'
    ]::text[]) capability(name)
    where public.has_local_business_capability(
      '22222222-2222-4222-8222-222222222222',
      '22222222-2222-4222-8222-22222222c001',
      capability.name
    )
  )
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000003', true);
select pg_temp.assert_true(
  'center manager is limited to a demonstrable matching center',
  public.has_core_capability(
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-22222222c001',
    'appointments.update'
  )
  and not public.has_core_capability(
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-22222222c002',
    'appointments.update'
  )
  and not public.has_core_capability(
    '22222222-2222-4222-8222-222222222222',
    null,
    'customers.update'
  )
);
select pg_temp.assert_true(
  'center manager retains specialized same-center workflows only',
  public.has_local_business_capability(
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-22222222c001',
    'delivery_reports.manage'
  )
  and public.has_local_business_capability(
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-22222222c001',
    'maintenance_reminders.manage'
  )
  and not public.has_local_business_capability(
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-22222222c002',
    'delivery_reports.manage'
  )
  and not public.has_local_business_capability(
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-22222222c001',
    'organization.settings.manage'
  )
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000007', true);
select pg_temp.assert_true(
  'technician has no generic core mutation capability',
  not public.has_core_capability(
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-22222222c002',
    'repairs.update'
  )
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000006', true);
select pg_temp.assert_true(
  'legacy front desk fails closed instead of becoming a receptionist',
  not public.has_core_capability(
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-22222222c001',
    'service_requests.select'
  )
  and not public.has_core_capability(
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-22222222c001',
    'service_requests.update'
  )
  and not public.has_local_business_capability(
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-22222222c001',
    'quotes.manage'
  )
);
reset role;

savepoint canonical_receptionist_scope;
update public.garage_members
set center_role = 'receptionist'
where user_id = 'b0000000-0000-4000-8000-000000000006'
  and garage_id = '22222222-2222-4222-8222-222222222222';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000006', true);
select pg_temp.assert_true(
  'canonical receptionist retains narrow customer messaging capability',
  public.has_center_capability(
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-22222222c001',
    'service_requests.message'
  )
  and not public.can_manage_garage_center(
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-22222222c001'
  )
);
select pg_temp.assert_true(
  'canonical receptionist can read quotes but cannot compose unrestricted prices',
  public.has_local_business_capability(
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-22222222c001',
    'quotes.select'
  )
  and not public.has_local_business_capability(
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-22222222c001',
    'quotes.manage'
  )
  and not public.has_local_business_capability(
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-22222222c001',
    'delivery_reports.manage'
  )
  and not public.has_local_business_capability(
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-22222222c001',
    'organization.settings.manage'
  )
);
reset role;
rollback to savepoint canonical_receptionist_scope;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c2000000-0000-4000-8000-000000000001', true);
select pg_temp.assert_true(
  'a client cannot use the staff reference validator as an existence oracle',
  not public.core_references_match(
    'customers',
    'customers.select',
    '22222222-2222-4222-8222-222222222222',
    p_customer_id => 'd2222222-0000-4000-8000-000000000001'
  )
);
reset role;

savepoint ambiguous_membership_scope;
update public.garage_members
set center_id = '11111111-1111-4111-8111-11111111c001',
    center_role = 'center_manager'
where user_id = 'a0000000-0000-4000-8000-000000000001'
  and garage_id = '11111111-1111-4111-8111-111111111111';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000001', true);
select pg_temp.assert_true(
  'ambiguous organization and center scope fails closed',
  not public.has_core_capability(
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-11111111c001',
    'appointments.update'
  )
  and not public.has_local_business_capability(
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-11111111c001',
    'delivery_reports.manage'
  )
);
reset role;
rollback to savepoint ambiguous_membership_scope;

savepoint multi_garage_membership;
insert into public.garage_members (
  garage_id,
  user_id,
  role,
  status,
  center_id,
  organization_role,
  center_role
)
values (
  '11111111-1111-4111-8111-111111111111',
  'b0000000-0000-4000-8000-000000000002',
  'admin',
  'active',
  '11111111-1111-4111-8111-11111111c001',
  null,
  'center_manager'
);
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000002', true);
select pg_temp.assert_true(
  'two valid memberships in distinct garages keep their canonical scopes',
  not public.has_core_capability(
    '22222222-2222-4222-8222-222222222222',
    null,
    'customers.update'
  )
  and public.has_core_capability(
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-11111111c001',
    'appointments.update'
  )
  and not public.has_core_capability(
    '11111111-1111-4111-8111-111111111111',
    null,
    'customers.update'
  )
);
reset role;
select pg_temp.expect_error(
  'duplicate membership in one garage remains structurally impossible',
  $sql$
    insert into public.garage_members (
      garage_id, user_id, role, status, center_id, organization_role, center_role
    )
    values (
      '11111111-1111-4111-8111-111111111111',
      'b0000000-0000-4000-8000-000000000002',
      'admin',
      'active',
      '11111111-1111-4111-8111-11111111c001',
      null,
      'center_manager'
    )
  $sql$,
  '23505'
);
rollback to savepoint multi_garage_membership;

savepoint invalid_membership_shapes;
update public.garage_members
set organization_role = null,
    center_id = null,
    center_role = null
where user_id = 'b0000000-0000-4000-8000-000000000006';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000006', true);
select pg_temp.assert_true(
  'active membership without canonical scope fails closed',
  not public.has_core_capability(
    '22222222-2222-4222-8222-222222222222',
    null,
    'customers.select'
  )
);
reset role;
rollback to savepoint invalid_membership_shapes;

savepoint regional_manager_scope;
update public.garage_members
set organization_role = 'regional_manager'
where user_id = 'b0000000-0000-4000-8000-000000000002'
  and garage_id = '22222222-2222-4222-8222-222222222222';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000002', true);
select pg_temp.assert_true(
  'regional manager is fail-closed for canonical, local, and network authority',
  not public.has_core_capability(
    '22222222-2222-4222-8222-222222222222',
    null,
    'customers.update'
  )
  and not public.has_organization_capability(
    '22222222-2222-4222-8222-222222222222',
    'network.dashboard.read'
  )
  and not public.can_manage_garage_center(
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-22222222c001'
  )
  and not public.can_view_network_dashboard(
    '22222222-2222-4222-8222-222222222222'
  )
  and not public.has_local_business_capability(
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-22222222c001',
    'quotes.manage'
  )
);
reset role;
rollback to savepoint regional_manager_scope;

savepoint legacy_admin_scope;
update public.garage_members
set organization_role = null,
    center_id = null,
    center_role = null
where user_id = 'b0000000-0000-4000-8000-000000000002'
  and garage_id = '22222222-2222-4222-8222-222222222222';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000002', true);
select pg_temp.assert_true(
  'legacy admin role alone grants no authority',
  not public.has_garage_role(
    '22222222-2222-4222-8222-222222222222',
    array['admin']
  )
  and not public.has_core_capability(
    '22222222-2222-4222-8222-222222222222',
    null,
    'vehicles.update'
  )
  and not public.has_local_business_capability(
    '22222222-2222-4222-8222-222222222222',
    null,
    'organization.settings.manage'
  )
);
reset role;
rollback to savepoint legacy_admin_scope;

savepoint legacy_center_roles_scope;
update public.garage_members
set center_role = 'service_advisor'
where user_id = 'b0000000-0000-4000-8000-000000000006'
  and garage_id = '22222222-2222-4222-8222-222222222222';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000006', true);
select pg_temp.assert_true(
  'legacy service advisor fails closed for every local business capability',
  not public.has_local_business_capability(
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-22222222c001',
    'quotes.manage'
  )
  and not public.has_local_business_capability(
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-22222222c001',
    'maintenance_reminders.manage'
  )
);
reset role;
rollback to savepoint legacy_center_roles_scope;

select pg_temp.expect_error(
  'unknown canonical role is rejected structurally',
  $sql$
    update public.garage_members
    set center_role = 'unknown_role'
    where user_id = 'b0000000-0000-4000-8000-000000000006'
      and garage_id = '22222222-2222-4222-8222-222222222222'
  $sql$,
  '23514'
);
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000001', true);
select pg_temp.assert_true(
  'unknown capability fails closed',
  not public.has_local_business_capability(
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-22222222c001',
    'unknown.capability'
  )
);
reset role;

-- Network administrators keep network aggregation/team administration only.
-- Every local mutation through the Data API must fail closed.
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000002', true);
select pg_temp.expect_error(
  'network admin customer INSERT is denied',
  $sql$
    insert into public.customers (id, garage_id, first_name)
    values (
      'cc000000-0000-4000-8000-000000000021',
      '22222222-2222-4222-8222-222222222222',
      'Denied'
    )
  $sql$,
  '42501'
);
select pg_temp.expect_error(
  'network admin vehicle INSERT is denied',
  $sql$
    insert into public.vehicles (id, garage_id, brand, model)
    values (
      'cc000000-0000-4000-8000-000000000022',
      '22222222-2222-4222-8222-222222222222',
      'Denied',
      'Vehicle'
    )
  $sql$,
  '42501'
);
select pg_temp.expect_error(
  'network admin appointment INSERT is denied',
  $sql$
    insert into public.appointments (id, garage_id, center_id, title, starts_at)
    values (
      'cc000000-0000-4000-8000-000000000023',
      '22222222-2222-4222-8222-222222222222',
      '22222222-2222-4222-8222-22222222c001',
      'Denied',
      now()
    )
  $sql$,
  '42501'
);
select pg_temp.expect_error(
  'network admin repair INSERT is denied',
  $sql$
    insert into public.repairs (id, garage_id, title)
    values (
      'cc000000-0000-4000-8000-000000000024',
      '22222222-2222-4222-8222-222222222222',
      'Denied'
    )
  $sql$,
  '42501'
);
select pg_temp.expect_error(
  'network admin task INSERT is denied',
  $sql$
    insert into public.tasks (id, garage_id, title)
    values (
      'cc000000-0000-4000-8000-000000000025',
      '22222222-2222-4222-8222-222222222222',
      'Denied'
    )
  $sql$,
  '42501'
);
select pg_temp.expect_error(
  'network admin garage service INSERT is denied',
  $sql$
    insert into public.garage_services (id, garage_id, name)
    values (
      'cc000000-0000-4000-8000-000000000026',
      '22222222-2222-4222-8222-222222222222',
      'Denied'
    )
  $sql$,
  '42501'
);

select pg_temp.expect_zero_rows(
  'network admin customer UPDATE is denied',
  $sql$update public.customers set city = 'Denied' where id = 'cc000000-0000-4000-8000-000000000011'$sql$
);
select pg_temp.expect_zero_rows(
  'network admin vehicle UPDATE is denied',
  $sql$update public.vehicles set model = 'Denied' where id = 'cc000000-0000-4000-8000-000000000012'$sql$
);
select pg_temp.expect_zero_rows(
  'network admin appointment UPDATE is denied',
  $sql$update public.appointments set title = 'Denied' where id = 'cc000000-0000-4000-8000-000000000007'$sql$
);
select pg_temp.expect_zero_rows(
  'network admin repair UPDATE is denied',
  $sql$update public.repairs set title = 'Denied' where id = 'cc000000-0000-4000-8000-000000000013'$sql$
);
select pg_temp.expect_zero_rows(
  'network admin task UPDATE is denied',
  $sql$update public.tasks set title = 'Denied' where id = 'cc000000-0000-4000-8000-000000000014'$sql$
);
select pg_temp.expect_zero_rows(
  'network admin garage service UPDATE is denied',
  $sql$update public.garage_services set name = 'Denied' where id = 'cc000000-0000-4000-8000-000000000015'$sql$
);

select pg_temp.expect_zero_rows(
  'network admin customer DELETE is denied',
  $sql$delete from public.customers where id = 'cc000000-0000-4000-8000-000000000011'$sql$
);
select pg_temp.expect_zero_rows(
  'network admin vehicle DELETE is denied',
  $sql$delete from public.vehicles where id = 'cc000000-0000-4000-8000-000000000012'$sql$
);
select pg_temp.expect_zero_rows(
  'network admin appointment DELETE is denied',
  $sql$delete from public.appointments where id = 'cc000000-0000-4000-8000-000000000007'$sql$
);
select pg_temp.expect_zero_rows(
  'network admin repair DELETE is denied',
  $sql$delete from public.repairs where id = 'cc000000-0000-4000-8000-000000000013'$sql$
);
select pg_temp.expect_zero_rows(
  'network admin task DELETE is denied',
  $sql$delete from public.tasks where id = 'cc000000-0000-4000-8000-000000000014'$sql$
);
select pg_temp.expect_zero_rows(
  'network admin garage service DELETE is denied',
  $sql$delete from public.garage_services where id = 'cc000000-0000-4000-8000-000000000015'$sql$
);
reset role;

savepoint owner_core_operations;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000001', true);
insert into public.customers (id, garage_id, first_name)
values (
  'cc000000-0000-4000-8000-000000000030',
  '22222222-2222-4222-8222-222222222222',
  'Owner permitted'
);
insert into public.vehicles (id, garage_id, customer_id, brand, model)
values (
  'cc000000-0000-4000-8000-000000000031',
  '22222222-2222-4222-8222-222222222222',
  'cc000000-0000-4000-8000-000000000030',
  'Owner',
  'Permitted'
);
insert into public.appointments (id, garage_id, center_id, title, starts_at)
values (
  'cc000000-0000-4000-8000-000000000032',
  '22222222-2222-4222-8222-222222222222',
  '22222222-2222-4222-8222-22222222c001',
  'Owner permitted',
  now()
);
insert into public.repairs (id, garage_id, appointment_id, title)
values (
  'cc000000-0000-4000-8000-000000000033',
  '22222222-2222-4222-8222-222222222222',
  'cc000000-0000-4000-8000-000000000032',
  'Owner permitted'
);
insert into public.tasks (id, garage_id, related_vehicle_id, title)
values (
  'cc000000-0000-4000-8000-000000000034',
  '22222222-2222-4222-8222-222222222222',
  'cc000000-0000-4000-8000-000000000031',
  'Owner permitted'
);
insert into public.garage_services (id, garage_id, name)
values (
  'cc000000-0000-4000-8000-000000000035',
  '22222222-2222-4222-8222-222222222222',
  'Owner permitted'
);
update public.customers
set city = 'Owner permitted'
where id = 'cc000000-0000-4000-8000-000000000030';
update public.vehicles set model = 'Owner updated'
where id = 'cc000000-0000-4000-8000-000000000031';
update public.appointments set title = 'Owner updated'
where id = 'cc000000-0000-4000-8000-000000000032';
update public.repairs set title = 'Owner updated'
where id = 'cc000000-0000-4000-8000-000000000033';
update public.tasks set title = 'Owner updated'
where id = 'cc000000-0000-4000-8000-000000000034';
update public.garage_services set name = 'Owner updated'
where id = 'cc000000-0000-4000-8000-000000000035';
delete from public.repairs
where id = 'cc000000-0000-4000-8000-000000000033';
delete from public.tasks
where id = 'cc000000-0000-4000-8000-000000000034';
delete from public.appointments
where id = 'cc000000-0000-4000-8000-000000000032';
delete from public.garage_services
where id = 'cc000000-0000-4000-8000-000000000035';
delete from public.vehicles
where id = 'cc000000-0000-4000-8000-000000000031';
delete from public.customers
where id = 'cc000000-0000-4000-8000-000000000030';
select pg_temp.assert_true(
  'organization owner retains real DML on all six local core tables',
  not exists (
    select 1 from public.customers
    where id = 'cc000000-0000-4000-8000-000000000030'
  )
  and not exists (
    select 1 from public.vehicles
    where id = 'cc000000-0000-4000-8000-000000000031'
  )
  and not exists (
    select 1 from public.appointments
    where id = 'cc000000-0000-4000-8000-000000000032'
  )
  and not exists (
    select 1 from public.repairs
    where id = 'cc000000-0000-4000-8000-000000000033'
  )
  and not exists (
    select 1 from public.tasks
    where id = 'cc000000-0000-4000-8000-000000000034'
  )
  and not exists (
    select 1 from public.garage_services
    where id = 'cc000000-0000-4000-8000-000000000035'
  )
);
reset role;
rollback to savepoint owner_core_operations;

savepoint organization_center_management;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000001', true);
insert into public.garage_centers (id, garage_id, slug, name, is_active)
values (
  'cc000000-0000-4000-8000-000000000039',
  '22222222-2222-4222-8222-222222222222',
  'owner-created-center',
  'Owner created center',
  true
);
update public.garage_centers
set name = 'Owner updated center'
where id = 'cc000000-0000-4000-8000-000000000039';
delete from public.garage_centers
where id = 'cc000000-0000-4000-8000-000000000039';
select pg_temp.assert_true(
  'organization owner can create, update, and delete a center',
  not exists (
    select 1 from public.garage_centers center
    where center.id = 'cc000000-0000-4000-8000-000000000039'
  )
);
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000002', true);
select pg_temp.expect_error(
  'network admin cannot create a local center',
  $sql$
    insert into public.garage_centers (id, garage_id, slug, name, is_active)
    values (
      'cc000000-0000-4000-8000-000000000040',
      '22222222-2222-4222-8222-222222222222',
      'network-denied-center',
      'Denied center',
      true
    )
  $sql$,
  '42501'
);
reset role;
rollback to savepoint organization_center_management;

savepoint center_manager_core_operations;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000003', true);
insert into public.appointments (id, garage_id, center_id, title, starts_at)
values (
  'cc000000-0000-4000-8000-000000000036',
  '22222222-2222-4222-8222-222222222222',
  '22222222-2222-4222-8222-22222222c001',
  'Center manager permitted',
  now()
);
insert into public.repairs (id, garage_id, appointment_id, title)
values (
  'cc000000-0000-4000-8000-000000000037',
  '22222222-2222-4222-8222-222222222222',
  'cc000000-0000-4000-8000-000000000036',
  'Center manager permitted'
);
update public.appointments set title = 'Center manager updated'
where id = 'cc000000-0000-4000-8000-000000000036';
update public.repairs set title = 'Center manager updated'
where id = 'cc000000-0000-4000-8000-000000000037';
select pg_temp.expect_error(
  'center manager cannot insert an appointment in another center',
  $sql$
    insert into public.appointments (id, garage_id, center_id, title, starts_at)
    values (
      'cc000000-0000-4000-8000-000000000038',
      '22222222-2222-4222-8222-222222222222',
      '22222222-2222-4222-8222-22222222c002',
      'Cross-center denied',
      now()
    )
  $sql$,
  '42501'
);
delete from public.repairs
where id = 'cc000000-0000-4000-8000-000000000037';
delete from public.appointments
where id = 'cc000000-0000-4000-8000-000000000036';
select pg_temp.assert_true(
  'center manager retains real DML only in their center',
  not exists (
    select 1 from public.appointments
    where id in (
      'cc000000-0000-4000-8000-000000000036',
      'cc000000-0000-4000-8000-000000000038'
    )
  )
  and not exists (
    select 1 from public.repairs
    where id = 'cc000000-0000-4000-8000-000000000037'
  )
);
reset role;
rollback to savepoint center_manager_core_operations;

savepoint specialized_historical_operations;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000003', true);
select public.create_quote_with_lines(
  jsonb_build_object(
    'garage_id', '22222222-2222-4222-8222-222222222222',
    'service_request_id', 'f2222222-0000-4000-8000-000000000001',
    'title', 'Center manager canonical quote',
    'valid_until', (current_date + 30)::text
  ),
  '[{"label":"Canonical line","quantity":1,"unit_price":42,"tax_rate":20}]'::jsonb
);
select public.update_quote_with_lines(
  (
    select quote.id from public.quotes quote
    where quote.title = 'Center manager canonical quote'
    order by quote.created_at desc limit 1
  ),
  jsonb_build_object(
    'service_request_id', 'f2222222-0000-4000-8000-000000000001',
    'title', 'Center manager canonical quote updated',
    'valid_until', (current_date + 30)::text
  ),
  '[{"label":"Canonical line updated","quantity":1,"unit_price":45,"tax_rate":20}]'::jsonb
);
select public.send_quote((
  select quote.id from public.quotes quote
  where quote.title = 'Center manager canonical quote updated'
  order by quote.created_at desc limit 1
));
select public.save_delivery_report(
  'f2222222-0000-4000-8000-000000000001',
  jsonb_build_object(
    'diagnostic_summary', 'Center manager canonical report',
    'authorized_attachment_ids', '[]'::jsonb
  ),
  false
);
select public.create_maintenance_reminder(
  '22222222-2222-4222-8222-222222222222',
  '22222222-2222-4222-8222-22222222c001',
  'c2000000-0000-4000-8000-000000000001',
  'e2222222-0000-4000-8000-000000000001',
  'e2000000-0000-4000-8000-000000000001',
  'f2222222-0000-4000-8000-000000000001',
  'after_service',
  'Center manager canonical reminder',
  current_date + 30,
  null,
  now(),
  'pr3a-contract',
  'fr'
);
select pg_temp.assert_true(
  'center manager can use specialized quote, report, and reminder RPCs in-center',
  exists (
    select 1 from public.quotes quote
    where quote.title = 'Center manager canonical quote updated'
      and quote.status = 'sent'
  )
  and exists (
    select 1 from public.delivery_reports report
    where report.service_request_id = 'f2222222-0000-4000-8000-000000000001'
      and report.status = 'draft'
  )
  and exists (
    select 1 from public.maintenance_reminders reminder
    where reminder.source = 'pr3a-contract'
  )
);

select set_config(
  'pr3a.quote_count',
  (select count(*)::text from public.quotes),
  true
);
select set_config(
  'pr3a.quote_line_count',
  (select count(*)::text from public.quote_lines),
  true
);
select set_config(
  'pr3a.reminder_count',
  (select count(*)::text from public.maintenance_reminders),
  true
);
select set_config(
  'pr3a.outbox_count',
  (select count(*)::text from public.notification_outbox),
  true
);

select pg_temp.expect_error(
  'quote creation cannot inject accepted status',
  $sql$
    select public.create_quote_with_lines(
      '{"garage_id":"22222222-2222-4222-8222-222222222222","service_request_id":"f2222222-0000-4000-8000-000000000001","title":"Forged accepted quote","status":"accepted"}'::jsonb,
      '[{"label":"Denied","quantity":1,"unit_price":1,"tax_rate":20}]'::jsonb
    )
  $sql$,
  '22023'
);
select pg_temp.expect_error(
  'quote creation cannot inject sent status',
  $sql$
    select public.create_quote_with_lines(
      '{"garage_id":"22222222-2222-4222-8222-222222222222","service_request_id":"f2222222-0000-4000-8000-000000000001","title":"Forged sent quote","status":"sent"}'::jsonb,
      '[{"label":"Denied","quantity":1,"unit_price":1,"tax_rate":20}]'::jsonb
    )
  $sql$,
  '22023'
);
select pg_temp.expect_error(
  'quote creation cannot inject declined status',
  $sql$
    select public.create_quote_with_lines(
      '{"garage_id":"22222222-2222-4222-8222-222222222222","service_request_id":"f2222222-0000-4000-8000-000000000001","title":"Forged declined quote","status":"declined"}'::jsonb,
      '[{"label":"Denied","quantity":1,"unit_price":1,"tax_rate":20}]'::jsonb
    )
  $sql$,
  '22023'
);
select pg_temp.expect_error(
  'quote creation cannot inject expired status',
  $sql$
    select public.create_quote_with_lines(
      '{"garage_id":"22222222-2222-4222-8222-222222222222","service_request_id":"f2222222-0000-4000-8000-000000000001","title":"Forged expired quote","status":"expired"}'::jsonb,
      '[{"label":"Denied","quantity":1,"unit_price":1,"tax_rate":20}]'::jsonb
    )
  $sql$,
  '22023'
);
select pg_temp.expect_error(
  'quote creation cannot inject client decision evidence',
  $sql$
    select public.create_quote_with_lines(
      jsonb_build_object(
        'garage_id', '22222222-2222-4222-8222-222222222222',
        'service_request_id', 'f2222222-0000-4000-8000-000000000001',
        'title', 'Forged accepted timestamp quote',
        'status', 'draft',
        'accepted_at', now()
      ),
      '[{"label":"Denied","quantity":1,"unit_price":1,"tax_rate":20}]'::jsonb
    )
  $sql$,
  '22023'
);
select pg_temp.expect_error(
  'quote creation rejects unknown decision metadata fail-closed',
  $sql$
    select public.create_quote_with_lines(
      jsonb_build_object(
        'garage_id', '22222222-2222-4222-8222-222222222222',
        'service_request_id', 'f2222222-0000-4000-8000-000000000001',
        'title', 'Forged decision metadata quote',
        'status', 'draft',
        'customer_decision', 'accepted'
      ),
      '[{"label":"Denied","quantity":1,"unit_price":1,"tax_rate":20}]'::jsonb
    )
  $sql$,
  '22023'
);
select pg_temp.expect_error(
  'center manager cannot create a quote in another center',
  $sql$
    select public.create_quote_with_lines(
      '{"garage_id":"22222222-2222-4222-8222-222222222222","service_request_id":"f2222222-0000-4000-8000-000000000003","title":"Cross-center manager quote","status":"draft"}'::jsonb,
      '[{"label":"Denied","quantity":1,"unit_price":1,"tax_rate":20}]'::jsonb
    )
  $sql$,
  '42501'
);
select pg_temp.expect_error(
  'center manager cannot target a request client mismatch',
  $sql$
    select public.create_maintenance_reminder(
      '22222222-2222-4222-8222-222222222222',
      '22222222-2222-4222-8222-22222222c001',
      'c2000000-0000-4000-8000-000000000002',
      null,
      null,
      'f2222222-0000-4000-8000-000000000001',
      'after_service',
      'Mismatched request client',
      current_date + 30,
      null,
      now(),
      'pr3a-mismatch-denied',
      'fr'
    )
  $sql$,
  '23514'
);
select pg_temp.expect_error(
  'center manager cannot create a reminder for another center',
  $sql$
    select public.create_maintenance_reminder(
      '22222222-2222-4222-8222-222222222222',
      '22222222-2222-4222-8222-22222222c002',
      'c2000000-0000-4000-8000-000000000001',
      null,
      null,
      'f2222222-0000-4000-8000-000000000003',
      'after_service',
      'Cross-center reminder',
      current_date + 30,
      null,
      now(),
      'pr3a-cross-center-denied',
      'fr'
    )
  $sql$,
  '42501'
);
select pg_temp.expect_error(
  'center manager cannot create an unbound reminder',
  $sql$
    select public.create_maintenance_reminder(
      '22222222-2222-4222-8222-222222222222',
      '22222222-2222-4222-8222-22222222c001',
      'c2000000-0000-4000-8000-000000000001',
      null,
      null,
      null,
      'fixed_date',
      'Unbound manager reminder',
      current_date + 30,
      null,
      now(),
      'pr3a-unbound-manager-denied',
      'fr'
    )
  $sql$,
  '42501'
);
select pg_temp.assert_true(
  'rejected quote and reminder calls are atomic',
  (select count(*) from public.quotes)
    = current_setting('pr3a.quote_count')::bigint
  and (select count(*) from public.quote_lines)
    = current_setting('pr3a.quote_line_count')::bigint
  and (select count(*) from public.maintenance_reminders)
    = current_setting('pr3a.reminder_count')::bigint
  and (select count(*) from public.notification_outbox)
    = current_setting('pr3a.outbox_count')::bigint
);
reset role;

update public.customers
set linked_user_id = 'c2000000-0000-4000-8000-000000000001'
where id = 'd2222222-0000-4000-8000-000000000001'
  and garage_id = '22222222-2222-4222-8222-222222222222';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000001', true);
select public.create_maintenance_reminder(
  '22222222-2222-4222-8222-222222222222',
  '22222222-2222-4222-8222-22222222c001',
  'c2000000-0000-4000-8000-000000000001',
  null,
  null,
  null,
  'fixed_date',
  'Owner CRM-linked reminder',
  current_date + 30,
  null,
  now(),
  'pr3a-owner-linked',
  'fr'
);
select set_config(
  'pr3a.owner_reminder_count',
  (select count(*)::text from public.maintenance_reminders),
  true
);
select set_config(
  'pr3a.owner_outbox_count',
  (select count(*)::text from public.notification_outbox),
  true
);
select pg_temp.expect_error(
  'owner cannot create an unbound reminder for another garage client',
  $sql$
    select public.create_maintenance_reminder(
      '22222222-2222-4222-8222-222222222222',
      '22222222-2222-4222-8222-22222222c001',
      'c0000000-0000-4000-8000-000000000001',
      null,
      null,
      null,
      'fixed_date',
      'External client reminder',
      current_date + 30,
      null,
      now(),
      'pr3a-external-client-denied',
      'fr'
    )
  $sql$,
  '23514'
);
select pg_temp.assert_true(
  'owner external-client refusal leaves no reminder or outbox row',
  (select count(*) from public.maintenance_reminders)
    = current_setting('pr3a.owner_reminder_count')::bigint
  and (select count(*) from public.notification_outbox)
    = current_setting('pr3a.owner_outbox_count')::bigint
);
reset role;

savepoint receptionist_quote_scope;
update public.garage_members
set center_role = 'receptionist'
where user_id = 'b0000000-0000-4000-8000-000000000006'
  and garage_id = '22222222-2222-4222-8222-222222222222';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000006', true);
select pg_temp.expect_error(
  'receptionist cannot freely set quote prices without a canonical threshold',
  $sql$
    select public.create_quote_with_lines(
      '{"garage_id":"22222222-2222-4222-8222-222222222222","service_request_id":"f2222222-0000-4000-8000-000000000001","title":"Receptionist priced quote","status":"draft"}'::jsonb,
      '[{"label":"Denied price","quantity":1,"unit_price":1,"tax_rate":20}]'::jsonb
    )
  $sql$,
  '42501'
);
reset role;
rollback to savepoint receptionist_quote_scope;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000002', true);
select pg_temp.expect_error(
  'network admin cannot create a quote',
  $sql$
    select public.create_quote_with_lines(
      '{"garage_id":"22222222-2222-4222-8222-222222222222","service_request_id":"f2222222-0000-4000-8000-000000000001","title":"Denied network quote"}'::jsonb,
      '[{"label":"Denied","quantity":1,"unit_price":1,"tax_rate":20}]'::jsonb
    )
  $sql$,
  '42501'
);
select pg_temp.expect_error(
  'network admin cannot save a delivery report',
  $sql$
    select public.save_delivery_report(
      'f2222222-0000-4000-8000-000000000002',
      '{"diagnostic_summary":"Denied"}'::jsonb,
      false
    )
  $sql$,
  '42501'
);
select pg_temp.expect_error(
  'network admin cannot create a maintenance reminder',
  $sql$
    select public.create_maintenance_reminder(
      '22222222-2222-4222-8222-222222222222',
      '22222222-2222-4222-8222-22222222c001',
      'c2000000-0000-4000-8000-000000000001',
      null,
      null,
      'f2222222-0000-4000-8000-000000000001',
      'after_service',
      'Denied network reminder',
      current_date + 30,
      null,
      now(),
      'pr3a-network-denied',
      'fr'
    )
  $sql$,
  '42501'
);
select pg_temp.expect_zero_rows(
  'network admin cannot mutate organization branding',
  $sql$
    update public.garages
    set name = name
    where id = '22222222-2222-4222-8222-222222222222'
  $sql$
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000006', true);
select pg_temp.expect_error(
  'legacy front desk cannot create a quote',
  $sql$
    select public.create_quote_with_lines(
      '{"garage_id":"22222222-2222-4222-8222-222222222222","service_request_id":"f2222222-0000-4000-8000-000000000001","title":"Denied legacy quote"}'::jsonb,
      '[{"label":"Denied","quantity":1,"unit_price":1,"tax_rate":20}]'::jsonb
    )
  $sql$,
  '42501'
);
select pg_temp.expect_error(
  'legacy front desk cannot save a delivery report',
  $sql$
    select public.save_delivery_report(
      'f2222222-0000-4000-8000-000000000002',
      '{"diagnostic_summary":"Denied"}'::jsonb,
      false
    )
  $sql$,
  '42501'
);
reset role;
rollback to savepoint specialized_historical_operations;

select pg_temp.assert_true(
  'specialized workflow fixtures are fully rolled back',
  not exists (
    select 1 from public.quotes quote
    where quote.title like 'Center manager canonical quote%'
  )
  and not exists (
    select 1 from public.delivery_reports report
    where report.service_request_id = 'f2222222-0000-4000-8000-000000000001'
  )
  and not exists (
    select 1 from public.maintenance_reminders reminder
    where reminder.source = 'pr3a-contract'
  )
);

-- Generic core DML is denied to a technician, including cross-tenant access.
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000007', true);
select pg_temp.expect_error(
  'technician customer INSERT is denied',
  $sql$
    insert into public.customers (id, garage_id, first_name)
    values (
      'cc000000-0000-4000-8000-000000000001',
      '22222222-2222-4222-8222-222222222222',
      'Synthetic'
    )
  $sql$,
  '42501'
);
select pg_temp.expect_zero_rows(
  'technician customer UPDATE affects no row',
  $sql$
    update public.customers set city = 'Denied'
    where id = 'd2222222-0000-4000-8000-000000000001'
  $sql$
);
select pg_temp.expect_zero_rows(
  'technician customer DELETE affects no row',
  $sql$
    delete from public.customers
    where id = 'd2222222-0000-4000-8000-000000000001'
  $sql$
);
select pg_temp.expect_error(
  'technician vehicle INSERT is denied',
  $sql$
    insert into public.vehicles (id, garage_id, brand, model)
    values (
      'cc000000-0000-4000-8000-000000000002',
      '22222222-2222-4222-8222-222222222222',
      'Synthetic',
      'Vehicle'
    )
  $sql$,
  '42501'
);
select pg_temp.expect_zero_rows(
  'technician vehicle UPDATE affects no row',
  $sql$
    update public.vehicles set model = 'Denied'
    where id = 'e2222222-0000-4000-8000-000000000001'
  $sql$
);
select pg_temp.expect_zero_rows(
  'technician vehicle DELETE affects no row',
  $sql$
    delete from public.vehicles
    where id = 'e2222222-0000-4000-8000-000000000001'
  $sql$
);
select pg_temp.expect_error(
  'technician appointment INSERT is denied',
  $sql$
    insert into public.appointments (
      id, garage_id, center_id, title, starts_at
    )
    values (
      'cc000000-0000-4000-8000-000000000003',
      '22222222-2222-4222-8222-222222222222',
      '22222222-2222-4222-8222-22222222c002',
      'Synthetic',
      now()
    )
  $sql$,
  '42501'
);
select pg_temp.expect_zero_rows(
  'technician appointment UPDATE affects no row',
  $sql$
    update public.appointments set title = 'Denied'
    where garage_id = '22222222-2222-4222-8222-222222222222'
  $sql$
);
select pg_temp.expect_zero_rows(
  'technician appointment DELETE affects no row',
  $sql$
    delete from public.appointments
    where garage_id = '22222222-2222-4222-8222-222222222222'
  $sql$
);
select pg_temp.expect_error(
  'technician repair INSERT is denied',
  $sql$
    insert into public.repairs (id, garage_id, title)
    values (
      'cc000000-0000-4000-8000-000000000004',
      '22222222-2222-4222-8222-222222222222',
      'Synthetic'
    )
  $sql$,
  '42501'
);
select pg_temp.expect_zero_rows(
  'technician repair UPDATE affects no row',
  $sql$
    update public.repairs set title = 'Denied'
    where garage_id = '22222222-2222-4222-8222-222222222222'
  $sql$
);
select pg_temp.expect_zero_rows(
  'technician repair DELETE affects no row',
  $sql$
    delete from public.repairs
    where garage_id = '22222222-2222-4222-8222-222222222222'
  $sql$
);
select pg_temp.expect_error(
  'technician task INSERT is denied',
  $sql$
    insert into public.tasks (id, garage_id, title)
    values (
      'cc000000-0000-4000-8000-000000000005',
      '22222222-2222-4222-8222-222222222222',
      'Synthetic'
    )
  $sql$,
  '42501'
);
select pg_temp.expect_zero_rows(
  'technician task UPDATE affects no row',
  $sql$
    update public.tasks set title = 'Denied'
    where garage_id = '22222222-2222-4222-8222-222222222222'
  $sql$
);
select pg_temp.expect_zero_rows(
  'technician task DELETE affects no row',
  $sql$
    delete from public.tasks
    where garage_id = '22222222-2222-4222-8222-222222222222'
  $sql$
);
select pg_temp.expect_error(
  'technician service INSERT is denied',
  $sql$
    insert into public.garage_services (id, garage_id, name)
    values (
      'cc000000-0000-4000-8000-000000000006',
      '22222222-2222-4222-8222-222222222222',
      'Synthetic'
    )
  $sql$,
  '42501'
);
select pg_temp.expect_zero_rows(
  'technician service UPDATE affects no row',
  $sql$
    update public.garage_services set name = 'Denied'
    where garage_id = '22222222-2222-4222-8222-222222222222'
  $sql$
);
select pg_temp.expect_zero_rows(
  'technician service DELETE affects no row',
  $sql$
    delete from public.garage_services
    where garage_id = '22222222-2222-4222-8222-222222222222'
  $sql$
);
select pg_temp.assert_true(
  'technician cannot select cross-tenant customer data',
  not exists (
    select 1
    from public.customers
    where garage_id = '11111111-1111-4111-8111-111111111111'
  )
);
reset role;

-- Tenant keys are immutable even for a user valid in both garages.
savepoint tenant_key_immutability;
insert into public.garage_members (
  garage_id, user_id, role, status, center_id, organization_role, center_role
)
values (
  '11111111-1111-4111-8111-111111111111',
  'b0000000-0000-4000-8000-000000000001',
  'owner',
  'active',
  null,
  'organization_owner',
  null
);
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000001', true);
select pg_temp.expect_error(
  'garage_id cannot be moved between valid memberships',
  $sql$
    update public.customers
    set garage_id = '11111111-1111-4111-8111-111111111111'
    where id = 'd2222222-0000-4000-8000-000000000001'
  $sql$,
  '42501'
);
reset role;
rollback to savepoint tenant_key_immutability;

-- Client updates may change only a valid status transition.
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c2000000-0000-4000-8000-000000000001', true);
select pg_temp.expect_error(
  'client cannot change request garage_id',
  $sql$
    update public.service_requests
    set garage_id = '11111111-1111-4111-8111-111111111111'
    where id = 'f2222222-0000-4000-8000-000000000001'
  $sql$,
  '42501'
);
select pg_temp.expect_error(
  'client cannot change request client_id',
  $sql$
    update public.service_requests
    set client_id = 'c2000000-0000-4000-8000-000000000002'
    where id = 'f2222222-0000-4000-8000-000000000001'
  $sql$,
  '42501'
);
select pg_temp.expect_error(
  'client cannot change request customer_id',
  $sql$
    update public.service_requests
    set customer_id = 'd2222222-0000-4000-8000-000000000002'
    where id = 'f2222222-0000-4000-8000-000000000001'
  $sql$,
  '42501'
);
select pg_temp.expect_error(
  'client cannot change request center_id',
  $sql$
    update public.service_requests
    set center_id = '22222222-2222-4222-8222-22222222c002'
    where id = 'f2222222-0000-4000-8000-000000000001'
  $sql$,
  '42501'
);
select pg_temp.expect_error(
  'client cannot change request appointment_id',
  $sql$
    update public.service_requests
    set appointment_id = 'cc000000-0000-4000-8000-000000000007'
    where id = 'f2222222-0000-4000-8000-000000000001'
  $sql$,
  '42501'
);
select pg_temp.expect_error(
  'client cannot change request reference',
  $sql$
    update public.service_requests
    set reference = 'FORGED'
    where id = 'f2222222-0000-4000-8000-000000000001'
  $sql$,
  '42501'
);
select pg_temp.expect_error(
  'client cannot change internal workshop fields',
  $sql$
    update public.service_requests
    set workshop_stage = 'vehicle_ready'
    where id = 'f2222222-0000-4000-8000-000000000001'
  $sql$,
  '42501'
);
select pg_temp.expect_error(
  'client cannot force a forbidden status transition',
  $sql$
    update public.service_requests
    set status = 'completed'
    where id = 'f2222222-0000-4000-8000-000000000001'
  $sql$,
  '42501'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000001', true);
select pg_temp.expect_error(
  'owner cannot physically delete a service request',
  $sql$
    delete from public.service_requests
    where id = 'f2222222-0000-4000-8000-000000000001'
  $sql$,
  '42501'
);
reset role;

-- Public discovery is a server-enforced, column-minimized boundary. The
-- synthetic rows below live only for this transaction and exercise both a
-- private parent and inactive/unpublished children of a public parent.
savepoint public_data_boundary;
insert into public.garage_centers (
  id, garage_id, slug, name, is_active, sort_order
)
values
  (
    'cc000000-0000-4000-8000-000000000021',
    '33333333-3333-4333-8333-333333333333',
    'private-public-boundary',
    'Private public-boundary center',
    true,
    901
  ),
  (
    'cc000000-0000-4000-8000-000000000022',
    '11111111-1111-4111-8111-111111111111',
    'inactive-public-boundary',
    'Inactive public-boundary center',
    false,
    902
  );

insert into public.garage_services (
  id, garage_id, name, description, category, duration_minutes, price_from,
  is_active, sort_order, tax_rate, labor_hours, price_type, default_lines
)
values
  (
    'cc000000-0000-4000-8000-000000000023',
    '33333333-3333-4333-8333-333333333333',
    'Private public-boundary service',
    'Synthetic private catalog row',
    'maintenance',
    30,
    10,
    true,
    901,
    20,
    1,
    'fixed',
    '[]'::jsonb
  ),
  (
    'cc000000-0000-4000-8000-000000000024',
    '11111111-1111-4111-8111-111111111111',
    'Inactive public-boundary service',
    'Synthetic inactive catalog row',
    'maintenance',
    30,
    10,
    false,
    902,
    20,
    1,
    'fixed',
    '[]'::jsonb
  );

insert into public.garage_hours (
  id, garage_id, weekday, open_time, close_time, is_closed
)
values (
  'cc000000-0000-4000-8000-000000000025',
  '33333333-3333-4333-8333-333333333333',
  6,
  '09:00',
  '10:00',
  false
);

insert into public.garage_news (
  id, garage_id, title, body, is_published, published_at
)
values
  (
    'cc000000-0000-4000-8000-000000000026',
    '33333333-3333-4333-8333-333333333333',
    'Private published public-boundary news',
    'Synthetic private catalog row',
    true,
    now()
  ),
  (
    'cc000000-0000-4000-8000-000000000027',
    '11111111-1111-4111-8111-111111111111',
    'Unpublished public-boundary news',
    'Synthetic unpublished catalog row',
    false,
    now()
  );

set local role anon;
select pg_temp.assert_true(
  'anonymous sees a public garage through the minimized contract',
  exists (
    select 1 from public.garages
    where id = '11111111-1111-4111-8111-111111111111'
  )
);
select pg_temp.assert_true(
  'anonymous sees an active center of a public garage',
  exists (
    select 1 from public.garage_centers
    where garage_id = '11111111-1111-4111-8111-111111111111'
      and is_active
  )
);
select pg_temp.assert_true(
  'anonymous sees an active service of a public garage',
  exists (
    select 1 from public.garage_services
    where garage_id = '11111111-1111-4111-8111-111111111111'
      and is_active
  )
);
select pg_temp.assert_true(
  'anonymous sees hours of a public garage',
  exists (
    select 1 from public.garage_hours
    where garage_id = '11111111-1111-4111-8111-111111111111'
  )
);
select pg_temp.assert_true(
  'anonymous sees published news of a public garage',
  exists (
    select 1 from public.garage_news
    where garage_id = '11111111-1111-4111-8111-111111111111'
  )
);
select pg_temp.assert_true(
  'anonymous cannot see the private garage',
  not exists (
    select 1 from public.garages
    where id = '33333333-3333-4333-8333-333333333333'
  )
);
select pg_temp.assert_true(
  'anonymous cannot see an active center of a private garage',
  not exists (
    select 1 from public.garage_centers
    where id = 'cc000000-0000-4000-8000-000000000021'
  )
);
select pg_temp.assert_true(
  'anonymous cannot see an active service of a private garage',
  not exists (
    select 1 from public.garage_services
    where id = 'cc000000-0000-4000-8000-000000000023'
  )
);
select pg_temp.assert_true(
  'anonymous cannot see hours of a private garage',
  not exists (
    select 1 from public.garage_hours
    where id = 'cc000000-0000-4000-8000-000000000025'
  )
);
select pg_temp.assert_true(
  'anonymous cannot see published news of a private garage',
  not exists (
    select 1 from public.garage_news
    where id = 'cc000000-0000-4000-8000-000000000026'
  )
);
select pg_temp.assert_true(
  'anonymous cannot see an inactive center of a public garage',
  not exists (
    select 1 from public.garage_centers
    where id = 'cc000000-0000-4000-8000-000000000022'
  )
);
select pg_temp.assert_true(
  'anonymous cannot see an inactive service of a public garage',
  not exists (
    select 1 from public.garage_services
    where id = 'cc000000-0000-4000-8000-000000000024'
  )
);
select pg_temp.assert_true(
  'anonymous cannot see unpublished news of a public garage',
  not exists (
    select 1 from public.garage_news
    where id = 'cc000000-0000-4000-8000-000000000027'
  )
);
select pg_temp.expect_error(
  'anonymous cannot select garage settings',
  $sql$select settings from public.garages limit 1$sql$,
  '42501'
);
select pg_temp.expect_error(
  'anonymous cannot select garage email',
  $sql$select email from public.garages limit 1$sql$,
  '42501'
);
select pg_temp.expect_error(
  'anonymous cannot select service default lines',
  $sql$select default_lines from public.garage_services limit 1$sql$,
  '42501'
);
select pg_temp.expect_error(
  'anonymous cannot select service labor hours',
  $sql$select labor_hours from public.garage_services limit 1$sql$,
  '42501'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'c2000000-0000-4000-8000-000000000001',
  true
);
select pg_temp.assert_true(
  'authenticated client retains the public garage and service allowlist',
  exists (
    select id, name, phone
    from public.garages
    where id = '11111111-1111-4111-8111-111111111111'
  )
  and exists (
    select id, name, price_from
    from public.garage_services
    where garage_id = '11111111-1111-4111-8111-111111111111'
      and is_active
  )
);
select pg_temp.assert_true(
  'unrelated authenticated client cannot see an active center of a private garage',
  not exists (
    select 1 from public.garage_centers
    where id = 'cc000000-0000-4000-8000-000000000021'
  )
);
select pg_temp.assert_true(
  'unrelated authenticated client cannot see an active service of a private garage',
  not exists (
    select 1 from public.garage_services
    where id = 'cc000000-0000-4000-8000-000000000023'
  )
);
select pg_temp.assert_true(
  'unrelated authenticated client cannot see hours of a private garage',
  not exists (
    select 1 from public.garage_hours
    where id = 'cc000000-0000-4000-8000-000000000025'
  )
);
select pg_temp.assert_true(
  'unrelated authenticated client cannot see published news of a private garage',
  not exists (
    select 1 from public.garage_news
    where id = 'cc000000-0000-4000-8000-000000000026'
  )
);
select pg_temp.expect_error(
  'authenticated client cannot select garage settings',
  $sql$select settings from public.garages limit 1$sql$,
  '42501'
);
select pg_temp.expect_error(
  'authenticated client cannot select garage email',
  $sql$select email from public.garages limit 1$sql$,
  '42501'
);
select pg_temp.expect_error(
  'authenticated client cannot select service default lines',
  $sql$select default_lines from public.garage_services limit 1$sql$,
  '42501'
);
select pg_temp.expect_error(
  'authenticated client cannot select service labor hours',
  $sql$select labor_hours from public.garage_services limit 1$sql$,
  '42501'
);
select pg_temp.expect_error(
  'authenticated client cannot select service tax rate',
  $sql$select tax_rate from public.garage_services limit 1$sql$,
  '42501'
);
select pg_temp.expect_error(
  'authenticated client cannot use the garage management RPC',
  $sql$
    select *
    from public.get_managed_garage(
      '11111111-1111-4111-8111-111111111111'
    )
  $sql$,
  '42501'
);
select pg_temp.expect_error(
  'authenticated client cannot use the service management RPC',
  $sql$
    select *
    from public.get_managed_garage_services(
      '11111111-1111-4111-8111-111111111111'
    )
  $sql$,
  '42501'
);
reset role;

select pg_temp.assert_true(
  'catalog and management function privileges are narrowly assigned',
  has_function_privilege(
    'anon',
    'public.is_public_catalog_garage(uuid)',
    'execute'
  )
  and not has_function_privilege(
    'authenticated',
    'public.is_public_catalog_garage(uuid)',
    'execute'
  )
  and not has_function_privilege(
    'anon',
    'public.get_managed_garage(uuid)',
    'execute'
  )
  and not has_function_privilege(
    'anon',
    'public.get_managed_garage_services(uuid)',
    'execute'
  )
  and has_function_privilege(
    'authenticated',
    'public.get_managed_garage(uuid)',
    'execute'
  )
  and has_function_privilege(
    'authenticated',
    'public.get_managed_garage_services(uuid)',
    'execute'
  )
);
select pg_temp.assert_true(
  'anonymous has no private schema usage and authenticated has no private helper execution',
  not has_schema_privilege('anon', 'private', 'usage')
  and not exists (
    select 1
    from pg_proc procedure
    join pg_namespace namespace
      on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'private'
      and has_function_privilege('authenticated', procedure.oid, 'execute')
  )
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'b3333333-0000-4000-8000-000000000001',
  true
);
select pg_temp.expect_error(
  'authorized owner also cannot bypass minimized base-table columns',
  $sql$select settings from public.garages limit 1$sql$,
  '42501'
);
select pg_temp.assert_true(
  'authorized private-garage owner obtains internal fields through the management RPC',
  exists (
    select 1
    from public.get_managed_garage(
      '33333333-3333-4333-8333-333333333333'
    ) garage
    where garage.settings is not null
      and pg_typeof(garage.email) = 'text'::regtype
  )
);
select pg_temp.assert_true(
  'authorized private-garage owner retains private catalog content',
  exists (
    select 1
    from public.get_managed_garage_services(
      '33333333-3333-4333-8333-333333333333'
    ) service
    where service.id = 'cc000000-0000-4000-8000-000000000023'
      and service.default_lines is not null
      and service.labor_hours is not null
      and service.tax_rate is not null
  )
  and exists (
    select 1 from public.garage_centers
    where id = 'cc000000-0000-4000-8000-000000000021'
  )
  and exists (
    select 1 from public.garage_hours
    where id = 'cc000000-0000-4000-8000-000000000025'
  )
  and exists (
    select 1 from public.garage_news
    where id = 'cc000000-0000-4000-8000-000000000026'
  )
);
reset role;

set local role service_role;
select pg_temp.assert_true(
  'service_role retains direct full catalog reads',
  exists (
    select settings, email
    from public.garages
    where id = '33333333-3333-4333-8333-333333333333'
  )
  and exists (
    select default_lines, labor_hours, tax_rate
    from public.garage_services
    where id = 'cc000000-0000-4000-8000-000000000023'
  )
);
reset role;

rollback to savepoint public_data_boundary;
select pg_temp.assert_true(
  'public data boundary fixtures are fully rolled back',
  not exists (
    select 1 from public.garage_centers
    where id in (
      'cc000000-0000-4000-8000-000000000021',
      'cc000000-0000-4000-8000-000000000022'
    )
  )
  and not exists (
    select 1 from public.garage_services
    where id in (
      'cc000000-0000-4000-8000-000000000023',
      'cc000000-0000-4000-8000-000000000024'
    )
  )
  and not exists (
    select 1 from public.garage_hours
    where id = 'cc000000-0000-4000-8000-000000000025'
  )
  and not exists (
    select 1 from public.garage_news
    where id in (
      'cc000000-0000-4000-8000-000000000026',
      'cc000000-0000-4000-8000-000000000027'
    )
  )
);

select pg_temp.assert_true(
  'all denied and rolled-back operations preserve the core baseline',
  current_setting('fpv1.core_baseline') = (
    select md5(coalesce(string_agg(
      concat_ws('|', object_type, object_id, garage_id, payload),
      E'\n'
      order by object_type, object_id
    ), ''))
    from (
      select
        'customer'::text as object_type,
        customer.id::text as object_id,
        customer.garage_id::text as garage_id,
        to_jsonb(customer)::text as payload
      from public.customers customer
      union all
      select 'vehicle', vehicle.id::text, vehicle.garage_id::text, to_jsonb(vehicle)::text
      from public.vehicles vehicle
      union all
      select 'request', request.id::text, request.garage_id::text, to_jsonb(request)::text
      from public.service_requests request
      union all
      select 'appointment', appointment.id::text, appointment.garage_id::text, to_jsonb(appointment)::text
      from public.appointments appointment
      union all
      select 'repair', repair.id::text, repair.garage_id::text, to_jsonb(repair)::text
      from public.repairs repair
      union all
      select 'task', task.id::text, task.garage_id::text, to_jsonb(task)::text
      from public.tasks task
      union all
      select 'service', service.id::text, service.garage_id::text, to_jsonb(service)::text
      from public.garage_services service
    ) current_state
  )
);

rollback;

select 'CORE_DATA_API_CAPABILITIES:PASS';

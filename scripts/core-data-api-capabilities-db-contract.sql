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

-- Structural contract: capabilities, policies, grants, and physical deletion.
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
    '22222222-2222-4222-8222-222222222222',
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
);
reset role;
rollback to savepoint legacy_admin_scope;

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
update public.customers
set city = 'Owner permitted'
where id = 'cc000000-0000-4000-8000-000000000030';
delete from public.customers
where id = 'cc000000-0000-4000-8000-000000000030';
select pg_temp.assert_true(
  'organization owner retains expected local core operations',
  not exists (
    select 1 from public.customers
    where id = 'cc000000-0000-4000-8000-000000000030'
  )
);
reset role;
rollback to savepoint owner_core_operations;

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

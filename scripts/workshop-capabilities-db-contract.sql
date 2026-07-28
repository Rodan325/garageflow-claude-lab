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
    raise exception 'Workshop capability assertion failed: %', p_name;
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
          'Workshop capability assertion failed: % returned SQLSTATE %, expected %',
          p_name,
          actual_state,
          p_expected_state;
      end if;
      raise notice '[PASS] %', p_name;
      return;
  end;

  raise exception 'Workshop capability assertion failed: % unexpectedly succeeded', p_name;
end;
$$;

-- Structural contract. This is intentionally the first red assertion on the
-- pre-PR2 schema.
select pg_temp.assert_true(
  'canonical workshop resolver exists',
  to_regprocedure('public.has_workshop_capability(uuid,text)') is not null
);

select pg_temp.assert_true(
  'receptionist is an accepted canonical center role',
  (
    select pg_catalog.pg_get_constraintdef(constraint_row.oid) ilike '%receptionist%'
    from pg_catalog.pg_constraint constraint_row
    join pg_catalog.pg_class table_row
      on table_row.oid = constraint_row.conrelid
    join pg_catalog.pg_namespace schema_row
      on schema_row.oid = table_row.relnamespace
    where schema_row.nspname = 'public'
      and table_row.relname = 'garage_members'
      and constraint_row.conname = 'garage_members_center_role_check'
  )
);

select pg_temp.assert_true(
  'workshop base tables are RPC-only',
  not has_table_privilege('authenticated', 'public.service_request_timeline', 'SELECT')
  and not has_table_privilege('authenticated', 'public.workshop_recommendations', 'SELECT')
  and not has_table_privilege('authenticated', 'public.recommendation_decisions', 'SELECT')
);

select pg_temp.assert_true(
  'workshop RPCs use SECURITY DEFINER and an empty search_path',
  not exists (
    select 1
    from pg_catalog.pg_proc function_row
    join pg_catalog.pg_namespace function_schema
      on function_schema.oid = function_row.pronamespace
    where function_schema.nspname = 'public'
      and function_row.proname in (
        'has_workshop_capability',
        'transition_workshop_stage',
        'close_workshop_request',
        'reopen_workshop_request',
        'assign_workshop_repair',
        'get_workshop_timeline',
        'get_workshop_recommendations',
        'get_workshop_recommendation_decisions',
        'create_workshop_recommendation',
        'set_workshop_recommendation_status',
        'decide_workshop_recommendation',
        'link_recommendation_quote'
      )
      and (
        not function_row.prosecdef
        or function_row.proconfig is distinct from array['search_path=""']::text[]
      )
  )
);

select pg_temp.assert_true(
  'PUBLIC and anon cannot execute workshop RPCs',
  not exists (
    select 1
    from pg_catalog.pg_proc function_row
    join pg_catalog.pg_namespace function_schema
      on function_schema.oid = function_row.pronamespace
    where function_schema.nspname = 'public'
      and function_row.proname in (
        'has_workshop_capability',
        'transition_workshop_stage',
        'close_workshop_request',
        'reopen_workshop_request',
        'assign_workshop_repair',
        'get_workshop_timeline',
        'get_workshop_recommendations',
        'get_workshop_recommendation_decisions',
        'create_workshop_recommendation',
        'set_workshop_recommendation_status',
        'decide_workshop_recommendation',
        'link_recommendation_quote'
      )
      and (
        has_function_privilege('anon', function_row.oid, 'EXECUTE')
        or has_function_privilege('public', function_row.oid, 'EXECUTE')
      )
  )
);

-- Transactional fixtures. All rows and role mutations are rolled back.
select set_config(
  'request.jwt.claim.sub',
  'b0000000-0000-4000-8000-000000000001',
  true
);

update public.garage_members
set center_role = 'receptionist'
where user_id = 'b0000000-0000-4000-8000-000000000006'
  and garage_id = '22222222-2222-4222-8222-222222222222';

insert into public.appointments (
  id,
  garage_id,
  center_id,
  service_request_id,
  assigned_to,
  title,
  starts_at
)
values
  (
    'cc100000-0000-4000-8000-000000000001',
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-22222222c002',
    'f2222222-0000-4000-8000-000000000003',
    null,
    'Assigned technician fixture',
    now()
  ),
  (
    'cc100000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-22222222c002',
    'f2222222-0000-4000-8000-000000000005',
    'b0000000-0000-4000-8000-000000000007',
    'Planning-only assignment fixture',
    now()
  ),
  (
    'cc100000-0000-4000-8000-000000000003',
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-22222222c001',
    'f2222222-0000-4000-8000-000000000004',
    null,
    'Center-one assignment fixture',
    now()
  );

insert into public.repairs (
  id,
  garage_id,
  customer_id,
  vehicle_id,
  appointment_id,
  title,
  assigned_to
)
values
  (
    'cc200000-0000-4000-8000-000000000001',
    '22222222-2222-4222-8222-222222222222',
    'd2222222-0000-4000-8000-000000000001',
    'e2222222-0000-4000-8000-000000000001',
    'cc100000-0000-4000-8000-000000000001',
    'Assigned repair fixture',
    'b0000000-0000-4000-8000-000000000007'
  ),
  (
    'cc200000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222222',
    'd2222222-0000-4000-8000-000000000002',
    'e2222222-0000-4000-8000-000000000002',
    'cc100000-0000-4000-8000-000000000003',
    'Unassigned repair fixture',
    null
  );

update public.service_requests
set appointment_id = case id
      when 'f2222222-0000-4000-8000-000000000003'::uuid
        then 'cc100000-0000-4000-8000-000000000001'::uuid
      when 'f2222222-0000-4000-8000-000000000005'::uuid
        then 'cc100000-0000-4000-8000-000000000002'::uuid
      when 'f2222222-0000-4000-8000-000000000004'::uuid
        then 'cc100000-0000-4000-8000-000000000003'::uuid
      else appointment_id
    end,
    workshop_stage = case id
      when 'f2222222-0000-4000-8000-000000000003'::uuid
        then 'vehicle_received'
      when 'f2222222-0000-4000-8000-000000000005'::uuid
        then 'work_authorized'
      else workshop_stage
    end
where id in (
  'f2222222-0000-4000-8000-000000000003',
  'f2222222-0000-4000-8000-000000000004',
  'f2222222-0000-4000-8000-000000000005'
);

insert into public.service_request_timeline (
  id,
  request_id,
  garage_id,
  center_id,
  previous_stage,
  new_stage,
  changed_by,
  internal_note,
  customer_message,
  visible_to_customer,
  notification_status
)
values (
  'cc300000-0000-4000-8000-000000000001',
  'f2222222-0000-4000-8000-000000000003',
  '22222222-2222-4222-8222-222222222222',
  '22222222-2222-4222-8222-22222222c002',
  'vehicle_received',
  'diagnosis_in_progress',
  'b0000000-0000-4000-8000-000000000007',
  'Assigned technician internal note',
  'Diagnosis is in progress.',
  true,
  'simulated'
);

insert into public.quotes (
  id,
  garage_id,
  number,
  title,
  service_request_id
)
values (
  'cc400000-0000-4000-8000-000000000001',
  '22222222-2222-4222-8222-222222222222',
  'PR2-ROLLBACK-001',
  'PR2 rollback quote',
  'f2222222-0000-4000-8000-000000000001'
);

select set_config(
  'fpv1.workshop_baseline',
  md5(coalesce(string_agg(payload, E'\n' order by payload), '')),
  true
)
from (
  select to_jsonb(request)::text as payload
  from public.service_requests request
  union all
  select to_jsonb(event)::text
  from public.service_request_timeline event
  union all
  select to_jsonb(recommendation)::text
  from public.workshop_recommendations recommendation
  union all
  select to_jsonb(decision)::text
  from public.recommendation_decisions decision
) workshop_state;

-- Canonical role resolution.
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000001', true);
select pg_temp.assert_true(
  'organization owner has workshop authority in their garage',
  public.has_workshop_capability(
    'f2222222-0000-4000-8000-000000000003',
    'timeline.full'
  )
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000002', true);
select pg_temp.assert_true(
  'network admin receives no automatic local workshop capability',
  not public.has_workshop_capability(
    'f2222222-0000-4000-8000-000000000003',
    'transition.operational'
  )
);
select pg_temp.expect_error(
  'network admin cannot transition a local workshop request',
  $sql$
    select public.transition_workshop_stage(
      'f2222222-0000-4000-8000-000000000003',
      'diagnosis_in_progress'
    )
  $sql$,
  '42501'
);
reset role;

savepoint legacy_roles;
update public.garage_members
set organization_role = null,
    center_id = null,
    center_role = null
where user_id = 'a0000000-0000-4000-8000-000000000002'
  and garage_id = '11111111-1111-4111-8111-111111111111';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000002', true);
select pg_temp.expect_error(
  'legacy mechanic alone cannot transition workshop stages',
  $sql$
    select public.transition_workshop_stage(
      'f1111111-0000-4000-8000-000000000002',
      'customer_approval_required'
    )
  $sql$,
  '42501'
);
reset role;
rollback to savepoint legacy_roles;

savepoint service_advisor_role;
update public.garage_members
set center_role = 'service_advisor'
where user_id = 'b0000000-0000-4000-8000-000000000006'
  and garage_id = '22222222-2222-4222-8222-222222222222';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000006', true);
select pg_temp.assert_true(
  'legacy service advisor is fail-closed',
  not public.has_workshop_capability(
    'f2222222-0000-4000-8000-000000000001',
    'transition.reception'
  )
);
reset role;
rollback to savepoint service_advisor_role;

savepoint front_desk_role;
update public.garage_members
set center_role = 'front_desk'
where user_id = 'b0000000-0000-4000-8000-000000000006'
  and garage_id = '22222222-2222-4222-8222-222222222222';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000006', true);
select pg_temp.assert_true(
  'legacy front desk is fail-closed',
  not public.has_workshop_capability(
    'f2222222-0000-4000-8000-000000000001',
    'transition.reception'
  )
);
reset role;
rollback to savepoint front_desk_role;

savepoint regional_manager_role;
update public.garage_members
set organization_role = 'regional_manager'
where user_id = 'b0000000-0000-4000-8000-000000000002'
  and garage_id = '22222222-2222-4222-8222-222222222222';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000002', true);
select pg_temp.assert_true(
  'regional manager is fail-closed',
  not public.has_workshop_capability(
    'f2222222-0000-4000-8000-000000000003',
    'timeline.full'
  )
);
reset role;
rollback to savepoint regional_manager_role;

savepoint viewer_role;
update public.garage_members
set center_role = 'viewer'
where user_id = 'b0000000-0000-4000-8000-000000000006'
  and garage_id = '22222222-2222-4222-8222-222222222222';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000006', true);
select pg_temp.assert_true(
  'viewer is fail-closed for workshop mutations',
  not public.has_workshop_capability(
    'f2222222-0000-4000-8000-000000000001',
    'transition.operational'
  )
);
reset role;
rollback to savepoint viewer_role;

-- Receptionist transition matrix.
savepoint receptionist_allowed;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000001', true);
update public.service_requests
set workshop_stage = 'appointment_confirmed'
where id = 'f2222222-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000006', true);
select pg_temp.assert_true(
  'receptionist can advance an allowed reception transition in their center',
  (
    select event.new_stage = 'vehicle_expected'
    from public.transition_workshop_stage(
      'f2222222-0000-4000-8000-000000000001',
      'vehicle_expected'
    ) event
  )
);
reset role;
rollback to savepoint receptionist_allowed;

savepoint receptionist_denied;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000001', true);
update public.service_requests
set workshop_stage = 'vehicle_received'
where id = 'f2222222-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000006', true);
select pg_temp.expect_error(
  'receptionist cannot start a diagnosis',
  $sql$
    select public.transition_workshop_stage(
      'f2222222-0000-4000-8000-000000000001',
      'diagnosis_in_progress'
    )
  $sql$,
  '42501'
);
reset role;
rollback to savepoint receptionist_denied;

-- Technician authority comes only from a unique repair assignment.
savepoint technician_allowed;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000007', true);
select pg_temp.assert_true(
  'assigned technician can perform an allowed technical transition',
  (
    select event.new_stage = 'diagnosis_in_progress'
    from public.transition_workshop_stage(
      'f2222222-0000-4000-8000-000000000003',
      'diagnosis_in_progress'
    ) event
  )
);
reset role;
rollback to savepoint technician_allowed;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000007', true);
select pg_temp.expect_error(
  'appointment planning assignment grants no workshop authority',
  $sql$
    select public.transition_workshop_stage(
      'f2222222-0000-4000-8000-000000000005',
      'work_in_progress'
    )
  $sql$,
  '42501'
);
select pg_temp.expect_error(
  'technician cannot act in another center',
  $sql$
    select public.transition_workshop_stage(
      'f2222222-0000-4000-8000-000000000004',
      'quality_control'
    )
  $sql$,
  '42501'
);
reset role;

-- Special states, finalization, closure, and audited reopening.
savepoint owner_finalize;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000001', true);
select pg_temp.assert_true(
  'owner can finalize quality control',
  (
    select event.new_stage = 'vehicle_ready'
    from public.transition_workshop_stage(
      'f2222222-0000-4000-8000-000000000005',
      'vehicle_ready'
    ) event
  )
);
reset role;
rollback to savepoint owner_finalize;

savepoint close_request;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000001', true);
update public.service_requests
set workshop_stage = 'vehicle_delivered'
where id = 'f2222222-0000-4000-8000-000000000006';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000005', true);
select pg_temp.assert_true(
  'center manager can close a delivered request in their center',
  (
    select event.new_stage = 'closed'
    from public.close_workshop_request(
      'f2222222-0000-4000-8000-000000000006',
      'Validated closure'
    ) event
  )
);
reset role;
rollback to savepoint close_request;

savepoint reopen_request;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000004', true);
select pg_temp.assert_true(
  'center manager can reopen quality control with an audited reason',
  (
    select event.new_stage = 'work_in_progress'
      and event.internal_note = 'Quality issue detected'
    from public.reopen_workshop_request(
      'f2222222-0000-4000-8000-000000000005',
      'work_in_progress',
      'Quality issue detected'
    ) event
  )
);
reset role;
rollback to savepoint reopen_request;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000001', true);
select pg_temp.expect_error(
  'generic transition cannot enter customer approval state',
  $sql$
    select public.transition_workshop_stage(
      'f2222222-0000-4000-8000-000000000003',
      'customer_approval_required'
    )
  $sql$,
  '42501'
);
select pg_temp.expect_error(
  'generic transition cannot close a request',
  $sql$
    select public.transition_workshop_stage(
      'f2222222-0000-4000-8000-000000000006',
      'closed'
    )
  $sql$,
  '42501'
);
select pg_temp.expect_error(
  'reopening requires a non-empty reason',
  $sql$
    select public.reopen_workshop_request(
      'f2222222-0000-4000-8000-000000000005',
      'work_in_progress',
      ' '
    )
  $sql$,
  '22023'
);
reset role;

-- Assignment is server controlled and center-scoped.
savepoint repair_assignment;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000003', true);
select pg_temp.assert_true(
  'center manager can assign a technician in the same center',
  (
    select repair.assigned_to = 'a0000000-0000-4000-8000-000000000003'::uuid
    from public.assign_workshop_repair(
      'cc200000-0000-4000-8000-000000000002',
      'a0000000-0000-4000-8000-000000000003'
    ) repair
  ) is false
);
reset role;
rollback to savepoint repair_assignment;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000002', true);
select pg_temp.expect_error(
  'network admin cannot assign a repair technician',
  $sql$
    select public.assign_workshop_repair(
      'cc200000-0000-4000-8000-000000000001',
      'b0000000-0000-4000-8000-000000000007'
    )
  $sql$,
  '42501'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000001', true);
select pg_temp.expect_error(
  'direct repair assignment is refused',
  $sql$
    update public.repairs
    set assigned_to = null
    where id = 'cc200000-0000-4000-8000-000000000001'
  $sql$,
  '42501'
);
select pg_temp.expect_error(
  'direct task assignment is refused',
  $sql$
    update public.tasks
    set assigned_to = 'a0000000-0000-4000-8000-000000000002'
    where id = '34111111-0000-4000-8000-000000000001'
  $sql$,
  '42501'
);
select pg_temp.expect_error(
  'direct workshop stage mutation is refused',
  $sql$
    update public.service_requests
    set workshop_stage = 'closed'
    where id = 'f2222222-0000-4000-8000-000000000006'
  $sql$,
  '42501'
);
reset role;

-- Timeline projections.
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000006', true);
select pg_temp.assert_true(
  'receptionist timeline hides internal notes and actor identifiers',
  not exists (
    select 1
    from public.get_workshop_timeline(
      'f2222222-0000-4000-8000-000000000001'
    ) event
    where event.internal_note is not null
      or event.changed_by is not null
  )
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000007', true);
select pg_temp.assert_true(
  'assigned technician can read technical timeline details',
  exists (
    select 1
    from public.get_workshop_timeline(
      'f2222222-0000-4000-8000-000000000003'
    ) event
    where event.internal_note = 'Assigned technician internal note'
  )
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c2000000-0000-4000-8000-000000000001', true);
select pg_temp.assert_true(
  'client timeline exposes only visible events without internal fields',
  not exists (
    select 1
    from public.get_workshop_timeline(
      'f2222222-0000-4000-8000-000000000001'
    ) event
    where not event.visible_to_customer
      or event.internal_note is not null
      or event.changed_by is not null
  )
);
reset role;

-- Recommendation pricing and ownership.
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000001', true);
select pg_temp.assert_true(
  'owner recommendation projection includes estimated price',
  exists (
    select 1
    from public.get_workshop_recommendations(
      'f2222222-0000-4000-8000-000000000001'
    ) recommendation
    where recommendation.id = '81000000-0000-4000-8000-000000000001'
      and recommendation.estimated_price = 180
  )
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000003', true);
select pg_temp.assert_true(
  'center manager recommendation projection hides estimated price',
  exists (
    select 1
    from public.get_workshop_recommendations(
      'f2222222-0000-4000-8000-000000000001'
    ) recommendation
    where recommendation.id = '81000000-0000-4000-8000-000000000001'
      and recommendation.estimated_price is null
  )
);
select pg_temp.expect_error(
  'center manager cannot provide an estimated price',
  $sql$
    select public.create_workshop_recommendation(
      'f2222222-0000-4000-8000-000000000001',
      'Manager priced recommendation',
      p_estimated_price => 120
    )
  $sql$,
  '42501'
);
select pg_temp.expect_error(
  'recommendation quote linkage is owner-only',
  $sql$
    select public.link_recommendation_quote(
      '81000000-0000-4000-8000-000000000001',
      'cc400000-0000-4000-8000-000000000001'
    )
  $sql$,
  '42501'
);
reset role;

savepoint technician_recommendation;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000007', true);
select pg_temp.assert_true(
  'assigned technician can create a price-free recommendation',
  (
    select recommendation.estimated_price is null
    from public.create_workshop_recommendation(
      'f2222222-0000-4000-8000-000000000003',
      'Assigned technical finding'
    ) recommendation
  )
);
select pg_temp.expect_error(
  'technician-provided estimated price is rejected',
  $sql$
    select public.create_workshop_recommendation(
      'f2222222-0000-4000-8000-000000000003',
      'Forbidden priced finding',
      p_estimated_price => 90
    )
  $sql$,
  '42501'
);
reset role;
rollback to savepoint technician_recommendation;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c2000000-0000-4000-8000-000000000001', true);
select pg_temp.assert_true(
  'client recommendation projection hides estimated price',
  not exists (
    select 1
    from public.get_workshop_recommendations(
      'f2222222-0000-4000-8000-000000000001'
    ) recommendation
    where recommendation.estimated_price is not null
  )
);
select pg_temp.expect_error(
  'another client cannot decide the recommendation',
  $sql$
    select public.decide_workshop_recommendation(
      '81000000-0000-4000-8000-000000000002',
      'declined'
    )
  $sql$,
  '42501'
);
reset role;

select pg_temp.assert_true(
  'all denied and rolled-back operations preserve the workshop baseline',
  current_setting('fpv1.workshop_baseline') = (
    select md5(coalesce(string_agg(payload, E'\n' order by payload), ''))
    from (
      select to_jsonb(request)::text as payload
      from public.service_requests request
      union all
      select to_jsonb(event)::text
      from public.service_request_timeline event
      union all
      select to_jsonb(recommendation)::text
      from public.workshop_recommendations recommendation
      union all
      select to_jsonb(decision)::text
      from public.recommendation_decisions decision
    ) workshop_state
  )
);

rollback;

select 'WORKSHOP_CAPABILITIES:PASS';

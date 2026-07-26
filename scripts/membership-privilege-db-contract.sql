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
    raise exception 'Phase 4A assertion failed: %', p_name;
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
          'Phase 4A assertion failed: % returned SQLSTATE %, expected %',
          p_name,
          actual_state,
          p_expected_state;
      end if;
      raise notice '[PASS] %', p_name;
      return;
  end;

  raise exception 'Phase 4A assertion failed: % unexpectedly succeeded', p_name;
end;
$$;

select set_config(
  'phase4.membership_baseline',
  md5(coalesce(string_agg(
    concat_ws(
      '|',
      member.id,
      member.garage_id,
      member.user_id,
      member.role,
      member.status,
      coalesce(member.center_id::text, ''),
      coalesce(member.organization_role, ''),
      coalesce(member.center_role, ''),
      coalesce(member.invited_at::text, ''),
      member.created_at
    ),
    E'\n'
    order by member.id
  ), '')),
  true
)
from public.garage_members member;

select set_config(
  'phase4.owner_a_member',
  (
    select member.id::text
    from public.garage_members member
    where member.user_id = 'a0000000-0000-4000-8000-000000000001'
  ),
  true
);
select set_config(
  'phase4.front_desk_a_member',
  (
    select member.id::text
    from public.garage_members member
    where member.user_id = 'a0000000-0000-4000-8000-000000000003'
  ),
  true
);
select set_config(
  'phase4.owner_b_member',
  (
    select member.id::text
    from public.garage_members member
    where member.user_id = 'b0000000-0000-4000-8000-000000000001'
  ),
  true
);
select set_config(
  'phase4.network_admin_b_member',
  (
    select member.id::text
    from public.garage_members member
    where member.user_id = 'b0000000-0000-4000-8000-000000000002'
  ),
  true
);
select set_config(
  'phase4.center_manager_b1_member',
  (
    select member.id::text
    from public.garage_members member
    where member.user_id = 'b0000000-0000-4000-8000-000000000003'
  ),
  true
);
select set_config(
  'phase4.center_manager_b2_member',
  (
    select member.id::text
    from public.garage_members member
    where member.user_id = 'b0000000-0000-4000-8000-000000000004'
  ),
  true
);
select set_config(
  'phase4.front_desk_b_member',
  (
    select member.id::text
    from public.garage_members member
    where member.user_id = 'b0000000-0000-4000-8000-000000000006'
  ),
  true
);
select set_config(
  'phase4.request_a',
  (
    select request.id::text
    from public.service_requests request
    where request.garage_id = '11111111-1111-4111-8111-111111111111'
      and request.center_id = '11111111-1111-4111-8111-11111111c001'
      and request.status in (
        'pending',
        'accepted',
        'reschedule_proposed',
        'confirmed',
        'completed'
      )
      and request.workshop_stage is distinct from 'closed'
    order by request.id
    limit 1
  ),
  true
);

-- Grants, policies, and privileged function boundaries.
select pg_temp.assert_true(
  'authenticated has no direct membership INSERT',
  not has_table_privilege('authenticated', 'public.garage_members', 'INSERT')
);
select pg_temp.assert_true(
  'authenticated has no direct membership UPDATE',
  not has_table_privilege('authenticated', 'public.garage_members', 'UPDATE')
);
select pg_temp.assert_true(
  'authenticated has no direct membership DELETE',
  not has_table_privilege('authenticated', 'public.garage_members', 'DELETE')
);
select pg_temp.assert_true(
  'anon has no membership mutations',
  not has_table_privilege('anon', 'public.garage_members', 'INSERT')
  and not has_table_privilege('anon', 'public.garage_members', 'UPDATE')
  and not has_table_privilege('anon', 'public.garage_members', 'DELETE')
);
select pg_temp.assert_true(
  'garage_members exposes SELECT policies only',
  not exists (
    select 1
    from pg_catalog.pg_policies policy
    where policy.schemaname = 'public'
      and policy.tablename = 'garage_members'
      and policy.cmd <> 'SELECT'
  )
);
select pg_temp.assert_true(
  'garage_members RLS remains enabled',
  (
    select table_row_security.relrowsecurity
    from pg_catalog.pg_class table_row_security
    join pg_catalog.pg_namespace table_schema
      on table_schema.oid = table_row_security.relnamespace
    where table_schema.nspname = 'public'
      and table_row_security.relname = 'garage_members'
  )
);
select pg_temp.assert_true(
  'membership RPCs are SECURITY DEFINER with an empty search_path',
  (
    select bool_and(
      function_row.prosecdef
      and function_row.proconfig = array['search_path=""']::text[]
    )
    from pg_catalog.pg_proc function_row
    join pg_catalog.pg_namespace function_schema
      on function_schema.oid = function_row.pronamespace
    where function_schema.nspname = 'public'
      and function_row.proname in (
        'promote_member_to_network_admin',
        'assign_member_to_center',
        'deactivate_organization_member'
      )
  )
);
select pg_temp.assert_true(
  'authenticated alone can execute public membership RPCs',
  has_function_privilege(
    'authenticated',
    'public.promote_member_to_network_admin(uuid)',
    'EXECUTE'
  )
  and has_function_privilege(
    'authenticated',
    'public.assign_member_to_center(uuid,uuid,text)',
    'EXECUTE'
  )
  and has_function_privilege(
    'authenticated',
    'public.deactivate_organization_member(uuid)',
    'EXECUTE'
  )
  and not has_function_privilege(
    'anon',
    'public.promote_member_to_network_admin(uuid)',
    'EXECUTE'
  )
  and not has_function_privilege(
    'anon',
    'public.assign_member_to_center(uuid,uuid,text)',
    'EXECUTE'
  )
  and not has_function_privilege(
    'anon',
    'public.deactivate_organization_member(uuid)',
    'EXECUTE'
  )
);
select pg_temp.assert_true(
  'private membership resolver is not executable by application roles',
  not has_function_privilege(
    'authenticated',
    'private.resolve_membership_management_context(uuid)',
    'EXECUTE'
  )
  and not has_function_privilege(
    'anon',
    'private.resolve_membership_management_context(uuid)',
    'EXECUTE'
  )
);

-- Direct Data API writes and anonymous administrative access fail closed.
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'b0000000-0000-4000-8000-000000000003',
  true
);
select pg_temp.expect_error(
  'center manager cannot modify their own role',
  format(
    'update public.garage_members set role = %L where id = %L::uuid',
    'owner',
    current_setting('phase4.center_manager_b1_member')
  ),
  '42501'
);
select pg_temp.expect_error(
  'center manager cannot modify their own center',
  format(
    'update public.garage_members set center_id = %L::uuid where id = %L::uuid',
    '22222222-2222-4222-8222-22222222c002',
    current_setting('phase4.center_manager_b1_member')
  ),
  '42501'
);
select pg_temp.expect_error(
  'center manager cannot modify their own status',
  format(
    'update public.garage_members set status = %L where id = %L::uuid',
    'disabled',
    current_setting('phase4.center_manager_b1_member')
  ),
  '42501'
);
select pg_temp.expect_error(
  'center manager cannot invite by direct membership INSERT',
  $sql$
    insert into public.garage_members (
      garage_id,
      user_id,
      role,
      status,
      center_id,
      center_role
    )
    values (
      '22222222-2222-4222-8222-222222222222',
      'c2000000-0000-4000-8000-000000000001',
      'front_desk',
      'invited',
      '22222222-2222-4222-8222-22222222c001',
      'front_desk'
    )
  $sql$,
  '42501'
);
select pg_temp.expect_error(
  'center manager cannot manage another membership through the RPC',
  format(
    'select public.assign_member_to_center(%L::uuid, %L::uuid, %L)',
    current_setting('phase4.front_desk_b_member'),
    '22222222-2222-4222-8222-22222222c001',
    'front_desk'
  ),
  '42501'
);
select pg_temp.expect_error(
  'center manager cannot promote another member',
  format(
    'select public.promote_member_to_network_admin(%L::uuid)',
    current_setting('phase4.front_desk_b_member')
  ),
  '42501'
);
select pg_temp.expect_error(
  'center manager cannot deactivate another member',
  format(
    'select public.deactivate_organization_member(%L::uuid)',
    current_setting('phase4.front_desk_b_member')
  ),
  '42501'
);
reset role;

set local role anon;
select pg_temp.expect_error(
  'anonymous callers cannot execute membership administration',
  format(
    'select public.deactivate_organization_member(%L::uuid)',
    current_setting('phase4.front_desk_b_member')
  ),
  '42501'
);
reset role;

-- Owner and network-admin RPCs derive authority and reject spoofed scope.
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'b0000000-0000-4000-8000-000000000001',
  true
);
select pg_temp.expect_error(
  'owner cannot modify their own membership',
  format(
    'select public.promote_member_to_network_admin(%L::uuid)',
    current_setting('phase4.owner_b_member')
  ),
  '42501'
);
select pg_temp.expect_error(
  'owner cannot act on another organization',
  format(
    'select public.assign_member_to_center(%L::uuid, %L::uuid, %L)',
    current_setting('phase4.front_desk_a_member'),
    '22222222-2222-4222-8222-22222222c001',
    'front_desk'
  ),
  '42501'
);
select pg_temp.expect_error(
  'owner cannot assign a center from another organization',
  format(
    'select public.assign_member_to_center(%L::uuid, %L::uuid, %L)',
    current_setting('phase4.center_manager_b1_member'),
    '11111111-1111-4111-8111-11111111c001',
    'center_manager'
  ),
  '42501'
);
select pg_temp.expect_error(
  'owner cannot deactivate the last owner',
  format(
    'select public.deactivate_organization_member(%L::uuid)',
    current_setting('phase4.owner_b_member')
  ),
  '42501'
);
select pg_temp.expect_error(
  'owner cannot assign the owner through the generic workflow',
  format(
    'select public.assign_member_to_center(%L::uuid, %L::uuid, %L)',
    current_setting('phase4.owner_b_member'),
    '22222222-2222-4222-8222-22222222c001',
    'center_manager'
  ),
  '42501'
);
select pg_temp.expect_error(
  'owner cannot use forged organization metadata',
  format(
    'select public.assign_member_to_center(%L::uuid, %L::uuid, %L, %L::uuid)',
    current_setting('phase4.front_desk_b_member'),
    '22222222-2222-4222-8222-22222222c001',
    'front_desk',
    '11111111-1111-4111-8111-111111111111'
  ),
  '42883'
);
reset role;

select pg_temp.assert_true(
  'cross-tenant and cross-center failures leave the target unchanged',
  (
    select member.garage_id = '22222222-2222-4222-8222-222222222222'
      and member.center_id = '22222222-2222-4222-8222-22222222c001'
      and member.center_role = 'center_manager'
      and member.role = 'admin'
    from public.garage_members member
    where member.id = current_setting('phase4.center_manager_b1_member')::uuid
  )
);

-- Positive owner operations are atomic and rolled back after each assertion.
savepoint owner_assigns_center;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'a0000000-0000-4000-8000-000000000001',
  true
);
select pg_temp.assert_true(
  'owner assigns an allowed center role inside their organization',
  exists (
    select 1
    from public.assign_member_to_center(
      current_setting('phase4.front_desk_a_member')::uuid,
      '11111111-1111-4111-8111-11111111c001',
      'service_advisor'
    ) updated_member
    where updated_member.garage_id = '11111111-1111-4111-8111-111111111111'
      and updated_member.center_id = '11111111-1111-4111-8111-11111111c001'
      and updated_member.center_role = 'service_advisor'
      and updated_member.role = 'advisor'
  )
);
reset role;
rollback to savepoint owner_assigns_center;

savepoint network_admin_assigns_center;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'b0000000-0000-4000-8000-000000000002',
  true
);
select pg_temp.assert_true(
  'network admin assigns an allowed center role inside their organization',
  exists (
    select 1
    from public.assign_member_to_center(
      current_setting('phase4.center_manager_b1_member')::uuid,
      '22222222-2222-4222-8222-22222222c002',
      'technician'
    ) updated_member
    where updated_member.garage_id = '22222222-2222-4222-8222-222222222222'
      and updated_member.center_id = '22222222-2222-4222-8222-22222222c002'
      and updated_member.center_role = 'technician'
      and updated_member.role = 'mechanic'
  )
);
reset role;
rollback to savepoint network_admin_assigns_center;

savepoint owner_promotes_network_admin;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'b0000000-0000-4000-8000-000000000001',
  true
);
select pg_temp.assert_true(
  'owner promotes a member to network admin inside their organization',
  exists (
    select 1
    from public.promote_member_to_network_admin(
      current_setting('phase4.center_manager_b1_member')::uuid
    ) updated_member
    where updated_member.organization_role = 'network_admin'
      and updated_member.role = 'admin'
      and updated_member.center_id is null
      and updated_member.center_role is null
  )
);
reset role;
rollback to savepoint owner_promotes_network_admin;

savepoint owner_deactivates_member;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'b0000000-0000-4000-8000-000000000001',
  true
);
select pg_temp.assert_true(
  'owner deactivates a non-owner member inside their organization',
  exists (
    select 1
    from public.deactivate_organization_member(
      current_setting('phase4.front_desk_b_member')::uuid
    ) updated_member
    where updated_member.status = 'disabled'
  )
);
reset role;
rollback to savepoint owner_deactivates_member;

-- Inactive and unscoped actors are denied even with a valid JWT.
savepoint inactive_actor;
update public.garage_members
set status = 'disabled'
where id = current_setting('phase4.network_admin_b_member')::uuid;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'b0000000-0000-4000-8000-000000000002',
  true
);
select pg_temp.expect_error(
  'inactive network admin cannot mutate a membership',
  format(
    'select public.assign_member_to_center(%L::uuid, %L::uuid, %L)',
    current_setting('phase4.center_manager_b1_member'),
    '22222222-2222-4222-8222-22222222c001',
    'center_manager'
  ),
  '42501'
);
reset role;
rollback to savepoint inactive_actor;

savepoint unscoped_actor;
update public.garage_members
set organization_role = null,
    center_id = null,
    center_role = null
where id = current_setting('phase4.front_desk_a_member')::uuid;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'a0000000-0000-4000-8000-000000000003',
  true
);
select pg_temp.assert_true(
  'active member without explicit scope is not an operational member',
  not public.is_garage_member('11111111-1111-4111-8111-111111111111')
);
select pg_temp.assert_true(
  'active member without explicit scope cannot manage a center',
  not public.can_manage_garage_center(
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-11111111c001'
  )
);
select pg_temp.expect_error(
  'active member without explicit scope cannot post a message',
  format(
    'select public.post_service_request_message(%L::uuid, %L)',
    current_setting('phase4.request_a'),
    'Phase 4A unscoped-member probe'
  ),
  '42501'
);
reset role;
rollback to savepoint unscoped_actor;

-- Direct deletion and platform-role assignment stay unavailable.
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'b0000000-0000-4000-8000-000000000001',
  true
);
select pg_temp.expect_error(
  'owner cannot delete a membership through the Data API',
  format(
    'delete from public.garage_members where id = %L::uuid',
    current_setting('phase4.front_desk_b_member')
  ),
  '42501'
);
select pg_temp.expect_error(
  'owner cannot assign a platform role through the Data API',
  $sql$
    insert into public.garage_members (
      garage_id,
      user_id,
      role,
      status,
      organization_role
    )
    values (
      '22222222-2222-4222-8222-222222222222',
      'c2000000-0000-4000-8000-000000000001',
      'platform_admin',
      'active',
      'network_admin'
    )
  $sql$,
  '42501'
);
reset role;

select pg_temp.assert_true(
  'every organization retains an active explicit owner',
  not exists (
    select 1
    from public.garages garage
    where not exists (
      select 1
      from public.garage_members owner_member
      where owner_member.garage_id = garage.id
        and owner_member.status = 'active'
        and owner_member.role = 'owner'
        and owner_member.organization_role = 'organization_owner'
    )
  )
);
select pg_temp.assert_true(
  'all rejected and rolled-back operations preserve the membership baseline',
  current_setting('phase4.membership_baseline') = (
    select md5(coalesce(string_agg(
      concat_ws(
        '|',
        member.id,
        member.garage_id,
        member.user_id,
        member.role,
        member.status,
        coalesce(member.center_id::text, ''),
        coalesce(member.organization_role, ''),
        coalesce(member.center_role, ''),
        coalesce(member.invited_at::text, ''),
        member.created_at
      ),
      E'\n'
      order by member.id
    ), ''))
    from public.garage_members member
  )
);

rollback;

select 'PHASE4_MEMBERSHIP_SECURITY:36/36';

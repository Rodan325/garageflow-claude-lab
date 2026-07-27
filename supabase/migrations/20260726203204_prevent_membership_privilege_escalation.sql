-- Phase 4A: make organization membership administration server-authoritative.
-- This migration intentionally performs no membership backfill.

do $$
declare
  incompatible_count bigint;
  incompatible_ids text;
  ownerless_count bigint;
  ownerless_ids text;
begin
  select count(*), string_agg(member.id::text, ',' order by member.id)
  into incompatible_count, incompatible_ids
  from public.garage_members member
  where member.status = 'active'
    and (
      (
        member.organization_role is null
        and (member.center_id is null or member.center_role is null)
      )
      or (
        member.organization_role = 'organization_owner'
        and member.role <> 'owner'
      )
      or (
        member.organization_role = 'network_admin'
        and member.role <> 'admin'
      )
      or (
        member.organization_role is null
        and (
          (member.center_role = 'center_manager' and member.role <> 'admin')
          or (member.center_role = 'service_advisor' and member.role <> 'advisor')
          or (member.center_role = 'front_desk' and member.role <> 'front_desk')
          or (member.center_role = 'technician' and member.role <> 'mechanic')
          or member.center_role = 'viewer'
        )
      )
    );

  if incompatible_count > 0 then
    raise exception
      'Phase 4A blocked: % incompatible active membership row(s): %',
      incompatible_count,
      incompatible_ids
      using errcode = '55000';
  end if;

  select count(*), string_agg(garage.id::text, ',' order by garage.id)
  into ownerless_count, ownerless_ids
  from public.garages garage
  where not exists (
    select 1
    from public.garage_members owner_member
    where owner_member.garage_id = garage.id
      and owner_member.status = 'active'
      and owner_member.role = 'owner'
      and owner_member.organization_role = 'organization_owner'
  );

  if ownerless_count > 0 then
    raise exception
      'Phase 4A blocked: % organization without an active explicit owner: %',
      ownerless_count,
      ownerless_ids
      using errcode = '55000';
  end if;
end;
$$;

-- An active membership must have an explicit organization or center scope.
create or replace function public.is_garage_member(p_garage_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.garage_members member
    where member.garage_id = p_garage_id
      and member.user_id = (select auth.uid())
      and member.status = 'active'
      and (
        member.organization_role is not null
        or (
          member.center_id is not null
          and member.center_role is not null
        )
      )
  );
$$;

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
  select exists (
    select 1
    from public.garage_members member
    where member.garage_id = p_garage_id
      and member.user_id = (select auth.uid())
      and member.status = 'active'
      and member.role = any(p_roles)
      and (
        member.organization_role is not null
        or (
          member.center_id is not null
          and member.center_role is not null
        )
      )
  );
$$;

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
  select exists (
    select 1
    from public.garage_members member
    where member.garage_id = p_garage_id
      and member.user_id = (select auth.uid())
      and member.status = 'active'
      and (
        member.organization_role in (
          'organization_owner',
          'network_admin',
          'regional_manager'
        )
        or (
          member.organization_role is null
          and member.center_id = p_center_id
          and member.center_role is not null
        )
      )
  );
$$;

create or replace function public.can_view_network_dashboard(p_garage_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.garage_members member
    where member.garage_id = p_garage_id
      and member.user_id = (select auth.uid())
      and member.status = 'active'
      and member.organization_role in (
        'organization_owner',
        'network_admin',
        'regional_manager'
      )
      and 1 < (
        select count(*)
        from public.garage_centers center
        where center.garage_id = p_garage_id
          and center.is_active
      )
  );
$$;

revoke all on function public.is_garage_member(uuid)
  from public, anon, authenticated;
revoke all on function public.has_garage_role(uuid, text[])
  from public, anon, authenticated;
revoke all on function public.can_manage_garage_center(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.can_view_network_dashboard(uuid)
  from public, anon, authenticated;

grant execute on function public.is_garage_member(uuid) to authenticated;
grant execute on function public.has_garage_role(uuid, text[]) to authenticated;
grant execute on function public.can_manage_garage_center(uuid, uuid)
  to authenticated;
grant execute on function public.can_view_network_dashboard(uuid)
  to authenticated;

-- Public catalog policies must not invoke authenticated-only authorization
-- helpers. Separate anonymous visibility from authenticated member visibility.
alter policy garages_select_public on public.garages
  to anon
  using (is_public = true);
drop policy if exists garages_select_authenticated on public.garages;
create policy garages_select_authenticated on public.garages
  for select to authenticated
  using (is_public = true or public.is_garage_member(id));

alter policy centers_select on public.garage_centers
  to anon
  using (is_active = true);
drop policy if exists centers_select_authenticated on public.garage_centers;
create policy centers_select_authenticated on public.garage_centers
  for select to authenticated
  using (is_active = true or public.is_garage_member(garage_id));

alter policy services_select on public.garage_services
  to anon
  using (is_active = true);
drop policy if exists services_select_authenticated on public.garage_services;
create policy services_select_authenticated on public.garage_services
  for select to authenticated
  using (is_active = true or public.is_garage_member(garage_id));

alter policy news_select on public.garage_news
  to anon
  using (is_published = true);
drop policy if exists news_select_authenticated on public.garage_news;
create policy news_select_authenticated on public.garage_news
  for select to authenticated
  using (is_published = true or public.is_garage_member(garage_id));

-- Unscoped memberships no longer make the organization directory visible.
alter policy profiles_select on public.profiles
  using (
    id = (select auth.uid())
    or exists (
      select 1
      from public.garage_members actor_member
      join public.garage_members visible_member
        on actor_member.garage_id = visible_member.garage_id
      where actor_member.user_id = (select auth.uid())
        and actor_member.status = 'active'
        and (
          actor_member.organization_role is not null
          or (
            actor_member.center_id is not null
            and actor_member.center_role is not null
          )
        )
        and visible_member.user_id = profiles.id
    )
  );

drop policy if exists members_manage_admin on public.garage_members;
revoke insert, update, delete on table public.garage_members
  from public, anon, authenticated;

-- All membership rows for one organization are locked in UUID order. This
-- serializes role and status changes and removes last-owner race windows.
create or replace function private.resolve_membership_management_context(
  p_target_member_id uuid
)
returns table (
  actor_member_id uuid,
  actor_authority text,
  target_member_id uuid,
  target_garage_id uuid,
  target_user_id uuid,
  target_legacy_role text,
  target_status text,
  target_organization_role text,
  target_center_id uuid,
  target_center_role text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  target_garage uuid;
  actor_row public.garage_members%rowtype;
  target_row public.garage_members%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication is required'
      using errcode = '42501';
  end if;

  select target.garage_id
  into target_garage
  from public.garage_members target
  where target.id = p_target_member_id;

  if target_garage is null then
    raise exception 'Membership not found'
      using errcode = 'P0002';
  end if;

  perform 1
  from public.garage_members locked_member
  where locked_member.garage_id = target_garage
  order by locked_member.id
  for update;

  select target.*
  into strict target_row
  from public.garage_members target
  where target.id = p_target_member_id
    and target.garage_id = target_garage;

  select actor.*
  into actor_row
  from public.garage_members actor
  where actor.garage_id = target_garage
    and actor.user_id = current_user_id;

  if actor_row.id is null
    or actor_row.status <> 'active'
  then
    raise exception 'Active organization membership is required'
      using errcode = '42501';
  end if;

  if actor_row.organization_role = 'organization_owner'
    and actor_row.role = 'owner'
  then
    actor_authority := 'organization_owner';
  elsif actor_row.organization_role = 'network_admin'
    and actor_row.role = 'admin'
  then
    actor_authority := 'network_admin';
  else
    raise exception 'Organization membership management is forbidden'
      using errcode = '42501';
  end if;

  if actor_row.id = target_row.id
    or actor_row.user_id = target_row.user_id
  then
    raise exception 'Self membership changes are forbidden'
      using errcode = '42501';
  end if;

  if target_row.organization_role is null then
    if target_row.center_id is null or target_row.center_role is null then
      raise exception 'Membership scope is missing or inconsistent'
        using errcode = '55000';
    end if;

    if (
      target_row.center_role = 'center_manager'
      and target_row.role <> 'admin'
    ) or (
      target_row.center_role = 'service_advisor'
      and target_row.role <> 'advisor'
    ) or (
      target_row.center_role = 'front_desk'
      and target_row.role <> 'front_desk'
    ) or (
      target_row.center_role = 'technician'
      and target_row.role <> 'mechanic'
    ) or target_row.center_role = 'viewer' then
      raise exception 'Membership scope is missing or inconsistent'
        using errcode = '55000';
    end if;
  elsif (
    target_row.organization_role = 'organization_owner'
    and target_row.role <> 'owner'
  ) or (
    target_row.organization_role = 'network_admin'
    and target_row.role <> 'admin'
  ) or (
    target_row.organization_role <> 'organization_owner'
    and target_row.center_role is not null
  ) then
    raise exception 'Membership scope is missing or inconsistent'
      using errcode = '55000';
  end if;

  actor_member_id := actor_row.id;
  target_member_id := target_row.id;
  target_garage_id := target_row.garage_id;
  target_user_id := target_row.user_id;
  target_legacy_role := target_row.role;
  target_status := target_row.status;
  target_organization_role := target_row.organization_role;
  target_center_id := target_row.center_id;
  target_center_role := target_row.center_role;
  return next;
end;
$$;

revoke all on function private.resolve_membership_management_context(uuid)
  from public, anon, authenticated;

create or replace function public.promote_member_to_network_admin(
  p_target_member_id uuid
)
returns public.garage_members
language plpgsql
security definer
set search_path = ''
as $$
declare
  management record;
  updated_member public.garage_members%rowtype;
begin
  select *
  into strict management
  from private.resolve_membership_management_context(p_target_member_id);

  if management.actor_authority <> 'organization_owner' then
    raise exception 'Only an organization owner can promote a network administrator'
      using errcode = '42501';
  end if;

  if management.target_organization_role = 'organization_owner'
    or management.target_legacy_role = 'owner'
  then
    raise exception 'Owner membership changes require the dedicated ownership workflow'
      using errcode = '42501';
  end if;

  if management.target_status <> 'active' then
    raise exception 'Only an active membership can be promoted'
      using errcode = '55000';
  end if;

  update public.garage_members
  set role = 'admin',
      organization_role = 'network_admin',
      center_id = null,
      center_role = null
  where id = management.target_member_id
    and garage_id = management.target_garage_id
  returning * into strict updated_member;

  return updated_member;
end;
$$;

create or replace function public.assign_member_to_center(
  p_target_member_id uuid,
  p_center_id uuid,
  p_center_role text
)
returns public.garage_members
language plpgsql
security definer
set search_path = ''
as $$
declare
  management record;
  legacy_role text;
  updated_member public.garage_members%rowtype;
begin
  if p_center_role not in (
    'center_manager',
    'service_advisor',
    'front_desk',
    'technician'
  ) then
    raise exception 'Unsupported center role'
      using errcode = '22023';
  end if;

  select *
  into strict management
  from private.resolve_membership_management_context(p_target_member_id);

  if management.target_organization_role = 'organization_owner'
    or management.target_legacy_role = 'owner'
  then
    raise exception 'Owner membership changes require the dedicated ownership workflow'
      using errcode = '42501';
  end if;

  if management.actor_authority = 'network_admin'
    and management.target_organization_role = 'network_admin'
  then
    raise exception 'A network administrator cannot change an equal role'
      using errcode = '42501';
  end if;

  if management.target_status <> 'active' then
    raise exception 'Only an active membership can be reassigned'
      using errcode = '55000';
  end if;

  perform 1
  from public.garage_centers center_row
  where center_row.id = p_center_id
    and center_row.garage_id = management.target_garage_id
    and center_row.is_active
  for share;

  if not found then
    raise exception 'Active center not found in the target organization'
      using errcode = '42501';
  end if;

  legacy_role := case p_center_role
    when 'center_manager' then 'admin'
    when 'service_advisor' then 'advisor'
    when 'front_desk' then 'front_desk'
    when 'technician' then 'mechanic'
  end;

  update public.garage_members
  set role = legacy_role,
      organization_role = null,
      center_id = p_center_id,
      center_role = p_center_role
  where id = management.target_member_id
    and garage_id = management.target_garage_id
  returning * into strict updated_member;

  return updated_member;
end;
$$;

create or replace function public.deactivate_organization_member(
  p_target_member_id uuid
)
returns public.garage_members
language plpgsql
security definer
set search_path = ''
as $$
declare
  management record;
  updated_member public.garage_members%rowtype;
begin
  select *
  into strict management
  from private.resolve_membership_management_context(p_target_member_id);

  if management.target_organization_role = 'organization_owner'
    or management.target_legacy_role = 'owner'
  then
    raise exception 'Owner membership changes require the dedicated ownership workflow'
      using errcode = '42501';
  end if;

  if management.actor_authority = 'network_admin'
    and management.target_organization_role = 'network_admin'
  then
    raise exception 'A network administrator cannot deactivate an equal role'
      using errcode = '42501';
  end if;

  if management.target_status <> 'active' then
    raise exception 'Only an active membership can be deactivated'
      using errcode = '55000';
  end if;

  update public.garage_members
  set status = 'disabled'
  where id = management.target_member_id
    and garage_id = management.target_garage_id
  returning * into strict updated_member;

  return updated_member;
end;
$$;

revoke all on function public.promote_member_to_network_admin(uuid)
  from public, anon, authenticated;
revoke all on function public.assign_member_to_center(uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.deactivate_organization_member(uuid)
  from public, anon, authenticated;

grant execute on function public.promote_member_to_network_admin(uuid)
  to authenticated;
grant execute on function public.assign_member_to_center(uuid, uuid, text)
  to authenticated;
grant execute on function public.deactivate_organization_member(uuid)
  to authenticated;

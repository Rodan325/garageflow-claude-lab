create table if not exists public.platform_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  role text not null check (role in ('owner', 'support')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

create or replace function public.is_platform_admin(uid uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.platform_admins pa
    where pa.user_id = uid and pa.status = 'active'
  );
$$;

create or replace function public.is_platform_owner()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.platform_admins pa
    where pa.user_id = auth.uid() and pa.status = 'active' and pa.role = 'owner'
  );
$$;

revoke all on function public.is_platform_admin(uuid) from public;
revoke all on function public.is_platform_owner() from public;
grant execute on function public.is_platform_admin(uuid) to authenticated;
grant execute on function public.is_platform_owner() to authenticated;

drop policy if exists platform_admins_select on public.platform_admins;
create policy platform_admins_select on public.platform_admins
  for select to authenticated
  using (user_id = auth.uid() or public.is_platform_owner());

drop policy if exists garages_select_platform_admin on public.garages;
create policy garages_select_platform_admin on public.garages
  for select to authenticated using (public.is_platform_admin());

drop policy if exists members_select_platform_admin on public.garage_members;
create policy members_select_platform_admin on public.garage_members
  for select to authenticated using (public.is_platform_admin());

drop policy if exists profiles_select_platform_admin on public.profiles;
create policy profiles_select_platform_admin on public.profiles
  for select to authenticated using (public.is_platform_admin());

drop policy if exists legal_acceptances_select_platform_admin on public.legal_acceptances;
create policy legal_acceptances_select_platform_admin on public.legal_acceptances
  for select to authenticated using (public.is_platform_admin());

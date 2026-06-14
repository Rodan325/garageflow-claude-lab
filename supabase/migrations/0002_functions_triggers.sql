-- =====================================================================
-- GarageFlow C — 0002 functions & triggers
-- Security-definer helpers (used by RLS) + integrity triggers.
-- =====================================================================

-- updated_at maintenance
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_vehicles_updated before update on public.vehicles
  for each row execute function public.set_updated_at();
create trigger trg_repairs_updated before update on public.repairs
  for each row execute function public.set_updated_at();
create trigger trg_requests_updated before update on public.service_requests
  for each row execute function public.set_updated_at();

-- Membership helpers. SECURITY DEFINER so they read garage_members without
-- triggering RLS (prevents recursion when used inside policies).
create or replace function public.is_garage_member(p_garage_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.garage_members gm
    where gm.garage_id = p_garage_id
      and gm.user_id = auth.uid()
      and gm.status = 'active'
  );
$$;

create or replace function public.has_garage_role(p_garage_id uuid, p_roles text[])
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.garage_members gm
    where gm.garage_id = p_garage_id
      and gm.user_id = auth.uid()
      and gm.status = 'active'
      and gm.role = any(p_roles)
  );
$$;

revoke all on function public.is_garage_member(uuid) from public;
revoke all on function public.has_garage_role(uuid, text[]) from public;
grant execute on function public.is_garage_member(uuid) to authenticated;
grant execute on function public.has_garage_role(uuid, text[]) to authenticated;

-- Auto-provision profile (+ client_profile) on signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_type text := coalesce(nullif(new.raw_user_meta_data->>'account_type',''), 'client');
begin
  insert into public.profiles (id, full_name, phone, account_type)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'full_name',''),
    nullif(new.raw_user_meta_data->>'phone',''),
    v_type
  )
  on conflict (id) do nothing;

  if v_type = 'client' then
    insert into public.client_profiles (id) values (new.id) on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Status-transition guard for service_requests (defense in depth on top of RLS).
-- The garage and the client may only perform their own legal transitions.
create or replace function public.guard_request_transition()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  is_member boolean := public.is_garage_member(new.garage_id);
  is_owner_client boolean := (new.client_id = auth.uid());
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if is_member then
      if not (
        (old.status = 'pending' and new.status in ('accepted','declined','reschedule_proposed','cancelled')) or
        (old.status = 'reschedule_proposed' and new.status in ('declined','accepted','cancelled')) or
        (old.status in ('accepted','confirmed') and new.status in ('confirmed','completed','cancelled'))
      ) then
        raise exception 'Transition non autorisée (garage): % -> %', old.status, new.status;
      end if;
    elsif is_owner_client then
      if not (
        (old.status = 'reschedule_proposed' and new.status in ('confirmed','cancelled')) or
        (old.status = 'accepted' and new.status in ('confirmed','cancelled')) or
        (old.status in ('pending','reschedule_proposed','accepted') and new.status = 'cancelled')
      ) then
        raise exception 'Transition non autorisée (client): % -> %', old.status, new.status;
      end if;
    else
      raise exception 'Accès non autorisé à cette demande';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_request_transition on public.service_requests;
create trigger trg_guard_request_transition
  before update on public.service_requests
  for each row execute function public.guard_request_transition();

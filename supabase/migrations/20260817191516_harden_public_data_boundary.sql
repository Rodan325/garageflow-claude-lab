begin;

-- Public discovery and professional management share the Data API roles but
-- not the same projection. Direct table reads stay minimized; full management
-- rows are available only through server-authoritative RPCs.
create or replace function public.is_public_catalog_garage(p_garage_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.garages garage
    where garage.id = p_garage_id
      and garage.is_public
  );
$$;

alter function public.is_public_catalog_garage(uuid) owner to postgres;
revoke all on function public.is_public_catalog_garage(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.is_public_catalog_garage(uuid) to anon;

-- Remove table-wide and historical column grants before exposing the exact
-- public/client projection. Staff obtain internal rows through the RPCs below.
revoke select on table
  public.garages,
  public.garage_centers,
  public.garage_services,
  public.garage_hours,
  public.garage_news
from public, anon, authenticated;

revoke select (
  legal_name, siret, vat_number, email, is_public, settings, created_at,
  legal_info
) on table public.garages from public, anon, authenticated;
revoke select (created_at)
  on table public.garage_centers from public, anon, authenticated;
revoke select (created_at, tax_rate, labor_hours, default_lines)
  on table public.garage_services from public, anon, authenticated;
revoke select (is_published, created_at)
  on table public.garage_news from public, anon, authenticated;

grant select (
  id, slug, name, phone, website, address, city, postal_code, country,
  description, specialties, logo_url, accent_color, maps_url
) on table public.garages to anon, authenticated;
grant select (
  id, garage_id, slug, name, address, city, postal_code, phone, is_active,
  sort_order
) on table public.garage_centers to anon, authenticated;
grant select (
  id, garage_id, name, description, category, duration_minutes, price_from,
  price_type, is_active, sort_order
) on table public.garage_services to anon, authenticated;
grant select (
  id, garage_id, weekday, open_time, close_time, is_closed
) on table public.garage_hours to anon, authenticated;
grant select (
  id, garage_id, title, body, image_url, published_at
) on table public.garage_news to anon, authenticated;

-- service_role does not gain a table privilege merely by bypassing RLS.
grant select on table
  public.garages,
  public.garage_centers,
  public.garage_services,
  public.garage_hours,
  public.garage_news
to service_role;

-- Replace every overlapping public/catalog policy. Authenticated professional
-- access retains its canonical membership/capability path, while an ordinary
-- client receives active/published rows only through a garage visible to them.
drop policy if exists centers_select on public.garage_centers;
drop policy if exists centers_select_authenticated on public.garage_centers;
drop policy if exists garage_centers_visible_garage_scope
  on public.garage_centers;
drop policy if exists garage_centers_select_public_boundary
  on public.garage_centers;
drop policy if exists garage_centers_select_authenticated_boundary
  on public.garage_centers;
create policy garage_centers_select_public_boundary
  on public.garage_centers
  for select to anon
  using (
    is_active
    and public.is_public_catalog_garage(garage_id)
  );
create policy garage_centers_select_authenticated_boundary
  on public.garage_centers
  for select to authenticated
  using (
    public.is_garage_member(garage_id)
    or (
      is_active
      and exists (
        select 1
        from public.garages garage
        where garage.id = garage_centers.garage_id
      )
    )
  );

drop policy if exists services_select on public.garage_services;
drop policy if exists garage_services_select_capability
  on public.garage_services;
drop policy if exists garage_services_visible_garage_scope
  on public.garage_services;
drop policy if exists garage_services_select_public_boundary
  on public.garage_services;
drop policy if exists garage_services_select_authenticated_boundary
  on public.garage_services;
create policy garage_services_select_public_boundary
  on public.garage_services
  for select to anon
  using (
    is_active
    and public.is_public_catalog_garage(garage_id)
  );
create policy garage_services_select_authenticated_boundary
  on public.garage_services
  for select to authenticated
  using (
    public.has_core_capability(
      garage_id,
      null,
      'garage_services.select'
    )
    or (
      is_active
      and exists (
        select 1
        from public.garages garage
        where garage.id = garage_services.garage_id
      )
    )
  );

drop policy if exists news_select on public.garage_news;
drop policy if exists news_select_authenticated on public.garage_news;
drop policy if exists garage_news_visible_garage_scope on public.garage_news;
drop policy if exists garage_news_select_public_boundary
  on public.garage_news;
drop policy if exists garage_news_select_authenticated_boundary
  on public.garage_news;
create policy garage_news_select_public_boundary
  on public.garage_news
  for select to anon
  using (
    is_published
    and public.is_public_catalog_garage(garage_id)
  );
create policy garage_news_select_authenticated_boundary
  on public.garage_news
  for select to authenticated
  using (
    public.is_garage_member(garage_id)
    or (
      is_published
      and exists (
        select 1
        from public.garages garage
        where garage.id = garage_news.garage_id
      )
    )
  );

drop policy if exists hours_select on public.garage_hours;
drop policy if exists hours_select_authenticated on public.garage_hours;
drop policy if exists garage_hours_visible_garage_scope
  on public.garage_hours;
drop policy if exists garage_hours_select_public_boundary
  on public.garage_hours;
drop policy if exists garage_hours_select_authenticated_boundary
  on public.garage_hours;
create policy garage_hours_select_public_boundary
  on public.garage_hours
  for select to anon
  using (public.is_public_catalog_garage(garage_id));
create policy garage_hours_select_authenticated_boundary
  on public.garage_hours
  for select to authenticated
  using (
    exists (
      select 1
      from public.garages garage
      where garage.id = garage_hours.garage_id
    )
  );

-- No public catalog policy requires access to private-schema helpers.
revoke usage on schema private from anon;
drop function if exists private.is_public_garage(uuid);

create or replace function public.get_managed_garage(p_garage_id uuid)
returns setof public.garages
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null
     or not public.is_garage_member(p_garage_id)
  then
    raise exception using
      errcode = '42501',
      message = 'garage management access denied';
  end if;

  return query
  select garage.*
  from public.garages garage
  where garage.id = p_garage_id;
end;
$$;

create or replace function public.get_managed_garage_services(p_garage_id uuid)
returns setof public.garage_services
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null
     or not public.has_core_capability(
       p_garage_id,
       null,
       'garage_services.select'
     )
  then
    raise exception using
      errcode = '42501',
      message = 'garage service management access denied';
  end if;

  return query
  select service.*
  from public.garage_services service
  where service.garage_id = p_garage_id;
end;
$$;

alter function public.get_managed_garage(uuid) owner to postgres;
alter function public.get_managed_garage_services(uuid) owner to postgres;

revoke all on function public.get_managed_garage(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.get_managed_garage_services(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.get_managed_garage(uuid) to authenticated;
grant execute on function public.get_managed_garage_services(uuid)
  to authenticated;

commit;

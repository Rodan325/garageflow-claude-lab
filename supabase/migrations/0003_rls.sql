-- =====================================================================
-- GarageFlow C — 0003 Row Level Security
-- Default-deny everywhere. Garage tables scoped by is_garage_member();
-- client tables scoped by auth.uid(); public catalog readable by anon.
-- =====================================================================
alter table public.garages enable row level security;
alter table public.profiles enable row level security;
alter table public.garage_members enable row level security;
alter table public.client_profiles enable row level security;
alter table public.customers enable row level security;
alter table public.vehicles enable row level security;
alter table public.client_vehicles enable row level security;
alter table public.garage_services enable row level security;
alter table public.garage_news enable row level security;
alter table public.garage_hours enable row level security;
alter table public.service_requests enable row level security;
alter table public.service_request_messages enable row level security;
alter table public.appointments enable row level security;
alter table public.repairs enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_lines enable row level security;
alter table public.documents enable row level security;
alter table public.tasks enable row level security;
alter table public.consents enable row level security;
alter table public.audit_logs enable row level security;

-- ===== garages: public directory read; admins edit their own =====
create policy garages_select_public on public.garages
  for select to anon, authenticated
  using (is_public = true or public.is_garage_member(id));
create policy garages_update_admin on public.garages
  for update to authenticated
  using (public.has_garage_role(id, array['owner','admin']))
  with check (public.has_garage_role(id, array['owner','admin']));

-- ===== profiles: self + colleagues sharing a garage =====
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from public.garage_members gm1
      join public.garage_members gm2 on gm1.garage_id = gm2.garage_id
      where gm1.user_id = auth.uid() and gm1.status = 'active'
        and gm2.user_id = profiles.id
    )
  );
create policy profiles_insert_self on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy profiles_update_self on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ===== garage_members: members see their garage; admins manage =====
create policy members_select on public.garage_members
  for select to authenticated
  using (user_id = auth.uid() or public.is_garage_member(garage_id));
create policy members_manage_admin on public.garage_members
  for all to authenticated
  using (public.has_garage_role(garage_id, array['owner','admin']))
  with check (public.has_garage_role(garage_id, array['owner','admin']));

-- ===== client_profiles: strictly self =====
create policy client_profiles_self on public.client_profiles
  for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ===== customers / vehicles: garage members only =====
create policy customers_rw on public.customers
  for all to authenticated
  using (public.is_garage_member(garage_id)) with check (public.is_garage_member(garage_id));
create policy vehicles_rw on public.vehicles
  for all to authenticated
  using (public.is_garage_member(garage_id)) with check (public.is_garage_member(garage_id));

-- ===== client_vehicles: strictly the owner =====
create policy client_vehicles_self on public.client_vehicles
  for all to authenticated using (client_id = auth.uid()) with check (client_id = auth.uid());

-- ===== catalog/content: public read of active/published; staff manage =====
create policy services_select on public.garage_services
  for select to anon, authenticated
  using (is_active = true or public.is_garage_member(garage_id));
create policy services_manage on public.garage_services
  for all to authenticated
  using (public.has_garage_role(garage_id, array['owner','admin','advisor','front_desk']))
  with check (public.has_garage_role(garage_id, array['owner','admin','advisor','front_desk']));

create policy news_select on public.garage_news
  for select to anon, authenticated
  using (is_published = true or public.is_garage_member(garage_id));
create policy news_manage on public.garage_news
  for all to authenticated
  using (public.has_garage_role(garage_id, array['owner','admin','advisor','front_desk']))
  with check (public.has_garage_role(garage_id, array['owner','admin','advisor','front_desk']));

create policy hours_select on public.garage_hours
  for select to anon, authenticated using (true);
create policy hours_manage on public.garage_hours
  for all to authenticated
  using (public.has_garage_role(garage_id, array['owner','admin','front_desk']))
  with check (public.has_garage_role(garage_id, array['owner','admin','front_desk']));

-- ===== service_requests: the client/garage boundary =====
create policy requests_select on public.service_requests
  for select to authenticated
  using (client_id = auth.uid() or public.is_garage_member(garage_id));
create policy requests_insert_client on public.service_requests
  for insert to authenticated
  with check (client_id = auth.uid());
create policy requests_update on public.service_requests
  for update to authenticated
  using (client_id = auth.uid() or public.is_garage_member(garage_id))
  with check (client_id = auth.uid() or public.is_garage_member(garage_id));

-- ===== service_request_messages =====
create policy req_messages_select on public.service_request_messages
  for select to authenticated
  using (
    public.is_garage_member(garage_id)
    or exists (select 1 from public.service_requests sr where sr.id = request_id and sr.client_id = auth.uid())
  );
create policy req_messages_insert on public.service_request_messages
  for insert to authenticated
  with check (
    (sender = 'garage' and public.is_garage_member(garage_id) and author_id = auth.uid())
    or (sender = 'client' and author_id = auth.uid()
        and exists (select 1 from public.service_requests sr where sr.id = request_id and sr.client_id = auth.uid()))
  );

-- ===== operations: garage members only =====
create policy appointments_rw on public.appointments
  for all to authenticated using (public.is_garage_member(garage_id)) with check (public.is_garage_member(garage_id));
create policy repairs_rw on public.repairs
  for all to authenticated using (public.is_garage_member(garage_id)) with check (public.is_garage_member(garage_id));
create policy quotes_rw on public.quotes
  for all to authenticated using (public.is_garage_member(garage_id)) with check (public.is_garage_member(garage_id));
create policy quote_lines_rw on public.quote_lines
  for all to authenticated
  using (exists (select 1 from public.quotes q where q.id = quote_id and public.is_garage_member(q.garage_id)))
  with check (exists (select 1 from public.quotes q where q.id = quote_id and public.is_garage_member(q.garage_id)));
create policy documents_rw on public.documents
  for all to authenticated using (public.is_garage_member(garage_id)) with check (public.is_garage_member(garage_id));
create policy tasks_rw on public.tasks
  for all to authenticated using (public.is_garage_member(garage_id)) with check (public.is_garage_member(garage_id));

-- ===== consents: self =====
create policy consents_self on public.consents
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===== audit_logs: admins read; members append =====
create policy audit_select_admin on public.audit_logs
  for select to authenticated using (public.has_garage_role(garage_id, array['owner','admin']));
create policy audit_insert_member on public.audit_logs
  for insert to authenticated with check (garage_id is null or public.is_garage_member(garage_id));

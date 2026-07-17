-- Keep organization logos public for public pages, quotes, and generated PDFs,
-- while restricting every write to an owner/admin and a canonical logo path.
update storage.buckets
set public = true,
    file_size_limit = 2097152,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
where id = 'garage-logos';

alter policy garage_logos_member_insert on storage.objects
  to authenticated
  with check (
    bucket_id = 'garage-logos'
    and case
      when name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/logo\.(png|jpe?g|webp)$'
        then public.has_garage_role(
          split_part(name, '/', 1)::uuid,
          array['owner', 'admin']::text[]
        )
      else false
    end
  );

alter policy garage_logos_member_update on storage.objects
  to authenticated
  using (
    bucket_id = 'garage-logos'
    and case
      when name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/logo\.(png|jpe?g|webp)$'
        then public.has_garage_role(
          split_part(name, '/', 1)::uuid,
          array['owner', 'admin']::text[]
        )
      else false
    end
  )
  with check (
    bucket_id = 'garage-logos'
    and case
      when name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/logo\.(png|jpe?g|webp)$'
        then public.has_garage_role(
          split_part(name, '/', 1)::uuid,
          array['owner', 'admin']::text[]
        )
      else false
    end
  );

alter policy garage_logos_member_delete on storage.objects
  to authenticated
  using (
    bucket_id = 'garage-logos'
    and case
      when name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/logo\.(png|jpe?g|webp)$'
        then public.has_garage_role(
          split_part(name, '/', 1)::uuid,
          array['owner', 'admin']::text[]
        )
      else false
    end
  );

create policy garage_logos_manager_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'garage-logos'
    and case
      when name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/logo\.(png|jpe?g|webp)$'
        then public.has_garage_role(
          split_part(name, '/', 1)::uuid,
          array['owner', 'admin']::text[]
        )
      else false
    end
  );

-- This maintenance RPC is server-only: it updates every garage's expired quotes.
revoke execute on function public.expire_quotes() from public, anon, authenticated;
grant execute on function public.expire_quotes() to service_role;

-- Cover every public foreign key so deletes and joins do not require full scans.
create index if not exists idx_appointments_assigned_to on public.appointments (assigned_to);
create index if not exists idx_appointments_customer_id on public.appointments (customer_id);
create index if not exists idx_appointments_service_request_id on public.appointments (service_request_id);
create index if not exists idx_appointments_vehicle_id on public.appointments (vehicle_id);
create index if not exists idx_audit_logs_actor_id on public.audit_logs (actor_id);
create index if not exists idx_client_profiles_default_garage_id on public.client_profiles (default_garage_id);
create index if not exists idx_client_vehicle_shares_service_request_id on public.client_vehicle_shares (service_request_id);
create index if not exists idx_client_vehicle_shares_shared_by on public.client_vehicle_shares (shared_by);
create index if not exists idx_consents_garage_id on public.consents (garage_id);
create index if not exists idx_consents_user_id on public.consents (user_id);
create index if not exists idx_customers_linked_user_id on public.customers (linked_user_id);
create index if not exists idx_documents_customer_id on public.documents (customer_id);
create index if not exists idx_documents_garage_id on public.documents (garage_id);
create index if not exists idx_documents_vehicle_id on public.documents (vehicle_id);
create index if not exists idx_quotes_customer_id on public.quotes (customer_id);
create index if not exists idx_quotes_repair_id on public.quotes (repair_id);
create index if not exists idx_quotes_revised_from on public.quotes (revised_from);
create index if not exists idx_quotes_service_request_id on public.quotes (service_request_id);
create index if not exists idx_quotes_vehicle_id on public.quotes (vehicle_id);
create index if not exists idx_repairs_appointment_id on public.repairs (appointment_id);
create index if not exists idx_repairs_assigned_to on public.repairs (assigned_to);
create index if not exists idx_repairs_customer_id on public.repairs (customer_id);
create index if not exists idx_repairs_vehicle_id on public.repairs (vehicle_id);
create index if not exists idx_service_request_messages_author_id on public.service_request_messages (author_id);
create index if not exists idx_service_request_messages_garage_id on public.service_request_messages (garage_id);
create index if not exists idx_service_requests_appointment_id on public.service_requests (appointment_id);
create index if not exists idx_service_requests_client_vehicle_id on public.service_requests (client_vehicle_id);
create index if not exists idx_service_requests_customer_id on public.service_requests (customer_id);
create index if not exists idx_service_requests_service_id on public.service_requests (service_id);
create index if not exists idx_tasks_assigned_to on public.tasks (assigned_to);
create index if not exists idx_tasks_related_vehicle_id on public.tasks (related_vehicle_id);
create index if not exists idx_vehicles_customer_id on public.vehicles (customer_id);

-- Evaluate auth.uid() once per statement instead of once per candidate row.
alter policy profiles_select on public.profiles
  using (
    id = (select auth.uid())
    or exists (
      select 1
      from public.garage_members gm1
      join public.garage_members gm2 on gm1.garage_id = gm2.garage_id
      where gm1.user_id = (select auth.uid())
        and gm1.status = 'active'
        and gm2.user_id = profiles.id
    )
  );

alter policy profiles_insert_self on public.profiles
  with check (id = (select auth.uid()));

alter policy profiles_update_self on public.profiles
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

alter policy members_select on public.garage_members
  using (user_id = (select auth.uid()) or public.is_garage_member(garage_id));

alter policy client_profiles_self on public.client_profiles
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

alter policy client_vehicles_self on public.client_vehicles
  using (client_id = (select auth.uid()))
  with check (client_id = (select auth.uid()));

alter policy requests_select on public.service_requests
  using (client_id = (select auth.uid()) or public.is_garage_member(garage_id));

alter policy requests_insert_client on public.service_requests
  with check (client_id = (select auth.uid()));

alter policy requests_update on public.service_requests
  using (client_id = (select auth.uid()) or public.is_garage_member(garage_id))
  with check (client_id = (select auth.uid()) or public.is_garage_member(garage_id));

alter policy req_messages_select on public.service_request_messages
  using (
    public.is_garage_member(garage_id)
    or exists (
      select 1 from public.service_requests request
      where request.id = service_request_messages.request_id
        and request.client_id = (select auth.uid())
    )
  );

alter policy req_messages_insert on public.service_request_messages
  with check (
    (
      sender = 'garage'
      and public.is_garage_member(garage_id)
      and author_id = (select auth.uid())
    )
    or (
      sender = 'client'
      and author_id = (select auth.uid())
      and exists (
        select 1 from public.service_requests request
        where request.id = service_request_messages.request_id
          and request.client_id = (select auth.uid())
      )
    )
  );

alter policy consents_self on public.consents
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter policy cvs_client on public.client_vehicle_shares
  using (shared_by = (select auth.uid()))
  with check (
    shared_by = (select auth.uid())
    and exists (
      select 1 from public.client_vehicles vehicle
      where vehicle.id = client_vehicle_shares.client_vehicle_id
        and vehicle.client_id = (select auth.uid())
    )
  );

alter policy "Users can read own legal acceptances" on public.legal_acceptances
  using (user_id = (select auth.uid()));

alter policy "Users can insert own legal acceptances" on public.legal_acceptances
  with check (user_id = (select auth.uid()));

alter policy platform_admins_select on public.platform_admins
  using (user_id = (select auth.uid()) or public.is_platform_owner());

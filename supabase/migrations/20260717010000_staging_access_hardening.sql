-- Staging validation hardening.
--
-- Supabase's historical default table privileges left anon/authenticated with
-- verbs that were broader than the grants intentionally documented in the
-- capability migrations. RLS denied those operations, but Data API grants
-- should still follow least privilege. This migration is additive and does
-- not alter or remove application data.

-- A signed-in client may resolve their configured organization even when the
-- organization is not part of the public booking directory.
create policy garages_select_client_default
  on public.garages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.client_profiles client
      where client.id = (select auth.uid())
        and client.default_garage_id = garages.id
    )
  );

-- Active catalog rows remain publicly readable only when their parent garage
-- is visible to the caller. Existing permissive policies still enforce the
-- active/published checks; these restrictive policies add tenant scope.
create policy garage_centers_visible_garage_scope
  on public.garage_centers
  as restrictive
  for select
  to anon, authenticated
  using (
    exists (select 1 from public.garages garage where garage.id = garage_centers.garage_id)
  );

create policy garage_services_visible_garage_scope
  on public.garage_services
  as restrictive
  for select
  to anon, authenticated
  using (
    exists (select 1 from public.garages garage where garage.id = garage_services.garage_id)
  );

create policy garage_news_visible_garage_scope
  on public.garage_news
  as restrictive
  for select
  to anon, authenticated
  using (
    exists (select 1 from public.garages garage where garage.id = garage_news.garage_id)
  );

create policy garage_hours_visible_garage_scope
  on public.garage_hours
  as restrictive
  for select
  to anon, authenticated
  using (
    exists (select 1 from public.garages garage where garage.id = garage_hours.garage_id)
  );

-- Reset Data API table privileges, then reproduce the exact verbs required by
-- the existing RLS policies. In particular, anon receives no write privilege.
revoke all privileges on all tables in schema public from anon, authenticated;

grant select on public.garages, public.garage_services, public.garage_news,
  public.garage_hours, public.garage_centers to anon, authenticated;

grant update on public.garages to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.garage_members to authenticated;
grant select, insert, update, delete on public.client_profiles to authenticated;
grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.vehicles to authenticated;
grant select, insert, update, delete on public.client_vehicles to authenticated;
grant select, insert, update, delete on public.client_vehicle_shares to authenticated;
grant insert, update, delete on public.garage_services to authenticated;
grant insert, update, delete on public.garage_news to authenticated;
grant insert, update, delete on public.garage_hours to authenticated;
grant insert, update, delete on public.garage_centers to authenticated;
grant select, insert, update, delete on public.service_requests to authenticated;
grant select, insert on public.service_request_messages to authenticated;
grant select, insert, update, delete on public.appointments to authenticated;
grant select, insert, update, delete on public.repairs to authenticated;
grant select, insert, update, delete on public.quotes to authenticated;
grant select, insert, update, delete on public.quote_lines to authenticated;
grant select, insert, update, delete on public.documents to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.consents to authenticated;
grant select, insert on public.audit_logs to authenticated;
grant select on public.quote_counters, public.platform_admins to authenticated;
grant select, insert on public.legal_acceptances to authenticated;
grant select on public.workshop_recommendations, public.recommendation_decisions,
  public.service_request_attachments, public.notification_outbox,
  public.delivery_reports, public.maintenance_reminders,
  public.service_request_transfers, public.service_request_transfer_events,
  public.integration_connections, public.external_entity_references
  to authenticated;

-- Trigger-only functions must never be exposed as Data API RPCs. Platform
-- helper functions are authenticated-only; public quote RPCs remain unchanged.
revoke all on function public.guard_quote_transition() from public, anon, authenticated;
revoke all on function public.share_vehicle_on_request() from public, anon, authenticated;
revoke all on function public.prevent_transfer_event_mutation() from public, anon, authenticated;
revoke all on function public.is_platform_admin(uuid) from public, anon, authenticated;
revoke all on function public.is_platform_owner() from public, anon, authenticated;
grant execute on function public.is_platform_admin(uuid) to authenticated;
grant execute on function public.is_platform_owner() to authenticated;

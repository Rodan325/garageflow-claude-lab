-- =====================================================================
-- GarageFlow C — 0020 allow a garage member to delete a request of its inbox
-- Until now no DELETE policy existed on service_requests, so a request could
-- never be removed via the anon key (only cancelled). A garage removing a
-- spam/test/duplicate request from ITS OWN inbox is a sensible capability and
-- lets the RLS test clean up after itself without any service_role key.
-- Dependents are safe: messages CASCADE ; appointments / quotes /
-- client_vehicle_shares reference with ON DELETE SET NULL.
-- =====================================================================
drop policy if exists requests_delete_member on public.service_requests;
create policy requests_delete_member on public.service_requests
  for delete to authenticated
  using (public.is_garage_member(garage_id));

-- =====================================================================
-- GarageFlow C — 0019 a vehicle share can only be created by the OWNER
-- Hardening: 0017's `cvs_client` policy checked only `shared_by = auth.uid()`.
-- That let ANY authenticated user (incl. a garage member) insert a share row
-- with shared_by = themselves for an arbitrary client_vehicle_id — self-granting
-- their garage read access to a vehicle they don't own. We now also require the
-- vehicle to belong to the sharer. The SECURITY DEFINER trigger already enforced
-- ownership; this closes the direct-insert path.
-- =====================================================================
drop policy if exists cvs_client on public.client_vehicle_shares;
create policy cvs_client on public.client_vehicle_shares
  for all to authenticated
  using (shared_by = auth.uid())
  with check (
    shared_by = auth.uid()
    and exists (
      select 1 from public.client_vehicles v
      where v.id = client_vehicle_id and v.client_id = auth.uid()
    )
  );

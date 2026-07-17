-- =====================================================================
-- GarageFlow C — 0010 tighten logo bucket
-- A public bucket serves objects via their public URL without a SELECT policy.
-- The broad SELECT policy only enabled LISTING the bucket — drop it.
-- Member write policies remain (insert/update/delete scoped to the garage).
-- =====================================================================
drop policy if exists garage_logos_public_read on storage.objects;

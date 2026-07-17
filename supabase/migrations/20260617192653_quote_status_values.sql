-- =====================================================================
-- GarageFlow C — 0015 align quote status values with the life-cycle
-- The 0001 CHECK allowed (draft, sent, accepted, refused). The client
-- accept/decline flow uses `declined` and lazy `expired`. Standardise on
-- draft / sent / accepted / declined / expired (migrating any legacy rows).
-- =====================================================================

update public.quotes set status = 'declined' where status = 'refused';

alter table public.quotes drop constraint if exists quotes_status_check;
alter table public.quotes add constraint quotes_status_check
  check (status = any (array['draft','sent','accepted','declined','expired']));

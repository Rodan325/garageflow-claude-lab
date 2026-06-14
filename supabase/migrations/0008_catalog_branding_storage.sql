-- =====================================================================
-- GarageFlow C — 0008 service catalog enrichment + garage branding + logo storage
-- =====================================================================

-- Service catalog: quoting fields + default quote lines + price type.
alter table public.garage_services
  add column if not exists tax_rate numeric(5,2) not null default 20,
  add column if not exists labor_hours numeric(6,2),
  add column if not exists price_type text not null default 'from' check (price_type in ('from','fixed')),
  add column if not exists default_lines jsonb not null default '[]';

-- Garage branding (logo_url already exists).
alter table public.garages
  add column if not exists accent_color text,
  add column if not exists legal_info text,
  add column if not exists maps_url text;

-- Public bucket for garage logos (shown on the public client page + quotes).
insert into storage.buckets (id, name, public)
values ('garage-logos', 'garage-logos', true)
on conflict (id) do nothing;

-- Public read; only members of the owning garage may write to {garage_id}/...
drop policy if exists garage_logos_public_read on storage.objects;
drop policy if exists garage_logos_member_insert on storage.objects;
drop policy if exists garage_logos_member_update on storage.objects;
drop policy if exists garage_logos_member_delete on storage.objects;

create policy garage_logos_public_read on storage.objects
  for select using (bucket_id = 'garage-logos');
create policy garage_logos_member_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'garage-logos' and public.is_garage_member(((storage.foldername(name))[1])::uuid));
create policy garage_logos_member_update on storage.objects
  for update to authenticated
  using (bucket_id = 'garage-logos' and public.is_garage_member(((storage.foldername(name))[1])::uuid));
create policy garage_logos_member_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'garage-logos' and public.is_garage_member(((storage.foldername(name))[1])::uuid));

-- =====================================================================
-- GarageFlow C — 0011 quote numbering + client snapshot
-- Per-garage, per-year quote sequence (concurrency-safe) + client contact
-- snapshot on the quote so the PDF is correct even without a CRM link.
-- =====================================================================

alter table public.quotes
  add column if not exists client_phone text,
  add column if not exists client_email text;

-- Per-garage / per-year counter.
create table if not exists public.quote_counters (
  garage_id uuid not null references public.garages(id) on delete cascade,
  year int not null,
  last_number int not null default 0,
  primary key (garage_id, year)
);
alter table public.quote_counters enable row level security;

drop policy if exists quote_counters_read on public.quote_counters;
create policy quote_counters_read on public.quote_counters
  for select to authenticated using (public.is_garage_member(garage_id));

-- Atomic next number → "DV-YYYY-NNNN". Single upsert statement = race-safe.
create or replace function public.next_quote_number(p_garage_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_year int := extract(year from now())::int;
  v_num int;
begin
  if not public.is_garage_member(p_garage_id) then
    raise exception 'Acces non autorise';
  end if;
  insert into public.quote_counters (garage_id, year, last_number)
  values (p_garage_id, v_year, 1)
  on conflict (garage_id, year)
  do update set last_number = public.quote_counters.last_number + 1
  returning last_number into v_num;
  return 'DV-' || v_year || '-' || lpad(v_num::text, 4, '0');
end;
$$;

revoke all on function public.next_quote_number(uuid) from public, anon;
grant execute on function public.next_quote_number(uuid) to authenticated;

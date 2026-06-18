-- =====================================================================
-- GarageFlow C — 0014 quote life-cycle: send → accept / decline
-- Adds: sent/accepted/declined timestamps, a non-guessable client token,
-- a "revised_from" link, and tokenised PUBLIC RPCs so a client (even not
-- logged-in) can consult + accept/decline ONE quote via a share link.
-- A draft is the only directly-editable state; accepted is terminal;
-- accept/decline are reserved to the client (enforced by trigger).
-- =====================================================================

alter table public.quotes
  add column if not exists client_token   text,
  add column if not exists sent_at        timestamptz,
  add column if not exists accepted_at    timestamptz,
  add column if not exists declined_at    timestamptz,
  add column if not exists decline_reason text,
  add column if not exists revised_from   uuid references public.quotes(id) on delete set null;

create unique index if not exists quotes_client_token_key on public.quotes(client_token) where client_token is not null;

-- ---------------------------------------------------------------------
-- Transition guard: accept/decline are client-only (set via the tokenised
-- RPC, which flags the session); an accepted quote is terminal.
-- ---------------------------------------------------------------------
create or replace function public.guard_quote_transition()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    if new.status in ('accepted', 'declined')
       and coalesce(current_setting('garageflow.client_quote_action', true), '') <> '1' then
      raise exception 'Acceptation ou refus reserves au client';
    end if;
    if old.status = 'accepted' then
      raise exception 'Devis accepte non modifiable';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_quote_transition on public.quotes;
create trigger trg_guard_quote_transition
  before update on public.quotes
  for each row execute function public.guard_quote_transition();

-- ---------------------------------------------------------------------
-- Garage action: send a draft to the client (mints a share token).
-- ---------------------------------------------------------------------
create or replace function public.send_quote(p_id uuid)
returns public.quotes
language plpgsql security definer set search_path = public as $$
declare v_garage uuid; v_status text; v_lines int; v_quote public.quotes;
begin
  select garage_id, status into v_garage, v_status from public.quotes where id = p_id;
  if v_garage is null or not public.is_garage_member(v_garage) then raise exception 'Acces non autorise'; end if;
  if v_status <> 'draft' then raise exception 'Seul un brouillon peut etre envoye'; end if;
  select count(*) into v_lines from public.quote_lines where quote_id = p_id;
  if v_lines = 0 then raise exception 'Devis vide : ajoutez au moins une ligne'; end if;

  update public.quotes set
    status = 'sent',
    sent_at = now(),
    client_token = coalesce(client_token,
      replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''))
  where id = p_id
  returning * into v_quote;
  return v_quote;
end;
$$;

-- ---------------------------------------------------------------------
-- Garage action: create a fresh DRAFT revision from any quote.
-- ---------------------------------------------------------------------
create or replace function public.revise_quote(p_id uuid)
returns public.quotes
language plpgsql security definer set search_path = public as $$
declare v_src public.quotes; v_new public.quotes;
begin
  select * into v_src from public.quotes where id = p_id;
  if v_src.id is null or not public.is_garage_member(v_src.garage_id) then raise exception 'Acces non autorise'; end if;

  insert into public.quotes (
    garage_id, number, title, status, subtotal, tax_total, total, discount_total,
    notes, conditions, valid_until, client_name, client_phone, client_email,
    vehicle_label, customer_id, vehicle_id, service_request_id, repair_id, revised_from
  ) values (
    v_src.garage_id, public.next_quote_number(v_src.garage_id), v_src.title, 'draft',
    v_src.subtotal, v_src.tax_total, v_src.total, v_src.discount_total,
    v_src.notes, v_src.conditions, v_src.valid_until, v_src.client_name, v_src.client_phone, v_src.client_email,
    v_src.vehicle_label, v_src.customer_id, v_src.vehicle_id, v_src.service_request_id, v_src.repair_id, v_src.id
  ) returning * into v_new;

  insert into public.quote_lines (quote_id, label, quantity, unit_price, tax_rate, line_total, sort_order)
  select v_new.id, label, quantity, unit_price, tax_rate, line_total, sort_order
  from public.quote_lines where quote_id = p_id;

  return v_new;
end;
$$;

-- ---------------------------------------------------------------------
-- Optional maintenance: flip past-validity SENT quotes to EXPIRED.
-- Not scheduled; expiry is also computed on read and blocked on accept.
-- ---------------------------------------------------------------------
create or replace function public.expire_quotes()
returns integer language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.quotes set status = 'expired'
  where status = 'sent' and valid_until is not null and valid_until < current_date;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ---------------------------------------------------------------------
-- PUBLIC consultation by token (anon). Returns ONE quote + its lines +
-- the garage's public-facing fields. Never enumerable, never cross-tenant.
-- ---------------------------------------------------------------------
create or replace function public.get_quote_public(p_token text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_quote public.quotes; v_garage public.garages; v_result jsonb;
begin
  if p_token is null or length(p_token) < 16 then return null; end if;
  select * into v_quote from public.quotes where client_token = p_token;
  if v_quote.id is null then return null; end if;
  select * into v_garage from public.garages where id = v_quote.garage_id;

  select jsonb_build_object(
    'quote', jsonb_build_object(
      'id', v_quote.id, 'number', v_quote.number, 'title', v_quote.title, 'status', v_quote.status,
      'subtotal', v_quote.subtotal, 'tax_total', v_quote.tax_total, 'total', v_quote.total,
      'notes', v_quote.notes, 'conditions', v_quote.conditions, 'valid_until', v_quote.valid_until,
      'client_name', v_quote.client_name, 'client_phone', v_quote.client_phone, 'client_email', v_quote.client_email,
      'vehicle_label', v_quote.vehicle_label, 'created_at', v_quote.created_at,
      'sent_at', v_quote.sent_at, 'accepted_at', v_quote.accepted_at,
      'declined_at', v_quote.declined_at, 'decline_reason', v_quote.decline_reason
    ),
    'lines', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', l.id, 'label', l.label, 'quantity', l.quantity, 'unit_price', l.unit_price,
        'tax_rate', l.tax_rate, 'line_total', l.line_total, 'sort_order', l.sort_order
      ) order by l.sort_order)
      from public.quote_lines l where l.quote_id = v_quote.id
    ), '[]'::jsonb),
    'garage', jsonb_build_object(
      'name', v_garage.name, 'logo_url', v_garage.logo_url, 'accent_color', v_garage.accent_color,
      'address', v_garage.address, 'city', v_garage.city, 'phone', v_garage.phone, 'email', v_garage.email,
      'legal_name', v_garage.legal_name, 'siret', v_garage.siret, 'vat_number', v_garage.vat_number,
      'legal_info', v_garage.legal_info
    )
  ) into v_result;
  return v_result;
end;
$$;

-- Client accepts the quote (by token).
create or replace function public.accept_quote_public(p_token text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_quote public.quotes;
begin
  select * into v_quote from public.quotes where client_token = p_token;
  if v_quote.id is null then raise exception 'Devis introuvable'; end if;
  if v_quote.status = 'accepted' then return public.get_quote_public(p_token); end if;
  if v_quote.status <> 'sent' then raise exception 'Devis non disponible'; end if;
  if v_quote.valid_until is not null and v_quote.valid_until < current_date then raise exception 'Devis expire'; end if;

  perform set_config('garageflow.client_quote_action', '1', true);
  update public.quotes set status = 'accepted', accepted_at = now() where id = v_quote.id;
  return public.get_quote_public(p_token);
end;
$$;

-- Client declines the quote (by token), with an optional reason.
create or replace function public.decline_quote_public(p_token text, p_reason text default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_quote public.quotes;
begin
  select * into v_quote from public.quotes where client_token = p_token;
  if v_quote.id is null then raise exception 'Devis introuvable'; end if;
  if v_quote.status = 'declined' then return public.get_quote_public(p_token); end if;
  if v_quote.status <> 'sent' then raise exception 'Devis non disponible'; end if;

  perform set_config('garageflow.client_quote_action', '1', true);
  update public.quotes set status = 'declined', declined_at = now(),
    decline_reason = nullif(btrim(coalesce(p_reason, '')), '')
  where id = v_quote.id;
  return public.get_quote_public(p_token);
end;
$$;

-- ---------------------------------------------------------------------
-- update_quote_with_lines: only a DRAFT is directly editable (was: only
-- "accepted" was blocked). Rest of the body is unchanged from 0013.
-- ---------------------------------------------------------------------
create or replace function public.update_quote_with_lines(p_id uuid, p_quote jsonb, p_lines jsonb)
returns public.quotes
language plpgsql security definer set search_path = public as $$
declare
  v_garage uuid; v_status text;
  v_customer uuid := nullif(p_quote->>'customer_id', '')::uuid;
  v_vehicle uuid := nullif(p_quote->>'vehicle_id', '')::uuid;
  v_req uuid := nullif(p_quote->>'service_request_id', '')::uuid;
  v_veh_owner uuid;
  v_quote public.quotes;
  v_line jsonb;
  v_label text; v_qty numeric; v_pu numeric; v_tva numeric;
  v_subtotal numeric := 0; v_tax numeric := 0; v_count int := 0;
begin
  select garage_id, status into v_garage, v_status from public.quotes where id = p_id;
  if v_garage is null or not public.is_garage_member(v_garage) then raise exception 'Acces non autorise'; end if;
  if v_status <> 'draft' then raise exception 'Seul un devis brouillon est modifiable'; end if;
  if v_customer is not null and not exists (select 1 from public.customers c where c.id = v_customer and c.garage_id = v_garage) then raise exception 'Client invalide'; end if;
  if v_vehicle is not null and not exists (select 1 from public.vehicles ve where ve.id = v_vehicle and ve.garage_id = v_garage) then raise exception 'Vehicule invalide'; end if;
  if v_req is not null and not exists (select 1 from public.service_requests sr where sr.id = v_req and sr.garage_id = v_garage) then raise exception 'Demande invalide'; end if;
  if v_customer is not null and v_vehicle is not null then
    select customer_id into v_veh_owner from public.vehicles where id = v_vehicle;
    if v_veh_owner is not null and v_veh_owner <> v_customer
       and coalesce((p_quote->>'cross_customer_vehicle_confirmed')::boolean, false) <> true then
      raise exception 'Confirmation requise pour vehicule d''un autre client';
    end if;
  end if;

  for v_line in select * from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) loop
    v_label := coalesce(v_line->>'label', '');
    v_qty := coalesce(nullif(v_line->>'quantity', '')::numeric, 0);
    v_pu := coalesce(nullif(v_line->>'unit_price', '')::numeric, 0);
    v_tva := coalesce(nullif(v_line->>'tax_rate', '')::numeric, 20);
    if length(btrim(v_label)) = 0 then raise exception 'Ligne de devis invalide'; end if;
    if v_qty <= 0 then raise exception 'Quantite invalide'; end if;
    if v_pu < 0 then raise exception 'Prix invalide'; end if;
    if v_tva < 0 or v_tva > 100 then raise exception 'TVA invalide'; end if;
    v_subtotal := v_subtotal + (v_qty * v_pu);
    v_tax := v_tax + (v_qty * v_pu * v_tva / 100);
    v_count := v_count + 1;
  end loop;
  if v_count = 0 then raise exception 'Au moins une ligne est requise'; end if;
  v_subtotal := round(v_subtotal, 2);
  v_tax := round(v_tax, 2);

  update public.quotes set
    title = coalesce(p_quote->>'title', title),
    status = coalesce(p_quote->>'status', status),
    subtotal = v_subtotal, tax_total = v_tax, total = round(v_subtotal + v_tax, 2),
    notes = p_quote->>'notes', conditions = p_quote->>'conditions',
    valid_until = nullif(p_quote->>'valid_until', '')::date,
    client_name = p_quote->>'client_name', client_phone = p_quote->>'client_phone', client_email = p_quote->>'client_email',
    vehicle_label = p_quote->>'vehicle_label', customer_id = v_customer, vehicle_id = v_vehicle, service_request_id = v_req
  where id = p_id
  returning * into v_quote;

  delete from public.quote_lines where quote_id = p_id;
  for v_line in select * from jsonb_array_elements(p_lines) loop
    insert into public.quote_lines (quote_id, label, quantity, unit_price, tax_rate, line_total, sort_order)
    values (
      p_id, v_line->>'label',
      coalesce(nullif(v_line->>'quantity', '')::numeric, 1),
      coalesce(nullif(v_line->>'unit_price', '')::numeric, 0),
      coalesce(nullif(v_line->>'tax_rate', '')::numeric, 20),
      round(coalesce(nullif(v_line->>'quantity', '')::numeric, 0) * coalesce(nullif(v_line->>'unit_price', '')::numeric, 0), 2),
      coalesce((v_line->>'sort_order')::int, 0)
    );
  end loop;
  return v_quote;
end;
$$;

-- ---------------------------------------------------------------------
-- Grants. Garage actions → authenticated only. Public consultation +
-- accept/decline → anon + authenticated (the token is the credential).
-- ---------------------------------------------------------------------
revoke all on function public.send_quote(uuid) from public, anon;
revoke all on function public.revise_quote(uuid) from public, anon;
revoke all on function public.expire_quotes() from public, anon;
grant execute on function public.send_quote(uuid) to authenticated;
grant execute on function public.revise_quote(uuid) to authenticated;

revoke all on function public.get_quote_public(text) from public;
revoke all on function public.accept_quote_public(text) from public;
revoke all on function public.decline_quote_public(text, text) from public;
grant execute on function public.get_quote_public(text) to anon, authenticated;
grant execute on function public.accept_quote_public(text) to anon, authenticated;
grant execute on function public.decline_quote_public(text, text) to anon, authenticated;

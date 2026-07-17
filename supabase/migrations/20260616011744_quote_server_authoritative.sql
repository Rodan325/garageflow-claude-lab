-- =====================================================================
-- GarageFlow C — 0013 server-authoritative quote totals + hardening
-- The DB NEVER trusts amounts sent by the frontend: line_total / subtotal /
-- tax_total / total are recomputed in SQL. Lines are validated; service_request,
-- customer and vehicle must belong to the garage; a cross-client vehicle needs
-- an explicit confirmation flag; accepted quotes are not editable.
-- =====================================================================

create or replace function public.create_quote_with_lines(p_quote jsonb, p_lines jsonb)
returns public.quotes
language plpgsql security definer set search_path = public as $$
declare
  v_garage uuid := nullif(p_quote->>'garage_id', '')::uuid;
  v_customer uuid := nullif(p_quote->>'customer_id', '')::uuid;
  v_vehicle uuid := nullif(p_quote->>'vehicle_id', '')::uuid;
  v_req uuid := nullif(p_quote->>'service_request_id', '')::uuid;
  v_veh_owner uuid;
  v_quote public.quotes;
  v_line jsonb;
  v_label text; v_qty numeric; v_pu numeric; v_tva numeric;
  v_subtotal numeric := 0; v_tax numeric := 0; v_count int := 0;
begin
  if v_garage is null or not public.is_garage_member(v_garage) then raise exception 'Acces non autorise'; end if;
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

  -- Validate + recompute (server is the source of truth).
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

  insert into public.quotes (
    garage_id, number, title, status, subtotal, tax_total, total, notes, conditions,
    valid_until, client_name, client_phone, client_email, vehicle_label,
    customer_id, vehicle_id, service_request_id
  ) values (
    v_garage, public.next_quote_number(v_garage),
    coalesce(p_quote->>'title', 'Devis'), coalesce(p_quote->>'status', 'draft'),
    v_subtotal, v_tax, round(v_subtotal + v_tax, 2),
    p_quote->>'notes', p_quote->>'conditions', nullif(p_quote->>'valid_until', '')::date,
    p_quote->>'client_name', p_quote->>'client_phone', p_quote->>'client_email',
    p_quote->>'vehicle_label', v_customer, v_vehicle, v_req
  ) returning * into v_quote;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    insert into public.quote_lines (quote_id, label, quantity, unit_price, tax_rate, line_total, sort_order)
    values (
      v_quote.id, v_line->>'label',
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
  if v_status = 'accepted' then raise exception 'Devis accepte non modifiable'; end if;
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

  -- number / garage_id / created_at are intentionally never updated.
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

revoke all on function public.create_quote_with_lines(jsonb, jsonb) from public, anon;
revoke all on function public.update_quote_with_lines(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.create_quote_with_lines(jsonb, jsonb) to authenticated;
grant execute on function public.update_quote_with_lines(uuid, jsonb, jsonb) to authenticated;

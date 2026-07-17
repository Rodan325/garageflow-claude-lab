-- =====================================================================
-- GarageFlow C — 0012 transactional quote create/update
-- A plpgsql function runs in a single transaction: if any statement fails the
-- whole thing rolls back, so a quote can never lose its lines (or burn a number).
-- SECURITY DEFINER + explicit is_garage_member() check; customer/vehicle must
-- belong to the same garage. No service_role anywhere.
-- =====================================================================

create or replace function public.create_quote_with_lines(p_quote jsonb, p_lines jsonb)
returns public.quotes
language plpgsql security definer set search_path = public as $$
declare
  v_garage uuid := nullif(p_quote->>'garage_id', '')::uuid;
  v_customer uuid := nullif(p_quote->>'customer_id', '')::uuid;
  v_vehicle uuid := nullif(p_quote->>'vehicle_id', '')::uuid;
  v_quote public.quotes;
  v_line jsonb;
begin
  if v_garage is null or not public.is_garage_member(v_garage) then
    raise exception 'Acces non autorise';
  end if;
  if v_customer is not null and not exists (select 1 from public.customers c where c.id = v_customer and c.garage_id = v_garage) then
    raise exception 'Client invalide';
  end if;
  if v_vehicle is not null and not exists (select 1 from public.vehicles ve where ve.id = v_vehicle and ve.garage_id = v_garage) then
    raise exception 'Vehicule invalide';
  end if;

  insert into public.quotes (
    garage_id, number, title, status, subtotal, tax_total, total, notes, conditions,
    valid_until, client_name, client_phone, client_email, vehicle_label,
    customer_id, vehicle_id, service_request_id
  ) values (
    v_garage,
    public.next_quote_number(v_garage),
    coalesce(p_quote->>'title', 'Devis'),
    coalesce(p_quote->>'status', 'draft'),
    coalesce((p_quote->>'subtotal')::numeric, 0),
    coalesce((p_quote->>'tax_total')::numeric, 0),
    coalesce((p_quote->>'total')::numeric, 0),
    p_quote->>'notes', p_quote->>'conditions',
    nullif(p_quote->>'valid_until', '')::date,
    p_quote->>'client_name', p_quote->>'client_phone', p_quote->>'client_email',
    p_quote->>'vehicle_label', v_customer, v_vehicle,
    nullif(p_quote->>'service_request_id', '')::uuid
  ) returning * into v_quote;

  for v_line in select * from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) loop
    insert into public.quote_lines (quote_id, label, quantity, unit_price, tax_rate, line_total, sort_order)
    values (
      v_quote.id,
      coalesce(v_line->>'label', ''),
      coalesce((v_line->>'quantity')::numeric, 1),
      coalesce((v_line->>'unit_price')::numeric, 0),
      coalesce((v_line->>'tax_rate')::numeric, 20),
      coalesce((v_line->>'line_total')::numeric, 0),
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
  v_garage uuid;
  v_customer uuid := nullif(p_quote->>'customer_id', '')::uuid;
  v_vehicle uuid := nullif(p_quote->>'vehicle_id', '')::uuid;
  v_quote public.quotes;
  v_line jsonb;
begin
  select garage_id into v_garage from public.quotes where id = p_id;
  if v_garage is null or not public.is_garage_member(v_garage) then
    raise exception 'Acces non autorise';
  end if;
  if v_customer is not null and not exists (select 1 from public.customers c where c.id = v_customer and c.garage_id = v_garage) then
    raise exception 'Client invalide';
  end if;
  if v_vehicle is not null and not exists (select 1 from public.vehicles ve where ve.id = v_vehicle and ve.garage_id = v_garage) then
    raise exception 'Vehicule invalide';
  end if;

  update public.quotes set
    title = coalesce(p_quote->>'title', title),
    status = coalesce(p_quote->>'status', status),
    subtotal = coalesce((p_quote->>'subtotal')::numeric, subtotal),
    tax_total = coalesce((p_quote->>'tax_total')::numeric, tax_total),
    total = coalesce((p_quote->>'total')::numeric, total),
    notes = p_quote->>'notes',
    conditions = p_quote->>'conditions',
    valid_until = nullif(p_quote->>'valid_until', '')::date,
    client_name = p_quote->>'client_name',
    client_phone = p_quote->>'client_phone',
    client_email = p_quote->>'client_email',
    vehicle_label = p_quote->>'vehicle_label',
    customer_id = v_customer,
    vehicle_id = v_vehicle
  where id = p_id
  returning * into v_quote;

  delete from public.quote_lines where quote_id = p_id;
  for v_line in select * from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) loop
    insert into public.quote_lines (quote_id, label, quantity, unit_price, tax_rate, line_total, sort_order)
    values (
      p_id,
      coalesce(v_line->>'label', ''),
      coalesce((v_line->>'quantity')::numeric, 1),
      coalesce((v_line->>'unit_price')::numeric, 0),
      coalesce((v_line->>'tax_rate')::numeric, 20),
      coalesce((v_line->>'line_total')::numeric, 0),
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

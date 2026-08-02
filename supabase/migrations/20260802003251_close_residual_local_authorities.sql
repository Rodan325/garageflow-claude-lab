-- PR3A follow-up: close historical local mutation authorities.
-- No application data is rewritten by this migration.

create or replace function public.has_local_business_capability(
  p_garage_id uuid,
  p_center_id uuid,
  p_capability text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor record;
begin
  if p_garage_id is null or nullif(pg_catalog.btrim(p_capability), '') is null then
    return false;
  end if;

  select context.*
  into actor
  from private.resolve_canonical_actor(p_garage_id, p_center_id) context;

  if not found then
    return false;
  end if;

  if actor.organization_role = 'organization_owner' then
    return p_capability = any(array[
      'organization.settings.manage',
      'organization.centers.manage',
      'organization.content.manage',
      'organization.documents.manage',
      'quotes.select',
      'quotes.manage',
      'delivery_reports.manage',
      'maintenance_reminders.manage',
      'service_attachments.manage',
      'center_transfers.manage'
    ]::text[]);
  end if;

  if actor.organization_role is null
    and actor.center_role = 'center_manager'
    and actor.actor_center_id = p_center_id
  then
    return p_capability = any(array[
      'quotes.select',
      'quotes.manage',
      'delivery_reports.manage',
      'maintenance_reminders.manage',
      'service_attachments.manage',
      'center_transfers.manage'
    ]::text[]);
  end if;

  if actor.organization_role is null
    and actor.center_role = 'receptionist'
    and actor.actor_center_id = p_center_id
  then
    return p_capability = any(array[
      'quotes.select',
      'quotes.manage'
    ]::text[]);
  end if;

  return false;
end;
$$;

create or replace function public.has_quote_capability(
  p_garage_id uuid,
  p_service_request_id uuid,
  p_capability text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  resolved_center_id uuid;
begin
  if p_garage_id is null
    or nullif(pg_catalog.btrim(p_capability), '') is null
  then
    return false;
  end if;

  if p_service_request_id is null then
    return public.has_local_business_capability(
      p_garage_id,
      null,
      p_capability
    );
  end if;

  select request.center_id
  into resolved_center_id
  from public.service_requests request
  where request.id = p_service_request_id
    and request.garage_id = p_garage_id;

  if not found or resolved_center_id is null then
    return false;
  end if;

  return public.has_local_business_capability(
    p_garage_id,
    resolved_center_id,
    p_capability
  );
end;
$$;

-- Keep this historical read helper canonical. It remains insufficient as a
-- mutation authority and is deliberately absent from every local mutation
-- policy and RPC below.
create or replace function public.is_garage_member(p_garage_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  resolved_actor_id uuid := (select auth.uid());
  active_scope_count integer;
  resolved_center_id uuid;
begin
  if resolved_actor_id is null or p_garage_id is null then
    return false;
  end if;

  select count(*)
  into active_scope_count
  from public.garage_members member
  where member.user_id = resolved_actor_id
    and member.garage_id = p_garage_id
    and member.status = 'active';

  if active_scope_count <> 1 then
    return false;
  end if;

  select member.center_id
  into resolved_center_id
  from public.garage_members member
  where member.user_id = resolved_actor_id
    and member.garage_id = p_garage_id
    and member.status = 'active';

  return exists (
    select 1
    from private.resolve_canonical_actor(
      p_garage_id,
      resolved_center_id
    ) context
  );
end;
$$;

-- Organization-scoped tables without a trustworthy center relation remain
-- owner-only. Center roles are not widened through a garage-level fallback.
drop policy if exists garages_update_admin on public.garages;
create policy garages_update_canonical on public.garages
  for update to authenticated
  using (
    public.has_local_business_capability(
      id,
      null,
      'organization.settings.manage'
    )
  )
  with check (
    public.has_local_business_capability(
      id,
      null,
      'organization.settings.manage'
    )
  );

drop policy if exists centers_manage on public.garage_centers;
drop policy if exists centers_insert_canonical on public.garage_centers;
drop policy if exists centers_update_canonical on public.garage_centers;
drop policy if exists centers_delete_canonical on public.garage_centers;
create policy centers_insert_canonical on public.garage_centers
  for insert to authenticated
  with check (
    public.has_local_business_capability(
      garage_id,
      null,
      'organization.centers.manage'
    )
  );
create policy centers_update_canonical on public.garage_centers
  for update to authenticated
  using (
    public.has_local_business_capability(
      garage_id,
      null,
      'organization.centers.manage'
    )
  )
  with check (
    public.has_local_business_capability(
      garage_id,
      null,
      'organization.centers.manage'
    )
  );
create policy centers_delete_canonical on public.garage_centers
  for delete to authenticated
  using (
    public.has_local_business_capability(
      garage_id,
      null,
      'organization.centers.manage'
    )
  );

drop policy if exists news_manage on public.garage_news;
drop policy if exists news_insert_canonical on public.garage_news;
drop policy if exists news_update_canonical on public.garage_news;
drop policy if exists news_delete_canonical on public.garage_news;
create policy news_insert_canonical on public.garage_news
  for insert to authenticated
  with check (
    public.has_local_business_capability(
      garage_id,
      null,
      'organization.content.manage'
    )
  );
create policy news_update_canonical on public.garage_news
  for update to authenticated
  using (
    public.has_local_business_capability(
      garage_id,
      null,
      'organization.content.manage'
    )
  )
  with check (
    public.has_local_business_capability(
      garage_id,
      null,
      'organization.content.manage'
    )
  );
create policy news_delete_canonical on public.garage_news
  for delete to authenticated
  using (
    public.has_local_business_capability(
      garage_id,
      null,
      'organization.content.manage'
    )
  );

drop policy if exists hours_manage on public.garage_hours;
drop policy if exists hours_insert_canonical on public.garage_hours;
drop policy if exists hours_update_canonical on public.garage_hours;
drop policy if exists hours_delete_canonical on public.garage_hours;
create policy hours_insert_canonical on public.garage_hours
  for insert to authenticated
  with check (
    public.has_local_business_capability(
      garage_id,
      null,
      'organization.content.manage'
    )
  );
create policy hours_update_canonical on public.garage_hours
  for update to authenticated
  using (
    public.has_local_business_capability(
      garage_id,
      null,
      'organization.content.manage'
    )
  )
  with check (
    public.has_local_business_capability(
      garage_id,
      null,
      'organization.content.manage'
    )
  );
create policy hours_delete_canonical on public.garage_hours
  for delete to authenticated
  using (
    public.has_local_business_capability(
      garage_id,
      null,
      'organization.content.manage'
    )
  );

-- Quote writes are RPC-only. Read access is derived from the quote's linked
-- request center; an unlinked quote remains owner-only.
drop policy if exists quotes_rw on public.quotes;
drop policy if exists quote_lines_rw on public.quote_lines;
drop policy if exists quotes_select_canonical on public.quotes;
drop policy if exists quote_lines_select_canonical on public.quote_lines;
drop policy if exists quotes_delete_canonical on public.quotes;

create policy quotes_select_canonical on public.quotes
  for select to authenticated
  using (
    public.has_quote_capability(
      garage_id,
      service_request_id,
      'quotes.select'
    )
  );

create policy quote_lines_select_canonical on public.quote_lines
  for select to authenticated
  using (
    exists (
      select 1
      from public.quotes quote
      where quote.id = quote_lines.quote_id
        and public.has_quote_capability(
          quote.garage_id,
          quote.service_request_id,
          'quotes.select'
        )
    )
  );

create policy quotes_delete_canonical on public.quotes
  for delete to authenticated
  using (
    status = 'draft'
    and public.has_quote_capability(
      garage_id,
      service_request_id,
      'quotes.manage'
    )
  );

revoke insert, update on table public.quotes from public, anon, authenticated;
revoke insert, update, delete on table public.quote_lines
  from public, anon, authenticated;
revoke delete on table public.quotes from public, anon;
grant delete on table public.quotes to authenticated;

-- The historical documents table has no center binding. Preserve owner DML
-- only rather than inferring an organization-wide scope for a center role.
drop policy if exists documents_rw on public.documents;
drop policy if exists documents_select_canonical on public.documents;
drop policy if exists documents_insert_canonical on public.documents;
drop policy if exists documents_update_canonical on public.documents;
drop policy if exists documents_delete_canonical on public.documents;

create policy documents_select_canonical on public.documents
  for select to authenticated
  using (public.is_garage_member(garage_id));
create policy documents_insert_canonical on public.documents
  for insert to authenticated
  with check (
    public.has_local_business_capability(
      garage_id,
      null,
      'organization.documents.manage'
    )
  );
create policy documents_update_canonical on public.documents
  for update to authenticated
  using (
    public.has_local_business_capability(
      garage_id,
      null,
      'organization.documents.manage'
    )
  )
  with check (
    public.has_local_business_capability(
      garage_id,
      null,
      'organization.documents.manage'
    )
  );
create policy documents_delete_canonical on public.documents
  for delete to authenticated
  using (
    public.has_local_business_capability(
      garage_id,
      null,
      'organization.documents.manage'
    )
  );

-- Garage branding has no center scope and is owner-only.
drop policy if exists garage_logos_member_insert on storage.objects;
drop policy if exists garage_logos_member_update on storage.objects;
drop policy if exists garage_logos_member_delete on storage.objects;

create policy garage_logos_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'garage-logos'
    and case
      when name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/logo\.(png|jpe?g|webp)$'
      then public.has_local_business_capability(
        pg_catalog.split_part(name, '/', 1)::uuid,
        null,
        'organization.settings.manage'
      )
      else false
    end
  );
create policy garage_logos_owner_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'garage-logos'
    and case
      when name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/logo\.(png|jpe?g|webp)$'
      then public.has_local_business_capability(
        pg_catalog.split_part(name, '/', 1)::uuid,
        null,
        'organization.settings.manage'
      )
      else false
    end
  )
  with check (
    bucket_id = 'garage-logos'
    and case
      when name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/logo\.(png|jpe?g|webp)$'
      then public.has_local_business_capability(
        pg_catalog.split_part(name, '/', 1)::uuid,
        null,
        'organization.settings.manage'
      )
      else false
    end
  );
create policy garage_logos_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'garage-logos'
    and case
      when name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/logo\.(png|jpe?g|webp)$'
      then public.has_local_business_capability(
        pg_catalog.split_part(name, '/', 1)::uuid,
        null,
        'organization.settings.manage'
      )
      else false
    end
  );

-- Attachment object mutations use a request-derived center capability.
drop policy if exists service_attachments_staff_insert_objects on storage.objects;
drop policy if exists service_attachments_staff_delete_objects on storage.objects;

create policy service_attachments_staff_insert_objects
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'service-request-attachments'
    and array_length(storage.foldername(name), 1) >= 2
    and exists (
      select 1
      from public.service_requests request
      where request.garage_id::text = (storage.foldername(name))[1]
        and request.id::text = (storage.foldername(name))[2]
        and public.has_local_business_capability(
          request.garage_id,
          request.center_id,
          'service_attachments.manage'
        )
    )
  );

create policy service_attachments_staff_delete_objects
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'service-request-attachments'
    and exists (
      select 1
      from public.service_requests request
      where request.garage_id::text = (storage.foldername(name))[1]
        and request.id::text = (storage.foldername(name))[2]
        and public.has_local_business_capability(
          request.garage_id,
          request.center_id,
          'service_attachments.manage'
        )
    )
  );

-- Quote numbering is an internal primitive. Callers use the canonical quote
-- RPCs; direct authenticated execution could otherwise mutate the counter.
create or replace function public.next_quote_number(p_garage_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_year integer := extract(year from now())::integer;
  v_num integer;
begin
  if p_garage_id is null then
    raise exception 'Garage is required' using errcode = '22023';
  end if;

  insert into public.quote_counters (garage_id, year, last_number)
  values (p_garage_id, v_year, 1)
  on conflict (garage_id, year)
  do update set last_number = public.quote_counters.last_number + 1
  returning last_number into v_num;

  return 'DV-' || v_year || '-' || pg_catalog.lpad(v_num::text, 4, '0');
end;
$$;

create or replace function public.create_quote_with_lines(
  p_quote jsonb,
  p_lines jsonb
)
returns public.quotes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_garage uuid := nullif(p_quote->>'garage_id', '')::uuid;
  v_customer uuid := nullif(p_quote->>'customer_id', '')::uuid;
  v_vehicle uuid := nullif(p_quote->>'vehicle_id', '')::uuid;
  v_req uuid := nullif(p_quote->>'service_request_id', '')::uuid;
  v_veh_owner uuid;
  v_quote public.quotes;
  v_line jsonb;
  v_label text;
  v_qty numeric;
  v_pu numeric;
  v_tva numeric;
  v_subtotal numeric := 0;
  v_tax numeric := 0;
  v_count integer := 0;
begin
  if not public.has_quote_capability(v_garage, v_req, 'quotes.manage') then
    raise exception 'Quote creation not permitted' using errcode = '42501';
  end if;

  if v_customer is not null and not exists (
    select 1 from public.customers customer
    where customer.id = v_customer and customer.garage_id = v_garage
  ) then
    raise exception 'Invalid customer' using errcode = '23514';
  end if;
  if v_vehicle is not null and not exists (
    select 1 from public.vehicles vehicle
    where vehicle.id = v_vehicle and vehicle.garage_id = v_garage
  ) then
    raise exception 'Invalid vehicle' using errcode = '23514';
  end if;
  if v_req is not null and not exists (
    select 1 from public.service_requests request
    where request.id = v_req and request.garage_id = v_garage
  ) then
    raise exception 'Invalid service request' using errcode = '23514';
  end if;

  if v_customer is not null and v_vehicle is not null then
    select vehicle.customer_id
    into v_veh_owner
    from public.vehicles vehicle
    where vehicle.id = v_vehicle;

    if v_veh_owner is not null
      and v_veh_owner <> v_customer
      and coalesce(
        (p_quote->>'cross_customer_vehicle_confirmed')::boolean,
        false
      ) <> true
    then
      raise exception 'Cross-customer vehicle confirmation required'
        using errcode = '23514';
    end if;
  end if;

  for v_line in
    select * from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb))
  loop
    v_label := coalesce(v_line->>'label', '');
    v_qty := coalesce(nullif(v_line->>'quantity', '')::numeric, 0);
    v_pu := coalesce(nullif(v_line->>'unit_price', '')::numeric, 0);
    v_tva := coalesce(nullif(v_line->>'tax_rate', '')::numeric, 20);
    if length(pg_catalog.btrim(v_label)) = 0 then
      raise exception 'Invalid quote line' using errcode = '22023';
    end if;
    if v_qty <= 0 or v_pu < 0 or v_tva < 0 or v_tva > 100 then
      raise exception 'Invalid quote line amount' using errcode = '22023';
    end if;
    v_subtotal := v_subtotal + (v_qty * v_pu);
    v_tax := v_tax + (v_qty * v_pu * v_tva / 100);
    v_count := v_count + 1;
  end loop;

  if v_count = 0 then
    raise exception 'At least one quote line is required' using errcode = '22023';
  end if;
  v_subtotal := round(v_subtotal, 2);
  v_tax := round(v_tax, 2);

  insert into public.quotes (
    garage_id, number, title, status, subtotal, tax_total, total, notes,
    conditions, valid_until, client_name, client_phone, client_email,
    vehicle_label, customer_id, vehicle_id, service_request_id
  ) values (
    v_garage,
    public.next_quote_number(v_garage),
    coalesce(p_quote->>'title', 'Devis'),
    coalesce(p_quote->>'status', 'draft'),
    v_subtotal,
    v_tax,
    round(v_subtotal + v_tax, 2),
    p_quote->>'notes',
    p_quote->>'conditions',
    nullif(p_quote->>'valid_until', '')::date,
    p_quote->>'client_name',
    p_quote->>'client_phone',
    p_quote->>'client_email',
    p_quote->>'vehicle_label',
    v_customer,
    v_vehicle,
    v_req
  ) returning * into v_quote;

  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    insert into public.quote_lines (
      quote_id, label, quantity, unit_price, tax_rate, line_total, sort_order
    ) values (
      v_quote.id,
      v_line->>'label',
      coalesce(nullif(v_line->>'quantity', '')::numeric, 1),
      coalesce(nullif(v_line->>'unit_price', '')::numeric, 0),
      coalesce(nullif(v_line->>'tax_rate', '')::numeric, 20),
      round(
        coalesce(nullif(v_line->>'quantity', '')::numeric, 0)
          * coalesce(nullif(v_line->>'unit_price', '')::numeric, 0),
        2
      ),
      coalesce((v_line->>'sort_order')::integer, 0)
    );
  end loop;

  return v_quote;
end;
$$;

create or replace function public.update_quote_with_lines(
  p_id uuid,
  p_quote jsonb,
  p_lines jsonb
)
returns public.quotes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_garage uuid;
  v_status text;
  v_existing_req uuid;
  v_customer uuid := nullif(p_quote->>'customer_id', '')::uuid;
  v_vehicle uuid := nullif(p_quote->>'vehicle_id', '')::uuid;
  v_req uuid := nullif(p_quote->>'service_request_id', '')::uuid;
  v_veh_owner uuid;
  v_quote public.quotes;
  v_line jsonb;
  v_label text;
  v_qty numeric;
  v_pu numeric;
  v_tva numeric;
  v_subtotal numeric := 0;
  v_tax numeric := 0;
  v_count integer := 0;
begin
  select quote.garage_id, quote.status, quote.service_request_id
  into v_garage, v_status, v_existing_req
  from public.quotes quote
  where quote.id = p_id
  for update;

  if not found
    or not public.has_quote_capability(
      v_garage,
      v_existing_req,
      'quotes.manage'
    )
    or not public.has_quote_capability(v_garage, v_req, 'quotes.manage')
  then
    raise exception 'Quote update not permitted' using errcode = '42501';
  end if;

  if v_status <> 'draft' then
    raise exception 'Only a draft quote can be updated' using errcode = '22023';
  end if;
  if v_customer is not null and not exists (
    select 1 from public.customers customer
    where customer.id = v_customer and customer.garage_id = v_garage
  ) then
    raise exception 'Invalid customer' using errcode = '23514';
  end if;
  if v_vehicle is not null and not exists (
    select 1 from public.vehicles vehicle
    where vehicle.id = v_vehicle and vehicle.garage_id = v_garage
  ) then
    raise exception 'Invalid vehicle' using errcode = '23514';
  end if;
  if v_req is not null and not exists (
    select 1 from public.service_requests request
    where request.id = v_req and request.garage_id = v_garage
  ) then
    raise exception 'Invalid service request' using errcode = '23514';
  end if;

  if v_customer is not null and v_vehicle is not null then
    select vehicle.customer_id
    into v_veh_owner
    from public.vehicles vehicle
    where vehicle.id = v_vehicle;
    if v_veh_owner is not null
      and v_veh_owner <> v_customer
      and coalesce(
        (p_quote->>'cross_customer_vehicle_confirmed')::boolean,
        false
      ) <> true
    then
      raise exception 'Cross-customer vehicle confirmation required'
        using errcode = '23514';
    end if;
  end if;

  for v_line in
    select * from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb))
  loop
    v_label := coalesce(v_line->>'label', '');
    v_qty := coalesce(nullif(v_line->>'quantity', '')::numeric, 0);
    v_pu := coalesce(nullif(v_line->>'unit_price', '')::numeric, 0);
    v_tva := coalesce(nullif(v_line->>'tax_rate', '')::numeric, 20);
    if length(pg_catalog.btrim(v_label)) = 0 then
      raise exception 'Invalid quote line' using errcode = '22023';
    end if;
    if v_qty <= 0 or v_pu < 0 or v_tva < 0 or v_tva > 100 then
      raise exception 'Invalid quote line amount' using errcode = '22023';
    end if;
    v_subtotal := v_subtotal + (v_qty * v_pu);
    v_tax := v_tax + (v_qty * v_pu * v_tva / 100);
    v_count := v_count + 1;
  end loop;

  if v_count = 0 then
    raise exception 'At least one quote line is required' using errcode = '22023';
  end if;
  v_subtotal := round(v_subtotal, 2);
  v_tax := round(v_tax, 2);

  update public.quotes quote
  set title = coalesce(p_quote->>'title', quote.title),
      status = coalesce(p_quote->>'status', quote.status),
      subtotal = v_subtotal,
      tax_total = v_tax,
      total = round(v_subtotal + v_tax, 2),
      notes = p_quote->>'notes',
      conditions = p_quote->>'conditions',
      valid_until = nullif(p_quote->>'valid_until', '')::date,
      client_name = p_quote->>'client_name',
      client_phone = p_quote->>'client_phone',
      client_email = p_quote->>'client_email',
      vehicle_label = p_quote->>'vehicle_label',
      customer_id = v_customer,
      vehicle_id = v_vehicle,
      service_request_id = v_req
  where quote.id = p_id
  returning * into v_quote;

  delete from public.quote_lines line where line.quote_id = p_id;
  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    insert into public.quote_lines (
      quote_id, label, quantity, unit_price, tax_rate, line_total, sort_order
    ) values (
      p_id,
      v_line->>'label',
      coalesce(nullif(v_line->>'quantity', '')::numeric, 1),
      coalesce(nullif(v_line->>'unit_price', '')::numeric, 0),
      coalesce(nullif(v_line->>'tax_rate', '')::numeric, 20),
      round(
        coalesce(nullif(v_line->>'quantity', '')::numeric, 0)
          * coalesce(nullif(v_line->>'unit_price', '')::numeric, 0),
        2
      ),
      coalesce((v_line->>'sort_order')::integer, 0)
    );
  end loop;

  return v_quote;
end;
$$;

create or replace function public.send_quote(p_id uuid)
returns public.quotes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quote public.quotes%rowtype;
  v_lines integer;
begin
  select *
  into v_quote
  from public.quotes quote
  where quote.id = p_id
  for update;

  if not found or not public.has_quote_capability(
    v_quote.garage_id,
    v_quote.service_request_id,
    'quotes.manage'
  ) then
    raise exception 'Quote send not permitted' using errcode = '42501';
  end if;
  if v_quote.status <> 'draft' then
    raise exception 'Only a draft quote can be sent' using errcode = '22023';
  end if;

  select count(*) into v_lines
  from public.quote_lines line
  where line.quote_id = p_id;

  if v_lines = 0 then
    raise exception 'A quote must contain at least one line' using errcode = '22023';
  end if;
  if v_quote.valid_until is null or v_quote.valid_until < current_date then
    raise exception 'A current validity date is required' using errcode = '22023';
  end if;

  update public.quotes quote
  set status = 'sent',
      sent_at = now(),
      client_token = coalesce(
        quote.client_token,
        replace(pg_catalog.gen_random_uuid()::text, '-', '')
          || replace(pg_catalog.gen_random_uuid()::text, '-', '')
      )
  where quote.id = p_id
  returning * into v_quote;

  return v_quote;
end;
$$;

create or replace function public.revise_quote(p_id uuid)
returns public.quotes
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_quote public.quotes%rowtype;
  revised_quote public.quotes%rowtype;
begin
  select *
  into source_quote
  from public.quotes quote
  where quote.id = p_id
  for update;

  if not found or not public.has_quote_capability(
    source_quote.garage_id,
    source_quote.service_request_id,
    'quotes.manage'
  ) then
    raise exception 'Quote revision not permitted' using errcode = '42501';
  end if;

  insert into public.quotes (
    garage_id, number, title, status, subtotal, tax_total, total,
    discount_total, notes, conditions, valid_until, client_name,
    client_phone, client_email, vehicle_label, customer_id, vehicle_id,
    service_request_id, repair_id, revised_from, recommendation_id,
    supplemental_to_quote_id
  ) values (
    source_quote.garage_id,
    public.next_quote_number(source_quote.garage_id),
    source_quote.title,
    'draft',
    source_quote.subtotal,
    source_quote.tax_total,
    source_quote.total,
    source_quote.discount_total,
    source_quote.notes,
    source_quote.conditions,
    source_quote.valid_until,
    source_quote.client_name,
    source_quote.client_phone,
    source_quote.client_email,
    source_quote.vehicle_label,
    source_quote.customer_id,
    source_quote.vehicle_id,
    source_quote.service_request_id,
    source_quote.repair_id,
    source_quote.id,
    source_quote.recommendation_id,
    source_quote.supplemental_to_quote_id
  ) returning * into revised_quote;

  insert into public.quote_lines (
    quote_id, label, quantity, unit_price, tax_rate, line_total, sort_order
  )
  select
    revised_quote.id,
    line.label,
    line.quantity,
    line.unit_price,
    line.tax_rate,
    line.line_total,
    line.sort_order
  from public.quote_lines line
  where line.quote_id = p_id;

  return revised_quote;
end;
$$;

create or replace function public.save_delivery_report(
  p_request_id uuid,
  p_report jsonb,
  p_finalize boolean default false
)
returns public.delivery_reports
language plpgsql
security definer
set search_path = ''
as $$
declare
  request public.service_requests%rowtype;
  report public.delivery_reports%rowtype;
  entry_mileage_value integer := nullif(
    p_report->>'entry_mileage',
    ''
  )::integer;
  exit_mileage_value integer := nullif(
    p_report->>'exit_mileage',
    ''
  )::integer;
  attachment_ids uuid[] := coalesce(
    array(
      select jsonb_array_elements_text(
        coalesce(p_report->'authorized_attachment_ids', '[]'::jsonb)
      )::uuid
    ),
    '{}'
  );
begin
  select *
  into request
  from public.service_requests item
  where item.id = p_request_id;

  if not found then
    raise exception 'Service request not found' using errcode = 'P0002';
  end if;
  if not public.has_local_business_capability(
    request.garage_id,
    request.center_id,
    'delivery_reports.manage'
  ) then
    raise exception 'Delivery report not permitted' using errcode = '42501';
  end if;

  select *
  into report
  from public.delivery_reports item
  where item.service_request_id = request.id
  for update;

  if report.status = 'finalized' then
    raise exception 'Finalized delivery report is immutable'
      using errcode = '55000';
  end if;
  if (entry_mileage_value is not null and entry_mileage_value < 0)
    or (exit_mileage_value is not null and exit_mileage_value < 0)
    or (
      entry_mileage_value is not null
      and exit_mileage_value is not null
      and exit_mileage_value < entry_mileage_value
    )
  then
    raise exception 'Invalid report mileage' using errcode = '22023';
  end if;
  if exists (
    select 1
    from unnest(attachment_ids) attachment_id
    where not exists (
      select 1
      from public.service_request_attachments attachment
      where attachment.id = attachment_id
        and attachment.service_request_id = request.id
        and attachment.garage_id = request.garage_id
        and attachment.visibility in ('customer', 'both')
    )
  ) then
    raise exception 'Invalid report attachment' using errcode = '23514';
  end if;

  insert into public.delivery_reports (
    garage_id, center_id, service_request_id, report_number, status,
    customer_snapshot, vehicle_snapshot, entry_mileage, exit_mileage,
    checked_in_at, delivered_at, requested_work, diagnostic_summary,
    completed_work, accepted_recommendations, deferred_recommendations,
    parts, authorized_attachment_ids, observations, next_due_date,
    next_due_mileage, warranty_terms, final_validation, finalized_by,
    finalized_at, updated_at
  ) values (
    request.garage_id,
    request.center_id,
    request.id,
    'RI-' || pg_catalog.to_char(current_date, 'YYYY') || '-'
      || upper(substr(pg_catalog.gen_random_uuid()::text, 1, 8)),
    case when p_finalize then 'finalized' else 'draft' end,
    coalesce(p_report->'customer_snapshot', '{}'::jsonb),
    coalesce(p_report->'vehicle_snapshot', '{}'::jsonb),
    entry_mileage_value,
    exit_mileage_value,
    coalesce(
      nullif(p_report->>'checked_in_at', '')::timestamptz,
      request.vehicle_checked_in_at
    ),
    coalesce(
      nullif(p_report->>'delivered_at', '')::timestamptz,
      request.vehicle_delivered_at
    ),
    case when jsonb_typeof(p_report->'requested_work') = 'array'
      then p_report->'requested_work' else '[]'::jsonb end,
    nullif(pg_catalog.btrim(p_report->>'diagnostic_summary'), ''),
    case when jsonb_typeof(p_report->'completed_work') = 'array'
      then p_report->'completed_work' else '[]'::jsonb end,
    case when jsonb_typeof(p_report->'accepted_recommendations') = 'array'
      then p_report->'accepted_recommendations' else '[]'::jsonb end,
    case when jsonb_typeof(p_report->'deferred_recommendations') = 'array'
      then p_report->'deferred_recommendations' else '[]'::jsonb end,
    case when jsonb_typeof(p_report->'parts') = 'array'
      then p_report->'parts' else '[]'::jsonb end,
    attachment_ids,
    nullif(pg_catalog.btrim(p_report->>'observations'), ''),
    nullif(p_report->>'next_due_date', '')::date,
    nullif(p_report->>'next_due_mileage', '')::integer,
    nullif(pg_catalog.btrim(p_report->>'warranty_terms'), ''),
    nullif(pg_catalog.btrim(p_report->>'final_validation'), ''),
    case when p_finalize then (select auth.uid()) else null end,
    case when p_finalize then now() else null end,
    now()
  )
  on conflict (service_request_id) do update set
    customer_snapshot = excluded.customer_snapshot,
    vehicle_snapshot = excluded.vehicle_snapshot,
    entry_mileage = excluded.entry_mileage,
    exit_mileage = excluded.exit_mileage,
    checked_in_at = excluded.checked_in_at,
    delivered_at = excluded.delivered_at,
    requested_work = excluded.requested_work,
    diagnostic_summary = excluded.diagnostic_summary,
    completed_work = excluded.completed_work,
    accepted_recommendations = excluded.accepted_recommendations,
    deferred_recommendations = excluded.deferred_recommendations,
    parts = excluded.parts,
    authorized_attachment_ids = excluded.authorized_attachment_ids,
    observations = excluded.observations,
    next_due_date = excluded.next_due_date,
    next_due_mileage = excluded.next_due_mileage,
    warranty_terms = excluded.warranty_terms,
    final_validation = excluded.final_validation,
    status = excluded.status,
    finalized_by = excluded.finalized_by,
    finalized_at = excluded.finalized_at,
    updated_at = now()
  returning * into report;

  return report;
end;
$$;

create or replace function public.create_maintenance_reminder(
  p_garage_id uuid,
  p_center_id uuid,
  p_client_id uuid,
  p_vehicle_id uuid,
  p_client_vehicle_id uuid,
  p_service_request_id uuid,
  p_reminder_type text,
  p_title text,
  p_due_date date,
  p_due_mileage integer,
  p_scheduled_at timestamptz default now(),
  p_source text default 'manual',
  p_language text default 'fr'
)
returns public.maintenance_reminders
language plpgsql
security definer
set search_path = ''
as $$
declare
  reminder public.maintenance_reminders%rowtype;
begin
  if not public.has_local_business_capability(
    p_garage_id,
    p_center_id,
    'maintenance_reminders.manage'
  ) then
    raise exception 'Reminder creation not permitted' using errcode = '42501';
  end if;
  if p_due_date is null and p_due_mileage is null then
    raise exception 'A date or mileage is required' using errcode = '22023';
  end if;
  if p_language not in ('fr', 'en', 'ar') then
    raise exception 'Invalid reminder language' using errcode = '22023';
  end if;
  if p_center_id is null or not exists (
    select 1
    from public.garage_centers center
    where center.id = p_center_id
      and center.garage_id = p_garage_id
      and center.is_active
  ) then
    raise exception 'Invalid reminder center' using errcode = '23514';
  end if;
  if p_service_request_id is not null and not exists (
    select 1
    from public.service_requests request
    where request.id = p_service_request_id
      and request.garage_id = p_garage_id
      and request.center_id = p_center_id
      and request.client_id = p_client_id
  ) then
    raise exception 'Invalid reminder request' using errcode = '23514';
  end if;
  if p_vehicle_id is not null and not exists (
    select 1
    from public.vehicles vehicle
    where vehicle.id = p_vehicle_id
      and vehicle.garage_id = p_garage_id
  ) then
    raise exception 'Invalid reminder vehicle' using errcode = '23514';
  end if;
  if p_client_vehicle_id is not null and not exists (
    select 1
    from public.client_vehicles vehicle
    where vehicle.id = p_client_vehicle_id
      and vehicle.client_id = p_client_id
  ) then
    raise exception 'Invalid client vehicle' using errcode = '23514';
  end if;

  insert into public.maintenance_reminders (
    garage_id, center_id, client_id, vehicle_id, client_vehicle_id,
    service_request_id, reminder_type, title, due_date, due_mileage,
    scheduled_at, source, created_by
  ) values (
    p_garage_id,
    p_center_id,
    p_client_id,
    p_vehicle_id,
    p_client_vehicle_id,
    p_service_request_id,
    p_reminder_type,
    pg_catalog.btrim(p_title),
    p_due_date,
    p_due_mileage,
    p_scheduled_at,
    p_source,
    (select auth.uid())
  ) returning * into reminder;

  insert into public.notification_outbox (
    garage_id, center_id, service_request_id, recipient_user_id,
    recipient_address, channel, template_key, language, payload, scheduled_at
  ) values (
    reminder.garage_id,
    reminder.center_id,
    reminder.service_request_id,
    reminder.client_id,
    reminder.client_id::text,
    'in_app',
    'maintenance_reminder',
    p_language,
    jsonb_build_object('reminder_id', reminder.id),
    p_scheduled_at
  );

  return reminder;
end;
$$;

create or replace function public.mark_maintenance_reminder_converted(
  p_reminder_id uuid,
  p_request_id uuid
)
returns public.maintenance_reminders
language plpgsql
security definer
set search_path = ''
as $$
declare
  reminder public.maintenance_reminders%rowtype;
  resolved_actor_id uuid := (select auth.uid());
begin
  if resolved_actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select *
  into reminder
  from public.maintenance_reminders item
  where item.id = p_reminder_id
  for update;

  if not found then
    raise exception 'Reminder not found' using errcode = 'P0002';
  end if;
  if reminder.client_id <> resolved_actor_id
    and not public.has_local_business_capability(
      reminder.garage_id,
      reminder.center_id,
      'maintenance_reminders.manage'
    )
  then
    raise exception 'Reminder conversion not permitted' using errcode = '42501';
  end if;
  if not exists (
    select 1
    from public.service_requests request
    where request.id = p_request_id
      and request.garage_id = reminder.garage_id
      and request.center_id = reminder.center_id
      and request.client_id = reminder.client_id
  ) then
    raise exception 'Invalid converted request' using errcode = '23514';
  end if;

  update public.maintenance_reminders item
  set status = 'converted',
      converted_request_id = p_request_id
  where item.id = reminder.id
  returning * into reminder;

  return reminder;
end;
$$;

create or replace function public.register_service_request_attachment(
  p_request_id uuid,
  p_recommendation_id uuid,
  p_file_name text,
  p_mime_type text,
  p_file_size bigint,
  p_storage_path text,
  p_visibility text default 'internal',
  p_document_type text default 'other'
)
returns public.service_request_attachments
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_request public.service_requests%rowtype;
  attachment public.service_request_attachments%rowtype;
  extension text;
begin
  select *
  into current_request
  from public.service_requests request
  where request.id = p_request_id;

  if not found then
    raise exception 'Service request not found' using errcode = 'P0002';
  end if;
  if not public.has_local_business_capability(
    current_request.garage_id,
    current_request.center_id,
    'service_attachments.manage'
  ) then
    raise exception 'Attachment registration not permitted'
      using errcode = '42501';
  end if;
  if p_recommendation_id is not null and not exists (
    select 1
    from public.workshop_recommendations recommendation
    where recommendation.id = p_recommendation_id
      and recommendation.garage_id = current_request.garage_id
      and recommendation.service_request_id = current_request.id
  ) then
    raise exception 'Invalid recommendation attachment'
      using errcode = '23514';
  end if;
  if p_storage_path not like current_request.garage_id::text
      || '/' || current_request.id::text || '/%'
  then
    raise exception 'Invalid attachment path' using errcode = '23514';
  end if;

  extension := pg_catalog.lower(
    pg_catalog.split_part(
      p_file_name,
      '.',
      pg_catalog.array_length(pg_catalog.string_to_array(p_file_name, '.'), 1)
    )
  );
  if extension not in ('jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'pdf', 'txt', 'csv') then
    raise exception 'Unsupported attachment extension' using errcode = '22023';
  end if;
  if p_mime_type not in (
    'image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime',
    'application/pdf', 'text/plain', 'text/csv'
  ) or p_file_size not between 1 and 26214400 then
    raise exception 'Unsupported attachment content' using errcode = '22023';
  end if;
  if p_visibility not in ('internal', 'customer', 'both')
    or p_document_type not in (
      'photo', 'video', 'diagnostic', 'quote', 'invoice', 'report', 'other'
    )
  then
    raise exception 'Invalid attachment metadata' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(current_request.id::text, 0)
  );
  if (
    select count(*)
    from public.service_request_attachments item
    where item.service_request_id = current_request.id
  ) >= 20 then
    raise exception 'Attachment limit reached' using errcode = '54000';
  end if;
  if not exists (
    select 1
    from storage.objects object
    where object.bucket_id = 'service-request-attachments'
      and object.name = p_storage_path
      and pg_catalog.lower(coalesce(object.metadata->>'mimetype', ''))
        = p_mime_type
  ) then
    raise exception 'Uploaded object not found' using errcode = 'P0002';
  end if;

  insert into public.service_request_attachments (
    garage_id, center_id, service_request_id, recommendation_id, uploaded_by,
    file_name, mime_type, file_size, storage_path, visibility, document_type
  ) values (
    current_request.garage_id,
    current_request.center_id,
    current_request.id,
    p_recommendation_id,
    (select auth.uid()),
    pg_catalog.left(p_file_name, 180),
    p_mime_type,
    p_file_size,
    p_storage_path,
    p_visibility,
    p_document_type
  ) returning * into attachment;

  return attachment;
end;
$$;

create or replace function public.propose_center_transfer(
  p_request_id uuid,
  p_to_center_id uuid,
  p_reason text default null
)
returns public.service_request_transfers
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  request public.service_requests%rowtype;
  transfer public.service_request_transfers%rowtype;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select *
  into request
  from public.service_requests item
  where item.id = p_request_id
  for update;

  if not found then
    raise exception 'Service request not found' using errcode = 'P0002';
  end if;
  if request.center_id is null then
    raise exception 'A source center is required' using errcode = '23514';
  end if;
  if not public.has_local_business_capability(
    request.garage_id,
    request.center_id,
    'center_transfers.manage'
  ) or not public.has_local_business_capability(
    request.garage_id,
    p_to_center_id,
    'center_transfers.manage'
  ) then
    raise exception 'Center transfer not permitted' using errcode = '42501';
  end if;
  if p_to_center_id = request.center_id then
    raise exception 'Destination must differ from source' using errcode = '23514';
  end if;
  if not exists (
    select 1
    from public.garage_centers center
    where center.id = p_to_center_id
      and center.garage_id = request.garage_id
      and center.is_active
  ) then
    raise exception 'Destination center is invalid' using errcode = '23514';
  end if;
  if not exists (
    select 1
    from public.garage_centers center
    where center.id = request.center_id
      and center.garage_id = request.garage_id
      and center.is_active
  ) then
    raise exception 'Source center is invalid' using errcode = '23514';
  end if;

  insert into public.service_request_transfers (
    garage_id, service_request_id, from_center_id, to_center_id,
    requested_by, reason
  ) values (
    request.garage_id,
    request.id,
    request.center_id,
    p_to_center_id,
    actor_id,
    nullif(pg_catalog.btrim(p_reason), '')
  ) returning * into transfer;

  insert into public.service_request_transfer_events (
    transfer_id, garage_id, previous_status, new_status, changed_by, note
  ) values (
    transfer.id,
    transfer.garage_id,
    null,
    'proposed',
    actor_id,
    transfer.reason
  );

  return transfer;
end;
$$;

create or replace function public.complete_center_transfer(p_transfer_id uuid)
returns public.service_request_transfers
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  transfer public.service_request_transfers%rowtype;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select *
  into transfer
  from public.service_request_transfers item
  where item.id = p_transfer_id
  for update;

  if not found then
    raise exception 'Center transfer not found' using errcode = 'P0002';
  end if;
  if not public.has_local_business_capability(
    transfer.garage_id,
    transfer.from_center_id,
    'center_transfers.manage'
  ) or not public.has_local_business_capability(
    transfer.garage_id,
    transfer.to_center_id,
    'center_transfers.manage'
  ) then
    raise exception 'Center transfer completion not permitted'
      using errcode = '42501';
  end if;
  if transfer.status <> 'customer_confirmed' then
    raise exception 'Customer confirmation is required' using errcode = '22023';
  end if;
  if not exists (
    select 1
    from public.garage_centers center
    where center.id = transfer.to_center_id
      and center.garage_id = transfer.garage_id
      and center.is_active
  ) then
    raise exception 'Destination center is invalid' using errcode = '23514';
  end if;

  update public.service_requests request
  set center_id = transfer.to_center_id,
      updated_at = pg_catalog.now()
  where request.id = transfer.service_request_id
    and request.garage_id = transfer.garage_id
    and request.center_id = transfer.from_center_id;

  if not found then
    raise exception 'Transfer source is stale' using errcode = '40001';
  end if;

  update public.appointments appointment
  set center_id = transfer.to_center_id
  where appointment.service_request_id = transfer.service_request_id
    and appointment.garage_id = transfer.garage_id;

  update public.service_request_transfers item
  set status = 'completed',
      completed_at = pg_catalog.now()
  where item.id = transfer.id
  returning * into transfer;

  insert into public.service_request_transfer_events (
    transfer_id, garage_id, previous_status, new_status, changed_by
  ) values (
    transfer.id,
    transfer.garage_id,
    'customer_confirmed',
    'completed',
    actor_id
  );

  return transfer;
end;
$$;

alter function public.has_local_business_capability(uuid, uuid, text)
  owner to postgres;
alter function public.has_quote_capability(uuid, uuid, text)
  owner to postgres;
alter function public.is_garage_member(uuid) owner to postgres;
alter function public.next_quote_number(uuid) owner to postgres;
alter function public.create_quote_with_lines(jsonb, jsonb) owner to postgres;
alter function public.update_quote_with_lines(uuid, jsonb, jsonb) owner to postgres;
alter function public.send_quote(uuid) owner to postgres;
alter function public.revise_quote(uuid) owner to postgres;
alter function public.save_delivery_report(uuid, jsonb, boolean) owner to postgres;
alter function public.create_maintenance_reminder(
  uuid, uuid, uuid, uuid, uuid, uuid, text, text, date, integer,
  timestamptz, text, text
) owner to postgres;
alter function public.mark_maintenance_reminder_converted(uuid, uuid)
  owner to postgres;
alter function public.register_service_request_attachment(
  uuid, uuid, text, text, bigint, text, text, text
) owner to postgres;
alter function public.propose_center_transfer(uuid, uuid, text)
  owner to postgres;
alter function public.complete_center_transfer(uuid) owner to postgres;

revoke all on function public.has_local_business_capability(uuid, uuid, text)
  from public, anon, authenticated, service_role;
revoke all on function public.has_quote_capability(uuid, uuid, text)
  from public, anon, authenticated, service_role;
revoke all on function public.is_garage_member(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.has_local_business_capability(uuid, uuid, text)
  to authenticated, service_role;
grant execute on function public.has_quote_capability(uuid, uuid, text)
  to authenticated, service_role;
grant execute on function public.is_garage_member(uuid)
  to authenticated, service_role;

revoke all on function public.next_quote_number(uuid)
  from public, anon, authenticated, service_role;

revoke all on function public.create_quote_with_lines(jsonb, jsonb)
  from public, anon, authenticated, service_role;
revoke all on function public.update_quote_with_lines(uuid, jsonb, jsonb)
  from public, anon, authenticated, service_role;
revoke all on function public.send_quote(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.revise_quote(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.save_delivery_report(uuid, jsonb, boolean)
  from public, anon, authenticated, service_role;
revoke all on function public.create_maintenance_reminder(
  uuid, uuid, uuid, uuid, uuid, uuid, text, text, date, integer,
  timestamptz, text, text
) from public, anon, authenticated, service_role;
revoke all on function public.mark_maintenance_reminder_converted(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.register_service_request_attachment(
  uuid, uuid, text, text, bigint, text, text, text
) from public, anon, authenticated, service_role;
revoke all on function public.propose_center_transfer(uuid, uuid, text)
  from public, anon, authenticated, service_role;
revoke all on function public.complete_center_transfer(uuid)
  from public, anon, authenticated, service_role;

grant execute on function public.create_quote_with_lines(jsonb, jsonb)
  to authenticated;
grant execute on function public.update_quote_with_lines(uuid, jsonb, jsonb)
  to authenticated;
grant execute on function public.send_quote(uuid) to authenticated;
grant execute on function public.revise_quote(uuid) to authenticated;
grant execute on function public.save_delivery_report(uuid, jsonb, boolean)
  to authenticated;
grant execute on function public.create_maintenance_reminder(
  uuid, uuid, uuid, uuid, uuid, uuid, text, text, date, integer,
  timestamptz, text, text
) to authenticated;
grant execute on function public.mark_maintenance_reminder_converted(uuid, uuid)
  to authenticated;
grant execute on function public.register_service_request_attachment(
  uuid, uuid, text, text, bigint, text, text, text
) to authenticated;
grant execute on function public.propose_center_transfer(uuid, uuid, text)
  to authenticated;
grant execute on function public.complete_center_transfer(uuid)
  to authenticated;

comment on function public.next_quote_number(uuid) is
  'Internal quote counter primitive; direct Data API execution is revoked.';

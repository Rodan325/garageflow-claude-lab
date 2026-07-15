-- Additive diagnostic recommendations and customer decision journal.
-- Quotes remain the single pricing engine; optional links below identify a
-- supplemental quote created from a recommendation.

create table public.workshop_recommendations (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references public.garages(id) on delete cascade,
  center_id uuid,
  service_request_id uuid not null,
  title text not null,
  description text,
  category text,
  urgency text not null default 'recommended',
  reason text,
  estimated_price numeric(12, 2),
  estimated_duration_minutes integer,
  affects_delivery_time boolean not null default false,
  proposed_delivery_at timestamptz,
  status text not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  customer_decision_note text,
  constraint workshop_recommendations_id_garage_key unique (id, garage_id),
  constraint workshop_recommendations_request_garage_fk
    foreign key (service_request_id, garage_id)
    references public.service_requests (id, garage_id) on delete cascade,
  constraint workshop_recommendations_center_garage_fk
    foreign key (center_id, garage_id)
    references public.garage_centers (id, garage_id)
    on delete set null (center_id),
  constraint workshop_recommendations_urgency_check check (
    urgency in ('critical', 'recommended', 'preventive', 'information')
  ),
  constraint workshop_recommendations_status_check check (
    status in ('draft', 'proposed', 'accepted', 'declined', 'callback_requested', 'cancelled', 'completed')
  ),
  constraint workshop_recommendations_price_check check (estimated_price is null or estimated_price >= 0),
  constraint workshop_recommendations_duration_check check (
    estimated_duration_minutes is null or estimated_duration_minutes >= 0
  )
);

create table public.recommendation_decisions (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null,
  garage_id uuid not null,
  service_request_id uuid not null,
  action text not null,
  previous_status text not null,
  new_status text not null,
  decided_by uuid references auth.users(id) on delete set null,
  occurred_at timestamptz not null default now(),
  legal_terms_version text,
  legal_privacy_version text,
  displayed_language text,
  note text,
  visible_to_customer boolean not null default true,
  constraint recommendation_decisions_recommendation_garage_fk
    foreign key (recommendation_id, garage_id)
    references public.workshop_recommendations (id, garage_id) on delete cascade,
  constraint recommendation_decisions_request_garage_fk
    foreign key (service_request_id, garage_id)
    references public.service_requests (id, garage_id) on delete cascade,
  constraint recommendation_decisions_action_check check (
    action in ('proposed', 'accepted', 'declined', 'callback_requested', 'question', 'cancelled', 'completed')
  ),
  constraint recommendation_decisions_previous_status_check check (
    previous_status in ('draft', 'proposed', 'accepted', 'declined', 'callback_requested', 'cancelled', 'completed')
  ),
  constraint recommendation_decisions_new_status_check check (
    new_status in ('draft', 'proposed', 'accepted', 'declined', 'callback_requested', 'cancelled', 'completed')
  ),
  constraint recommendation_decisions_language_check check (
    displayed_language is null or displayed_language in ('fr', 'en', 'ar')
  )
);

alter table public.quotes
  add column recommendation_id uuid,
  add column supplemental_to_quote_id uuid;

alter table public.quotes
  add constraint quotes_id_garage_key unique (id, garage_id),
  add constraint quotes_recommendation_garage_fk
    foreign key (recommendation_id, garage_id)
    references public.workshop_recommendations (id, garage_id) on delete set null (recommendation_id),
  add constraint quotes_supplemental_to_garage_fk
    foreign key (supplemental_to_quote_id, garage_id)
    references public.quotes (id, garage_id) on delete set null (supplemental_to_quote_id);

create index workshop_recommendations_request_idx
  on public.workshop_recommendations (service_request_id, created_at desc);
create index workshop_recommendations_garage_status_idx
  on public.workshop_recommendations (garage_id, status, created_at desc);
create index recommendation_decisions_recommendation_idx
  on public.recommendation_decisions (recommendation_id, occurred_at);
create index quotes_recommendation_idx
  on public.quotes (recommendation_id) where recommendation_id is not null;

alter table public.workshop_recommendations enable row level security;
alter table public.recommendation_decisions enable row level security;

create policy workshop_recommendations_staff_select
  on public.workshop_recommendations for select to authenticated
  using (public.is_garage_member(garage_id));

create policy workshop_recommendations_customer_select
  on public.workshop_recommendations for select to authenticated
  using (
    status not in ('draft', 'cancelled')
    and exists (
      select 1 from public.service_requests request
      where request.id = workshop_recommendations.service_request_id
        and request.garage_id = workshop_recommendations.garage_id
        and request.client_id = (select auth.uid())
    )
  );

create policy recommendation_decisions_staff_select
  on public.recommendation_decisions for select to authenticated
  using (public.is_garage_member(garage_id));

create policy recommendation_decisions_customer_select
  on public.recommendation_decisions for select to authenticated
  using (
    visible_to_customer
    and exists (
      select 1 from public.service_requests request
      where request.id = recommendation_decisions.service_request_id
        and request.garage_id = recommendation_decisions.garage_id
        and request.client_id = (select auth.uid())
    )
  );

revoke all on public.workshop_recommendations from anon, authenticated;
revoke all on public.recommendation_decisions from anon, authenticated;
grant select on public.workshop_recommendations to authenticated;
grant select on public.recommendation_decisions to authenticated;

create or replace function public.create_workshop_recommendation(
  p_request_id uuid,
  p_title text,
  p_description text default null,
  p_category text default null,
  p_urgency text default 'recommended',
  p_reason text default null,
  p_estimated_price numeric default null,
  p_estimated_duration_minutes integer default null,
  p_affects_delivery_time boolean default false,
  p_proposed_delivery_at timestamptz default null
)
returns public.workshop_recommendations
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  current_request public.service_requests%rowtype;
  recommendation public.workshop_recommendations%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select * into current_request
  from public.service_requests request
  where request.id = p_request_id;
  if not found then raise exception 'Service request not found' using errcode = 'P0002'; end if;
  if not public.has_garage_role(
    current_request.garage_id,
    array['owner', 'admin', 'advisor', 'front_desk', 'mechanic']
  ) then
    raise exception 'Recommendation creation not permitted' using errcode = '42501';
  end if;
  if nullif(btrim(p_title), '') is null then
    raise exception 'Recommendation title is required' using errcode = '22023';
  end if;
  if p_urgency not in ('critical', 'recommended', 'preventive', 'information') then
    raise exception 'Invalid recommendation urgency' using errcode = '22023';
  end if;
  if p_estimated_price is not null and p_estimated_price < 0 then
    raise exception 'Invalid estimated price' using errcode = '22023';
  end if;
  if p_estimated_duration_minutes is not null and p_estimated_duration_minutes < 0 then
    raise exception 'Invalid estimated duration' using errcode = '22023';
  end if;

  insert into public.workshop_recommendations (
    garage_id, center_id, service_request_id, title, description, category,
    urgency, reason, estimated_price, estimated_duration_minutes,
    affects_delivery_time, proposed_delivery_at, created_by
  ) values (
    current_request.garage_id, current_request.center_id, current_request.id,
    btrim(p_title), nullif(btrim(p_description), ''), nullif(btrim(p_category), ''),
    p_urgency, nullif(btrim(p_reason), ''), p_estimated_price,
    p_estimated_duration_minutes, p_affects_delivery_time,
    p_proposed_delivery_at, (select auth.uid())
  ) returning * into recommendation;
  return recommendation;
end;
$$;

create or replace function public.set_workshop_recommendation_status(
  p_recommendation_id uuid,
  p_new_status text,
  p_note text default null
)
returns public.workshop_recommendations
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  recommendation public.workshop_recommendations%rowtype;
  transition_allowed boolean := false;
  previous_status text;
begin
  select * into recommendation
  from public.workshop_recommendations item
  where item.id = p_recommendation_id
  for update;
  if not found then raise exception 'Recommendation not found' using errcode = 'P0002'; end if;
  if not public.has_garage_role(
    recommendation.garage_id,
    array['owner', 'admin', 'advisor', 'front_desk', 'mechanic']
  ) then
    raise exception 'Recommendation transition not permitted' using errcode = '42501';
  end if;

  transition_allowed := case recommendation.status
    when 'draft' then p_new_status in ('proposed', 'cancelled')
    when 'proposed' then p_new_status = 'cancelled'
    when 'callback_requested' then p_new_status in ('proposed', 'cancelled')
    when 'accepted' then p_new_status in ('completed', 'cancelled')
    when 'declined' then p_new_status = 'cancelled'
    else false
  end;
  if not transition_allowed then
    raise exception 'Invalid recommendation transition from % to %', recommendation.status, p_new_status
      using errcode = '22023';
  end if;

  previous_status := recommendation.status;

  update public.workshop_recommendations
  set status = p_new_status
  where id = recommendation.id
  returning * into recommendation;

  insert into public.recommendation_decisions (
    recommendation_id, garage_id, service_request_id, action,
    previous_status, new_status, decided_by, note
  ) values (
    recommendation.id, recommendation.garage_id, recommendation.service_request_id,
    p_new_status, previous_status, p_new_status, (select auth.uid()),
    nullif(btrim(p_note), '')
  );
  return recommendation;
end;
$$;

create or replace function public.decide_workshop_recommendation(
  p_recommendation_id uuid,
  p_action text,
  p_note text default null,
  p_terms_version text default null,
  p_privacy_version text default null,
  p_displayed_language text default null
)
returns public.workshop_recommendations
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  recommendation public.workshop_recommendations%rowtype;
  request public.service_requests%rowtype;
  new_status text;
  previous_status text;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select * into recommendation
  from public.workshop_recommendations item
  where item.id = p_recommendation_id
  for update;
  if not found then raise exception 'Recommendation not found' using errcode = 'P0002'; end if;
  select * into request from public.service_requests item
  where item.id = recommendation.service_request_id;
  if request.client_id <> (select auth.uid()) then
    raise exception 'Recommendation decision not permitted' using errcode = '42501';
  end if;
  if recommendation.status not in ('proposed', 'callback_requested') then
    raise exception 'Recommendation is not awaiting a decision' using errcode = '22023';
  end if;
  if p_action not in ('accepted', 'declined', 'callback_requested', 'question') then
    raise exception 'Invalid recommendation decision' using errcode = '22023';
  end if;
  if p_displayed_language is not null and p_displayed_language not in ('fr', 'en', 'ar') then
    raise exception 'Invalid displayed language' using errcode = '22023';
  end if;
  if p_action = 'question' and nullif(btrim(p_note), '') is null then
    raise exception 'A question is required' using errcode = '22023';
  end if;

  previous_status := recommendation.status;
  new_status := case when p_action = 'question' then recommendation.status else p_action end;
  update public.workshop_recommendations
  set status = new_status,
      decided_at = case when p_action = 'question' then decided_at else now() end,
      customer_decision_note = nullif(btrim(p_note), '')
  where id = recommendation.id
  returning * into recommendation;

  insert into public.recommendation_decisions (
    recommendation_id, garage_id, service_request_id, action,
    previous_status, new_status, decided_by, legal_terms_version,
    legal_privacy_version, displayed_language, note
  ) values (
    recommendation.id, recommendation.garage_id, recommendation.service_request_id,
    p_action, previous_status, new_status, (select auth.uid()),
    nullif(btrim(p_terms_version), ''), nullif(btrim(p_privacy_version), ''),
    p_displayed_language, nullif(btrim(p_note), '')
  );
  return recommendation;
end;
$$;

create or replace function public.link_recommendation_quote(
  p_recommendation_id uuid,
  p_quote_id uuid,
  p_supplemental_to_quote_id uuid default null
)
returns public.quotes
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  recommendation public.workshop_recommendations%rowtype;
  linked_quote public.quotes%rowtype;
begin
  select * into recommendation from public.workshop_recommendations where id = p_recommendation_id;
  select * into linked_quote from public.quotes where id = p_quote_id for update;
  if recommendation.id is null or linked_quote.id is null then
    raise exception 'Recommendation or quote not found' using errcode = 'P0002';
  end if;
  if recommendation.garage_id <> linked_quote.garage_id
    or recommendation.service_request_id <> linked_quote.service_request_id then
    raise exception 'Recommendation and quote do not belong to the same case' using errcode = '23514';
  end if;
  if not public.is_garage_member(linked_quote.garage_id) then
    raise exception 'Quote link not permitted' using errcode = '42501';
  end if;
  if p_supplemental_to_quote_id is not null and not exists (
    select 1 from public.quotes parent
    where parent.id = p_supplemental_to_quote_id
      and parent.garage_id = linked_quote.garage_id
      and parent.service_request_id = linked_quote.service_request_id
  ) then
    raise exception 'Invalid parent quote' using errcode = '23514';
  end if;

  update public.quotes
  set recommendation_id = recommendation.id,
      supplemental_to_quote_id = p_supplemental_to_quote_id
  where id = linked_quote.id
  returning * into linked_quote;
  return linked_quote;
end;
$$;

-- Keep recommendation linkage when an existing supplemental quote is revised.
-- This replaces only the function definition; no existing quote row changes.
create or replace function public.revise_quote(p_id uuid)
returns public.quotes
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  source_quote public.quotes%rowtype;
  revised_quote public.quotes%rowtype;
begin
  select * into source_quote from public.quotes where id = p_id;
  if source_quote.id is null or not public.is_garage_member(source_quote.garage_id) then
    raise exception 'Quote revision not permitted' using errcode = '42501';
  end if;

  insert into public.quotes (
    garage_id, number, title, status, subtotal, tax_total, total, discount_total,
    notes, conditions, valid_until, client_name, client_phone, client_email,
    vehicle_label, customer_id, vehicle_id, service_request_id, repair_id,
    revised_from, recommendation_id, supplemental_to_quote_id
  ) values (
    source_quote.garage_id, public.next_quote_number(source_quote.garage_id),
    source_quote.title, 'draft', source_quote.subtotal, source_quote.tax_total,
    source_quote.total, source_quote.discount_total, source_quote.notes,
    source_quote.conditions, source_quote.valid_until, source_quote.client_name,
    source_quote.client_phone, source_quote.client_email, source_quote.vehicle_label,
    source_quote.customer_id, source_quote.vehicle_id, source_quote.service_request_id,
    source_quote.repair_id, source_quote.id, source_quote.recommendation_id,
    source_quote.supplemental_to_quote_id
  ) returning * into revised_quote;

  insert into public.quote_lines (
    quote_id, label, quantity, unit_price, tax_rate, line_total, sort_order
  )
  select revised_quote.id, label, quantity, unit_price, tax_rate, line_total, sort_order
  from public.quote_lines where quote_id = p_id;

  return revised_quote;
end;
$$;

revoke all on function public.create_workshop_recommendation(uuid, text, text, text, text, text, numeric, integer, boolean, timestamptz) from public, anon;
revoke all on function public.set_workshop_recommendation_status(uuid, text, text) from public, anon;
revoke all on function public.decide_workshop_recommendation(uuid, text, text, text, text, text) from public, anon;
revoke all on function public.link_recommendation_quote(uuid, uuid, uuid) from public, anon;
revoke all on function public.revise_quote(uuid) from public, anon;
grant execute on function public.create_workshop_recommendation(uuid, text, text, text, text, text, numeric, integer, boolean, timestamptz) to authenticated;
grant execute on function public.set_workshop_recommendation_status(uuid, text, text) to authenticated;
grant execute on function public.decide_workshop_recommendation(uuid, text, text, text, text, text) to authenticated;
grant execute on function public.link_recommendation_quote(uuid, uuid, uuid) to authenticated;
grant execute on function public.revise_quote(uuid) to authenticated;

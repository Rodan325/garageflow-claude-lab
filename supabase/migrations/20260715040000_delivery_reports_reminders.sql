-- Final intervention reports and maintenance reminder engine.

create table public.delivery_reports (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references public.garages(id) on delete cascade,
  center_id uuid,
  service_request_id uuid not null,
  report_number text not null unique,
  status text not null default 'draft',
  customer_snapshot jsonb not null default '{}'::jsonb,
  vehicle_snapshot jsonb not null default '{}'::jsonb,
  entry_mileage integer,
  exit_mileage integer,
  checked_in_at timestamptz,
  delivered_at timestamptz,
  requested_work jsonb not null default '[]'::jsonb,
  diagnostic_summary text,
  completed_work jsonb not null default '[]'::jsonb,
  accepted_recommendations jsonb not null default '[]'::jsonb,
  deferred_recommendations jsonb not null default '[]'::jsonb,
  parts jsonb not null default '[]'::jsonb,
  authorized_attachment_ids uuid[] not null default '{}',
  observations text,
  next_due_date date,
  next_due_mileage integer,
  warranty_terms text,
  final_validation text,
  finalized_by uuid references auth.users(id) on delete set null,
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint delivery_reports_request_unique unique (service_request_id),
  constraint delivery_reports_request_garage_fk
    foreign key (service_request_id, garage_id)
    references public.service_requests (id, garage_id) on delete cascade,
  constraint delivery_reports_center_garage_fk
    foreign key (center_id, garage_id)
    references public.garage_centers (id, garage_id) on delete set null (center_id),
  constraint delivery_reports_status_check check (status in ('draft', 'finalized')),
  constraint delivery_reports_entry_mileage_check check (entry_mileage is null or entry_mileage >= 0),
  constraint delivery_reports_exit_mileage_check check (exit_mileage is null or exit_mileage >= 0),
  constraint delivery_reports_mileage_order_check check (
    entry_mileage is null or exit_mileage is null or exit_mileage >= entry_mileage
  ),
  constraint delivery_reports_next_mileage_check check (next_due_mileage is null or next_due_mileage >= 0),
  constraint delivery_reports_finalization_check check (
    (status = 'draft' and finalized_at is null)
    or (status = 'finalized' and finalized_at is not null)
  )
);

create index delivery_reports_garage_idx on public.delivery_reports (garage_id, created_at desc);
create index delivery_reports_request_garage_fk_idx
  on public.delivery_reports (service_request_id, garage_id);
create index delivery_reports_center_garage_fk_idx
  on public.delivery_reports (center_id, garage_id)
  where center_id is not null;
create index delivery_reports_finalized_by_fk_idx
  on public.delivery_reports (finalized_by)
  where finalized_by is not null;
alter table public.delivery_reports enable row level security;

create policy delivery_reports_staff_select
  on public.delivery_reports for select to authenticated
  using (public.can_manage_garage_center(garage_id, center_id));
create policy delivery_reports_customer_select
  on public.delivery_reports for select to authenticated
  using (
    status = 'finalized'
    and exists (
      select 1 from public.service_requests request
      where request.id = delivery_reports.service_request_id
        and request.garage_id = delivery_reports.garage_id
        and request.client_id = (select auth.uid())
    )
  );

revoke all on public.delivery_reports from anon, authenticated;
grant select on public.delivery_reports to authenticated;

create or replace function public.save_delivery_report(
  p_request_id uuid,
  p_report jsonb,
  p_finalize boolean default false
)
returns public.delivery_reports
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  request public.service_requests%rowtype;
  report public.delivery_reports%rowtype;
  entry_mileage_value integer := nullif(p_report->>'entry_mileage', '')::integer;
  exit_mileage_value integer := nullif(p_report->>'exit_mileage', '')::integer;
  attachment_ids uuid[] := coalesce(
    array(select jsonb_array_elements_text(coalesce(p_report->'authorized_attachment_ids', '[]'::jsonb))::uuid),
    '{}'
  );
begin
  select * into request from public.service_requests where id = p_request_id;
  if not found then raise exception 'Service request not found' using errcode = 'P0002'; end if;
  if not public.has_garage_role(
    request.garage_id,
    array['owner', 'admin', 'advisor', 'front_desk', 'mechanic']
  ) or not public.can_manage_garage_center(request.garage_id, request.center_id) then
    raise exception 'Delivery report not permitted' using errcode = '42501';
  end if;
  select * into report from public.delivery_reports where service_request_id = request.id for update;
  if report.status = 'finalized' then
    raise exception 'Finalized delivery report is immutable' using errcode = '55000';
  end if;
  if (entry_mileage_value is not null and entry_mileage_value < 0)
    or (exit_mileage_value is not null and exit_mileage_value < 0)
    or (entry_mileage_value is not null and exit_mileage_value is not null and exit_mileage_value < entry_mileage_value) then
    raise exception 'Invalid report mileage' using errcode = '22023';
  end if;
  if exists (
    select 1 from unnest(attachment_ids) attachment_id
    where not exists (
      select 1 from public.service_request_attachments attachment
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
    request.garage_id, request.center_id, request.id,
    'RI-' || to_char(current_date, 'YYYY') || '-' || upper(substr(gen_random_uuid()::text, 1, 8)),
    case when p_finalize then 'finalized' else 'draft' end,
    coalesce(p_report->'customer_snapshot', '{}'::jsonb),
    coalesce(p_report->'vehicle_snapshot', '{}'::jsonb),
    entry_mileage_value, exit_mileage_value,
    coalesce(nullif(p_report->>'checked_in_at', '')::timestamptz, request.vehicle_checked_in_at),
    coalesce(nullif(p_report->>'delivered_at', '')::timestamptz, request.vehicle_delivered_at),
    case when jsonb_typeof(p_report->'requested_work') = 'array' then p_report->'requested_work' else '[]'::jsonb end,
    nullif(btrim(p_report->>'diagnostic_summary'), ''),
    case when jsonb_typeof(p_report->'completed_work') = 'array' then p_report->'completed_work' else '[]'::jsonb end,
    case when jsonb_typeof(p_report->'accepted_recommendations') = 'array' then p_report->'accepted_recommendations' else '[]'::jsonb end,
    case when jsonb_typeof(p_report->'deferred_recommendations') = 'array' then p_report->'deferred_recommendations' else '[]'::jsonb end,
    case when jsonb_typeof(p_report->'parts') = 'array' then p_report->'parts' else '[]'::jsonb end,
    attachment_ids, nullif(btrim(p_report->>'observations'), ''),
    nullif(p_report->>'next_due_date', '')::date,
    nullif(p_report->>'next_due_mileage', '')::integer,
    nullif(btrim(p_report->>'warranty_terms'), ''),
    nullif(btrim(p_report->>'final_validation'), ''),
    case when p_finalize then (select auth.uid()) else null end,
    case when p_finalize then now() else null end, now()
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

revoke all on function public.save_delivery_report(uuid, jsonb, boolean) from public, anon;
grant execute on function public.save_delivery_report(uuid, jsonb, boolean) to authenticated;

create table public.maintenance_reminders (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references public.garages(id) on delete cascade,
  center_id uuid,
  client_id uuid not null references public.profiles(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  client_vehicle_id uuid references public.client_vehicles(id) on delete set null,
  service_request_id uuid,
  reminder_type text not null,
  title text not null,
  due_date date,
  due_mileage integer,
  status text not null default 'scheduled',
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  converted_request_id uuid,
  source text not null default 'manual',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint maintenance_reminders_center_garage_fk
    foreign key (center_id, garage_id)
    references public.garage_centers (id, garage_id) on delete set null (center_id),
  constraint maintenance_reminders_request_garage_fk
    foreign key (service_request_id, garage_id)
    references public.service_requests (id, garage_id) on delete set null (service_request_id),
  constraint maintenance_reminders_converted_request_garage_fk
    foreign key (converted_request_id, garage_id)
    references public.service_requests (id, garage_id) on delete set null (converted_request_id),
  constraint maintenance_reminders_type_check check (
    reminder_type in ('fixed_date', 'after_service', 'mileage', 'date_or_mileage', 'seasonal_campaign')
  ),
  constraint maintenance_reminders_status_check check (
    status in ('scheduled', 'sent', 'opened', 'converted', 'ignored', 'cancelled')
  ),
  constraint maintenance_reminders_trigger_check check (due_date is not null or due_mileage is not null),
  constraint maintenance_reminders_mileage_check check (due_mileage is null or due_mileage >= 0)
);

create index maintenance_reminders_due_idx
  on public.maintenance_reminders (status, due_date, scheduled_at)
  where status in ('scheduled', 'sent', 'opened');
create index maintenance_reminders_garage_idx
  on public.maintenance_reminders (garage_id, created_at desc);
create index maintenance_reminders_client_idx
  on public.maintenance_reminders (client_id, created_at desc);
create index maintenance_reminders_center_garage_fk_idx
  on public.maintenance_reminders (center_id, garage_id)
  where center_id is not null;
create index maintenance_reminders_vehicle_fk_idx
  on public.maintenance_reminders (vehicle_id)
  where vehicle_id is not null;
create index maintenance_reminders_client_vehicle_fk_idx
  on public.maintenance_reminders (client_vehicle_id)
  where client_vehicle_id is not null;
create index maintenance_reminders_request_garage_fk_idx
  on public.maintenance_reminders (service_request_id, garage_id)
  where service_request_id is not null;
create index maintenance_reminders_converted_request_garage_fk_idx
  on public.maintenance_reminders (converted_request_id, garage_id)
  where converted_request_id is not null;
create index maintenance_reminders_created_by_fk_idx
  on public.maintenance_reminders (created_by)
  where created_by is not null;
create unique index maintenance_reminders_active_dedupe_idx
  on public.maintenance_reminders (
    garage_id,
    client_id,
    coalesce(vehicle_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(client_vehicle_id, '00000000-0000-0000-0000-000000000000'::uuid),
    reminder_type,
    coalesce(due_date, 'infinity'::date),
    coalesce(due_mileage, -1),
    source
  )
  where status in ('scheduled', 'sent', 'opened');

alter table public.maintenance_reminders enable row level security;
create policy maintenance_reminders_staff_select
  on public.maintenance_reminders for select to authenticated
  using (public.can_manage_garage_center(garage_id, center_id));
create policy maintenance_reminders_client_select
  on public.maintenance_reminders for select to authenticated
  using (client_id = (select auth.uid()));

revoke all on public.maintenance_reminders from anon, authenticated;
grant select on public.maintenance_reminders to authenticated;

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
set search_path = pg_catalog, public
as $$
declare reminder public.maintenance_reminders%rowtype;
begin
  if not public.has_garage_role(p_garage_id, array['owner', 'admin', 'advisor', 'front_desk']) then
    raise exception 'Reminder creation not permitted' using errcode = '42501';
  end if;
  if not public.can_manage_garage_center(p_garage_id, p_center_id) then
    raise exception 'Reminder creation not permitted for this center' using errcode = '42501';
  end if;
  if p_due_date is null and p_due_mileage is null then
    raise exception 'A date or mileage is required' using errcode = '22023';
  end if;
  if p_language not in ('fr', 'en', 'ar') then
    raise exception 'Invalid reminder language' using errcode = '22023';
  end if;
  if p_center_id is not null and not exists (
    select 1 from public.garage_centers center where center.id = p_center_id and center.garage_id = p_garage_id
  ) then raise exception 'Invalid reminder center' using errcode = '23514'; end if;
  if p_service_request_id is not null and not exists (
    select 1 from public.service_requests request
    where request.id = p_service_request_id and request.garage_id = p_garage_id and request.client_id = p_client_id
  ) then raise exception 'Invalid reminder request' using errcode = '23514'; end if;
  if p_vehicle_id is not null and not exists (
    select 1 from public.vehicles vehicle where vehicle.id = p_vehicle_id and vehicle.garage_id = p_garage_id
  ) then raise exception 'Invalid reminder vehicle' using errcode = '23514'; end if;
  if p_client_vehicle_id is not null and not exists (
    select 1 from public.client_vehicles vehicle where vehicle.id = p_client_vehicle_id and vehicle.client_id = p_client_id
  ) then raise exception 'Invalid client vehicle' using errcode = '23514'; end if;

  insert into public.maintenance_reminders (
    garage_id, center_id, client_id, vehicle_id, client_vehicle_id,
    service_request_id, reminder_type, title, due_date, due_mileage,
    scheduled_at, source, created_by
  ) values (
    p_garage_id, p_center_id, p_client_id, p_vehicle_id, p_client_vehicle_id,
    p_service_request_id, p_reminder_type, btrim(p_title), p_due_date,
    p_due_mileage, p_scheduled_at, p_source, (select auth.uid())
  ) returning * into reminder;
  insert into public.notification_outbox (
    garage_id, center_id, service_request_id, recipient_user_id, recipient_address,
    channel, template_key, language, payload, scheduled_at
  ) values (
    reminder.garage_id, reminder.center_id, reminder.service_request_id,
    reminder.client_id, reminder.client_id::text, 'in_app', 'maintenance_reminder',
    p_language, jsonb_build_object('reminder_id', reminder.id), p_scheduled_at
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
set search_path = pg_catalog, public
as $$
declare reminder public.maintenance_reminders%rowtype;
begin
  select * into reminder from public.maintenance_reminders where id = p_reminder_id for update;
  if not found then raise exception 'Reminder not found' using errcode = 'P0002'; end if;
  if not public.is_garage_member(reminder.garage_id) and reminder.client_id <> (select auth.uid()) then
    raise exception 'Reminder conversion not permitted' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.service_requests request
    where request.id = p_request_id and request.garage_id = reminder.garage_id
      and request.client_id = reminder.client_id
  ) then raise exception 'Invalid converted request' using errcode = '23514'; end if;
  update public.maintenance_reminders
  set status = 'converted', converted_request_id = p_request_id
  where id = reminder.id returning * into reminder;
  return reminder;
end;
$$;

revoke all on function public.create_maintenance_reminder(uuid, uuid, uuid, uuid, uuid, uuid, text, text, date, integer, timestamptz, text, text) from public, anon;
revoke all on function public.mark_maintenance_reminder_converted(uuid, uuid) from public, anon;
grant execute on function public.create_maintenance_reminder(uuid, uuid, uuid, uuid, uuid, uuid, text, text, date, integer, timestamptz, text, text) to authenticated;
grant execute on function public.mark_maintenance_reminder_converted(uuid, uuid) to authenticated;

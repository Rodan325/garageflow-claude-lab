-- Generic organization roles and a protected multi-center comparison RPC.
-- `garages` remains the customer organization for backward compatibility;
-- `garage_centers` represents physical establishments.

alter table public.appointments add column center_id uuid;

alter table public.appointments
  add constraint appointments_center_garage_fk
  foreign key (center_id, garage_id)
  references public.garage_centers (id, garage_id)
  on delete set null (center_id);

create index appointments_center_starts_idx
  on public.appointments (center_id, starts_at);

update public.appointments appointment
set center_id = request.center_id
from public.service_requests request
where request.id = appointment.service_request_id
  and request.garage_id = appointment.garage_id
  and appointment.center_id is null;

alter table public.garage_members
  add column organization_role text,
  add column center_role text;

alter table public.garage_members
  add constraint garage_members_organization_role_check check (
    organization_role is null or organization_role in (
      'organization_owner', 'network_admin', 'regional_manager', 'viewer'
    )
  ),
  add constraint garage_members_center_role_check check (
    center_role is null or center_role in (
      'center_manager', 'service_advisor', 'front_desk', 'technician', 'viewer'
    )
  ),
  add constraint garage_members_center_role_scope_check check (
    center_role is null or center_id is not null
  );

comment on column public.garage_members.organization_role is
  'Optional organization-wide role. Existing role remains authoritative until migration to generic roles is complete.';
comment on column public.garage_members.center_role is
  'Optional establishment role scoped by center_id. Existing role is preserved for compatibility.';

create or replace function public.can_view_network_dashboard(p_garage_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.garage_members member
    where member.garage_id = p_garage_id
      and member.user_id = (select auth.uid())
      and member.status = 'active'
      and (
        member.role in ('owner', 'admin')
        or member.organization_role in ('organization_owner', 'network_admin', 'regional_manager')
      )
  );
$$;

revoke all on function public.can_view_network_dashboard(uuid) from public, anon;
grant execute on function public.can_view_network_dashboard(uuid) to authenticated;

create or replace function public.get_network_dashboard(
  p_garage_id uuid,
  p_start timestamptz default null,
  p_end timestamptz default null
)
returns table (
  center_id uuid,
  center_name text,
  appointments bigint,
  interventions bigint,
  quote_amount numeric,
  accepted_amount numeric,
  acceptance_rate numeric,
  average_decision_hours numeric,
  average_intervention_hours numeric,
  vehicles_waiting bigint,
  delays bigint,
  reminders_converted bigint,
  satisfaction numeric
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  if not public.can_view_network_dashboard(p_garage_id) then
    raise exception 'Network dashboard not permitted' using errcode = '42501';
  end if;
  return query
  with request_metrics as (
    select
      request.center_id,
      count(*) filter (
        where (p_start is null or request.created_at >= p_start)
          and (p_end is null or request.created_at < p_end)
      ) as interventions,
      count(*) filter (
        where request.workshop_stage not in ('vehicle_delivered', 'closed')
      ) as vehicles_waiting,
      count(*) filter (
        where request.estimated_completion_at < now()
          and request.workshop_stage not in ('vehicle_delivered', 'closed')
      ) as delays,
      avg(extract(epoch from (request.vehicle_delivered_at - request.vehicle_checked_in_at)) / 3600)
        filter (where request.vehicle_checked_in_at is not null and request.vehicle_delivered_at is not null)
        as average_intervention_hours
    from public.service_requests request
    where request.garage_id = p_garage_id and request.center_id is not null
    group by request.center_id
  ), appointment_metrics as (
    select appointment.center_id, count(*) as appointments
    from public.appointments appointment
    where appointment.garage_id = p_garage_id and appointment.center_id is not null
      and (p_start is null or appointment.starts_at >= p_start)
      and (p_end is null or appointment.starts_at < p_end)
    group by appointment.center_id
  ), quote_metrics as (
    select
      request.center_id,
      coalesce(sum(quote.total), 0) as quote_amount,
      coalesce(sum(quote.total) filter (where quote.status = 'accepted'), 0) as accepted_amount,
      count(*) filter (where quote.status = 'accepted')::numeric
        / nullif(count(*) filter (where quote.status in ('accepted', 'declined')), 0) as acceptance_rate,
      avg(extract(epoch from (coalesce(quote.accepted_at, quote.declined_at) - quote.sent_at)) / 3600)
        filter (where quote.status in ('accepted', 'declined') and quote.sent_at is not null) as average_decision_hours
    from public.quotes quote
    join public.service_requests request
      on request.id = quote.service_request_id and request.garage_id = quote.garage_id
    where quote.garage_id = p_garage_id and request.center_id is not null
      and (p_start is null or quote.created_at >= p_start)
      and (p_end is null or quote.created_at < p_end)
    group by request.center_id
  ), reminder_metrics as (
    select reminder.center_id, count(*) filter (where reminder.status = 'converted') as reminders_converted
    from public.maintenance_reminders reminder
    where reminder.garage_id = p_garage_id and reminder.center_id is not null
    group by reminder.center_id
  )
  select
    center.id,
    center.name,
    coalesce(appointment_metrics.appointments, 0),
    coalesce(request_metrics.interventions, 0),
    coalesce(quote_metrics.quote_amount, 0),
    coalesce(quote_metrics.accepted_amount, 0),
    quote_metrics.acceptance_rate,
    quote_metrics.average_decision_hours,
    request_metrics.average_intervention_hours,
    coalesce(request_metrics.vehicles_waiting, 0),
    coalesce(request_metrics.delays, 0),
    coalesce(reminder_metrics.reminders_converted, 0),
    null::numeric
  from public.garage_centers center
  left join request_metrics on request_metrics.center_id = center.id
  left join appointment_metrics on appointment_metrics.center_id = center.id
  left join quote_metrics on quote_metrics.center_id = center.id
  left join reminder_metrics on reminder_metrics.center_id = center.id
  where center.garage_id = p_garage_id and center.is_active
  order by center.sort_order, center.name;
end;
$$;

revoke all on function public.get_network_dashboard(uuid, timestamptz, timestamptz) from public, anon;
grant execute on function public.get_network_dashboard(uuid, timestamptz, timestamptz) to authenticated;

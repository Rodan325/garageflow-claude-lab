-- Private service-request attachments and provider-neutral notification outbox.
-- No external provider is called by database code. Storage remains private.

create schema if not exists private;
revoke all on schema private from public;

create table public.service_request_attachments (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references public.garages(id) on delete cascade,
  center_id uuid,
  service_request_id uuid not null,
  recommendation_id uuid,
  uploaded_by uuid references auth.users(id) on delete set null,
  file_name text not null,
  mime_type text not null,
  file_size bigint not null,
  storage_path text not null unique,
  visibility text not null default 'internal',
  document_type text not null default 'other',
  created_at timestamptz not null default now(),
  constraint service_request_attachments_request_garage_fk
    foreign key (service_request_id, garage_id)
    references public.service_requests (id, garage_id) on delete cascade,
  constraint service_request_attachments_center_garage_fk
    foreign key (center_id, garage_id)
    references public.garage_centers (id, garage_id)
    on delete set null (center_id),
  constraint service_request_attachments_recommendation_garage_fk
    foreign key (recommendation_id, garage_id)
    references public.workshop_recommendations (id, garage_id)
    on delete set null (recommendation_id),
  constraint service_request_attachments_visibility_check
    check (visibility in ('internal', 'customer', 'both')),
  constraint service_request_attachments_document_type_check
    check (document_type in ('photo', 'video', 'diagnostic', 'quote', 'invoice', 'report', 'other')),
  constraint service_request_attachments_mime_check check (
    mime_type in (
      'image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime',
      'application/pdf', 'text/plain', 'text/csv'
    )
  ),
  constraint service_request_attachments_size_check
    check (file_size > 0 and file_size <= 26214400),
  constraint service_request_attachments_name_check
    check (length(file_name) between 1 and 180)
);

create index service_request_attachments_request_idx
  on public.service_request_attachments (service_request_id, created_at desc);
create index service_request_attachments_garage_idx
  on public.service_request_attachments (garage_id, created_at desc);
create index service_request_attachments_request_garage_fk_idx
  on public.service_request_attachments (service_request_id, garage_id);
create index service_request_attachments_center_garage_fk_idx
  on public.service_request_attachments (center_id, garage_id)
  where center_id is not null;
create index service_request_attachments_recommendation_garage_fk_idx
  on public.service_request_attachments (recommendation_id, garage_id)
  where recommendation_id is not null;
create index service_request_attachments_uploaded_by_fk_idx
  on public.service_request_attachments (uploaded_by)
  where uploaded_by is not null;

alter table public.service_request_attachments enable row level security;

create policy service_request_attachments_staff_select
  on public.service_request_attachments for select to authenticated
  using (public.can_manage_garage_center(garage_id, center_id));

create policy service_request_attachments_customer_select
  on public.service_request_attachments for select to authenticated
  using (
    visibility in ('customer', 'both')
    and exists (
      select 1 from public.service_requests request
      where request.id = service_request_attachments.service_request_id
        and request.garage_id = service_request_attachments.garage_id
        and request.client_id = (select auth.uid())
    )
  );

revoke all on public.service_request_attachments from anon, authenticated;
grant select on public.service_request_attachments to authenticated;

-- Private bucket. A horizontal brand logo is never used as an attachment icon.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'service-request-attachments',
  'service-request-attachments',
  false,
  26214400,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime',
    'application/pdf', 'text/plain', 'text/csv'
  ]
)
on conflict (id) do nothing;

-- Storage writes object metadata after reserving the row, so INSERT policies
-- cannot reliably inspect the final size. Enforce the lower bound and mirror
-- the bucket limits when metadata becomes available.
create or replace function private.guard_service_attachment_object()
returns trigger
language plpgsql
set search_path = pg_catalog, storage
as $$
declare
  object_size bigint;
  object_mime text;
begin
  if new.bucket_id <> 'service-request-attachments'
    or new.metadata is null
    or not (new.metadata ? 'size') then
    return new;
  end if;
  if coalesce(new.metadata->>'size', '') !~ '^[0-9]+$' then
    raise exception 'Attachment object size is required' using errcode = '22023';
  end if;
  object_size := (new.metadata->>'size')::bigint;
  object_mime := lower(coalesce(new.metadata->>'mimetype', ''));
  if object_size not between 1 and 26214400 then
    raise exception 'Attachment object size is invalid' using errcode = '22023';
  end if;
  if object_mime not in (
    'image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime',
    'application/pdf', 'text/plain', 'text/csv'
  ) then
    raise exception 'Attachment object MIME type is invalid' using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger guard_service_attachment_object_metadata
before insert or update of metadata on storage.objects
for each row execute function private.guard_service_attachment_object();

-- Path contract: <garage_uuid>/<request_uuid>/<random>-<safe-file-name>.
create policy service_attachments_staff_read_objects
  on storage.objects for select to authenticated
  using (
    bucket_id = 'service-request-attachments'
    and exists (
      select 1
      from public.service_requests request
      where request.garage_id::text = (storage.foldername(name))[1]
        and request.id::text = (storage.foldername(name))[2]
        and public.can_manage_garage_center(request.garage_id, request.center_id)
    )
  );

create policy service_attachments_customer_read_objects
  on storage.objects for select to authenticated
  using (
    bucket_id = 'service-request-attachments'
    and exists (
      select 1
      from public.service_request_attachments attachment
      join public.service_requests request on request.id = attachment.service_request_id
      where attachment.storage_path = storage.objects.name
        and attachment.visibility in ('customer', 'both')
        and request.client_id = (select auth.uid())
        and request.garage_id = attachment.garage_id
    )
  );

create policy service_attachments_staff_insert_objects
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'service-request-attachments'
    and array_length(storage.foldername(name), 1) >= 2
    and exists (
      select 1
      from public.service_requests request
      where request.id::text = (storage.foldername(name))[2]
        and request.garage_id::text = (storage.foldername(name))[1]
        and public.can_manage_garage_center(request.garage_id, request.center_id)
    )
  );

create policy service_attachments_staff_delete_objects
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'service-request-attachments'
    and (
      owner_id = (select auth.uid())::text
      or exists (
      select 1 from public.service_request_attachments attachment
      where attachment.storage_path = storage.objects.name
        and (
          attachment.uploaded_by = (select auth.uid())
          or (
            public.has_garage_role(attachment.garage_id, array['owner', 'admin'])
            and public.can_manage_garage_center(attachment.garage_id, attachment.center_id)
          )
        )
      )
    )
  );

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
set search_path = pg_catalog, public, storage
as $$
declare
  current_request public.service_requests%rowtype;
  attachment public.service_request_attachments%rowtype;
  extension text;
begin
  select * into current_request
  from public.service_requests request where request.id = p_request_id;
  if not found then raise exception 'Service request not found' using errcode = 'P0002'; end if;
  if not public.can_manage_garage_center(
    current_request.garage_id,
    current_request.center_id
  ) then
    raise exception 'Attachment registration not permitted' using errcode = '42501';
  end if;
  if p_recommendation_id is not null and not exists (
    select 1 from public.workshop_recommendations recommendation
    where recommendation.id = p_recommendation_id
      and recommendation.garage_id = current_request.garage_id
      and recommendation.service_request_id = current_request.id
  ) then
    raise exception 'Invalid recommendation attachment' using errcode = '23514';
  end if;
  if p_storage_path not like current_request.garage_id::text || '/' || current_request.id::text || '/%' then
    raise exception 'Invalid attachment path' using errcode = '23514';
  end if;
  extension := lower(split_part(p_file_name, '.', array_length(string_to_array(p_file_name, '.'), 1)));
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
    or p_document_type not in ('photo', 'video', 'diagnostic', 'quote', 'invoice', 'report', 'other') then
    raise exception 'Invalid attachment metadata' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(current_request.id::text, 0));
  if (select count(*) from public.service_request_attachments where service_request_id = current_request.id) >= 20 then
    raise exception 'Attachment limit reached' using errcode = '54000';
  end if;
  if not exists (
    select 1 from storage.objects object
    where object.bucket_id = 'service-request-attachments'
      and object.name = p_storage_path
      and lower(coalesce(object.metadata->>'mimetype', '')) = p_mime_type
  ) then
    raise exception 'Uploaded object not found' using errcode = 'P0002';
  end if;

  insert into public.service_request_attachments (
    garage_id, center_id, service_request_id, recommendation_id, uploaded_by,
    file_name, mime_type, file_size, storage_path, visibility, document_type
  ) values (
    current_request.garage_id, current_request.center_id, current_request.id,
    p_recommendation_id, (select auth.uid()), left(p_file_name, 180), p_mime_type,
    p_file_size, p_storage_path, p_visibility, p_document_type
  ) returning * into attachment;
  return attachment;
end;
$$;

revoke all on function public.register_service_request_attachment(uuid, uuid, text, text, bigint, text, text, text) from public, anon;
grant execute on function public.register_service_request_attachment(uuid, uuid, text, text, bigint, text, text, text) to authenticated;

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references public.garages(id) on delete cascade,
  center_id uuid,
  service_request_id uuid,
  recipient_user_id uuid references auth.users(id) on delete set null,
  recipient_address text,
  channel text not null,
  template_key text not null,
  language text not null default 'fr',
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  provider text,
  provider_message_id text,
  attempts integer not null default 0,
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  failed_at timestamptz,
  error_code text,
  created_at timestamptz not null default now(),
  constraint notification_outbox_center_garage_fk
    foreign key (center_id, garage_id)
    references public.garage_centers (id, garage_id) on delete set null (center_id),
  constraint notification_outbox_request_garage_fk
    foreign key (service_request_id, garage_id)
    references public.service_requests (id, garage_id) on delete cascade,
  constraint notification_outbox_channel_check check (channel in ('in_app', 'email', 'sms', 'push')),
  constraint notification_outbox_template_check check (template_key in (
    'appointment_confirmed', 'vehicle_received', 'approval_required',
    'quote_available', 'recommendation_available', 'message_received',
    'delivery_time_changed', 'vehicle_ready', 'vehicle_delivered', 'maintenance_reminder'
  )),
  constraint notification_outbox_language_check check (language in ('fr', 'en', 'ar')),
  constraint notification_outbox_status_check check (
    status in ('pending', 'processing', 'simulated', 'sent', 'failed', 'cancelled')
  ),
  constraint notification_outbox_attempts_check check (attempts >= 0)
);

create index notification_outbox_dispatch_idx
  on public.notification_outbox (status, scheduled_at) where status in ('pending', 'failed');
create index notification_outbox_garage_idx
  on public.notification_outbox (garage_id, created_at desc);
create index notification_outbox_recipient_idx
  on public.notification_outbox (recipient_user_id, created_at desc) where channel = 'in_app';
create index notification_outbox_center_garage_fk_idx
  on public.notification_outbox (center_id, garage_id)
  where center_id is not null;
create index notification_outbox_request_garage_fk_idx
  on public.notification_outbox (service_request_id, garage_id)
  where service_request_id is not null;
create index notification_outbox_recipient_user_fk_idx
  on public.notification_outbox (recipient_user_id)
  where recipient_user_id is not null;

alter table public.notification_outbox enable row level security;

create policy notification_outbox_staff_select
  on public.notification_outbox for select to authenticated
  using (public.can_manage_garage_center(garage_id, center_id));
create policy notification_outbox_recipient_select
  on public.notification_outbox for select to authenticated
  using (channel = 'in_app' and recipient_user_id = (select auth.uid()));

revoke all on public.notification_outbox from anon, authenticated;
grant select on public.notification_outbox to authenticated;

create or replace function private.queue_request_notification()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  request public.service_requests%rowtype;
  event_key text;
begin
  select * into request from public.service_requests where id = new.request_id;
  event_key := case new.new_stage
    when 'appointment_confirmed' then 'appointment_confirmed'
    when 'vehicle_received' then 'vehicle_received'
    when 'customer_approval_required' then 'approval_required'
    when 'vehicle_ready' then 'vehicle_ready'
    when 'vehicle_delivered' then 'vehicle_delivered'
    else null
  end;
  if event_key is not null and new.visible_to_customer then
    insert into public.notification_outbox (
      garage_id, center_id, service_request_id, recipient_user_id,
      channel, template_key, language, payload
    ) values (
      new.garage_id, new.center_id, new.request_id, request.client_id,
      'in_app', event_key, 'fr', jsonb_build_object('stage', new.new_stage)
    );
  end if;
  return new;
end;
$$;

create trigger queue_workshop_timeline_notification
after insert on public.service_request_timeline
for each row execute function private.queue_request_notification();

create or replace function private.queue_recommendation_notification()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  request public.service_requests%rowtype;
begin
  if new.status = 'proposed' and old.status is distinct from new.status then
    select * into request from public.service_requests where id = new.service_request_id;
    insert into public.notification_outbox (
      garage_id, center_id, service_request_id, recipient_user_id,
      channel, template_key, language, payload
    ) values (
      new.garage_id, new.center_id, new.service_request_id, request.client_id,
      'in_app', 'recommendation_available', 'fr',
      jsonb_build_object('recommendation_id', new.id)
    );
  end if;
  return new;
end;
$$;

create trigger queue_workshop_recommendation_notification
after update of status on public.workshop_recommendations
for each row execute function private.queue_recommendation_notification();

create or replace function private.queue_quote_notification()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  request public.service_requests%rowtype;
begin
  if new.status = 'sent' and old.status is distinct from new.status and new.service_request_id is not null then
    select * into request from public.service_requests where id = new.service_request_id;
    insert into public.notification_outbox (
      garage_id, center_id, service_request_id, recipient_user_id,
      channel, template_key, language, payload
    ) values (
      new.garage_id, request.center_id, new.service_request_id, request.client_id,
      'in_app', 'quote_available', 'fr', jsonb_build_object('quote_id', new.id)
    );
  end if;
  return new;
end;
$$;

create trigger queue_quote_available_notification
after update of status on public.quotes
for each row execute function private.queue_quote_notification();

revoke all on function private.guard_service_attachment_object() from public, anon, authenticated;
revoke all on function private.queue_request_notification() from public, anon, authenticated;
revoke all on function private.queue_recommendation_notification() from public, anon, authenticated;
revoke all on function private.queue_quote_notification() from public, anon, authenticated;

-- Route all ordinary-user legal acceptance writes through a current-document
-- RPC. Existing evidence is preserved byte-for-byte: this migration performs
-- no UPDATE, DELETE or backfill on public.legal_acceptances.

revoke insert, update, delete on table public.legal_acceptances from anon, authenticated;
grant select on table public.legal_acceptances to authenticated;

drop policy if exists "Users can insert own legal acceptances"
  on public.legal_acceptances;

create or replace function public.get_current_legal_acceptance_status_v2(
  p_document_key text,
  p_language text,
  p_organization_id uuid default null
)
returns table (
  accepted boolean,
  "current" boolean,
  can_accept boolean,
  reason text,
  document_key text,
  document_version text,
  document_sha256 text,
  organization_id uuid,
  acceptance_scope text,
  accepted_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_document private.legal_document_versions%rowtype;
  v_member_role text;
  v_organization_role text;
  v_center_id uuid;
  v_can_accept boolean := false;
  v_accepted_at timestamptz;
  v_reason text;
begin
  if v_actor_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  if p_language not in ('fr', 'en', 'ar') then
    raise exception using errcode = '22023', message = 'Unsupported legal document language';
  end if;

  -- Historical and non-contractual keys never enter the acceptance pipeline.
  if p_document_key = 'pilot_agreement'
    or p_document_key not in ('terms_pro', 'terms_client', 'dpa') then
    raise exception using errcode = '22023', message = 'Legal document is not acceptable';
  end if;

  select document.*
  into v_document
  from private.legal_document_versions document
  where document.document_id = p_document_key
    and document.language = p_language
    and document.status = 'effective'
    and document.effective_at is not null
    and document.effective_at <= pg_catalog.now()
    and document.requires_acceptance
    and document.acceptance_scope in ('user', 'organization')
    and not (
      document.document_id = 'dpa'
      and document.document_version = '2026-07-02'
    )
  order by document.effective_at desc, document.created_at desc, document.document_version desc
  limit 1;

  if not found then
    return query
      select
        false,
        false,
        false,
        'no_current_document'::text,
        p_document_key,
        null::text,
        null::text,
        p_organization_id,
        null::text,
        null::timestamptz;
    return;
  end if;

  if v_document.acceptance_scope = 'organization' then
    if p_organization_id is null then
      return query
        select
          false,
          true,
          false,
          'organization_required'::text,
          v_document.document_id,
          v_document.document_version,
          v_document.sha256,
          null::uuid,
          v_document.acceptance_scope,
          null::timestamptz;
      return;
    end if;

    select member.role, member.organization_role, member.center_id
    into v_member_role, v_organization_role, v_center_id
    from public.garage_members member
    where member.user_id = v_actor_id
      and member.garage_id = p_organization_id
      and member.status = 'active'
    limit 1;

    if not found then
      raise exception using errcode = '42501', message = 'Organization membership required';
    end if;

    v_can_accept := (
      coalesce(v_organization_role in ('organization_owner', 'network_admin'), false)
      or (
        v_organization_role is null
        and v_center_id is null
        and v_member_role in ('owner', 'admin')
      )
    );

    select acceptance.accepted_at
    into v_accepted_at
    from public.legal_acceptances acceptance
    join private.legal_document_versions accepted_document
      on accepted_document.document_id = acceptance.document_id
      and accepted_document.document_version = acceptance.document_version
      and accepted_document.language = acceptance.displayed_language
      and accepted_document.sha256 = acceptance.document_sha256
    where acceptance.organization_id = p_organization_id
      and acceptance.document_id = v_document.document_id
      and acceptance.document_version = v_document.document_version
      and acceptance.document_status = 'effective'
      and acceptance.acceptance_scope = 'organization'
      and accepted_document.status = 'effective'
      and accepted_document.effective_at is not null
      and accepted_document.effective_at <= pg_catalog.now()
    order by acceptance.accepted_at asc
    limit 1;
  else
    if p_organization_id is not null then
      raise exception using errcode = '22023', message = 'User acceptance must not claim an organization';
    end if;

    v_can_accept := true;
    select acceptance.accepted_at
    into v_accepted_at
    from public.legal_acceptances acceptance
    join private.legal_document_versions accepted_document
      on accepted_document.document_id = acceptance.document_id
      and accepted_document.document_version = acceptance.document_version
      and accepted_document.language = acceptance.displayed_language
      and accepted_document.sha256 = acceptance.document_sha256
    where acceptance.user_id = v_actor_id
      and acceptance.organization_id is null
      and acceptance.document_id = v_document.document_id
      and acceptance.document_version = v_document.document_version
      and acceptance.document_status = 'effective'
      and acceptance.acceptance_scope = 'user'
      and accepted_document.status = 'effective'
      and accepted_document.effective_at is not null
      and accepted_document.effective_at <= pg_catalog.now()
    order by acceptance.accepted_at asc
    limit 1;
  end if;

  v_reason := case
    when v_accepted_at is not null then 'accepted'
    when v_can_accept then 'acceptance_available'
    else 'authorized_representative_required'
  end;

  return query
    select
      v_accepted_at is not null,
      true,
      v_can_accept,
      v_reason,
      v_document.document_id,
      v_document.document_version,
      v_document.sha256,
      case
        when v_document.acceptance_scope = 'organization' then p_organization_id
        else null::uuid
      end,
      v_document.acceptance_scope,
      v_accepted_at;
end;
$$;

create or replace function public.accept_current_legal_document_v2(
  p_document_key text,
  p_language text,
  p_organization_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_status record;
  v_document private.legal_document_versions%rowtype;
  v_authority_role text;
  v_organization_name text;
  v_acceptance_id uuid;
  v_legal_role text;
begin
  if v_actor_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  if p_document_key = 'pilot_agreement'
    or p_document_key not in ('terms_pro', 'terms_client', 'dpa') then
    raise exception using errcode = '22023', message = 'Legal document is not acceptable';
  end if;

  select status.*
  into v_status
  from public.get_current_legal_acceptance_status_v2(
    p_document_key,
    p_language,
    p_organization_id
  ) status;

  if not v_status."current" then
    raise exception using errcode = '23514', message = 'No current acceptable legal document';
  end if;

  -- Even an idempotent call requires current authority. A simple member cannot
  -- probe or reuse an organization proof by calling the RPC manually.
  if not v_status.can_accept then
    raise exception using errcode = '42501', message = 'Legal acceptance authority required';
  end if;

  select document.*
  into strict v_document
  from private.legal_document_versions document
  where document.document_id = v_status.document_key
    and document.document_version = v_status.document_version
    and document.language = p_language
    and document.sha256 = v_status.document_sha256
    and document.status = 'effective'
    and document.effective_at is not null
    and document.effective_at <= pg_catalog.now()
    and document.requires_acceptance
  for share;

  -- Serialize acceptances for the same current subject/document/version so
  -- concurrent calls in different languages remain idempotent.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      pg_catalog.concat_ws(
        ':',
        v_document.acceptance_scope,
        coalesce(p_organization_id::text, v_actor_id::text),
        v_document.document_id,
        v_document.document_version
      ),
      0
    )
  );

  if v_document.acceptance_scope = 'organization' then
    select
      case
        when member.organization_role in ('organization_owner', 'network_admin')
          then member.organization_role
        when member.organization_role is null
          and member.center_id is null
          and member.role in ('owner', 'admin')
          then member.role
        else null
      end,
      organization.name
    into v_authority_role, v_organization_name
    from public.garage_members member
    join public.garages organization on organization.id = member.garage_id
    where member.user_id = v_actor_id
      and member.garage_id = p_organization_id
      and member.status = 'active'
    limit 1;

    if v_authority_role is null or v_organization_name is null then
      raise exception using errcode = '42501', message = 'Authorized organization representative required';
    end if;
    v_legal_role := 'garage';

    select acceptance.id
    into v_acceptance_id
    from public.legal_acceptances acceptance
    join private.legal_document_versions accepted_document
      on accepted_document.document_id = acceptance.document_id
      and accepted_document.document_version = acceptance.document_version
      and accepted_document.language = acceptance.displayed_language
      and accepted_document.sha256 = acceptance.document_sha256
    where acceptance.organization_id = p_organization_id
      and acceptance.document_id = v_document.document_id
      and acceptance.document_version = v_document.document_version
      and acceptance.document_status = 'effective'
      and acceptance.acceptance_scope = 'organization'
      and accepted_document.status = 'effective'
      and accepted_document.effective_at is not null
      and accepted_document.effective_at <= pg_catalog.now()
    order by acceptance.accepted_at asc
    limit 1;
  else
    if p_organization_id is not null then
      raise exception using errcode = '22023', message = 'User acceptance must not claim an organization';
    end if;
    v_authority_role := null;
    v_organization_name := null;
    v_legal_role := 'client';

    select acceptance.id
    into v_acceptance_id
    from public.legal_acceptances acceptance
    join private.legal_document_versions accepted_document
      on accepted_document.document_id = acceptance.document_id
      and accepted_document.document_version = acceptance.document_version
      and accepted_document.language = acceptance.displayed_language
      and accepted_document.sha256 = acceptance.document_sha256
    where acceptance.user_id = v_actor_id
      and acceptance.organization_id is null
      and acceptance.document_id = v_document.document_id
      and acceptance.document_version = v_document.document_version
      and acceptance.document_status = 'effective'
      and acceptance.acceptance_scope = 'user'
      and accepted_document.status = 'effective'
      and accepted_document.effective_at is not null
      and accepted_document.effective_at <= pg_catalog.now()
    order by acceptance.accepted_at asc
    limit 1;
  end if;

  if v_acceptance_id is not null then
    return v_acceptance_id;
  end if;

  insert into public.legal_acceptances (
    user_id,
    role,
    document_type,
    document_version,
    document_id,
    displayed_language,
    organization_id,
    organization_name_snapshot,
    document_sha256,
    document_status,
    application_version,
    acceptance_scope,
    authority_role,
    evidence_source,
    acceptance_context
  )
  values (
    v_actor_id,
    v_legal_role,
    v_document.document_id,
    v_document.document_version,
    v_document.document_id,
    p_language,
    case
      when v_document.acceptance_scope = 'organization' then p_organization_id
      else null::uuid
    end,
    case
      when v_document.acceptance_scope = 'organization' then left(v_organization_name, 200)
      else null::text
    end,
    v_document.sha256,
    v_document.status,
    'legal-current-document-rpc-v1',
    v_document.acceptance_scope,
    v_authority_role,
    'legal_gate',
    'legal_gate'
  )
  on conflict do nothing
  returning id into v_acceptance_id;

  if v_acceptance_id is null then
    -- A concurrent transaction may have inserted the same current proof.
    if v_document.acceptance_scope = 'organization' then
      select acceptance.id
      into v_acceptance_id
      from public.legal_acceptances acceptance
      where acceptance.organization_id = p_organization_id
        and acceptance.document_id = v_document.document_id
        and acceptance.document_version = v_document.document_version
        and acceptance.document_sha256 = v_document.sha256
      limit 1;
    else
      select acceptance.id
      into v_acceptance_id
      from public.legal_acceptances acceptance
      where acceptance.user_id = v_actor_id
        and acceptance.organization_id is null
        and acceptance.document_id = v_document.document_id
        and acceptance.document_version = v_document.document_version
        and acceptance.document_sha256 = v_document.sha256
      limit 1;
    end if;
  end if;

  if v_acceptance_id is null then
    raise exception using errcode = '40001', message = 'Legal acceptance could not be recorded';
  end if;

  return v_acceptance_id;
end;
$$;

revoke all on function public.get_current_legal_acceptance_status_v2(text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.get_current_legal_acceptance_status_v2(text, text, uuid)
  to authenticated;

revoke all on function public.accept_current_legal_document_v2(text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.accept_current_legal_document_v2(text, text, uuid)
  to authenticated;

comment on function public.get_current_legal_acceptance_status_v2(text, text, uuid) is
  'Returns current registry/evidence state and server-derived acceptance authority for one authenticated subject.';
comment on function public.accept_current_legal_document_v2(text, text, uuid) is
  'Records only the server-resolved current effective legal document; actor, timestamp, version and hash are never caller supplied.';

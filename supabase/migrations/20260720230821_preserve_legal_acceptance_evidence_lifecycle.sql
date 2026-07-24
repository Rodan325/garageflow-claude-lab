-- Preserve legal evidence independently from mutable Auth and organization rows.
-- This migration intentionally performs no UPDATE, DELETE or backfill: the eight
-- historical acceptances keep their exact values and new snapshot fields remain
-- null when the original context was unknown.

alter table public.legal_acceptances
  drop constraint if exists legal_acceptances_user_id_fkey,
  drop constraint if exists legal_acceptances_organization_id_fkey;

comment on column public.legal_acceptances.user_id is
  'Immutable pseudonymous actor UUID snapshot. Deliberately not a foreign key so Auth deletion cannot remove legal evidence.';
comment on column public.legal_acceptances.organization_id is
  'Immutable contracting-organization UUID snapshot. Deliberately not a foreign key so organization deletion cannot erase its legal context.';

alter table public.legal_acceptances
  add column if not exists organization_name_snapshot text;

alter table public.legal_acceptances
  add constraint legal_acceptances_organization_name_snapshot_check check (
    organization_name_snapshot is null
    or (
      document_sha256 is not null
      and acceptance_scope = 'organization'
      and length(btrim(organization_name_snapshot)) between 1 and 200
    )
  ) not valid;

alter table public.legal_acceptances
  validate constraint legal_acceptances_organization_name_snapshot_check;

comment on column public.legal_acceptances.organization_name_snapshot is
  'Server-derived organization name at V2 acceptance time. Historical evidence remains null and is never backfilled.';

-- A hash change is material evidence even when a deployment accidentally keeps
-- the same version label. Preserve both proofs instead of treating them as one.
drop index if exists public.legal_acceptances_v2_user_unique;
drop index if exists public.legal_acceptances_v2_organization_unique;

create unique index legal_acceptances_v2_user_unique
  on public.legal_acceptances (user_id, document_id, document_version, document_sha256)
  where document_sha256 is not null and acceptance_scope = 'user';

create unique index legal_acceptances_v2_organization_unique
  on public.legal_acceptances (organization_id, document_id, document_version, document_sha256)
  where document_sha256 is not null and acceptance_scope = 'organization';

create or replace function private.guard_legal_acceptance_v2()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_document private.legal_document_versions%rowtype;
  v_authority_role text;
  v_organization_name text;
begin
  if new.document_type not in ('terms_pro', 'terms_client', 'dpa') then
    return new;
  end if;

  if auth.uid() is null or new.user_id <> auth.uid() then
    raise exception using errcode = '42501', message = 'Legal acceptance identity mismatch';
  end if;

  -- The frozen 2026-07-02 DPA remains the active legacy document while the
  -- V2 flags are off. It never claims organization-level V2 evidence.
  if new.document_type = 'dpa' and new.document_version = '2026-07-02' then
    if new.organization_id is not null
      or new.document_sha256 is not null
      or new.organization_name_snapshot is not null then
      raise exception using errcode = '23514', message = 'Legacy DPA evidence must remain user scoped';
    end if;
    return new;
  end if;

  if new.displayed_language is null or new.document_sha256 is null then
    raise exception using errcode = '23514', message = 'Complete V2 evidence is required';
  end if;

  select * into v_document
  from private.legal_document_versions document
  where document.document_id = new.document_type
    and document.document_version = new.document_version
    and document.language = new.displayed_language;

  if not found
    or v_document.status <> 'effective'
    or v_document.effective_at is null
    or not v_document.requires_acceptance
    or v_document.sha256 <> new.document_sha256 then
    raise exception using errcode = '23514', message = 'Legal document is not effective or evidence does not match';
  end if;

  if v_document.acceptance_scope = 'organization' then
    if new.organization_id is null then
      raise exception using errcode = '23514', message = 'Organization evidence is required';
    end if;

    select
      case
        when member.organization_role in ('organization_owner', 'network_admin') then member.organization_role
        when member.organization_role is null
          and member.center_id is null
          and member.role in ('owner', 'admin') then member.role
        else null
      end,
      organization.name
    into v_authority_role, v_organization_name
    from public.garage_members member
    join public.garages organization on organization.id = member.garage_id
    where member.user_id = auth.uid()
      and member.garage_id = new.organization_id
      and member.status = 'active'
      and (
        member.organization_role in ('organization_owner', 'network_admin')
        or (
          member.organization_role is null
          and member.center_id is null
          and member.role in ('owner', 'admin')
        )
      )
    order by case
      when member.organization_role = 'organization_owner' then 1
      when member.organization_role = 'network_admin' then 2
      when member.role = 'owner' then 3
      else 4
    end
    limit 1;

    if v_authority_role is null or v_organization_name is null then
      raise exception using errcode = '42501', message = 'Authorized organization representative required';
    end if;
    new.organization_name_snapshot := left(v_organization_name, 200);
  else
    if new.organization_id is not null then
      raise exception using errcode = '23514', message = 'User acceptance must not claim an organization';
    end if;
    v_authority_role := null;
    new.organization_name_snapshot := null;
  end if;

  new.document_id := v_document.document_id;
  new.document_status := v_document.status;
  new.acceptance_scope := v_document.acceptance_scope;
  new.authority_role := v_authority_role;
  new.evidence_source := coalesce(new.evidence_source, new.acceptance_context);
  return new;
end;
$$;

revoke all on function private.guard_legal_acceptance_v2() from public, anon, authenticated;

create or replace function public.has_organization_legal_acceptance(
  p_organization_id uuid,
  p_document_id text,
  p_document_version text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.garage_members member
    where member.user_id = auth.uid()
      and member.garage_id = p_organization_id
      and member.status = 'active'
  ) then
    raise exception using errcode = '42501', message = 'Organization membership required';
  end if;

  return exists (
    select 1
    from public.legal_acceptances acceptance
    join private.legal_document_versions document
      on document.document_id = acceptance.document_id
      and document.document_version = acceptance.document_version
      and document.language = acceptance.displayed_language
      and document.sha256 = acceptance.document_sha256
    where acceptance.organization_id = p_organization_id
      and acceptance.document_id = p_document_id
      and acceptance.document_version = p_document_version
      and acceptance.document_status = 'effective'
      and acceptance.acceptance_scope = 'organization'
      and document.status = 'effective'
      and document.effective_at is not null
  );
end;
$$;

create or replace function public.has_organization_legal_acceptance_v2(
  p_organization_id uuid,
  p_document_id text,
  p_document_version text,
  p_document_hashes text[]
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.garage_members member
    where member.user_id = auth.uid()
      and member.garage_id = p_organization_id
      and member.status = 'active'
  ) then
    raise exception using errcode = '42501', message = 'Organization membership required';
  end if;

  if coalesce(cardinality(p_document_hashes), 0) = 0 then
    return false;
  end if;

  return exists (
    select 1
    from public.legal_acceptances acceptance
    join private.legal_document_versions document
      on document.document_id = acceptance.document_id
      and document.document_version = acceptance.document_version
      and document.language = acceptance.displayed_language
      and document.sha256 = acceptance.document_sha256
    where acceptance.organization_id = p_organization_id
      and acceptance.document_id = p_document_id
      and acceptance.document_version = p_document_version
      and acceptance.document_sha256 = any (p_document_hashes)
      and acceptance.document_status = 'effective'
      and acceptance.acceptance_scope = 'organization'
      and document.status = 'effective'
      and document.effective_at is not null
  );
end;
$$;

revoke all on function public.has_organization_legal_acceptance(uuid, text, text) from public, anon;
grant execute on function public.has_organization_legal_acceptance(uuid, text, text) to authenticated;
revoke all on function public.has_organization_legal_acceptance_v2(uuid, text, text, text[]) from public, anon;
grant execute on function public.has_organization_legal_acceptance_v2(uuid, text, text, text[]) to authenticated;

comment on function public.has_organization_legal_acceptance_v2(uuid, text, text, text[]) is
  'Checks tenant membership and exact accepted V2 hashes without exposing organization evidence rows.';

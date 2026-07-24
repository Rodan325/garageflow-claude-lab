-- Preserve the historical legal gate while the commercial V2 corpus remains
-- behind disabled feature flags. This is a forward-only correction because
-- the V2 guard migration has already been validated on staging.

create or replace function private.guard_legal_acceptance_v2()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_document private.legal_document_versions%rowtype;
  v_authority_role text;
begin
  if new.document_type not in ('terms_pro', 'terms_client', 'dpa') then
    return new;
  end if;

  if auth.uid() is null or new.user_id <> auth.uid() then
    raise exception using errcode = '42501', message = 'Legal acceptance identity mismatch';
  end if;

  -- The frozen 2026-07-02 DPA remains the active legacy document while the
  -- V2 flags are off. It is user-scoped historical evidence and must not claim
  -- organization-level authority or a V2 document hash.
  if new.document_type = 'dpa' and new.document_version = '2026-07-02' then
    if new.organization_id is not null or new.document_sha256 is not null then
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

    select case
      when member.organization_role in ('organization_owner', 'network_admin') then member.organization_role
      when member.organization_role is null
        and member.center_id is null
        and member.role in ('owner', 'admin') then member.role
      else null
    end
    into v_authority_role
    from public.garage_members member
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

    if v_authority_role is null then
      raise exception using errcode = '42501', message = 'Authorized organization representative required';
    end if;
  else
    if new.organization_id is not null then
      raise exception using errcode = '23514', message = 'User acceptance must not claim an organization';
    end if;
    v_authority_role := null;
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

comment on function private.guard_legal_acceptance_v2() is
  'Validates immutable V2 evidence while preserving only the user-scoped 2026-07-02 legacy DPA flow when V2 flags are off.';

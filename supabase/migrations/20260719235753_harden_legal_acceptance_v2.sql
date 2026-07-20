-- Versioned legal evidence for the staged commercial corpus.
-- This migration is additive for historical rows: no acceptance is updated,
-- deleted or backfilled. V2 documents remain `staged`, so the database rejects
-- a V2 acceptance until a later, reviewed migration marks a version effective.

create table if not exists private.legal_document_versions (
  document_id text not null,
  document_version text not null,
  language text not null check (language in ('fr', 'en', 'ar')),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  status text not null check (status in ('draft', 'staged', 'effective', 'archived')),
  published_at timestamptz,
  effective_at timestamptz,
  supersedes text,
  requires_acceptance boolean not null default false,
  acceptance_scope text not null check (acceptance_scope in ('user', 'organization', 'none')),
  material_change boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (document_id, document_version, language),
  check (status <> 'effective' or effective_at is not null),
  check (requires_acceptance or acceptance_scope = 'none')
);

alter table private.legal_document_versions enable row level security;
revoke all on table private.legal_document_versions from public, anon, authenticated;

comment on table private.legal_document_versions is
  'Immutable metadata for rendered legal documents. Staged rows cannot be accepted.';

insert into private.legal_document_versions (
  document_id, document_version, language, sha256, status, published_at,
  effective_at, supersedes, requires_acceptance, acceptance_scope, material_change
)
values
  ('legal', 'legal-2026-01', 'fr', 'c4cc77044679978386ce0247204f169b261db06851b92a1476fee7042b6e25a3', 'staged', null, null, '2026-07-02', false, 'none', true),
  ('legal', 'legal-2026-01', 'en', 'e2963ebcbda56560431af2ad2cd3f7b01bb86389f46e209c5e8ac3af932c9492', 'staged', null, null, '2026-07-02', false, 'none', true),
  ('legal', 'legal-2026-01', 'ar', '05070a851c1f4721b75691670e8a3dd29ba9cf4f5b44c71255856d8b2efb6253', 'staged', null, null, '2026-07-02', false, 'none', true),
  ('terms_pro', 'terms-2026-01', 'fr', '7a1e300603254a82ca2da16137b33553216e7b15f68d5bd235ae909e6baf2700', 'staged', null, null, '2026-07-02', true, 'organization', true),
  ('terms_pro', 'terms-2026-01', 'en', '07aa0d300a4a9d36b5d3b08cc6e110ff85b4bfae0c684014061c87d1021e5363', 'staged', null, null, '2026-07-02', true, 'organization', true),
  ('terms_pro', 'terms-2026-01', 'ar', 'd37594bf5ca7ad284a4b9f5d9a07040f04192d65632d4cb6e44b71647dd9e3ed', 'staged', null, null, '2026-07-02', true, 'organization', true),
  ('terms_client', 'terms-2026-01', 'fr', '5b2d8b1500f446459d79ee22976a0f632db2cedf2329116961c99501e97b3640', 'staged', null, null, '2026-07-02', true, 'user', true),
  ('terms_client', 'terms-2026-01', 'en', 'a5adfa398a1d9b5270a9d52062e1af6fc11a6f6fb127a6d88882e6bf956abf66', 'staged', null, null, '2026-07-02', true, 'user', true),
  ('terms_client', 'terms-2026-01', 'ar', 'b3ef8a4a140c0c1325d13b67961ce73b60da4acefda35a4707e107a44a11890e', 'staged', null, null, '2026-07-02', true, 'user', true),
  ('privacy', 'privacy-2026-01', 'fr', 'ce46f94d6d1f1a024fd55045f3ad8d47c1d4c5efad601b0cb2e552dcfc77a486', 'staged', null, null, '2026-07-02', false, 'none', true),
  ('privacy', 'privacy-2026-01', 'en', 'b466e1844b16a8c0b3ed15f039d3de73da66e9dc4bf8c0d7fd810da8f9aa82bd', 'staged', null, null, '2026-07-02', false, 'none', true),
  ('privacy', 'privacy-2026-01', 'ar', '2a01be149ab09dd1496cfc193a810215d414cea651a6faf7e3c3126854a83c73', 'staged', null, null, '2026-07-02', false, 'none', true),
  ('cookies', 'cookies-2026-01', 'fr', '6840f36df37fe2a0dd8d315ef6c3e4bec1ead3be57662863df67b78ad83c0dca', 'staged', null, null, '2026-07-02', false, 'none', true),
  ('cookies', 'cookies-2026-01', 'en', '435aba28216bd39bec6e7650963862525ecf2b73b96d3ff09455ae1ed4289fba', 'staged', null, null, '2026-07-02', false, 'none', true),
  ('cookies', 'cookies-2026-01', 'ar', '77177cf660f45c8f8f5c4cac3a01c68c1f7ee758cd60db669c71c50834a88b82', 'staged', null, null, '2026-07-02', false, 'none', true),
  ('dpa', 'dpa-2026-01', 'fr', '052603acbcf65a5f5797239858e236c0bfeef054469a52362e58111bf62cd0a7', 'staged', null, null, '2026-07-02', true, 'organization', true),
  ('dpa', 'dpa-2026-01', 'en', '4790144261e99467ce4f75d6eb61e94813a841cac60914b377a83c9b045bd30b', 'staged', null, null, '2026-07-02', true, 'organization', true),
  ('dpa', 'dpa-2026-01', 'ar', 'fc718712bfe93ce6ab4e7ee330ae3e454de682b6af317eb63c07e59ce34874e2', 'staged', null, null, '2026-07-02', true, 'organization', true),
  ('subprocessors', 'subprocessors-2026-01', 'fr', '8743c142f98217ccc3373af7d75047dc6eeb0142898492dc8be8737d9bb5315a', 'staged', null, null, '2026-07-02', false, 'none', true),
  ('subprocessors', 'subprocessors-2026-01', 'en', '295cf8103ab3b01a3f9eb98d85f76a7887a19f9552a53ae44ab6445117561eae', 'staged', null, null, '2026-07-02', false, 'none', true),
  ('subprocessors', 'subprocessors-2026-01', 'ar', 'f97e3678b1d6fac05c0e86ac23742471d3ebf9b3a5a30f40a10c1d790b0dcd8a', 'staged', null, null, '2026-07-02', false, 'none', true),
  ('security', 'security-2026-01', 'fr', 'f289fc19785087f4ef5fb41f964daa987a03afd3aec6d85ed59f3874b19dae91', 'staged', null, null, '2026-07-02', false, 'none', true),
  ('security', 'security-2026-01', 'en', '0baca6fc58c22720688ffd4e38b333737891a94a41dea728036d0a4d4cc06786', 'staged', null, null, '2026-07-02', false, 'none', true),
  ('security', 'security-2026-01', 'ar', 'd9e59530d6c041f7cd2495c391ea6d6d4dc652320b43e594eed86641dcdab3ae', 'staged', null, null, '2026-07-02', false, 'none', true),
  ('service_levels', 'service-levels-2026-01', 'fr', 'ef3a5b0058120a855a65b8e6a4bf97537c0ce41c32b6bf2e6e9728a5039568a6', 'staged', null, null, '2026-07-02', false, 'none', true),
  ('service_levels', 'service-levels-2026-01', 'en', '8601cd863933dad140c0202fb4ee00352eee758c2ca805a13616e975b595787b', 'staged', null, null, '2026-07-02', false, 'none', true),
  ('service_levels', 'service-levels-2026-01', 'ar', 'e4dc5d47ce75569fb6c7d7deb9b60c414761f8948da1779101cbc088044fca5e', 'staged', null, null, '2026-07-02', false, 'none', true),
  ('ai_policy', 'ai-policy-2026-01', 'fr', '5a412b17aec7f8804034d648fa4fcf8388fd6a9f0f3c6d376291879351223565', 'draft', null, null, null, false, 'none', true),
  ('ai_policy', 'ai-policy-2026-01', 'en', '67b3c47bce8ee0f6827fc9bc80b6a2ddd5c8e612175f4fbdfefe126c791b4226', 'draft', null, null, null, false, 'none', true),
  ('ai_policy', 'ai-policy-2026-01', 'ar', 'ef15f48fd3d1716e6714538d3dde8341138745e691bdb2d6ccf5a0ef1018f1e8', 'draft', null, null, null, false, 'none', true)
on conflict (document_id, document_version, language) do nothing;

alter table public.legal_acceptances
  add column if not exists document_sha256 text,
  add column if not exists document_status text,
  add column if not exists application_version text,
  add column if not exists acceptance_scope text,
  add column if not exists authority_role text,
  add column if not exists evidence_source text;

-- Extend, rather than rewrite, the accepted document vocabulary. Existing
-- rows and legacy `type:version` document ids remain valid.
alter table public.legal_acceptances
  drop constraint if exists legal_acceptances_document_type_check,
  drop constraint if exists legal_acceptances_document_id_check;

alter table public.legal_acceptances
  add constraint legal_acceptances_document_type_check check (
    document_type in (
      'terms', 'privacy', 'pilot_agreement', 'dpa', 'legal_notice',
      'terms_pro', 'terms_client', 'cookies', 'subprocessors', 'security',
      'service_levels', 'ai_policy'
    )
  ) not valid,
  add constraint legal_acceptances_document_id_check check (
    document_id is null
    or document_id = document_type || ':' || document_version
    or document_id ~ '^[a-z][a-z0-9_]{1,63}$'
  ) not valid,
  add constraint legal_acceptances_v2_evidence_check check (
    document_sha256 is null
    or (
      document_sha256 ~ '^[0-9a-f]{64}$'
      and document_status = 'effective'
      and displayed_language in ('fr', 'en', 'ar')
      and application_version is not null
      and length(application_version) between 1 and 100
      and acceptance_scope in ('user', 'organization')
      and evidence_source in ('signup', 'legal_gate', 'garage_onboarding', 'quote_acceptance', 'contract_admin')
    )
  ) not valid;

alter table public.legal_acceptances
  validate constraint legal_acceptances_document_type_check;
alter table public.legal_acceptances
  validate constraint legal_acceptances_document_id_check;
alter table public.legal_acceptances
  validate constraint legal_acceptances_v2_evidence_check;

create unique index if not exists legal_acceptances_v2_user_unique
  on public.legal_acceptances (user_id, document_id, document_version)
  where document_sha256 is not null and acceptance_scope = 'user';

create unique index if not exists legal_acceptances_v2_organization_unique
  on public.legal_acceptances (organization_id, document_id, document_version)
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
begin
  if new.document_type not in ('terms_pro', 'terms_client', 'dpa') then
    return new;
  end if;

  if auth.uid() is null or new.user_id <> auth.uid() then
    raise exception using errcode = '42501', message = 'Legal acceptance identity mismatch';
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

    select coalesce(member.organization_role, member.role)
    into v_authority_role
    from public.garage_members member
    where member.user_id = auth.uid()
      and member.garage_id = new.organization_id
      and member.status = 'active'
      and (
        member.organization_role in ('organization_owner', 'network_admin')
        or member.role in ('owner', 'admin')
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

drop trigger if exists guard_legal_acceptance_v2 on public.legal_acceptances;
create trigger guard_legal_acceptance_v2
before insert on public.legal_acceptances
for each row execute function private.guard_legal_acceptance_v2();

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
    select 1 from public.legal_acceptances acceptance
    where acceptance.organization_id = p_organization_id
      and acceptance.document_id = p_document_id
      and acceptance.document_version = p_document_version
      and acceptance.document_status = 'effective'
      and acceptance.acceptance_scope = 'organization'
  );
end;
$$;

revoke all on function public.has_organization_legal_acceptance(uuid, text, text) from public, anon;
grant execute on function public.has_organization_legal_acceptance(uuid, text, text) to authenticated;

comment on column public.legal_acceptances.document_sha256 is
  'SHA-256 of the exact localized V2 document displayed at acceptance time. Historical rows remain null.';
comment on column public.legal_acceptances.document_status is
  'Document status at acceptance time. V2 accepts only effective documents.';
comment on column public.legal_acceptances.application_version is
  'Frontend application version recording the evidence. Historical rows remain null.';
comment on column public.legal_acceptances.acceptance_scope is
  'Whether the V2 evidence binds the user or an authorized organization.';
comment on column public.legal_acceptances.authority_role is
  'Server-derived organization authority role. Never trusted from the frontend.';
comment on column public.legal_acceptances.evidence_source is
  'Controlled source of the acceptance event.';

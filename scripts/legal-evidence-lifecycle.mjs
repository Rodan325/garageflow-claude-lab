import { randomUUID } from 'node:crypto'
import { basename, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { assertSupabaseTestTarget } from './rls-target-guard.mjs'

try {
  assertSupabaseTestTarget(process.env.VITE_SUPABASE_URL, { mode: 'local' })
} catch (error) {
  console.error(`LEGAL EVIDENCE LIFECYCLE: ${error.message}`)
  process.exit(2)
}

if ((process.env.SUPABASE_TEST_TARGET || 'local') !== 'local') {
  console.error('LEGAL EVIDENCE LIFECYCLE: refusing a non-local target')
  process.exit(2)
}

const projectName = basename(resolve('.'))
const dockerList = spawnSync(
  'docker',
  ['ps', '--filter', `label=com.supabase.cli.project=${projectName}`, '--format', '{{.Names}}'],
  { encoding: 'utf8' },
)
const databaseContainers = (dockerList.stdout || '')
  .split(/\r?\n/)
  .map((name) => name.trim())
  .filter((name) => name.startsWith('supabase_db_'))

if (dockerList.error || dockerList.status !== 0 || databaseContainers.length !== 1) {
  console.error('LEGAL EVIDENCE LIFECYCLE: expected exactly one local Supabase database container')
  process.exit(2)
}

const actorId = randomUUID()
const otherActorId = randomUUID()
const organizationId = randomUUID()
const acceptanceId = randomUUID()
const version = `lifecycle-${randomUUID()}`
const hash = 'a'.repeat(64)

const sql = `
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000', '${actorId}', 'authenticated', 'authenticated',
  'legal-lifecycle-${actorId}@example.invalid', '', now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Legal lifecycle fixture","account_type":"staff"}'::jsonb,
  now(), now()
);

insert into public.profiles (id, full_name, account_type)
values ('${actorId}', 'Legal lifecycle fixture', 'staff')
on conflict (id) do update set account_type = excluded.account_type;

insert into public.garages (id, slug, name, is_public)
values ('${organizationId}', 'legal-lifecycle-${organizationId}', 'Legal lifecycle organization', false);

insert into public.garage_members (garage_id, user_id, role, status, organization_role)
values ('${organizationId}', '${actorId}', 'owner', 'active', 'organization_owner');

insert into private.legal_document_versions (
  document_id, document_version, language, sha256, status, published_at,
  effective_at, supersedes, requires_acceptance, acceptance_scope, material_change
)
values ('terms_pro', '${version}', 'fr', '${hash}', 'effective', now(), now(), null, true, 'organization', true);

set local role authenticated;
select set_config('request.jwt.claim.sub', '${actorId}', true);
insert into public.legal_acceptances (
  id, user_id, role, document_type, document_version, displayed_language,
  organization_id, document_sha256, document_status, application_version,
  acceptance_scope, evidence_source, acceptance_context
)
values (
  '${acceptanceId}', '${actorId}', 'garage', 'terms_pro', '${version}', 'fr',
  '${organizationId}', '${hash}', 'effective', 'lifecycle-test',
  'organization', 'legal_gate', 'legal_gate'
);

do $$
declare v_count bigint;
begin
  begin
    update public.legal_acceptances set application_version = 'forbidden' where id = '${acceptanceId}';
    get diagnostics v_count = row_count;
    if v_count <> 0 then raise exception 'authenticated UPDATE modified immutable evidence'; end if;
  exception when insufficient_privilege then
    null;
  end;

  begin
    delete from public.legal_acceptances where id = '${acceptanceId}';
    get diagnostics v_count = row_count;
    if v_count <> 0 then raise exception 'authenticated DELETE removed immutable evidence'; end if;
  exception when insufficient_privilege then
    null;
  end;
end $$;

select set_config('request.jwt.claim.sub', '${otherActorId}', true);
do $$
begin
  if exists (select 1 from public.legal_acceptances where id = '${acceptanceId}') then
    raise exception 'cross-tenant actor read legal evidence';
  end if;
end $$;

reset role;

do $$
begin
  if not exists (
    select 1 from public.legal_acceptances
    where id = '${acceptanceId}'
      and user_id = '${actorId}'
      and organization_id = '${organizationId}'
      and organization_name_snapshot = 'Legal lifecycle organization'
      and document_id = 'terms_pro'
      and document_version = '${version}'
      and document_sha256 = '${hash}'
  ) then raise exception 'initial immutable snapshot is incomplete'; end if;
end $$;

delete from private.legal_document_versions
where document_id = 'terms_pro' and document_version = '${version}' and language = 'fr';
delete from auth.users where id = '${actorId}';
delete from public.garages where id = '${organizationId}';

do $$
begin
  if not exists (
    select 1 from public.legal_acceptances
    where id = '${acceptanceId}'
      and user_id = '${actorId}'
      and organization_id = '${organizationId}'
      and organization_name_snapshot = 'Legal lifecycle organization'
      and document_id = 'terms_pro'
      and document_version = '${version}'
      and document_sha256 = '${hash}'
  ) then raise exception 'evidence changed after actor, organization or document deletion'; end if;
end $$;

rollback;
select 'LEGAL_EVIDENCE_LIFECYCLE_OK';
`

const postgres = spawnSync(
  'docker',
  ['exec', '-i', databaseContainers[0], 'psql', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'postgres', '-At'],
  { input: sql, encoding: 'utf8' },
)

if (postgres.error || postgres.status !== 0 || !postgres.stdout.includes('LEGAL_EVIDENCE_LIFECYCLE_OK')) {
  console.error(`LEGAL EVIDENCE LIFECYCLE: failed: ${postgres.error?.message || postgres.stderr?.trim() || 'missing success marker'}`)
  process.exit(1)
}

console.log('LEGAL EVIDENCE LIFECYCLE: actor, organization and registry deletion preserve immutable evidence; transaction rolled back')

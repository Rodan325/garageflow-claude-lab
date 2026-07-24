-- Add evidence needed for future commercial legal acceptances without
-- rewriting the eight historical acceptances already stored in production.
-- Nullable columns preserve rolling-deployment compatibility with older clients.

alter table public.legal_acceptances
  add column if not exists displayed_language text,
  add column if not exists document_id text,
  add column if not exists organization_id uuid references public.garages(id) on delete set null;

alter table public.legal_acceptances
  add constraint legal_acceptances_displayed_language_check
    check (displayed_language is null or displayed_language in ('fr', 'en', 'ar')) not valid,
  add constraint legal_acceptances_document_id_check
    check (document_id is null or document_id = document_type || ':' || document_version) not valid;

alter table public.legal_acceptances
  validate constraint legal_acceptances_displayed_language_check;

alter table public.legal_acceptances
  validate constraint legal_acceptances_document_id_check;

create index if not exists legal_acceptances_organization_idx
  on public.legal_acceptances(organization_id)
  where organization_id is not null;

comment on column public.legal_acceptances.displayed_language is
  'Language displayed when the document was accepted. Historical rows may be null.';
comment on column public.legal_acceptances.document_id is
  'Stable document identifier formatted as document_type:document_version. Historical rows may be null.';
comment on column public.legal_acceptances.organization_id is
  'Contracting garage/organization context when applicable. Historical and client rows may be null.';

alter policy "Users can insert own legal acceptances" on public.legal_acceptances
  with check (
    user_id = (select auth.uid())
    and (
      organization_id is null
      or exists (
        select 1
        from public.garage_members member
        where member.user_id = (select auth.uid())
          and member.garage_id = organization_id
          and member.status = 'active'
      )
    )
  );

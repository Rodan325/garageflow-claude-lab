-- =====================================================================
-- GarageFlow C — 0021 journal d'acceptation des documents légaux
-- Preuve opposable et traçable : qui a accepté quel document, en quelle
-- VERSION, quand, avec quel user-agent et dans quel contexte. RLS stricte :
-- un utilisateur ne lit/écrit QUE ses propres acceptations ; pas de policy
-- DELETE/UPDATE (le journal est append-only pour préserver la preuve) ;
-- jamais exposé à l'anon. Aucune adresse IP n'est collectée côté frontend.
-- Bonus preuve devis : les versions CGU/confidentialité affichées au moment
-- de l'acceptation d'un devis sont horodatées sur le devis lui-même.
-- =====================================================================

create table if not exists public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('client', 'garage', 'admin')),
  document_type text not null check (
    document_type in (
      'terms',
      'privacy',
      'pilot_agreement',
      'dpa',
      'legal_notice'
    )
  ),
  document_version text not null,
  accepted_at timestamptz not null default now(),
  user_agent text,
  acceptance_context text not null default 'signup',
  created_at timestamptz not null default now()
);

create index if not exists legal_acceptances_user_idx
on public.legal_acceptances(user_id);

create index if not exists legal_acceptances_lookup_idx
on public.legal_acceptances(user_id, document_type, document_version);

alter table public.legal_acceptances enable row level security;

drop policy if exists "Users can read own legal acceptances" on public.legal_acceptances;
create policy "Users can read own legal acceptances"
on public.legal_acceptances
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own legal acceptances" on public.legal_acceptances;
create policy "Users can insert own legal acceptances"
on public.legal_acceptances
for insert
to authenticated
with check (user_id = auth.uid());

-- Pas de policy UPDATE/DELETE : journal append-only (préservation de la preuve).
-- Pas de grant anon : la table n'est jamais accessible sans authentification.

-- ---------------------------------------------------------------------
-- Preuve côté devis : versions des CGU / confidentialité affichées au
-- moment de l'acceptation par le client (horodatage déjà via accepted_at).
-- ---------------------------------------------------------------------
alter table public.quotes
  add column if not exists accepted_terms_version text,
  add column if not exists accepted_privacy_version text;

-- accept_quote_public gagne deux paramètres optionnels (compatibles avec les
-- appels existants). DROP explicite pour éviter une surcharge ambiguë.
drop function if exists public.accept_quote_public(text);

create or replace function public.accept_quote_public(
  p_token text,
  p_terms_version text default null,
  p_privacy_version text default null
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_quote public.quotes;
begin
  select * into v_quote from public.quotes where client_token = p_token;
  if v_quote.id is null then raise exception 'Devis introuvable'; end if;
  if v_quote.status = 'accepted' then return public.get_quote_public(p_token); end if;
  if v_quote.status <> 'sent' then raise exception 'Devis non disponible'; end if;
  if v_quote.valid_until is not null and v_quote.valid_until < current_date then raise exception 'Devis expire'; end if;

  perform set_config('garageflow.client_quote_action', '1', true);
  update public.quotes set
    status = 'accepted',
    accepted_at = now(),
    accepted_terms_version = coalesce(p_terms_version, accepted_terms_version),
    accepted_privacy_version = coalesce(p_privacy_version, accepted_privacy_version)
  where id = v_quote.id;
  return public.get_quote_public(p_token);
end;
$$;

revoke all on function public.accept_quote_public(text, text, text) from public;
grant execute on function public.accept_quote_public(text, text, text) to anon, authenticated;

# Clikarage — Configuration Supabase

## 1. Projet
- **Nom** : `garageflow-c` · **Région** : `eu-west-3` (Paris) · `https://tftmfhwmzkhzlvgwcnje.supabase.co`
- Frontend = clé publique (anon / publishable) uniquement. **Jamais** la clé `service_role`.

## 2. Migrations (`supabase/migrations/`, dans l'ordre)

| Fichier | Contenu |
|---|---|
| `0001_init_schema` | 20 tables (tenancy, identité, CRM, client-owned, catalogue, pipeline réservation, ops, audit) + index. |
| `0002_functions_triggers` | `is_garage_member`, `has_garage_role`, `handle_new_user`, `set_updated_at`, `guard_request_transition`. |
| `0003_rls` | RLS activée partout + policies (default-deny). |
| `0004_seed` | Démo : garage, 3 comptes, prestations, horaires, CRM, 1 réservation en attente. |
| `0005`/`0006` | Durcissement fonctions (search_path, retrait EXECUTE inutiles). |
| `0007_lock_client_request_updates` | Un client ne peut changer **que** le statut de sa demande. |
| `0008_catalog_branding_storage` | `garage_services` (tax_rate, labor_hours, price_type, default_lines) ; `garages` (accent_color, legal_info, maps_url) ; bucket **`garage-logos`** + policies. |
| `0009_quote_snapshot_fields` | `quotes` : client_name, vehicle_label, conditions, valid_until, service_request_id. |
| `0010_logos_no_listing` | Bucket logos : suppression du listing public (accès par URL seulement). |
| `0011_quote_numbering_snapshot` | `quote_counters` + RPC `next_quote_number()` (DV-YYYY-NNNN) ; `quotes` : client_phone, client_email. |
| `0012_quote_transactions` | RPC **`create_quote_with_lines`** / **`update_quote_with_lines`** (transactionnelles, member-checked). |

### Application locale des migrations

Pour le développement courant, appliquer les migrations uniquement à la stack
Supabase locale avec :

```bash
npm run db:push:local
```

Le défaut sûr du dépôt est **LOCAL**. La commande nue `supabase db push` ne doit
pas être utilisée comme instruction courante : un dépôt Supabase peut conserver
dans `.temp` un état de liaison vers un projet hébergé. Cet état n'est jamais une
autorisation de modifier ce projet, et Production ne doit notamment jamais être
ciblée au seul motif que le dépôt y serait lié.

Les déploiements de migrations vers Staging et Production sont des opérations de
release séparées. Ils exigent une identification explicite de la cible, une revue
explicite et une autorisation explicite. Cette documentation ne fournit pas de
commande distante prête à copier et ce dépôt n'ajoute ici aucun mécanisme de
déploiement distant.

`supabase migration repair` n'est pas une commande courante de correction du
drift et ne doit jamais être proposée automatiquement face à un historique de
migrations divergent.

## 3. Fonctions RPC (SECURITY DEFINER, `search_path` épinglé)
- `is_garage_member(uuid)`, `has_garage_role(uuid, text[])` — utilisées par les policies RLS.
- `next_quote_number(garage)` → `DV-YYYY-NNNN`, séquence atomique par garage/année (`quote_counters`).
- `create_quote_with_lines(p_quote jsonb, p_lines jsonb)` → crée numéro + devis + lignes en **une transaction**, vérifie l'appartenance au garage et que client/véhicule appartiennent au garage. Retourne la ligne `quotes`.
- `update_quote_with_lines(p_id uuid, p_quote jsonb, p_lines jsonb)` → met à jour le devis et **remplace** ses lignes dans une transaction (jamais de devis sans lignes).
- Toutes : `revoke from public, anon` + `grant execute to authenticated`.

## 4. Identité & auth
- `profiles` (1/compte, `account_type` staff|client) créé par trigger à l'inscription ; `garage_members` (rôle) ; `client_profiles` (extras client).
- Les comptes connectés de démonstration utilisent `<DEMO_EMAIL_TEMPORAIRE>` et `<DEMO_PASSWORD_TEMPORAIRE>`, générés temporairement hors Git.
- Les accès expirent après la démonstration, sont renouvelés avant toute réutilisation et restent distincts entre Staging et Production.
- Réservation client possible **sans compte** jusqu'à l'étape finale (puis login/inscription).

## 5. Storage
- Bucket public **`garage-logos`** : lecture par URL publique (logo affiché page client + devis), **écriture réservée aux membres** du garage (`{garage_id}/…`), pas de listing.
- Les **PDF de devis ne sont pas stockés** (générés à la volée côté client). Cible production : bucket **privé** `garage-quotes` + URL signée + version figée.

## 6. Edge Functions (`supabase/functions/`)
- `request-to-appointment` (sous JWT appelant, RLS respectée) ; `generate-vehicle-ad`, `repair-summary` (clé OpenAI côté fonction seulement). `verify_jwt = true`.

## 7. Frontend
```dotenv
VITE_SUPABASE_URL=https://tftmfhwmzkhzlvgwcnje.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```
`.env` gitignoré. Sans config → mode démo local.

## 8. Vérifications
- Advisors Security/Performance après tout DDL.
- `npm run test:rls` (isolation inter-garages). Les fixtures ne sont **pas** appliquées
  automatiquement : `scripts/seed-local.sql` applique `supabase/seed.sql` puis
  `scripts/rls-fixtures.sql` sur une seule connexion, et le harnais échoue si le
  garage Test B (`3333…`) est absent ou a été semé avec un autre mot de passe.

### Workflow local complet (bases locales uniquement)

Bash — sous Windows, Git Bash ou WSL. Le mot de passe ne transite ni par `argv`
ni par l'historique du shell ; il reste dans l'environnement des processus fils
le temps de leur exécution.

```bash
supabase db reset --local --no-seed

read -rs -p 'Fixture password: ' fixture_pw
printf '\n'

SEED_FIXTURE_PASSWORD="$fixture_pw" npm run db:seed:local
SEED_FIXTURE_PASSWORD="$fixture_pw" npm run test:rls

unset fixture_pw
```

Sans `SEED_FIXTURE_PASSWORD`, chaque fixture reçoit un mot de passe aléatoire
inconnu — c'est le comportement par défaut recommandé, mais `npm run test:rls`
ne peut alors pas se connecter.

Rejouer les fichiers de seed **ne fait aucune rotation** : les lignes
`auth.users` déjà présentes conservent leur hash, et un avertissement SQL le
signale. Pour de nouveaux identifiants, recréez la base avec
`supabase db reset --local`. Ne pointez jamais ces commandes vers un projet
hébergé.

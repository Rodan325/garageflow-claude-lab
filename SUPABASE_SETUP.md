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

CLI : `supabase db push`. Sinon coller chaque fichier dans le SQL Editor, dans l'ordre.

## 3. Fonctions RPC (SECURITY DEFINER, `search_path` épinglé)
- `is_garage_member(uuid)`, `has_garage_role(uuid, text[])` — utilisées par les policies RLS.
- `next_quote_number(garage)` → `DV-YYYY-NNNN`, séquence atomique par garage/année (`quote_counters`).
- `create_quote_with_lines(p_quote jsonb, p_lines jsonb)` → crée numéro + devis + lignes en **une transaction**, vérifie l'appartenance au garage et que client/véhicule appartiennent au garage. Retourne la ligne `quotes`.
- `update_quote_with_lines(p_id uuid, p_quote jsonb, p_lines jsonb)` → met à jour le devis et **remplace** ses lignes dans une transaction (jamais de devis sans lignes).
- Toutes : `revoke from public, anon` + `grant execute to authenticated`.

## 4. Identité & auth
- `profiles` (1/compte, `account_type` staff|client) créé par trigger à l'inscription ; `garage_members` (rôle) ; `client_profiles` (extras client).
- Comptes démo (mdp `Demo1234!`) : `owner@demo-garage.fr`, `mecano@demo-garage.fr`, `client@demo.fr`.
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
- `npm run test:rls` (isolation inter-garages) — nécessite les fixtures `scripts/rls-fixtures.sql` (2ᵉ garage de test).

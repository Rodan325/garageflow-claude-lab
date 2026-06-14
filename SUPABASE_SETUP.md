# GarageFlow — Configuration Supabase

## 1. Projet

- **Nom** : `garageflow-c`
- **Région** : `eu-west-3` (Paris) — UE-first
- **URL** : `https://tftmfhwmzkhzlvgwcnje.supabase.co`
- Le frontend utilise **uniquement** la clé publique (anon / publishable). La clé `service_role` n’est **jamais** utilisée côté client.

## 2. Migrations (`supabase/migrations/`)

À appliquer dans l’ordre (déjà appliquées sur le projet) :

| Fichier | Contenu |
|---|---|
| `0001_init_schema.sql` | 20 tables + index. Chaque table métier porte `garage_id`. |
| `0002_functions_triggers.sql` | `set_updated_at`, `is_garage_member`, `has_garage_role`, `handle_new_user` (profil auto à l’inscription), `guard_request_transition` (validation des transitions de statut). |
| `0003_rls.sql` | RLS activée partout + policies (default-deny). |
| `0004_seed.sql` | Démo : 1 garage, 3 comptes, prestations, horaires, CRM, 1 réservation en attente. |
| `0005_harden_functions.sql` / `0006_revoke_function_grants.sql` | Durcissement (search_path, retrait des EXECUTE inutiles, suite advisors). |

Avec le CLI Supabase : `supabase db push`. Via le SQL Editor : coller chaque fichier dans l’ordre.

### Tables

`garages`, `profiles`, `garage_members`, `client_profiles`, `customers`, `vehicles`, `client_vehicles`, `garage_services`, `garage_news`, `garage_hours`, `service_requests`, `service_request_messages`, `appointments`, `repairs`, `quotes`, `quote_lines`, `documents`, `tasks`, `consents`, `audit_logs`.

## 3. Identité & auth

- **profiles** : 1 ligne par compte (`account_type` = `staff` | `client`), créée par le trigger `handle_new_user` à l’inscription.
- **garage_members** : rattache un profil staff à un garage avec un `role`.
- **client_profiles** : extras du client final (garage favori, consentement marketing).

Comptes de démo (mot de passe `Demo1234!`) : `owner@demo-garage.fr`, `mecano@demo-garage.fr`, `client@demo.fr`.

## 4. Edge Functions (`supabase/functions/`)

| Fonction | Rôle | Auth |
|---|---|---|
| `request-to-appointment` | Promeut une réservation → `customer + vehicle + appointment`, sous le **JWT de l’appelant** (RLS appliquée). | `verify_jwt = true` |
| `generate-vehicle-ad` | Génère une annonce véhicule (OpenAI si `OPENAI_API_KEY` présent, sinon gabarit). | `verify_jwt = true` |
| `repair-summary` | Résumé réparation client/interne (idem). | `verify_jwt = true` |

Déploiement : `supabase functions deploy <nom>`. Secret IA (optionnel) : `supabase secrets set OPENAI_API_KEY=...` — **jamais** côté frontend.

## 5. Configuration frontend

```bash
cp .env.example .env
```
```dotenv
VITE_SUPABASE_URL="https://tftmfhwmzkhzlvgwcnje.supabase.co"
VITE_SUPABASE_ANON_KEY="sb_publishable_..."   # clé publique uniquement
```
`.env` est ignoré par git. Sans configuration, l’app affiche un bandeau d’aide.

## 6. Vérifications

- Conseils sécurité Supabase : voir les *Advisors* (Security/Performance) après toute modification DDL.
- Test d’isolation : `npm run test:rls` (nécessite les fixtures `scripts/rls-fixtures.sql` pour le 2ᵉ garage de test).

## 7. Storage (futur)

Bucket recommandé `garage-documents`, chemins `{garage_id}/...`, URLs signées courtes, accès journalisés. Non activé dans cette version (pas de document sensible stocké).

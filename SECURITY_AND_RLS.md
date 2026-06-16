# GarageFlow — Sécurité & RLS

## 1. Principes
- **Minimisation** : seules les données nécessaires au rendez-vous / devis.
- **Isolation** : chaque donnée métier porte `garage_id` ; RLS en dernier rempart.
- **Séparation des identités** : *garage member* (rôle) / *administrateur* (owner/admin) / *client final* — cloisonnés.
- **Aucun secret côté frontend** : clé anon publique uniquement ; `service_role` jamais utilisée ; `.env` gitignoré.
- **Défense en profondeur** : RLS + triggers + RPC `SECURITY DEFINER` member-checked.

## 2. Fonctions d'aide (SECURITY DEFINER, search_path épinglé)
`is_garage_member(garage_id)` / `has_garage_role(garage_id, roles[])` — utilisées dans les policies (évitent la récursion). Ne révèlent que l'appartenance de l'appelant.

## 3. Policies RLS (résumé)

| Table(s) | Lecture | Écriture |
|---|---|---|
| `garages` | publique si `is_public` ; sinon membres | `owner`/`admin` |
| `garage_services`, `garage_news` | actives/publiées = publiques ; sinon membres | rôles garage |
| `garage_hours` | publique | `owner`/`admin`/`front_desk` |
| `customers`, `vehicles`, `appointments`, `repairs`, `quotes`, `quote_lines`, `documents`, `tasks`, `quote_counters` | **membres du garage** | membres du garage |
| `profiles` | soi + collègues du même garage | soi |
| `client_profiles`, `client_vehicles`, `consents` | **soi uniquement** | soi |
| `service_requests` | client propriétaire **ou** membres du garage | insert par le client ; update client **status-only** (trigger) ou membres |
| `service_request_messages` | participants | client/garage selon `sender` + `author_id = auth.uid()` |
| `audit_logs` | `owner`/`admin` | membres |

## 4. Garde-fous métier (triggers + RPC)
- **`guard_request_transition`** : transitions de statut autorisées par acteur ; un **client ne peut modifier que le statut** de sa demande (aucun champ détail).
- **`create_quote_with_lines` / `update_quote_with_lines`** : transactionnelles, vérifient `is_garage_member(garage)` et que `customer_id`/`vehicle_id` appartiennent au garage. La mise à jour remplace les lignes dans la même transaction → un devis ne perd jamais ses lignes.
- **`next_quote_number`** : séquence atomique par garage/année → pas de numéro en doublon.
- **Promotion demande→RDV** (`request-to-appointment`) : Edge Function sous **JWT de l'appelant** (RLS appliquée), pas de `service_role`.

## 5. Devis : robustesse client/véhicule
- Comparaisons sur valeurs **normalisées** : téléphone (FR-friendly : `+33`/`0033` → `0`), email (trim+lowercase), plaque (uppercase, sans espaces/tirets).
- **Dédoublonnage** : réutilise un client (tél/email) ou un véhicule (plaque, **même client**) existant plutôt que d'en créer un doublon.
- **Jamais** de lien silencieux vers le véhicule d'un autre client : confirmation explicite obligatoire.

## 6. Stockage
- Bucket public `garage-logos` : lecture par URL, écriture **membre du garage** uniquement, pas de listing.
- **PDF de devis non stockés** (générés à la volée) → aucune exposition publique.

## 7. Validation des entrées
- Frontend : Zod (login/inscription) + validations sur les formulaires.
- Edge Functions : Zod sur chaque payload.

## 8. Consentement & données personnelles
- Consentement explicite à l'inscription client ; consentement marketing séparé.
- Données client limitées (nom, contact, véhicule).

## 9. Preuve d'isolation
`npm run test:rls` — **16 assertions** (anon, client, garage A vs B) via clé anon + sign-in réel. Vérifie qu'un garage ne lit/écrit jamais les données d'un autre.

## 10. Advisors Supabase
- Réglés : search_path des fonctions ; listing du bucket logos retiré.
- Acceptés (par conception) : fonctions SECURITY DEFINER appelables par `authenticated` — elles vérifient l'appartenance et n'exposent pas de données d'un autre garage.
- À activer côté projet : *Leaked Password Protection* (Auth).

## 11. Risques résiduels / limites (avant production)
- **PDF devis** généré à la volée — non stocké en **bucket privé**, pas d'**URL signée**, pas de version figée à l'envoi.
- **Facturation** et **signature client en ligne** non incluses.
- **MFA administrateur**, **rate limiting** (Edge Functions/gateway), **invitations équipe** par email, **notifications** email/SMS : à brancher.
- **Audit log** : table présente, à alimenter systématiquement.
- Pack légal RGPD (politique de confidentialité, CGU, DPA, conservation, sous-traitants) à finaliser.

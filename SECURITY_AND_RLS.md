# GarageFlow — Sécurité & RLS

## 1. Principes

- **Minimisation** : seules les données nécessaires à la prise de rendez-vous sont collectées.
- **Isolation** : chaque donnée métier porte `garage_id` ; RLS en dernier rempart.
- **Séparation des identités** : *garage member* (avec rôle) vs *administrateur* (`owner`/`admin`) vs *client final* — strictement cloisonnés.
- **Aucun secret côté frontend** : seule la clé anon (publique) est exposée ; `service_role` jamais utilisée par le client. `.env` est gitignoré.
- **Défense en profondeur** : RLS + triggers de validation + Edge Functions sous JWT de l’appelant.

## 2. Fonctions d’aide (SECURITY DEFINER)

```sql
is_garage_member(garage_id)         -- l'appelant est-il membre actif de ce garage ?
has_garage_role(garage_id, roles[]) -- ... avec l'un de ces rôles ?
```
`SECURITY DEFINER` pour lire `garage_members` sans déclencher la RLS (évite la récursion dans les policies). Elles ne révèlent que **l’appartenance de l’appelant lui-même** (booléen) — aucune donnée d’un autre garage.

## 3. Politiques RLS (résumé)

| Table(s) | Lecture | Écriture |
|---|---|---|
| `garages` | publique si `is_public` ; sinon membres | `owner`/`admin` du garage |
| `garage_services`, `garage_news` | actives/publiées = publiques ; sinon membres | rôles garage |
| `garage_hours` | publique | `owner`/`admin`/`front_desk` |
| `customers`, `vehicles`, `appointments`, `repairs`, `quotes`, `quote_lines`, `documents`, `tasks` | membres du garage | membres du garage |
| `profiles` | soi-même + collègues du même garage | soi-même |
| `client_profiles`, `client_vehicles`, `consents` | **soi-même uniquement** | soi-même |
| `service_requests` | le client propriétaire **ou** les membres du garage | insert par le client ; update par le client OU le garage (transitions filtrées par trigger) |
| `service_request_messages` | participants (client propriétaire ou membres) | client/garage selon `sender` + `author_id = auth.uid()` |
| `audit_logs` | `owner`/`admin` | membres |

**Frontière sensible** = `service_requests` : seule table lisible/écrite des deux côtés. Le trigger `guard_request_transition` n’autorise que :
- **Garage** : `pending → accepted|declined|reschedule_proposed|cancelled`, `reschedule_proposed → accepted|declined|cancelled`, `accepted|confirmed → confirmed|completed|cancelled`.
- **Client** : `accepted|reschedule_proposed → confirmed|cancelled`, `* → cancelled`.

## 4. Promotion contrôlée (Edge Function)

`request-to-appointment` s’exécute **avec le JWT de l’appelant** (un membre du garage). Toutes ses écritures (customer, vehicle, appointment, update de la demande) sont donc soumises à la RLS : un non-membre ne peut rien promouvoir. Aucune clé `service_role`.

## 5. Validation des entrées

- Frontend : Zod + React Hook Form (login, inscription) ; validations explicites sur les formulaires de création.
- Edge Functions : Zod sur chaque payload (rejet 400 si invalide).

## 6. Consentement & données personnelles

- Inscription client : **consentement explicite** obligatoire (case à cocher) pour le traitement des données de rendez-vous.
- Consentement marketing **séparé**, modifiable dans le profil.
- Données client limitées au nécessaire (nom, téléphone/email de contact, véhicule).

## 7. Preuve d’isolation (test automatisé)

`npm run test:rls` — **16 assertions** vérifiées sur le projet live :
- anonyme : aucune lecture des tables privées ; lecture du seul catalogue public ; garage privé invisible.
- client : aucune lecture du CRM garage ; lecture de ses seules demandes/véhicules.
- garage A ↔ garage B : A ne lit ni n’écrit aucune ligne de B (et inversement).

## 8. Résultats des advisors Supabase

- **Réglés** : `function_search_path_mutable` (search_path épinglé) ; EXECUTE retiré sur les fonctions trigger.
- **Acceptés (par conception)** : `is_garage_member` / `has_garage_role` restent appelables (SECURITY DEFINER) car **référencées par les policies RLS** ; elles ne renvoient qu’un booléen sur l’appartenance de l’appelant.
- **À activer côté projet (pilote)** : *Leaked Password Protection* (HaveIBeenPwned) dans Auth → Settings.

## 9. Risques résiduels (à traiter avant production)

1. **Invitations d’équipe** non encore implémentées (création de membres via fonction admin) — aujourd’hui via seed/SQL contrôlé.
2. **Rate limiting** applicatif à ajouter (Edge Functions / gateway) contre l’abus de création de demandes.
3. **Notifications** (email/SMS) non branchées : pas de fuite, mais à sécuriser lors de l’ajout (templates, opt-out).
4. **Storage documents** non activé : à faire avec buckets par garage + URLs signées + journalisation d’accès.
5. **Audit log** : table présente, à alimenter systématiquement sur les actions critiques.
6. **MFA administrateur** : recommandé avant production (Supabase Auth MFA).
7. **Validation serveur renforcée** : ajouter des contraintes/triggers vérifiant que `service_id` appartient bien au `garage_id` de la demande.

# GarageFlow — Architecture technique

## 1. Choix de stack (et pourquoi)

| Décision | Choix | Justification |
|---|---|---|
| Framework front | **Vite + React + TypeScript** | Le produit est une PWA / SPA. Pas de besoin SSR/SEO pour l’app (le marketing reste statique). Build & dev plus rapides que Next.js, déploiement 100 % statique, surface de complexité réduite. TypeScript pour la sûreté de types exigée. |
| Backend | **Supabase** (Postgres + Auth + RLS + Edge Functions) | Chemin le plus rapide **et** sécurisé vers un MVP multi-tenant : Postgres managé, Auth gérée, **RLS** native, Edge Functions pour la logique privilégiée. Correspond à l’« Option A » des docs produit. |
| Données serveur | **TanStack Query** | Cache, invalidation, états loading/error/optimistic « gratuits ». |
| Styling | **Tailwind + tokens CSS variables** | Cohérence, thème clair/sombre, vélocité, adapté au Pro dense et au Client premium. |
| Routing | **React Router (HashRouter)** | Fonctionne sur tout hébergement statique sans rewrite serveur (GitHub Pages, sous-chemins, PWA). |
| Formulaires | **React Hook Form + Zod** | Validation stricte, schémas réutilisables (les Edge Functions valident aussi avec Zod). |
| Animations | **Framer Motion** | Micro-interactions sobres, gardées par `prefers-reduced-motion`. |

### Pourquoi pas Next.js / NestJS ?
Sur-dimensionné pour un pilote : un runtime serveur, du SSR et une API séparée ajoutent de l’ops sans bénéfice ici. La logique privilégiée tient dans des **Edge Functions** ciblées. La migration reste possible (le modèle de données et les Edge Functions sont portables).

## 2. Architecture frontend

```
main.tsx
  ThemeProvider → ToastProvider → QueryClientProvider → AuthProvider → HashRouter → App
App.tsx (routes)
  /            MarketingShell + HomePage
  /pilote      MarketingShell + PilotPage
  /login /signup
  /pro/*       RequireStaff → ProShell (sidebar + topbar) → pages Pro
  /app/*       ClientShell (bottom nav) → pages Client (certaines sous RequireClientAuth)
```

- **AuthProvider** : résout `session → profile → (membership + garage + role)` pour le staff, ou `client_profile` pour le client. Expose `isStaff`, `isClient`, `role`, `garage`, actions `signIn/signUp/signOut`.
- **Guards** : `RequireStaff` (back-office), `RequireClientAuth` (pages client privées). Le marketing et l’accueil client sont publics.
- **Couche données** (`src/data/*`) : un hook React Query par préoccupation. Toutes les écritures passent par le client Supabase typé (RLS appliquée côté serveur).
- **Types** : `database.types.ts` **généré** depuis le schéma live → typage bout-en-bout des requêtes.

## 3. Architecture backend (Supabase)

- **Postgres** : 20 tables (voir [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)). Chaque table métier porte `garage_id`.
- **Auth** : email/mot de passe. Un trigger `handle_new_user` crée automatiquement le `profile` (+ `client_profile` pour les clients) à l’inscription.
- **RLS** : activée sur **toutes** les tables, default-deny. Fonctions `security definer` `is_garage_member` / `has_garage_role` (voir [SECURITY_AND_RLS.md](./SECURITY_AND_RLS.md)).
- **Triggers d’intégrité** : `set_updated_at`, et `guard_request_transition` qui valide les transitions de statut des réservations selon l’acteur (garage vs client).
- **Edge Functions** (Deno) :
  - `request-to-appointment` — promeut une réservation en `customer + vehicle + appointment` **sous le JWT de l’appelant** (donc RLS respectée, pas de `service_role`).
  - `generate-vehicle-ad`, `repair-summary` — IA, clé OpenAI **uniquement** côté fonction, repli sur gabarit déterministe sans clé.

## 4. Modèle de données (résumé)

```
garages ─┬─ garage_members ── profiles ── auth.users
         ├─ client_profiles ── auth.users
         ├─ customers ── vehicles
         ├─ garage_services / garage_news / garage_hours
         ├─ service_requests ── service_request_messages
         │     └─ (confirmée) → appointments, customers, vehicles
         ├─ appointments / repairs / quotes (+ quote_lines)
         ├─ documents / tasks
         └─ consents / audit_logs
client_vehicles ── auth.users   (propriété du client)
```

## 5. Tests & qualité

- `tsc -b` (0 erreur), `eslint` (0 erreur), `vitest` (9 tests), `vite build` (OK + service worker PWA).
- `scripts/rls-antileak.mjs` : **16 assertions** prouvant l’isolation (anon, client, garage A vs garage B) via la clé anon + sign-in réel.
- Vérification runtime (navigation, auth, dashboard, inbox, parcours réservation complet avec Edge Function, app client mobile).

## 6. Déploiement

**Frontend** (statique) :
```bash
npm run build      # produit dist/
```
Déployer `dist/` sur Vercel, Netlify ou GitHub Pages. HashRouter ⇒ pas de configuration de rewrite. Variables d’environnement de build : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

**Backend** : projet Supabase déjà provisionné (`garageflow-c`, région `eu-west-3`). Migrations dans `supabase/migrations`, fonctions dans `supabase/functions`. Voir [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

## 7. Mise à jour — détails d'implémentation

- **Mode démo local** : `src/lib/demo.ts` — store `localStorage` qui reflète chaque hook (auth, catalogue, devis…) ; `isDemo()` aiguille toutes les requêtes. Aucune dépendance Supabase pour la démo.
- **Réservation invité** : `/app/book` public ; brouillon en `sessionStorage`, restauré après l'aller-retour de connexion.
- **Routing marketing** : HashRouter → la nav utilise `scrollToSection()` (jamais `href="#…"` qui créerait une 404).
- **Catalogue / devis** : hooks `data/catalog.ts` & `data/quotes.ts`. Normalisation (`src/lib/normalize.ts`) téléphone (FR-friendly), email, plaque pour le matching/dédoublonnage.
- **Numérotation** : RPC `next_quote_number(garage)` → `DV-YYYY-NNNN` (table `quote_counters`, upsert atomique).
- **Écritures devis transactionnelles + totaux serveur-autoritaires** : RPC `create_quote_with_lines` / `update_quote_with_lines` (SECURITY DEFINER). La base **recalcule** `line_total`/`subtotal`/`tax_total`/`total` en SQL et ignore les montants du frontend ; elle valide les lignes (≥1, libellé/quantité/prix/TVA) et vérifie l'appartenance de `customer_id`/`vehicle_id`/`service_request_id` au garage. Véhicule d'un autre client → flag `cross_customer_vehicle_confirmed` requis ; devis `accepted` non modifiable ; `number`/`garage_id`/`created_at` jamais touchés. Le frontend ne fait plus insert/delete séparés et n'envoie qu'un **aperçu** des totaux (`src/lib/quoteTotals.ts`, partagé avec le mode démo).
- **PDF** : `@react-pdf/renderer` (`src/features/pro/quotePdf.tsx`), import **dynamique** (code-split) ; `downloadQuotePdf()` produit un vrai `application/pdf` affichant les totaux **recalculés côté serveur**. Aperçu écran séparé (`/print/quote/:id`). PDF généré à la volée — non figé / non stocké en bucket privé signé (limite résiduelle).
- **Storage** : bucket public `garage-logos` (écriture membre, pas de listing). PDF non stockés (générés à la volée).

## 8. Migrations

`0001` schéma · `0002` fonctions/triggers · `0003` RLS · `0004` seed · `0005`/`0006` durcissement · `0007` verrou maj client · `0008` catalogue+branding+storage · `0009` snapshot devis · `0010` logos sans listing · `0011` numérotation+contacts devis · `0012` RPC transactionnelles · `0013` totaux devis serveur-autoritaires (recalcul SQL + validation lignes + contrôle demande/client/véhicule + garde-fous update).

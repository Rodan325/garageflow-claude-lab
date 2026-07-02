# GarageFlow

Plateforme **SaaS / PWA** pour garages automobiles indépendants, en deux espaces :

- **GarageFlow Pro** — back-office du garage : dashboard, **réservations reçues**, agenda, clients, véhicules, et — en mode *Atelier avancé* — atelier (kanban), **prestations (catalogue)**, **devis**, équipe, paramètres.
- **GarageFlow Client** — application **mobile-first** : choisir un garage, réserver une prestation, suivre ses demandes, gérer profil et véhicules, lire les actualités.

Promesse : **« Le client réserve. Le garage confirme. Le devis est prêt. »**

Le cœur : un client envoie une **demande** → elle arrive dans l'**inbox du garage** → le garage **confirme / refuse / propose un autre créneau** en 1 clic (création auto du rendez-vous + client + véhicule) → puis génère un **devis PDF** prérempli.

---

## Stack

| Couche | Technologie |
|---|---|
| Frontend | Vite + React 18 + TypeScript |
| UI / design | Tailwind CSS + tokens (clair/sombre), design sobre « outil métier » |
| Routing | React Router 6 (**HashRouter**) |
| Données | TanStack Query + `@supabase/supabase-js` (typé) |
| Formulaires | React Hook Form + Zod |
| PDF | `@react-pdf/renderer` (vrai fichier `.pdf`, code-split) |
| Backend | Supabase : PostgreSQL + Auth + RLS + Edge Functions + Storage |
| Tests | Vitest + script RLS anti-fuite |

---

## Démarrage local

```bash
npm install
cp .env.example .env      # renseigner l'URL Supabase + clé anon (PUBLIQUE uniquement)
npm run dev               # http://127.0.0.1:4174   (npm.cmd run dev … si PowerShell bloque)
```

> `.env` est **gitignoré**. N'y mettre **que** des clés publiques (anon/publishable) ; la clé `service_role` n'est jamais utilisée côté frontend. Sans `.env`, l'app reste utilisable en **mode démo local**.

### Trois façons d'entrer
1. **Mode démo local** (sans Supabase) — sur `/login` : **« Démo garage »** ou **« Démo client »**. Données fictives en `localStorage`, partagées entre onglets, bandeau « Mode démo local ».
2. **Compte garage** (Supabase) : `owner@demo-garage.fr` / `Demo1234!` (gérant) ou `mecano@demo-garage.fr`.
3. **Compte client** (Supabase) : `client@demo.fr` / `Demo1234!`.

### Réservation sans login
Le parcours client `/app/book` est **public** : prestation → créneau → véhicule + coordonnées → **identification seulement à la dernière étape** (connexion / création de compte), brouillon conservé.

---

## Fonctionnalités

- **Réservation client** Doctolib-like (prestations, créneaux, véhicule, confirmation + référence).
- **Inbox garage** : Confirmer le RDV (1 clic), Proposer un autre créneau, Refuser, Appeler, Créer un devis. Pas de faux succès si l'agenda échoue (« Erreur agenda » + Réessayer).
- **Catalogue de prestations** par garage : nom, durée, prix (« à partir de » / fixe), TVA, main-d'œuvre, **lignes de devis par défaut**, visibilité client.
- **Identité garage** : logo (Supabase Storage), adresse, contacts, couleur d'accent, mentions légales — réutilisés sur la page client et les devis.
- **Devis** : depuis une demande (prérempli) ou manuel avec **recherche client + véhicule**, **suggestion** (client par tél/email normalisés, véhicule par plaque), **dédoublonnage**, jamais de lien silencieux vers le véhicule d'un autre client.
- **Numérotation** `DV-YYYY-NNNN` par garage (séquence atomique, RPC) ; **totaux recalculés côté serveur**.
- **Cycle de vie du devis** : `draft` → `sent` → `accepted` / `declined` / `expired`. Le garage **envoie** le devis (lien client tokenisé) ; le client le consulte **sans login** sur `/devis/:token`, télécharge le PDF, puis **accepte** ou **refuse avec motif** ; le garage peut **réviser** (nouveau brouillon). Seul le client accepte/refuse.
- **PDF de devis** réel via `@react-pdf/renderer` (logo, garage, client, véhicule, lignes, HT/TVA/TTC, conditions, bon pour accord).
- **UX progressive** : mode *Essentiel* par défaut, *Atelier avancé* pour les garages techniques.
- États vides / chargement / erreur soignés, motion discret, `prefers-reduced-motion` respecté.

---

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Typecheck (`tsc -b`) + build de production |
| `npm run preview` | Sert le build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Vérification TypeScript |
| `npm run test` | Tests unitaires (Vitest) |
| `npm run test:rls` | Test anti-fuite RLS (isolation entre garages, projet live) |

---

## Structure

```
src/
  components/ui · shells (Marketing/Pro/Client) · common
  features/auth · marketing · pro · client (+ client/booking)
  data/        hooks React Query (garagePublic, requests, clientData, proData, catalog, quotes)
  lib/         supabase, env, theme, motion, format, normalize, slots, demo, utils
  types/       database.types.ts (généré) + domain.ts
supabase/
  migrations/  0001 → 0020 (schéma, RLS, fonctions, seed, catalogue/branding, devis, RPC transactionnelles, totaux serveur, cycle de vie devis, dossier véhicule + partage owner-only, delete demande par membre)
  functions/   request-to-appointment, generate-vehicle-ad, repair-summary
scripts/       rls-antileak.mjs + fixtures
```

## Limites actuelles (pilote)
- Le **PDF est généré à la volée** côté client — **pas encore stocké** dans un bucket privé, **pas d'URL signée**, pas de version figée à l'envoi/acceptation.
- **Envoi du devis** : le lien client tokenisé est copié dans le presse-papier — **email/SMS réels non branchés** (le jeton n'expire pas encore).
- **Facturation** non incluse (devis uniquement).
- **Signature électronique avancée** non incluse (acceptation en ligne + mention « Bon pour accord » sur le PDF).
- Invitations d'équipe par email et notifications email/SMS non branchées.

## Documentation
**Technique** : [PRODUCT_ARCHITECTURE](./PRODUCT_ARCHITECTURE.md) · [TECHNICAL_ARCHITECTURE](./TECHNICAL_ARCHITECTURE.md) · [SUPABASE_SETUP](./SUPABASE_SETUP.md) · [SECURITY_AND_RLS](./SECURITY_AND_RLS.md) · [DATA_PRIVACY_NOTES](./DATA_PRIVACY_NOTES.md) · [VEHICLE_DOCUMENTS_ROADMAP](./VEHICLE_DOCUMENTS_ROADMAP.md)

**Sécurité pilote** : [PILOT_SECURITY_GATE](./PILOT_SECURITY_GATE.md) (go/no-go) · [COST_GUARDRAILS](./COST_GUARDRAILS.md) · [AUTH_RATE_LIMITING](./AUTH_RATE_LIMITING.md) · [SESSION_SECURITY_NOTES](./SESSION_SECURITY_NOTES.md) · [PASSWORD_SECURITY](./PASSWORD_SECURITY.md) · [MFA_ROADMAP](./MFA_ROADMAP.md) · [DEPLOYMENT_SECURITY_CHECKLIST](./DEPLOYMENT_SECURITY_CHECKLIST.md) · `npm run security:scan`

**Légal** : pages publiques `/legal` · `/privacy` · `/terms` · `/pilot-agreement` · `/dpa` (config : `src/config/legal.ts`) · [LEGAL_READINESS_CHECKLIST](./LEGAL_READINESS_CHECKLIST.md) · [TERMS_OF_USE](./TERMS_OF_USE.md) · [PILOT_AGREEMENT_DRAFT](./PILOT_AGREEMENT_DRAFT.md) · [DPA_DRAFT](./DPA_DRAFT.md) · [DATA_PRIVACY_NOTES](./DATA_PRIVACY_NOTES.md)

**Démo & pilote** : [DEMO_QUICKSTART](./DEMO_QUICKSTART.md) (lancer en 5 min) · [LAUNCH_CHECKLIST](./LAUNCH_CHECKLIST.md) (runbook de lancement + plan 72h) · [SALES_DEMO_SCRIPT](./SALES_DEMO_SCRIPT.md) (script de démo) · [GARAGE_DEMO_CHECKLIST](./GARAGE_DEMO_CHECKLIST.md) (RDV garage) · [PILOT_OFFER](./PILOT_OFFER.md) (fiche à envoyer au garage) · [PILOT_DEPLOYMENT_CHECKLIST](./PILOT_DEPLOYMENT_CHECKLIST.md) · [PILOT_READINESS_CHECKLIST](./PILOT_READINESS_CHECKLIST.md) · [DEMO_SCRIPT](./DEMO_SCRIPT.md)

**Prospection** : [SALES_OUTREACH](./SALES_OUTREACH.md) (SMS/e-mails/pitchs/questions) · [SALES_CALL_SCRIPT](./SALES_CALL_SCRIPT.md) (script d'appel) · [SALES_ARGUMENTS](./SALES_ARGUMENTS.md) (argumentaire) · [PROSPECTING_TRACKER_TEMPLATE](./PROSPECTING_TRACKER_TEMPLATE.md) (suivi)

## Déploiement
Frontend statique (`npm run build` → `dist/`) sur Vercel / Netlify / GitHub Pages — HashRouter, aucun rewrite serveur requis. Variables de build : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Backend : projet Supabase `garageflow-c` (eu-west-3), migrations dans `supabase/migrations`.

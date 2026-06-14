# GarageFlow

Plateforme **SaaS / PWA** pour garages automobiles indépendants, en deux espaces :

- **GarageFlow Pro** — back-office du garage (dashboard, réservations reçues, agenda, véhicules, clients, atelier, devis, équipe, paramètres).
- **GarageFlow Client** — application **mobile-first** pour les automobilistes (choisir un garage, réserver, suivre, profil, véhicules, actualités).

Le cœur du produit : un client envoie une **demande de réservation** → elle arrive dans l’**inbox du garage** → le garage **accepte / refuse / propose un autre créneau** → le client **suit le statut** → la demande confirmée devient un **rendez-vous** dans l’agenda (création automatique du client + véhicule côté CRM).

Construit de zéro à partir des documents produit, avec une base **Supabase dédiée**, **RLS** stricte par garage, et des **Edge Functions**.

---

## Stack

| Couche | Technologie |
|---|---|
| Frontend | Vite + React 18 + TypeScript |
| UI / design system | Tailwind CSS + tokens CSS (clair/sombre) + composants maison |
| Routing | React Router 6 (HashRouter) |
| Données serveur | TanStack Query + `@supabase/supabase-js` (typé) |
| Formulaires | React Hook Form + Zod |
| Animations | Framer Motion (respecte `prefers-reduced-motion`) |
| Backend | Supabase : PostgreSQL + Auth + RLS + Edge Functions |
| PWA | `vite-plugin-pwa` (manifest + service worker versionné) |
| Tests | Vitest + Testing Library + script RLS anti-fuite |

Voir [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md) pour les justifications.

---

## Démarrage local

```bash
npm install
cp .env.example .env     # renseigner l'URL Supabase + la clé anon (publique)
npm run dev              # http://127.0.0.1:4174
```

> `.env` est **ignoré par git**. Seules des clés **publiques** (anon / publishable) y figurent ; la clé `service_role` n’est jamais utilisée côté frontend.

### Comptes de démonstration

| Rôle | Email | Mot de passe |
|---|---|---|
| Garage — Gérant | `owner@demo-garage.fr` | `Demo1234!` |
| Garage — Mécanicien | `mecano@demo-garage.fr` | `Demo1234!` |
| Client final | `client@demo.fr` | `Demo1234!` |

---

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Typecheck (`tsc -b`) + build de production |
| `npm run preview` | Sert le build de production |
| `npm run lint` | ESLint |
| `npm run typecheck` | Vérification TypeScript |
| `npm run test` | Tests unitaires / composants (Vitest) |
| `npm run test:rls` | **Test anti-fuite RLS** (isolation entre garages, exécuté sur le projet live) |

---

## Structure

```
src/
  components/ui/        # design system (button, card, badge, modal, toast, …)
  components/shells/    # MarketingShell, ProShell, ClientShell
  components/common/    # Logo, ThemeToggle, SupabaseStatus, PageHeader, ConfigBanner
  features/
    auth/               # AuthProvider, guards, Login, Signup
    marketing/          # HomePage, PilotPage, NotFound
    pro/                # Dashboard, Bookings, Calendar, Vehicles, Clients, Workshop, Quotes, Team, Settings
    client/             # Home, News, Bookings, BookingDetail, Vehicles, Profile, booking/BookingFlow
  data/                 # hooks React Query (garagePublic, requests, clientData, proData)
  lib/                  # supabase, env, theme, motion, format, utils, queryClient
  types/                # database.types.ts (généré) + domain.ts
supabase/
  migrations/           # 0001 schema · 0002 fonctions/triggers · 0003 RLS · 0004 seed · 0005/0006 hardening
  functions/            # request-to-appointment, generate-vehicle-ad, repair-summary
scripts/                # rls-antileak.mjs + rls-fixtures.sql
```

---

## Déploiement

Voir [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) (backend) et la section Déploiement de [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md) (frontend statique — Vercel, Netlify ou GitHub Pages ; HashRouter = aucun rewrite serveur requis).

## Documentation

- [PRODUCT_ARCHITECTURE.md](./PRODUCT_ARCHITECTURE.md) — produit, espaces, parcours, rôles
- [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md) — stack, frontend, backend, choix
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) — schéma, migrations, Edge Functions, config
- [SECURITY_AND_RLS.md](./SECURITY_AND_RLS.md) — modèle de sécurité, RLS, risques résiduels
- [PILOT_READINESS_CHECKLIST.md](./PILOT_READINESS_CHECKLIST.md) — prêt pour pilote / reste à faire
- [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) — script de démo commerciale (≈ 5 min)

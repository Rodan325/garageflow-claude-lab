# Clikarage

Clikarage est une plateforme trilingue de gestion de l'experience client apres-vente automobile pour les garages independants, concessions, franchises et organisations multi-centres.

Le parcours couvert va du rendez-vous a la fidelisation :

    Rendez-vous -> depot -> diagnostic -> accord client -> intervention
    -> controle qualite -> restitution -> historique -> rappels

Le produit visible s'appelle **Clikarage**. Il est edite par **RODANBTECH — Anas RODRIGUEZ BENKARROUM**. Le white-label Speedy fourni dans ce depot est uniquement un exemple de presentation ; il n'active aucune logique metier particuliere.

## Espaces

- **Client** : reservation, suivi de la timeline, devis, recommandations, rapport de restitution, vehicules et rappels.
- **Garage** : demandes, agenda, atelier, diagnostics, recommandations, pieces jointes, devis, rapports et notifications.
- **Reseau** : indicateurs consolides et transferts entre etablissements, visibles uniquement pour une organisation multi-centres et un role autorise.
- **Public** : presentation commerciale, authentification, devis partage et documents legaux.

L'interface prend en charge le francais, l'anglais et l'arabe, y compris le RTL, en themes clair et sombre.

## Demarrage

    npm install
    cp .env.example .env
    npm run dev

Seules des valeurs publiques Supabase (VITE_SUPABASE_URL et cle anon/publishable) peuvent etre placees dans .env. Aucune cle privilegiee ou cle fournisseur ne doit etre exposee au frontend.

Quatre comptes de presentation sont disponibles depuis /login :

- client ;
- garage independant ;
- organisation multi-centres ;
- responsable reseau.

Ils utilisent des donnees fictives isolees et affichent uniquement le badge :

**Compte de démonstration — les actions n’affectent aucune donnée réelle.**

## Architecture

| Couche | Technologie |
|---|---|
| Frontend | Vite, React 18, TypeScript, HashRouter |
| UI | Tailwind CSS, themes clair/sombre, FR/EN/AR |
| Donnees | TanStack Query, Supabase JS, stores de presentation isoles |
| Formulaires | React Hook Form, Zod |
| PDF | @react-pdf/renderer |
| Backend prepare | PostgreSQL, Auth, RLS, RPC et Storage Supabase |
| Tests | Vitest, ESLint, TypeScript et scan de securite |

Les nouvelles capacites dependantes de schema sont protegees par des feature flags desactives par defaut. Elles fonctionnent avec des adaptateurs locaux dans les comptes de presentation, sans appel a un fournisseur externe.

## Commandes

| Commande | Usage |
|---|---|
| npm run typecheck | Verification TypeScript |
| npm run lint | Analyse ESLint |
| npm run test | Tests Vitest |
| npm run build | Build de production local |
| npm run security:scan | Recherche de secrets et pratiques dangereuses |
| npm run test:rls | Tests RLS, uniquement sur une base non productive preparee |

## Activation

Le plan d'architecture, l'ordre des migrations additives, les flags et la procedure de validation sont decrits dans [PRODUCT_ACTIVATION.md](./PRODUCT_ACTIVATION.md).

Les migrations ne doivent jamais etre appliquees directement en production sans reconstruction complete sur une base vide, validation RLS sur une base de test et revue des RPC SECURITY DEFINER.

## Compatibilite

Les identifiants historiques gf-*, les tokens de partage, les tables existantes et les migrations deja appliquees sont conserves. Les routes /#/demo/speedy et /#/demo/reset restent disponibles. La route historique /pilote redirige vers /solutions ; /pilot-agreement reste un document contractuel versionne et ne constitue pas une page commerciale.

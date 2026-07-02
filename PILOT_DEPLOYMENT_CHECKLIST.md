# GarageFlow — Checklist de déploiement pilote

Étapes pour mettre un garage pilote en production (frontend statique + Supabase). Cocher au fur et à mesure.

## 0. Pré-requis
- [ ] Node 18+ et npm installés.
- [ ] Accès au projet Supabase **`garageflow-c`** (région eu-west-3) ou à un projet Supabase dédié au garage.
- [ ] Compte d'hébergement statique (Vercel, Netlify ou GitHub Pages).

## 1. Variables d'environnement (`.env`)
Le frontend n'utilise **que** la clé publique (`anon`). Ne **jamais** exposer la clé `service_role`.
- [ ] `VITE_SUPABASE_URL` = URL du projet Supabase.
- [ ] `VITE_SUPABASE_ANON_KEY` = clé **anon** (publique).
- [ ] `.env` créé en local à partir de `.env.example` (et **jamais commité** — déjà gitignoré).
- [ ] Mêmes variables configurées dans le **dashboard de l'hébergeur** (build env).

## 2. Base de données Supabase (migrations)
- [ ] Appliquer les migrations `supabase/migrations/0001` → `0020` dans l'ordre (schéma, fonctions, RLS, seed, catalogue/branding, numérotation, RPC transactionnelles, totaux serveur, cycle de vie devis, date de validité, dossier véhicule + partage owner-only, delete demande par membre).
- [ ] Vérifier que les RPC existent : `create_quote_with_lines`, `update_quote_with_lines`, `send_quote`, `revise_quote`, `get_quote_public`, `accept_quote_public`, `decline_quote_public`, `next_quote_number`.
- [ ] Types TS à jour si le schéma a changé (`src/types/database.types.ts`).

## 3. Sécurité (RLS)
- [ ] **RLS activée** sur toutes les tables (par défaut : refus).
- [ ] Isolation par garage vérifiée (un garage ne lit/écrit jamais les données d'un autre).
- [ ] RPC devis `SECURITY DEFINER` avec `search_path` épinglé ; accept/refus réservés au client (trigger `guard_quote_transition`).
- [ ] Bucket `garage-logos` : lecture par URL, écriture membre, pas de listing.
- [ ] *(Recommandé)* Activer **Leaked Password Protection** dans Supabase Auth.

## 4. Test d'isolation (anti-fuite)
- [ ] `npm run test:rls` → **60/60 réussis** (isolation + recalcul serveur + cycle de vie devis + dossier véhicule).
- [ ] Après le test, remettre le compteur de devis du garage de démo à zéro si besoin (le script nettoie ses devis de test).

## 5. Build
- [ ] `npm install`
- [ ] `npm run typecheck` (0 erreur)
- [ ] `npm run lint` (0 erreur)
- [ ] `npm run test` (vert)
- [ ] `npm run build` → dossier `dist/`

## 6. Déploiement (Vercel / Netlify / GitHub Pages)
- [ ] Commande de build : `npm run build` · dossier publié : `dist`.
- [ ] Variables `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` renseignées côté hébergeur.
- [ ] **HashRouter** : aucune règle de réécriture serveur nécessaire (les routes sont après `#`).
- [ ] PWA : `dist/sw.js` généré ; tester l'ouverture en navigation privée.

## 7. Domaine
- [ ] Domaine ou sous-domaine configuré (ex. `garage-central.votre-domaine.fr`).
- [ ] HTTPS actif (certificat automatique de l'hébergeur).
- [ ] Vérifier qu'un **lien de devis** `https://…/#/devis/<token>` s'ouvre bien.

## 8. Compte garage
- [ ] Créer le compte du gérant (e-mail + mot de passe) via la page d'inscription / Supabase Auth.
- [ ] Le rattacher au garage (`garage_members`, rôle `owner`).
- [ ] Vérifier la connexion sur **/login** → arrivée sur le **dashboard**.

## 9. Données initiales du garage
- [ ] **Identité** : nom, logo, adresse, téléphone, e-mail, mentions légales, couleur d'accent (Paramètres).
- [ ] **Prestations** réelles : nom, durée, prix de départ, TVA, lignes de devis par défaut, visibilité client.
- [ ] **Horaires** d'ouverture (pour proposer des créneaux cohérents).
- [ ] *(Optionnel)* importer quelques clients / véhicules existants.

## 10. Vérifications fonctionnelles (sur le vrai garage)
- [ ] **Réservation** : faire une demande de test depuis l'espace client → elle arrive dans la boîte de réception.
- [ ] **RDV** : confirmer la demande → rendez-vous + client + véhicule créés.
- [ ] **Devis** : créer un devis depuis la demande → totaux corrects → renseigner la **date de validité** → **Envoyer**.
- [ ] **Lien client** : ouvrir le lien du devis → **Télécharger le PDF** → vérifier logo, coordonnées, lignes, HT/TVA/TTC, conditions.
- [ ] **Acceptation** : accepter le devis côté client → statut **Accepté** côté garage.
- [ ] **Refus / révision** : refuser un autre devis avec motif ; créer une **révision** d'un devis envoyé/accepté.
- [ ] **Mobile** : refaire le parcours client sur un **téléphone** → pas de scroll horizontal, boutons accessibles, PDF téléchargeable.

## 11. Avant de présenter au garage
- [ ] Pré-remplir un peu de contenu réaliste (prestations, 1–2 demandes, 1–2 devis) pour que l'écran ne soit pas vide.
- [ ] Tester une fois le **parcours complet** de bout en bout sur l'URL de production.
- [ ] Garder sous la main : `SALES_DEMO_SCRIPT.md`, `PILOT_OFFER.md`.

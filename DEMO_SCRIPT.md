# GarageFlow — Script de démo (≈ 5 minutes)

> Objectif : montrer en 5 minutes la valeur pour un garage pilote — **les clients réservent, le garage garde la main, l’atelier suit**.

## Préparation (30 s)
- Lancer `npm run dev` → ouvrir `http://127.0.0.1:4174`.
- Avoir deux fenêtres prêtes : une « desktop » (garage) et une étroite / mobile (client).
- Données de démo déjà en place : **Garage Central Lyon**, prestations, 2 clients, 2 véhicules, **1 réservation en attente** (Julie Durand — plaquettes de frein).

## 1. Le pitch sur la landing (30 s)
- Page d’accueil : « Le garage prend ses rendez-vous, vous gardez la main. »
- Faire défiler : problèmes → modules → parcours client/garage → offre pilote.

## 2. Côté client — réserver (90 s)  *(fenêtre mobile)*
1. **Espace client** → choisir **Garage Central Lyon**.
2. Montrer la home premium : prestations, actualités, CTA **Réserver**.
3. **Réserver** → se connecter avec `client@demo.fr` / `Demo1234!` (ou bouton « Démo client »).
4. Parcours guidé : **prestation** (ex. Révision) → **véhicule** (en choisir un / en ajouter) → **créneau** (date + heure) → **coordonnées + message**.
5. **Envoyer la demande** → écran de confirmation animé avec **référence de suivi**.
6. Onglet **Demandes** : la demande apparaît « En attente ».

## 3. Côté garage — traiter la demande (120 s)  *(fenêtre desktop)*
1. Se connecter avec `owner@demo-garage.fr` / `Demo1234!` (bouton « Démo garage »).
2. **Dashboard** : KPI + « Demandes à traiter » + badge **Supabase connecté**.
3. **Réservations** : ouvrir la demande.
   - Montrer **Proposer un autre créneau** (option), puis **Accepter**.
   - Onglet **En cours** → **Confirmer le rendez-vous**.
   - 👉 La demande passe **Confirmée** ; en coulisse, l’Edge Function crée le **client**, le **véhicule** et le **rendez-vous**.
4. **Agenda** : le rendez-vous confirmé apparaît, daté.
5. **Clients / Véhicules** : la fiche a été créée automatiquement (zéro double saisie).

## 4. Côté client — suivi (30 s)  *(fenêtre mobile)*
- Onglet **Demandes** → la réservation est passée **Confirmée**.
- Ouvrir le détail → échanger un **message** avec le garage.

## 5. Atelier & robustesse (45 s)  *(desktop)*
- **Atelier** : kanban des réparations (déplacer une carte d’une colonne à l’autre).
- **Paramètres** : prestations, horaires, **état du backend** (clé publique uniquement).
- Argument sécurité : *« chaque garage est isolé par RLS — un garage ne voit jamais les données d’un autre. »* (test `npm run test:rls` : 16/16).

## Points de vente à marteler
- **Moins d’appels** : les demandes arrivent au même endroit.
- **Zéro double saisie** : la confirmation crée client + véhicule + rendez-vous.
- **Le garage garde la main** : accepter / refuser / proposer un autre créneau.
- **Crédible et sécurisé** : base UE, isolation par garage, données client minimales + consentement.

## Réinitialiser la démo
Si une réservation a été confirmée pendant la démo, la remettre « en attente » (et nettoyer le RDV/CRM créés) via le SQL de remise à zéro documenté, ou ré-exécuter le seed `0004_seed.sql` sur un projet de test.

# Clikarage — Architecture produit

## 1. Vision

Permettre à un garage indépendant — même peu à l’aise avec l’informatique — de **recevoir et gérer ses rendez-vous** sans téléphone permanent ni post-it, et d’offrir à ses clients une **expérience de réservation mobile moderne**.

## 2. Les trois surfaces

### Site marketing (public)
- `#/` accueil : problèmes → solution → modules → parcours → CTA.
- `#/pilote` : offre pilote (inclus, déroulé 4 semaines, prix).

### Clikarage Pro (membres du garage, authentifiés, par rôle)
- **Dashboard** : KPI (demandes en attente, RDV du jour, réparations, tâches, véhicules, clients) + priorités du jour.
- **Réservations reçues** (inbox) : accepter / refuser / proposer un autre créneau / confirmer / messages.
- **Agenda** : rendez-vous planifiés (issus des réservations confirmées ou créés manuellement).
- **Véhicules** : parc clients suivi par le garage.
- **Clients** : carnet d’adresses (CRM).
- **Atelier** : kanban des réparations (à diagnostiquer → restitué).
- **Devis** : TVA, totaux serveur, cycle brouillon → envoyé → accepté/refusé, consultation client par lien.
- **Équipe** : membres et rôles.
- **Paramètres** : infos garage, prestations, horaires, **état du backend**, compte.

### Clikarage Client (automobilistes, mobile-first)
- **Accueil** : choisir / retrouver son garage, prestations, actualités.
- **Réserver** : parcours guidé prestation → véhicule → créneau → coordonnées → confirmation.
- **Demandes** : suivi des réservations + acceptation d’un créneau proposé + annulation + messages.
- **Profil** : coordonnées, garage favori, consentement, déconnexion.
- **Mes véhicules** : dossier véhicule **privé** du client (ajout / modification / archivage / suppression, avec marque, modèle, année, carburant, kilométrage, immatriculation, notes). Un véhicule existant est **réutilisé** lors d'une demande — sans ressaisie — et **partagé par consentement** avec le garage destinataire seulement (révocable). Préparation V2 : documents véhicule (voir `VEHICLE_DOCUMENTS_ROADMAP.md`).
- **Actualités** : publications du garage.

## 3. Rôles

| Rôle | Accès |
|---|---|
| `owner` (Gérant) | Tout, gestion garage + équipe |
| `admin` | Tout, gestion garage + équipe |
| `advisor` (Conseiller) | Réservations, clients, véhicules, devis, prestations |
| `mechanic` (Mécanicien) | Atelier, véhicules |
| `front_desk` (Réception) | Réservations, agenda, clients, prestations, horaires |
| Client final | Uniquement ses propres données |

Les rôles sont appliqués **côté base** par les policies RLS (pas seulement côté UI).

## 4. Le workflow central (réservation → rendez-vous)

```
Client                          Garage
──────                          ──────
Choisit garage + prestation
Choisit / ajoute véhicule
Choisit un créneau
Envoie la demande  ───────────▶  Demande "en attente" dans l'inbox
                                 Accepter ──▶ "acceptée"
                                 ou Proposer un créneau ──▶ "autre créneau proposé"
Accepte le créneau  ◀──────────  (le client confirme)
                                 Confirmer ──▶ Edge Function:
                                   crée client CRM + véhicule + rendez-vous (agenda)
                                   statut "confirmée"
Suit le statut      ◀──────────  (terminée à la fin de la prestation)
```

Transitions de statut : `pending → accepted | declined | reschedule_proposed → confirmed → completed | cancelled`.
Chaque transition est **validée côté base** par un trigger (qui autorise au garage et au client uniquement leurs transitions légitimes).

## 5. États & qualité d’expérience

- États **vides** explicites (inbox vide, aucun véhicule, aucune actualité…).
- États **de chargement** (skeletons, spinners).
- États **d’erreur** propres (toasts, messages, bouton réessayer).
- **Motion** discret (entrées de listes, transitions d’étapes, confirmation animée), désactivé si `prefers-reduced-motion`.
- **Mobile-first** côté client (bottom navigation, sheets), **dense et lisible** côté Pro (sidebar, topbar avec statut backend).

## 6. Évolutions prévues

- Invitation d’équipe par email (Edge Function admin).
- Notifications email/SMS sur changement de statut.
- Disponibilité atelier réelle (capacité par créneau).
- Boutons IA branchés sur les Edge Functions (annonce véhicule, résumé réparation).

## 6. Mise à jour — état réel (pilote)

Au-delà du socle ci-dessus, le produit livré inclut :

- **Réservation client sans login** : `/app/book` est public ; le client va jusqu'au récapitulatif et **s'identifie seulement à la dernière étape** (connexion ou création de compte), brouillon conservé.
- **Mode démo local** (sans Supabase) : « Démo garage » / « Démo client » sur `/login`, données fictives `localStorage` partagées entre onglets.
- **UX progressive Pro** : mode *Essentiel* (réservations, agenda, clients, véhicules) par défaut ; *Atelier avancé* (atelier, **prestations**, **devis**, équipe).
- **Catalogue de prestations** par garage (durée, prix « dès / fixe », TVA, main-d'œuvre, **lignes de devis par défaut**, visibilité client) — visible côté client et utilisé pour préremplir les devis.
- **Identité garage** (logo via Supabase Storage, adresse, contacts, couleur d'accent, mentions légales) réutilisée page client + devis.
- **Devis** : depuis une demande (prérempli) ou manuel avec **recherche client + véhicule**, **suggestion** (client par téléphone/email normalisés, véhicule par plaque normalisée), **dédoublonnage**, **confirmation explicite** avant d'utiliser le véhicule d'un autre client.
- **Numérotation** `DV-YYYY-NNNN` par garage ; **PDF réel** (`@react-pdf/renderer`) ; totaux **recalculés côté serveur**.
- **Cycle de vie du devis** : `draft` (modifiable) → `sent` (envoyé, figé) → `accepted` / `declined` / `expired`. Le garage **envoie** le devis (un lien client tokenisé est généré) ; le client le **consulte sans login** sur `/devis/:token`, **télécharge le PDF**, puis **accepte** ou **refuse avec motif**. Un devis envoyé n'est plus modifiable : le garage crée une **révision** (nouveau brouillon, lien `revised_from`). Seul le client accepte/refuse (jamais le garage).
- Workflow complet : **demande → confirmation (RDV + client + véhicule) → devis brouillon → envoyé → accepté/refusé** (visible des deux côtés).

Limites pilote : PDF généré à la volée (pas encore en bucket privé / URL signée, pas de version figée à l'envoi) ; envoi du lien **manuel** (email/SMS réels à brancher) ; pas de facturation ni de signature électronique avancée.

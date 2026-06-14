# GarageFlow — Checklist de préparation pilote

## ✅ Prêt pour un pilote garage

### Produit
- [x] Landing claire + page offre pilote
- [x] Espace garage (Pro) avec dashboard lisible
- [x] Espace client mobile-first avec bottom navigation
- [x] Authentification garage (email/mot de passe) + rôles
- [x] Réservation client de bout en bout (prestation → véhicule → créneau → coordonnées → confirmation)
- [x] Inbox réservations côté garage
- [x] Acceptation / refus / proposition d’un autre créneau
- [x] Suivi de statut côté client (+ acceptation du créneau proposé, annulation)
- [x] Conversion d’une demande confirmée en rendez-vous (client + véhicule + agenda) via Edge Function
- [x] Gestion véhicules (garage + client), clients, atelier (kanban), agenda, devis simples
- [x] Paramètres : infos garage, prestations, horaires, **statut Supabase visible**
- [x] États vides / chargement / erreur propres
- [x] Motion discret respectant `prefers-reduced-motion`
- [x] Design responsive (mobile + desktop) et mode sombre

### Sécurité
- [x] RLS activée sur toutes les tables (default-deny)
- [x] Isolation cross-tenant prouvée (16 assertions automatisées)
- [x] Séparation garage member / admin / client final
- [x] Aucune clé `service_role` côté frontend ; `.env` gitignoré
- [x] Validation des formulaires (Zod) et des payloads Edge Functions
- [x] Consentement explicite à l’inscription client + consentement marketing séparé
- [x] Trigger de validation des transitions de statut

### Qualité technique
- [x] `tsc -b` sans erreur
- [x] `eslint` sans erreur
- [x] `vitest` (9 tests) au vert
- [x] `vite build` OK + service worker PWA généré
- [x] Vérification runtime des parcours clés

## 🔜 Avant une mise en production commerciale

### Sécurité / conformité
- [ ] Activer *Leaked Password Protection* (Supabase Auth)
- [ ] MFA obligatoire pour `owner`/`admin`
- [ ] Rate limiting (Edge Functions / gateway) sur la création de demandes et l’IA
- [ ] Alimenter `audit_logs` sur les actions critiques + écran d’historique
- [ ] Contrainte serveur : `service_id` ∈ `garage_id` de la demande
- [ ] Pack légal : politique de confidentialité, CGU, DPA, politique de conservation, liste des sous-traitants
- [ ] Procédures RGPD : export / suppression des données client

### Produit / ops
- [ ] Invitations d’équipe par email (Edge Function admin)
- [ ] Notifications email/SMS sur changement de statut (avec opt-out)
- [ ] Disponibilité atelier réelle (capacité par créneau, jours fériés)
- [ ] Devis détaillés (lignes) + signature + documents (Storage chiffré, URLs signées)
- [ ] Sauvegardes/PITR vérifiées, monitoring, plan incident
- [ ] Code-splitting par espace (réduire le bundle initial)
- [ ] Tests E2E automatisés (Playwright) sur les parcours critiques

## Comptes & environnement de démo

| Rôle | Email | Mot de passe |
|---|---|---|
| Gérant | `owner@demo-garage.fr` | `Demo1234!` |
| Mécanicien | `mecano@demo-garage.fr` | `Demo1234!` |
| Client | `client@demo.fr` | `Demo1234!` |

Projet Supabase : `garageflow-c` (`eu-west-3`). Garage de démo : **Garage Central Lyon**.

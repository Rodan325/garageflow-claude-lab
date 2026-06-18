# GarageFlow — Checklist de préparation pilote

## ✅ Prêt pour un pilote garage

### Produit
- [x] Landing claire (nav qui scrolle, sans 404) + page offre pilote
- [x] Espace garage (Pro) — dashboard sobre, 3 KPI + « à faire »
- [x] Espace client mobile-first + **vrai layout desktop** (pas de phone frame forcée)
- [x] **Réservation client sans login** jusqu'à la dernière étape (identification finale, brouillon conservé)
- [x] **Mode démo local** garage + client (sans Supabase)
- [x] Inbox réservations : **Confirmer le RDV en 1 clic** (crée RDV + client + véhicule), Proposer un créneau, Refuser, Appeler — **pas de faux succès** si l'agenda échoue
- [x] Suivi de statut côté client (+ accepter un créneau proposé, annuler, messages)
- [x] **Catalogue de prestations** (durée, prix, TVA, main-d'œuvre, lignes par défaut, visibilité)
- [x] **Identité garage** + logo (Supabase Storage) réutilisé page client / devis
- [x] **Devis** depuis une demande ou manuel, avec recherche/suggestion/dédoublonnage client + véhicule
- [x] **Numérotation** `DV-YYYY-NNNN` par garage (séquence atomique)
- [x] **Devis PDF réel** (`@react-pdf/renderer`) : logo, garage, client (tél/email), véhicule/immatriculation, lignes, HT/TVA/TTC, conditions, bon pour accord
- [x] Création de devis/MAJ **transactionnelle** (RPC) — un devis ne perd jamais ses lignes ; totaux **recalculés côté serveur**
- [x] **Cycle de vie du devis** : `draft` → `sent` → `accepted` / `declined` / `expired` ; seul un brouillon est modifiable, l'accepté est définitif
- [x] **Envoi au client** : action « Envoyer », `sent_at`, **lien de consultation tokenisé** copié (email/SMS à brancher plus tard)
- [x] **Page client de consultation** `/devis/:token` (sans login) : document complet, **télécharger le PDF**, **accepter** ou **refuser avec motif**
- [x] **Révision** : « Réviser » crée une nouvelle version en brouillon (lien `revised_from`), sans écraser l'envoyé/accepté
- [x] UX progressive (Essentiel / Atelier avancé), agenda, atelier kanban, clients, véhicules
- [x] États vides / chargement / erreur ; motion discret ; responsive sans scroll horizontal

### Sécurité
- [x] RLS sur toutes les tables (default-deny) ; **isolation + cycle devis prouvés 42/42**
- [x] Séparation garage member / admin / client ; client = statut-only sur sa demande
- [x] Aucune clé `service_role` côté frontend ; `.env` gitignoré
- [x] RPC devis member-checked ; totaux recalculés serveur ; jamais de lien silencieux vers le véhicule d'un autre client
- [x] **Consultation devis par jeton non devinable** (RPC `SECURITY DEFINER`) — jamais énumérable, jamais cross-tenant
- [x] **Accepter/refuser réservés au client** (trigger `guard_quote_transition`) ; le garage ne peut pas accepter à sa place ; accepté = définitif
- [x] Logos publics par URL (écriture membre, pas de listing) ; PDF non publics (non stockés)
- [x] Validation Zod (frontend + Edge Functions) ; consentement client explicite

### Qualité technique
- [x] `tsc -b` 0 erreur · `eslint` 0 erreur · `vitest` 28 tests · `vite build` OK · `test:rls` 42/42

## 🔜 Avant production
- [ ] PDF devis **stocké en bucket privé** + **URL signée** + version figée à l'envoi/acceptation
- [ ] **Facturation** (devis → facture) + **signature client en ligne**
- [ ] Activer *Leaked Password Protection* (Auth) ; MFA owner/admin
- [ ] Rate limiting (Edge Functions / gateway)
- [ ] Invitations équipe par email ; notifications email/SMS (avec opt-out)
- [ ] Alimenter `audit_logs` + écran d'historique
- [ ] Disponibilité atelier réelle (capacité par créneau, jours fériés)
- [ ] Pack légal RGPD ; sauvegardes/PITR vérifiées, monitoring, plan incident
- [ ] Tests E2E (Playwright) sur les parcours critiques

## Comptes & environnement
| Rôle | Email | Mot de passe |
|---|---|---|
| Gérant | `owner@demo-garage.fr` | `Demo1234!` |
| Mécanicien | `mecano@demo-garage.fr` | `Demo1234!` |
| Client | `client@demo.fr` | `Demo1234!` |

Projet Supabase `garageflow-c` (eu-west-3). Garage de démo : **Garage Central Lyon**. Mode démo local disponible sans Supabase.

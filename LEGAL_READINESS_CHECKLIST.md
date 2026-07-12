# Clikarage — Checklist de préparation légale (pilote)

> **Note interne** : Relecture juridique recommandée avant commercialisation large, contrat payant important, traitement à grande échelle ou ajout de documents sensibles.

Source unique des informations publiques : `src/config/legal.ts` (versions : `legalVersions`, docs requis par rôle : `REQUIRED_LEGAL_DOCS`, test anti-placeholder : `src/config/legal.test.ts`).

## Pages légales publiques
- [x] `/legal` — Mentions légales (version affichée)
- [x] `/privacy` — Politique de confidentialité (résumé rapide + tableau des données, version affichée)
- [x] `/terms` — CGU renforcées (définitions, acceptation, limitation de responsabilité raisonnable, preuve, version affichée)
- [x] `/pilot-agreement` — Contrat pilote détaillé (acceptation, durée, périmètre inclus/exclu, financier, plafond 100 € / 3 mois, résiliation, non-référence)
- [x] `/dpa` — DPA proche de l'article 28 RGPD (instructions documentées, sous-traitants, transferts, audit raisonnable, sort des données)
- [x] Footer légal (`LegalFooter`) présent partout : landing, login, signup, espace client, espace garage, devis public
- [x] Note publique assumée (« version pilote ») — la mention « à faire relire » reste **interne uniquement**

## Acceptation obligatoire & traçable
- [x] **Versionnement** des documents (`legalVersions`) — version affichée sur chaque page
- [x] **Table `legal_acceptances`** (migration 0021) : user, rôle, document, version, horodatage, user-agent, contexte — **append-only** (pas de policy update/delete), jamais exposée à l'anon
- [x] **Signup client** : case d'acceptation obligatoire non pré-cochée (CGU + confidentialité, versions affichées) + enregistrement automatique après inscription
- [x] **LegalAcceptanceGate** : blocage post-connexion tant que les documents requis (version courante) ne sont pas acceptés — client : CGU + confidentialité ; garage : CGU + confidentialité + contrat pilote + DPA ; nouvelle version ⇒ nouvelle acceptation demandée
- [x] **Acceptation différenciée client / garage** (`REQUIRED_LEGAL_DOCS`)
- [x] **Page `/pro/legal-status`** : documents applicables, versions acceptées, dates, statut accepté/manquant, liens
- [x] **Preuve devis** : acceptation horodatée + versions CGU/confidentialité stampées sur le devis (`accepted_terms_version`, `accepted_privacy_version`) + texte de confirmation avec liens
- [x] Mode démo non bloqué (gate et journal désactivés sans Supabase)

## Informations éditeur (réelles, sans placeholder)
- [x] Email professionnel (anas.rodriguez@rodanbtech.com) · Téléphone (+33 7 81 18 93 65)
- [x] SIREN (103 878 187) / SIRET (103 878 187 00014) · Adresse (47 RUE VIVIENNE, 75002 PARIS, France) · RNE (17/04/2026)
- [x] Hébergeur frontend (Vercel Inc.) · Prestataire technique (Supabase, Inc.)
- [x] Test anti-placeholder + versions + docs requis verts (`npm run test` → `legal.test.ts`)

## Périmètre pilote (verrouillé)
- [x] Pas de documents sensibles · pas d'analytics marketing · pas de cookies publicitaires · pas de paiement en ligne

## Sécurité & données
- [x] Données cloisonnées client/garage (RLS) ; véhicule client partagé par consentement révocable
- [x] RLS **68/68** (`npm run test:rls`) — dont 8 tests `legal_acceptances` (insert/lecture strictement personnels, anon exclu)
- [x] Security scan OK (`npm run security:scan`)

## Setup d'hébergement (vérifié)
- [x] **Région Supabase vérifiée : eu-west-3 — West EU (Paris)** (dashboard → Project Settings → Region ; région européenne) — reportée dans `src/config/legal.ts` (`backendDataRegion`)
- [x] **Hébergement application : Vercel** (Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA)
- [x] **Domaine / email : Squarespace / Google Workspace selon configuration** (Squarespace gère le domaine ; il n'héberge pas l'application)

## Avant commercialisation large (à faire)
- [ ] **Validation juridique** des 5 documents par un professionnel du droit
- [ ] DPA signé bilatéralement avec chaque garage payant
- [ ] Politique de conservation détaillée par catégorie ; vérification région UE Supabase + garanties de transfert
- [ ] Numéro de TVA intracommunautaire une fois obtenu → mettre à jour `src/config/legal.ts`
- [ ] À chaque évolution substantielle d'un document : incrémenter sa version dans `legalVersions` (la gate redemandera l'acceptation)

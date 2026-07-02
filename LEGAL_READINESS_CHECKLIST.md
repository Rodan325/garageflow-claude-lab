# GarageFlow — Checklist de préparation légale (pilote)

> **Note interne** : Documents préparés pour le pilote. Relecture juridique recommandée avant commercialisation large, signature de contrats payants importants ou traitement à grande échelle.

Source unique des informations publiques : `src/config/legal.ts` (test anti-placeholder : `src/config/legal.test.ts`).

## Pages légales publiques
- [x] `/legal` — Mentions légales présente
- [x] `/privacy` — Politique de confidentialité présente
- [x] `/terms` — CGU présentes
- [x] `/pilot-agreement` — Contrat pilote disponible
- [x] `/dpa` — DPA disponible
- [x] Footer légal (`LegalFooter`) présent partout : landing, login, signup, espace client, espace garage, devis public `/devis/:token`
- [x] Liens légaux dans les formulaires : signup (CGU + confidentialité), réservation (consentement + confidentialité), devis public (confidentialité + CGU)
- [x] Espace garage : liens Contrat pilote + DPA via le footer légal

## Informations éditeur (réelles, sans placeholder)
- [x] Email professionnel présent (anas.rodriguez@rodanbtech.com)
- [x] Téléphone professionnel présent (+33 7 81 18 93 65)
- [x] SIREN présent (103 878 187) / SIRET présent (103 878 187 00014)
- [x] Adresse du siège présente (47 RUE VIVIENNE, 75002 PARIS, France)
- [x] Immatriculation RNE présente (17/04/2026)
- [x] Hébergeur frontend indiqué (Vercel Inc.)
- [x] Prestataire technique indiqué (Supabase, Inc. — base de données, auth, infrastructure)
- [x] Test anti-placeholder vert (`npm run test` → `legal.test.ts`)

## Périmètre pilote (verrouillé)
- [x] Pas de documents sensibles pendant le pilote (carte grise, assurance, CT, factures, identité, bancaire, santé)
- [x] Pas d'analytics marketing pendant le pilote
- [x] Pas de cookies publicitaires
- [x] Pas de paiement en ligne dans l'app

## Sécurité & données
- [x] Données cloisonnées client/garage (RLS par garage, véhicule client partagé par consentement révocable)
- [x] RLS 60/60 (`npm run test:rls`)
- [x] Security scan OK (`npm run security:scan` — aucun secret frontend)
- [x] Politique de mot de passe renforcée ; erreurs de connexion génériques

## Avant commercialisation large (à faire)
- [ ] **Validation juridique** des 5 documents par un professionnel du droit
- [ ] Politique de conservation détaillée par catégorie de données
- [ ] Vérification région UE Supabase + garanties de transfert (clauses contractuelles types)
- [ ] DPA signé avec chaque garage payant ; traçage horodaté de l'acceptation des CGU
- [ ] Numéro de TVA intracommunautaire une fois obtenu → mettre à jour `src/config/legal.ts`

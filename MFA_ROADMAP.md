# GarageFlow — MFA (double authentification) : roadmap

> **État : NON activée.** Ce document décrit un plan propre. Ne pas prétendre que la MFA est en place tant qu'elle ne l'est pas.

## Recommandation
- **MFA recommandée (puis obligatoire) pour les comptes garage / admin** : ce sont les comptes qui voient les données clients, les devis et le CRM — la cible d'un vol d'identifiants.
- **MFA optionnelle pour les clients finaux** : leur périmètre est limité (leurs demandes, leurs véhicules) ; l'imposer nuirait à l'adoption (réservation rapide). On l'offre en option, sans l'imposer.
- **Ne pas casser la démo** : le mode démo local (sans Supabase) n'est pas concerné par la MFA.

## Faisabilité
Supabase Auth supporte la **MFA TOTP** (application d'authentification type Google Authenticator / Authy) avec des niveaux d'assurance (`aal1` / `aal2`). C'est utilisable proprement via `supabase.auth.mfa.*`.

## Étapes techniques (plan V1 → V2)
### V1 — MFA optionnelle (TOTP), opt-in garage
1. Activer la MFA dans le dashboard Supabase (Authentication → MFA).
2. Écran « Sécurité » dans l'espace garage :
   - `supabase.auth.mfa.enroll({ factorType: 'totp' })` → afficher le **QR code** + secret.
   - `supabase.auth.mfa.challenge` + `verify` pour confirmer l'enrôlement.
   - Lister / supprimer les facteurs (`listFactors`, `unenroll`).
3. À la connexion, si un facteur existe : demander le code TOTP (`challenge` + `verify`) pour atteindre `aal2`.
4. Codes de secours (récupération) : afficher et stocker de façon sûre (ou régénérer).

### V2 — MFA obligatoire pour owner/admin
1. Politique : les rôles `owner`/`admin` doivent avoir `aal2` pour accéder au back-office.
2. Garde d'accès : bloquer `/pro` sensible tant que `aal2` n'est pas atteint (rediriger vers l'enrôlement).
3. *(Optionnel, avancé)* renforcer côté base avec des policies tenant compte du niveau d'assurance du JWT pour les tables les plus sensibles.

## Impact UX
- Enrôlement : ~1 minute (scanner un QR une fois).
- Connexion : un code à 6 chiffres en plus, uniquement pour le staff.
- Prévoir la **récupération** (perte du téléphone) : codes de secours + procédure support.

## Limites / précautions
- Ne pas livrer une implémentation fragile : tester enrôlement, connexion, perte de facteur, révocation.
- SMS OTP déconseillé (coût + SIM-swap) → privilégier **TOTP** (gratuit, standard).
- Documenter la procédure de secours avant d'imposer la MFA.

## Priorité
Non bloquant pour un **premier pilote** (1 garage de confiance) si : mots de passe forts + leaked-password protection + RLS. **Recommandé avant d'ouvrir à plusieurs garages / comptes admin multiples.**

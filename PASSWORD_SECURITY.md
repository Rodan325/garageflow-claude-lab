# GarageFlow — Sécurité des mots de passe

## Règles appliquées (frontend, au signup)
Implémenté dans `src/lib/password.ts` (+ tests) et branché sur `SignupPage` :
- **≥ 12 caractères** minimum.
- Une **phrase de passe longue** (≥ 16 caractères) est acceptée telle quelle — pas de règle absurde imposée.
- Entre 12 et 15 caractères : exiger **au moins 3 catégories** parmi majuscule / minuscule / chiffre / symbole.
- **Indicateur de force** (Faible / Moyen / Fort) affiché en direct.
- **Message clair** si trop faible (« Au moins 12 caractères — une phrase de passe est idéale. »).

> Philosophie : encourager les **phrases de passe** (faciles à retenir, difficiles à casser) plutôt que des règles de composition frustrantes.

## À activer dans Supabase (backend — indispensable)
La validation frontend est contournable (on peut appeler l'API directement). La **vraie** protection est côté Supabase :
- [ ] **Leaked Password Protection** — Dashboard → Authentication → Passwords → activer. Refuse les mots de passe présents dans les fuites connues (via HaveIBeenPwned, comparaison par **k-anonymity** : le mot de passe en clair n'est jamais envoyé).
- [ ] **Longueur minimale** — régler la même exigence (≥ 12) côté Supabase pour aligner backend et frontend.
- [ ] *(Optionnel)* exigences de caractères Supabase si souhaité — mais préférer la longueur.

## Ne pas faire
- **Ne jamais** envoyer le mot de passe **en clair** à une API externe de vérification depuis le frontend. La vérification « mot de passe fuité » doit passer par Supabase (k-anonymity) ou une Edge Function, jamais par un POST du mot de passe brut.
- Ne pas logguer le mot de passe (aucun `console.log` — vérifié).
- Ne pas imposer de rotation forcée arbitraire (contre-productif).

## Limites
- La politique frontend peut être contournée → **Leaked Password Protection Supabase est obligatoire** avant vraies données.
- Pas de vérification de similarité avec l'e-mail/nom (améliorable en V2).
- Reset de mot de passe : géré par Supabase (e-mail) ; s'assurer que le SMTP et les templates sont configurés.

## Tests manuels
1. Signup `Abc1!` → **refusé** (trop court).
2. Signup `azertyuiopqs` (12, une seule casse) → **refusé** (manque de variété).
3. Signup `Azerty123456` → accepté, force **Moyen**.
4. Signup `j aime les vieilles voitures` → accepté, force **Fort**.
5. Avec Leaked Password Protection activée : un mot de passe fuité connu (`Password123!`) → **refusé par Supabase**.

# GarageFlow — Sécurité des sessions & jetons (frontend)

## Le fait honnête à connaître
GarageFlow est une **SPA** (frontend statique + Supabase). Les jetons Supabase Auth (access + refresh) sont donc **stockés dans le navigateur** (par défaut `localStorage`) et **accessibles au JavaScript** de la page. **On ne peut pas** obtenir la même protection qu'un cookie `HttpOnly`/`SameSite` **sans** une architecture backend qui proxifie l'auth. C'est un compromis inhérent aux SPA — il faut donc **compenser** ailleurs.

## Compensations en place
- **RLS stricte** : même avec un jeton, on ne peut lire/écrire que ce que les policies autorisent (isolation garage/client prouvée, 60/60).
- **Aucun secret côté frontend** : clé anon publique uniquement ; pas de `service_role`, pas de clé IA/paiement. Un vol de session ne donne **pas** de super-pouvoir serveur.
- **Pas de XSS évident** : aucun `dangerouslySetInnerHTML`, aucun rendu HTML brut de données utilisateur, aucune injection ; React échappe le contenu par défaut.
- **Pas de log de secrets** : aucun `console.log` de session/JWT/user/clé (vérifié par `security:scan`).
- **Minimisation** : les vues publiques (devis par jeton) ne renvoient **que** le devis concerné + l'identité **publique** du garage — jamais les données d'autres clients ni les données garage complètes.
- **Expiration** : les access tokens Supabase expirent (≈ 1 h) et sont rafraîchis ; on peut réduire la durée dans le dashboard.
- **Jetons de devis** : non devinables (64 hex), limités à la consultation + accept/refus de **ce** devis, révocables (nouvelle version). Pas de jeton admin dans une URL.

## Vérifications faites
- [x] Pas de `console.log` de session/token/JWT dans `src/`.
- [x] Pas de jeton sensible en `localStorage` **hors** Supabase Auth (le store démo ne contient que des données fictives ; le rôle démo est en `sessionStorage`).
- [x] Pas de jeton admin dans l'URL. Seul `/devis/:token` expose un jeton **public** dédié.
- [x] `/devis/:token` n'expose que le devis public prévu (RPC `get_quote_public`) — pas de données d'autres clients, pas de données garage complètes.
- [x] Pas de `dangerouslySetInnerHTML` ; formulaires validés (Zod / validations).
- [x] Dépendances installées via `package-lock.json` (auditables avec `npm audit`).

## Recommandations (durcissement)
- **CSP** stricte à l'hébergeur (voir `DEPLOYMENT_SECURITY_CHECKLIST.md`) : réduit fortement l'impact d'un éventuel XSS (empêche l'exfiltration du jeton vers un domaine tiers).
- **Durée de vie du token** raccourcie si le contexte l'exige (dashboard Auth).
- **`npm audit`** régulier ; garder les dépendances à jour (surtout React, Supabase, react-pdf).
- **MFA** pour garage/admin (voir `MFA_ROADMAP.md`) : limite l'impact d'un vol d'identifiants.
- **Éviter d'ajouter** des libs qui rendent du HTML utilisateur brut ; si un jour nécessaire, sanitiser (DOMPurify) et justifier.

## Ce qu'on ne prétend PAS
- On **ne** prétend **pas** que la session est à l'épreuve d'un XSS réussi : si du JS malveillant s'exécutait dans la page, il pourrait lire le jeton. D'où l'importance de la CSP, de l'absence d'injection, et de dépendances saines.
- Une vraie protection « cookie HttpOnly » nécessiterait un **backend proxy d'auth** (évolution possible, hors périmètre pilote).

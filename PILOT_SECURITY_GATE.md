# GarageFlow — Porte de sécurité pilote (go / no-go)

Synthèse honnête de l'état de sécurité avant de brancher de **vraies données** de garage. Détails dans les fiches liées. Ce qui est **fait** vs **à activer dans Supabase** vs **limites assumées** est indiqué clairement — rien n'est présenté comme sécurisé s'il ne l'est pas.

Fiches : [SECURITY_AND_RLS](./SECURITY_AND_RLS.md) · [AUTH_RATE_LIMITING](./AUTH_RATE_LIMITING.md) · [SESSION_SECURITY_NOTES](./SESSION_SECURITY_NOTES.md) · [COST_GUARDRAILS](./COST_GUARDRAILS.md) · [PASSWORD_SECURITY](./PASSWORD_SECURITY.md) · [MFA_ROADMAP](./MFA_ROADMAP.md) · [DEPLOYMENT_SECURITY_CHECKLIST](./DEPLOYMENT_SECURITY_CHECKLIST.md)

---

## ✅ Fait (vérifié)
- **Aucun secret côté frontend** : clé **anon** publique uniquement ; aucune clé `service_role` / OpenAI / Anthropic / paiement dans `src/`, `public/`, `.env.example` ou docs. Vérifié par `npm run security:scan`.
- **Aucune API payante appelée depuis le navigateur** : le seul appel Edge Function est `request-to-appointment` (sans clé). Les fonctions IA gardent leur clé côté serveur et **ne sont pas branchées** au frontend.
- **RLS par défaut-deny** sur toutes les tables ; isolation garage A/B et client A/B **prouvée par `npm run test:rls` (60/60)**, y compris accès par **ID direct** refusé et **auto-partage** de véhicule refusé.
- **Devis public** : consultable seulement via un **jeton non devinable** (RPC `SECURITY DEFINER`), jamais énumérable, jamais cross-tenant ; accepter/refuser réservés au client.
- **Séparation des espaces** : `/pro` réservé au staff, pages client protégées ; un client est redirigé hors de `/pro`, un garage hors de `/app/*`. La RLS reste la vraie barrière (le frontend n'est qu'une commodité).
- **Mots de passe** : ≥ 12 caractères (ou phrase de passe longue), indicateur de force, message générique au login (anti-énumération). Voir `PASSWORD_SECURITY.md`.
- **Pas de fuite évidente** : aucun `console.log` de session/token, aucun `dangerouslySetInnerHTML`, aucun `fetch` direct vers une API externe.

## ⚙️ À activer dans le dashboard Supabase (avant vraies données)
- **Leaked Password Protection** (Auth → Passwords) — refuse les mots de passe fuités (HaveIBeenPwned).
- **CAPTCHA** (hCaptcha/Turnstile) sur login/signup si abus constatés.
- **Rate limits Auth** (Auth → Rate Limits) : conserver/ajuster les limites d'essais.
- **Confirmation d'email** activée ; SMTP configuré.
- **Spend cap / alertes budget** Supabase (voir `COST_GUARDRAILS.md`).
- **PITR / sauvegardes** vérifiées (plan payant) ou export régulier.

## ⚠️ Limites assumées (à dire au garage)
- **SPA = jetons dans le navigateur.** Les jetons Supabase Auth sont accessibles au JS du navigateur (pas de cookie `HttpOnly` sans backend dédié). On compense par RLS stricte, zéro secret frontend, absence de XSS, expiration des jetons, minimisation des données. Voir `SESSION_SECURITY_NOTES.md`.
- **MFA non activée** (roadmap `MFA_ROADMAP.md`) — recommandée pour garage/admin en V2.
- **PDF devis** généré à la volée (pas d'archivage signé) ; **documents véhicule** non implémentés (roadmap privée).
- **Envoi email/SMS** des devis non branché (lien à partager).

## Protection coûts et abus
- **Aucune clé payante côté client** → un secret volé dans le navigateur est impossible (il n'y en a pas).
- **Toute API payante future** (IA, SMS, paiement) **doit** passer par une **Edge Function** avec : auth du JWT appelant, **rate limit**, **quota par utilisateur et par garage**, **plafond journalier**, refus si dépassement, logs, et **clé secrète uniquement côté serveur**. Détail + procédure de rotation dans `COST_GUARDRAILS.md`.
- **Supabase** : activer un **spend cap** et des **alertes budget** ; surveiller les requêtes anormales.

## Décision
> **Go pour un pilote** avec un garage, à condition d'avoir coché la section « À activer dans Supabase ». Ne pas ouvrir en inscription publique large sans CAPTCHA + leaked-password protection + surveillance budget.

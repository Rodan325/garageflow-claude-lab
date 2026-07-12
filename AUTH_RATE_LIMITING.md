# Clikarage — Rate limiting & anti-abus (login / signup)

Protéger login et création de compte contre le brute-force et le spam **sans** bloquer un vrai utilisateur.

## Ce qui est géré par Supabase (backend)
Supabase Auth applique déjà des **rate limits** côté serveur (par IP et par endpoint) — c'est la première ligne de défense, et c'est la bonne place (le frontend ne peut pas se protéger lui-même de façon fiable). Réglable dans **Dashboard → Authentication → Rate Limits** :
- tentatives de connexion (token/password),
- envois d'e-mails (signup, magic link, reset),
- vérifications OTP.

Supabase renvoie un **message générique** en cas d'échec de connexion (« Invalid login credentials ») — il ne révèle pas si l'e-mail existe.

## À configurer dans le dashboard (avant vraies données)
- [ ] **CAPTCHA** (Authentication → Bot & Abuse Protection) : hCaptcha ou Cloudflare Turnstile sur signup/login. Recommandé dès qu'on ouvre l'inscription publique.
- [ ] **Confirmation d'e-mail** activée (empêche la création de comptes avec des e-mails bidons).
- [ ] **SMTP** de production configuré (sinon quotas d'e-mails très bas).
- [ ] **Rate limits** revus (garder des valeurs raisonnables : ne pas bloquer un vrai utilisateur qui se trompe 2-3 fois).
- [ ] **Leaked Password Protection** (voir `PASSWORD_SECURITY.md`).

## Ce qui est fait côté application
- **Message d'erreur générique au login** : « Email ou mot de passe incorrect. » — ne révèle jamais si l'e-mail existe (anti-énumération). *(Voir `LoginPage.tsx`.)*
- **Politique de mot de passe** au signup (≥ 12 / phrase de passe) — réduit l'efficacité du brute-force.
- **Aucun secret exposé** : impossible d'appeler une API payante en boucle depuis le client.
- **Pas de compteur de tentatives côté frontend** : ce serait contournable (on peut recharger la page / appeler l'API directement). Le vrai rate limit doit rester **côté serveur** (Supabase) — d'où la config dashboard ci-dessus.

## Règle raisonnable visée
- Après quelques échecs rapprochés : léger délai (géré par Supabase).
- Après plusieurs échecs : délai plus long / CAPTCHA.
- **Ne pas** casser une création de compte légitime ni un utilisateur qui se trompe.
- Les valeurs exactes se règlent dans le dashboard selon l'usage réel du pilote.

## Limites
- Le rate limiting **fin par compte** (ex. « 5 échecs → blocage 15 min ») n'est pas implémenté en propre ; on s'appuie sur les limites Supabase (par IP/endpoint) + CAPTCHA. Un rate-limit applicatif dédié nécessiterait une Edge Function + table de compteurs — à envisager si le pilote révèle des abus.
- Un attaquant distribué (beaucoup d'IP) contourne les limites par IP : le CAPTCHA et la leaked-password protection restent essentiels.

## Tests manuels
1. Se tromper de mot de passe 3-4 fois → message **générique**, pas d'info sur l'existence de l'e-mail.
2. Un e-mail inexistant et un e-mail existant avec mauvais mot de passe → **même** message.
3. Signup avec mot de passe faible → **refusé** (message clair).
4. Signup répété rapide → les limites Supabase / le CAPTCHA doivent freiner.
5. Un vrai utilisateur qui se trompe une fois puis réussit → **pas** bloqué.

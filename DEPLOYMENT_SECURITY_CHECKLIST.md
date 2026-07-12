# Clikarage — Checklist de déploiement sécurisé

À dérouler avant d'exposer l'app avec de vraies données (Vercel / Netlify / hébergeur statique).

## Transport & variables
- [ ] **HTTPS obligatoire** (certificat auto de l'hébergeur) ; forcer la redirection http→https.
- [ ] Variables de build chez l'hébergeur : **`VITE_SUPABASE_URL`**, **`VITE_SUPABASE_ANON_KEY`** (publiques).
- [ ] **Aucun** secret non-public en `VITE_*` (tout `VITE_*` finit dans le bundle navigateur). `service_role`, clés IA/paiement → **jamais** ici.
- [ ] `npm run security:scan` **vert** avant chaque déploiement.

## En-têtes de sécurité (recommandés)
- [ ] `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
- [ ] `X-Frame-Options: DENY` (ou via CSP `frame-ancestors 'none'`)
- [ ] **CSP** (voir ci-dessous) — tester avant de forcer.

### Exemple Netlify — `public/_headers`
```
/*
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  X-Frame-Options: DENY
  Content-Security-Policy: default-src 'self'; connect-src 'self' https://<PROJECT>.supabase.co wss://<PROJECT>.supabase.co; img-src 'self' data: blob: https://<PROJECT>.supabase.co; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self' data:; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

### Exemple Vercel — `vercel.json`
```json
{
  "headers": [
    { "source": "/(.*)", "headers": [
      { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
      { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=()" },
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "Content-Security-Policy", "value": "default-src 'self'; connect-src 'self' https://<PROJECT>.supabase.co wss://<PROJECT>.supabase.co; img-src 'self' data: blob: https://<PROJECT>.supabase.co; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self' data:; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" }
    ]}
  ]
}
```

> Remplacer `<PROJECT>` par le sous-domaine Supabase. Notes CSP :
> - `connect-src` doit inclure l'URL Supabase (https **et** wss pour le realtime).
> - `img-src` inclut le domaine Supabase (logos garage) + `data:`/`blob:`.
> - `style-src 'unsafe-inline'` est nécessaire (styles injectés par framer-motion / react-pdf). `script-src` reste **sans** `unsafe-inline`.
> - `worker-src blob:` pour la génération PDF.
> - **Tester** tout le parcours (login, réservation, devis, PDF, `/devis/:token`) après activation ; ajuster si une ressource est bloquée (voir la console).

## Sources externes
- [ ] Pas de source externe inutile (polices Google, CDN, scripts tiers, analytics non maîtrisés). L'app est **self-contained** (Vite build). Garder cette propriété simplifie la CSP.

## Logs & erreurs
- [ ] Logs **sans données sensibles** (pas de token/JWT/mot de passe ; aucun `console.log` de session — vérifié).
- [ ] Messages d'erreur **utilisateur** non techniques (« Connexion impossible », « Enregistrement impossible ») ; pas de stack/SQL exposée.
- [ ] Erreurs backend non renvoyées brutes au client sur les chemins sensibles (login = message générique).

## Supabase — production
- [ ] **RLS activée** partout ; `npm run test:rls` **60/60**.
- [ ] **Leaked Password Protection** + **CAPTCHA** activés (voir `PASSWORD_SECURITY.md`, `AUTH_RATE_LIMITING.md`).
- [ ] **Confirmation d'e-mail** + **SMTP** de prod configurés.
- [ ] **Spend cap** + **alertes budget** activés (voir `COST_GUARDRAILS.md`).
- [ ] **Sauvegardes / PITR** vérifiées (ou export régulier) + **test de restauration**.
- [ ] Secrets des Edge Functions (`OPENAI_API_KEY`, etc.) configurés **côté fonction** uniquement.

## Rotation & incident
- [ ] Procédure de **rotation des clés** connue (voir `COST_GUARDRAILS.md`).
- [ ] En cas de fuite d'une clé serveur : révocation immédiate, audit facturation, invalidation des sessions si besoin.

## Vérification finale (prod)
- [ ] Parcours complet sur l'URL de prod : réservation → inbox → devis → envoi → `/devis/:token` → acceptation.
- [ ] `/pro` inaccessible à un client ; `/app/vehicles` inaccessible à un garage ; non connecté → redirigé.
- [ ] Un lien `/#/devis/<token>` s'ouvre ; un **mauvais** token → « Devis introuvable ».
- [ ] Mobile OK, pas de scroll horizontal, PDF téléchargeable.

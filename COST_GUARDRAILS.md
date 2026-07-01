# GarageFlow — Garde-fous coûts & abus

Objectif : qu'un secret volé ou un endpoint abusé **ne puisse pas** générer une facture énorme.

## Clés : publiques vs privées
| Clé / secret | Où | Public ? |
|---|---|---|
| `VITE_SUPABASE_URL` | frontend (build) | ✅ Public (juste une URL) |
| `VITE_SUPABASE_ANON_KEY` | frontend (build) | ✅ Public **par nature** — protégé par **RLS stricte** |
| `SUPABASE_SERVICE_ROLE_KEY` | **jamais** | ❌ Serveur uniquement (bypass RLS) — **jamais** dans le frontend |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | Edge Function env | ❌ Serveur uniquement |
| Clés de paiement (Stripe…), secrets webhook, clés privées | backend/Edge | ❌ Serveur uniquement |

> Règle d'or : **rien qui coûte de l'argent ne doit être appelable directement depuis le navigateur.** La clé anon ne coûte rien en elle-même : elle ne peut faire que ce que la RLS autorise.

## État actuel (vérifié)
- Le frontend n'appelle **aucune API payante** directement (`npm run security:scan` + audit : aucun `fetch` externe, aucune clé).
- Les Edge Functions IA (`generate-vehicle-ad`, `repair-summary`) gardent la clé OpenAI **côté serveur** et **ne sont pas branchées** au frontend. Le seul appel utilisé est `request-to-appointment` (sans clé, sous JWT appelant).

## Comment éviter une facture Supabase / API externe trop élevée
1. **Supabase — spend cap & alertes** : activer le plafond de dépense (Organization → Billing) et des **alertes budget**. Sur le plan gratuit, le projet se met en pause plutôt que de facturer.
2. **Rate limits Auth** (dashboard) : limiter login/signup/OTP pour éviter le spam (voir `AUTH_RATE_LIMITING.md`).
3. **RLS stricte** : empêche l'exfiltration massive de données via la clé anon.
4. **Pagination / limites** : les requêtes de liste restent bornées (pas de `select *` non filtré sur des tables énormes).
5. **Storage** : bucket logos public en lecture seule, écriture membre, **pas de listing** ; pas d'upload public anonyme.
6. **Toute API payante future** derrière une Edge Function (voir ci-dessous).

## Règle pour TOUTE API payante (IA, SMS, paiement) — obligatoire
Passer par une **Edge Function** (ou backend) avec :
- **Authentification** : vérifier le JWT de l'appelant (`verify_jwt = true`), refuser l'anonyme.
- **Rate limit** par utilisateur et par IP (fenêtre glissante).
- **Quota par utilisateur** et **par garage** (compteur en base).
- **Plafond journalier global** ; **refus** (429) si dépassé.
- **Logs** des appels (qui, quand, coût estimé).
- **Clé secrète uniquement dans l'env de la fonction** — jamais renvoyée au client.
- **Validation stricte** de l'entrée (Zod) pour éviter les prompts/coûts abusifs.

## Si une clé fuite — que faire
1. **Anon key** : elle est publique par design ; une fuite n'est pas critique **si la RLS est correcte**. Vérifier la RLS, surveiller l'usage. On peut la **rotationner** (Project Settings → API → Reset) puis redéployer avec la nouvelle valeur.
2. **service_role / clé IA / clé paiement** : **incident**. Révoquer/rotationner **immédiatement** la clé côté fournisseur, invalider les sessions si besoin, auditer les logs de facturation, prévenir les personnes concernées.

## Procédure de rotation des clés
1. Générer la nouvelle clé côté fournisseur (Supabase / OpenAI / Stripe…).
2. Mettre à jour l'**env serveur** (Edge Function secrets / hébergeur), **pas** le code.
3. Pour l'anon key : mettre à jour `VITE_SUPABASE_ANON_KEY` chez l'hébergeur puis **rebuild/redeploy**.
4. Révoquer l'ancienne clé.
5. Vérifier que l'app fonctionne + relire les logs de facturation.

## Rappel
**Ne jamais** utiliser la clé `service_role` côté client, ni la mettre dans une variable `VITE_*`, ni dans un fichier commité.

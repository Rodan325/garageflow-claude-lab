# Validation locale et staging des acceptations juridiques V2

Date de validation : 20 juillet 2026  
Branche : `feat/legal-production-readiness`  
SHA de depart : `ec2518b397ddd1bae141efda29c3615dacb58cbc`  
Staging autorise : `zazdhzmfrtecxtglhoso`  
Production interdite : `tftmfhwmzkhzlvgwcnje`

## Perimetre et garanties

La validation porte exclusivement sur :

- `20260719111617_add_legal_acceptance_versioning_contracts.sql` ;
- `20260719235753_harden_legal_acceptance_v2.sql`.

La production et Vercel n'ont pas ete consultes ou modifies. Aucun flag n'a ete active. Aucune migration historique n'a ete modifiee. Les tests distants ont utilise uniquement le staging autorise et des donnees manifestement fictives, ensuite supprimees.

## Etat avant migration

### Local Docker

- 33 migrations etaient appliquees avant les deux migrations juridiques.
- Huit acceptations historiques fictives ont ete inserees dans le schema historique a neuf colonnes.
- Empreinte SHA-256 des colonnes historiques avant migration : `5268894c...73f94`.
- Un dump local utile a ete cree hors depot dans le repertoire temporaire du poste. Les sommes SHA-256 du schema, des roles et des donnees ont ete relevees sans exposer leur contenu.

### Staging

- Les 33 migrations existantes correspondaient exactement au depot.
- `migration list` montrait seulement les deux versions juridiques absentes.
- Le dry-run annoncait exactement ces deux migrations, dans l'ordre, sans migration inconnue ni operation destructive.
- La table staging contenait initialement zero acceptation juridique.
- Huit acceptations historiques fictives ont ete ajoutees avant migration pour verifier la compatibilite additive.

## Versions appliquees

| Version | Objet | Local | Staging |
| --- | --- | --- | --- |
| `20260719111617` | Colonnes de langue, identifiant stable et organisation | Oui | Oui |
| `20260719235753` | Registre prive, preuve V2, garde, index et RPC | Oui | Oui |

Apres application, le local et le staging presentent 35 migrations. Le dry-run staging final est vide.

## Commandes executees

Les commandes ont ete executees avec des gardes verifiant la cible. Aucun secret n'est reproduit ici.

```powershell
npx.cmd supabase --version
npx.cmd supabase start
npx.cmd supabase db start
npx.cmd supabase db reset --local --version 20260717131215
npx.cmd supabase migration list --local
npx.cmd supabase migration up --local
npm.cmd run test:rls
npm.cmd run test -- <tests juridiques>
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test
npm.cmd run build
npm.cmd run security:scan

npx.cmd supabase migration list
npx.cmd supabase db push --dry-run
npx.cmd supabase db push
npm.cmd run test:rls
npx.cmd supabase db push --dry-run
```

Le seul `db push` a cible `zazdhzmfrtecxtglhoso` apres double verification du project ref. Aucun `db push`, `reset`, `repair` ou acces n'a cible la production.

## Resultats locaux

- Reconstruction au point pre-juridique : 33/33 migrations et seed appliques.
- Application incrementale : les deux migrations juridiques appliquees, soit 35/35.
- `test:rls` general : 101 reussis, 0 echec.
- `test:rls` juridique V2 : 15 reussis, 0 echec.
- Tests juridiques cibles : 59 reussis, 0 echec lors de la validation initiale ; 41 reussis, 0 echec lors du controle final des contrats et de l'archive.
- Suite applicative complete : 340 reussis, 0 echec.
- Typecheck : reussi.
- Lint : reussi, 0 erreur et 2 avertissements Fast Refresh preexistants.
- Build : reussi ; avertissement non bloquant sur la taille d'un chunk.
- Security scan : reussi ; aucune cle sensible detectee.

Docker Desktop et les services indispensables (PostgreSQL, Auth, REST, Kong et Storage) etaient operationnels. `analytics` et `pg_meta` sont restes en etat unhealthy avec une erreur locale `input/output error`; cette limite de l'outillage local n'a pas affecte PostgreSQL, les migrations, Auth, REST, Storage ou les tests RLS.

## Resultats staging

- Derive avant application : controlee, uniquement les deux migrations attendues.
- Application : reussie en une execution, sans erreur.
- Historique apres application : 35/35.
- Dry-run final : vide (`Remote database is up to date`).
- Suite RLS/RPC/Storage/concurrence generale : 101 reussis, 0 echec.
- Suite juridique V2 : 15 reussis, 0 echec.
- Nettoyage : zero organisation, membre, version, acceptation ou rappel temporaire restant.
- Etat final du registre : 30 lignes, dont 27 `staged`, 3 `draft` et 0 `effective`.
- Etat final des acceptations staging : retour au compte initial de 0.

## Huit acceptations historiques

En local, les huit lignes etaient toujours presentes apres migration, les neuf nouveaux champs etaient `NULL` pour 8/8 lignes et l'empreinte SHA-256 des colonnes historiques restait exactement `5268894c...73f94`. En staging, les huit fixtures existaient encore apres migration et les neuf nouveaux champs etaient `NULL` pour 8/8 lignes. Elles ont ensuite ete supprimees dans le nettoyage du test, puisque le staging n'en contenait aucune avant la validation.

Les migrations ne contiennent aucun `UPDATE`, `DELETE` ou backfill de `public.legal_acceptances`. Les champs restent donc inconnus (`NULL`) pour une preuve historique lorsque l'information n'existait pas au moment de l'acceptation.

## Contraintes, index, fonctions et RLS

- RLS activee sur `public.legal_acceptances` et `private.legal_document_versions`.
- Toutes les contraintes juridiques sont validees ; aucune contrainte `NOT VALID` restante.
- Six index de `legal_acceptances` valides et prets, dont les deux index uniques partiels V2.
- Trigger `guard_legal_acceptance_v2` actif avant insertion.
- `private.guard_legal_acceptance_v2` et `public.has_organization_legal_acceptance` sont `SECURITY DEFINER` avec `search_path=""`.
- Aucun grant `anon` ou `authenticated` sur le registre prive.
- Policies de preuve limitees a l'insertion et la lecture autorisees ; aucune policy `UPDATE` ou `DELETE`.
- L'archive `/pilot-agreement` et la route versionnee `/legal/archive/:documentId/:version` restent consultables, marquees historiques, non acceptables et independantes du registre commercial courant.

## Roles et comportements verifies

- Une version `staged` ne peut pas etre acceptee.
- Un hash different du document affiche est refuse.
- Le hash exact du document affiche est enregistre.
- Une double acceptation utilisateur est refusee par l'index unique.
- Un membre simple ne peut pas accepter le DPA de l'organisation.
- Un `organization_owner` actif peut accepter le DPA de sa propre organisation.
- Le role d'autorite est derive cote serveur et ignore une valeur fournie par le frontend.
- Le proprietaire A ne peut pas accepter ni consulter la preuve de B, et reciproquement.
- Le RPC refuse une organisation etrangere.
- Les preuves restent immuables : les tentatives d'`UPDATE` et `DELETE` par les utilisateurs sont refusees.
- Le registre prive n'est pas expose par la Data API.
- L'acces anonyme aux preuves est refuse.

## Flags

Les neuf flags sont `false` dans `.env.example`, `.env.local` et le fichier staging local ignore par Git :

- `VITE_ENABLE_CENTERS`
- `VITE_ENABLE_WORKSHOP_TIMELINE`
- `VITE_ENABLE_RECOMMENDATIONS`
- `VITE_ENABLE_ATTACHMENTS`
- `VITE_ENABLE_NOTIFICATIONS`
- `VITE_ENABLE_DELIVERY_REPORTS`
- `VITE_ENABLE_MAINTENANCE_REMINDERS`
- `VITE_ENABLE_NETWORK_DASHBOARD`
- `VITE_ENABLE_INTEGRATIONS`

Aucun reglage distant ou Vercel n'a ete modifie.

## Derives et anomalies

Aucune derive destructive ou inconnue n'a ete detectee. Aucun P0 ou P1 n'est ouvert sur ces deux migrations.

Limite non bloquante : les services locaux `analytics` et `pg_meta` n'ont pas passe leur healthcheck Docker, alors que tous les services necessaires a cette mission etaient fonctionnels. Ce point releve de l'environnement Docker local, pas du SQL juridique.

## Rollback logique

Les migrations sont additives et compatibles avec les anciens clients. En cas de probleme avant activation :

1. conserver tous les flags a `false` ;
2. laisser les versions commerciales en `staged` ou `draft`, ce qui interdit leur acceptation ;
3. ne jamais supprimer ou reecrire une acceptation existante ;
4. corriger tout defaut par une migration forward additive ;
5. archiver une version devenue invalide au lieu de modifier sa preuve ;
6. conserver l'ancienne route pilote comme archive historique non proposee aux nouvelles acceptations.

La suppression physique des colonnes, fonctions ou preuves n'est pas un rollback acceptable. Avant activation commerciale, une migration distincte et revue devra publier explicitement les versions validees en les passant a `effective` avec leur date d'effet.

## Recommandation

Les deux migrations peuvent etre mergees avec les flags desactives. L'activation des documents commerciaux doit rester une etape separee, apres validation juridique humaine des textes, des versions, des hashes et de la date d'effet.

LOCAL DOCKER — MIGRATIONS JURIDIQUES APPLIQUEES : OUI  
LOCAL DOCKER — TEST:RLS : OUI — 116/116  
STAGING — DERIVE CONTROLEE : OUI  
STAGING — MIGRATIONS JURIDIQUES APPLIQUEES : OUI  
STAGING — TEST:RLS : OUI — 116/116  
HUIT ACCEPTATIONS HISTORIQUES INCHANGEES : OUI  
ISOLATION MULTI-TENANT : OUI  
CONTROLE D'HABILITATION DPA : OUI  
FLAGS TOUJOURS OFF : OUI  
PRODUCTION MODIFIEE : NON  
P0 RESTANTS : AUCUN  
P1 RESTANTS : AUCUN  
PRET POUR MERGE AVEC FLAGS OFF : OUI

# Validation locale et staging des acceptations juridiques V2

Date de validation : 20 juillet 2026  
Branche : `feat/legal-production-readiness`  
SHA de depart : `ec2518b397ddd1bae141efda29c3615dacb58cbc`  
Staging autorise : `zazdhzmfrtecxtglhoso`  
Production interdite : `tftmfhwmzkhzlvgwcnje`

## Perimetre et garanties

La validation initiale puis la revue independante portent sur :

- `20260719111617_add_legal_acceptance_versioning_contracts.sql` ;
- `20260719235753_harden_legal_acceptance_v2.sql` ;
- `20260720151800_preserve_legacy_legal_acceptance_fail_closed.sql`.

La production et Vercel n'ont pas ete consultes ou modifies. Aucun flag n'a ete active. Aucune migration historique n'a ete modifiee. Les tests distants ont utilise uniquement le staging autorise et des donnees manifestement fictives, ensuite supprimees.

## Etat avant migration

### Local Docker

- 33 migrations etaient appliquees avant les deux migrations juridiques initiales.
- Huit acceptations historiques fictives ont ete inserees dans le schema historique a neuf colonnes.
- Empreinte SHA-256 des colonnes historiques avant migration : `5268894c...73f94`.
- Un dump local utile a ete cree hors depot dans le repertoire temporaire du poste. Les sommes SHA-256 du schema, des roles et des donnees ont ete relevees sans exposer leur contenu.

### Staging

- Les 33 migrations existantes correspondaient exactement au depot.
- `migration list` montrait seulement les deux versions juridiques initiales absentes.
- Le dry-run annoncait exactement ces deux migrations, dans l'ordre, sans migration inconnue ni operation destructive.
- La table staging contenait initialement zero acceptation juridique.
- Huit acceptations historiques fictives ont ete ajoutees avant migration pour verifier la compatibilite additive.

## Versions appliquees

| Version | Objet | Local | Staging |
| --- | --- | --- | --- |
| `20260719111617` | Colonnes de langue, identifiant stable et organisation | Oui | Oui |
| `20260719235753` | Registre prive, preuve V2, garde, index et RPC | Oui | Oui |
| `20260720151800` | Parcours historique fail-closed et habilitation DPA resserree | Oui | Oui |

Apres application, le local et le staging presentent 36 migrations. Le dry-run staging final est vide.

## Commandes executees

Les commandes ont ete executees avec des gardes verifiant la cible. Aucun secret n'est reproduit ici.

```powershell
npx.cmd supabase --version
npx.cmd supabase start
npx.cmd supabase db start
npx.cmd supabase db reset --local --version 20260717131215
npx.cmd supabase migration list --local
npx.cmd supabase migration up --local
npx.cmd supabase db reset --local
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

- Reconstruction finale exacte : 36/36 migrations et seed appliques.
- La migration forward a ete appliquee sans modifier les deux migrations deja validees.
- `test:rls` general : 101 reussis, 0 echec.
- `test:rls` juridique V2 : 18 reussis, 0 echec.
- Tests juridiques cibles : 59 reussis, 0 echec lors de la validation initiale ; 41 reussis, 0 echec lors du controle final des contrats et de l'archive.
- Suite applicative complete apres revue : 345 reussis, 0 echec.
- Typecheck : reussi.
- Lint : reussi, 0 erreur et 2 avertissements Fast Refresh preexistants.
- Build : reussi ; avertissement non bloquant sur la taille d'un chunk.
- Security scan : reussi ; aucune cle sensible detectee.

Docker Desktop et les services indispensables (PostgreSQL, Auth, REST, Kong et Storage) etaient operationnels. `analytics` et `pg_meta` sont restes en etat unhealthy avec une erreur locale `input/output error`; cette limite de l'outillage local n'a pas affecte PostgreSQL, les migrations, Auth, REST, Storage ou les tests RLS.

Une derniere tentative de `test:rls` local apres la revue applicative a obtenu 100/101 : un rappel fictif `local_validation` laisse par une execution anterieure a declenche l'index d'idempotence. Les 119 scenarios avaient deja reussi localement et sur staging apres reconstruction et nettoyage. Le nettoyage final de cet artefact local n'a pas pu etre repete dans cette session, car l'acces Docker hors sandbox a ete refuse par la limite d'approbation de l'environnement. Cette reserve ne concerne ni le SQL juridique, ni staging, ni une ressource distante.

## Resultats staging

- Derive initiale : controlee, uniquement les deux migrations juridiques attendues.
- Derive de revue : controlee, uniquement `20260720151800`.
- Application : reussie en une execution, sans erreur.
- Historique apres application : 36/36.
- Dry-run final : vide (`Remote database is up to date`).
- Suite RLS/RPC/Storage/concurrence generale : 101 reussis, 0 echec.
- Suite juridique V2 : 18 reussis, 0 echec.
- Nettoyage : zero version, acceptation ou rappel temporaire de validation restant.
- Etat final du registre : 30 lignes, dont 27 `staged`, 3 `draft` et 0 `effective`.
- Etat final des acceptations staging : retour au compte initial de 0.

## Huit acceptations historiques

En local, les huit lignes etaient toujours presentes apres migration, les neuf nouveaux champs etaient `NULL` pour 8/8 lignes et l'empreinte SHA-256 des colonnes historiques restait exactement `5268894c...73f94`. En staging, les huit fixtures existaient encore apres migration et les neuf nouveaux champs etaient `NULL` pour 8/8 lignes. Elles ont ensuite ete supprimees dans le nettoyage du test, puisque le staging n'en contenait aucune avant la validation.

Les migrations ne contiennent aucun `UPDATE`, `DELETE` ou backfill de `public.legal_acceptances`. La migration forward remplace uniquement la fonction de garde. Les champs restent donc inconnus (`NULL`) pour une preuve historique lorsque l'information n'existait pas au moment de l'acceptation.

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
- Un responsable limite a un centre, meme avec le role historique `admin`, ne peut pas accepter le DPA de l'organisation.
- Un `organization_owner` actif peut accepter le DPA de sa propre organisation.
- Le role d'autorite exact est derive cote serveur et ignore une valeur fournie par le frontend.
- Le DPA historique `2026-07-02` reste acceptable uniquement comme preuve utilisateur sans hash ni organisation lorsque les flags V2 sont OFF.
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

## Revue independante et corrections P1

La revue complete `main...branche` a detecte puis corrige les ecarts suivants :

1. Avec les flags absents, les routes principales affichaient le corpus commercial `staged` et exigeaient ses nouvelles versions. Les routes et versions actives restent maintenant sur `2026-07-02` jusqu'a activation explicite.
2. La garde V2 interceptait aussi le DPA historique et bloquait le parcours existant. La migration forward autorise uniquement le DPA historique user-scoped, sans hash ni revendication d'organisation.
3. Le fallback de role pouvait habiliter un responsable limite a un centre et enregistrer un role d'autorite inexact. Le fallback `owner/admin` exige maintenant un membre non rattache a un centre et la valeur enregistree est celle qui a effectivement autorise l'action.
4. `/service-levels` pouvait exposer un document marque non public lorsque le flag documentaire etait actif. Le routeur rejette maintenant toute definition `public: false`.
5. Le PDF arabe conservait `Subtotal`, `VAT` et `Total`. Les libelles sont maintenant localises et les montants techniques restent LTR.
6. Le cartouche d'identite V2 conservait le statut juridique et la phrase TVA en francais dans les pages EN/AR. Ces valeurs sont maintenant localisees, tandis que les noms et identifiants officiels restent inchanges.
7. Les annexes internes `service_levels` et `ai_policy` etaient bloquees par les routes mais encore incluses dans le module frontend. Leur contenu est maintenant absent du runtime client ; seuls leurs identifiants, statuts et empreintes restent dans le registre prive de gouvernance.
8. Un module commercial attribuait les services backend a `Supabase, Inc.` sans preuve de l'entite contractante du compte. Le texte courant utilise maintenant le nom produit neutre `Supabase` ; le snapshot historique reste strictement inchange.
9. Le test de retour EN vers FR recherchait uniquement le libelle du nouveau layout alors que le mode fail-closed rend le layout historique. Le contrat accepte maintenant les deux formulations semantiques et verifie toujours le retour immediat a `lang=fr`, `dir=ltr`.

Aucune derive destructive ou inconnue n'a ete detectee. Aucun P0 ou P1 ne reste ouvert pour un merge avec flags OFF.

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

Les trois migrations peuvent etre mergees avec les flags desactives. L'activation des documents commerciaux doit rester une etape separee, apres validation juridique humaine des textes, des versions, des hashes et de la date d'effet.

LOCAL DOCKER — MIGRATIONS JURIDIQUES APPLIQUEES : OUI
LOCAL DOCKER — TEST:RLS : OUI — 119/119
STAGING — DERIVE CONTROLEE : OUI
STAGING — MIGRATIONS JURIDIQUES APPLIQUEES : OUI
STAGING — TEST:RLS : OUI — 119/119
HUIT ACCEPTATIONS HISTORIQUES INCHANGEES : OUI
ISOLATION MULTI-TENANT : OUI
CONTROLE D'HABILITATION DPA : OUI
FLAGS TOUJOURS OFF : OUI
PRODUCTION MODIFIEE : NON
P0 RESTANTS : AUCUN
P1 RESTANTS : AUCUN
PRET POUR MERGE AVEC FLAGS OFF : OUI

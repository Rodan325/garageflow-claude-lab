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
- Tests juridiques cibles finaux : 68 reussis, 0 echec, incluant les contrats de repetabilite et le rendu PDF arabe.
- Suite applicative complete apres revue : 349 reussis, 0 echec.
- Typecheck : reussi.
- Lint : reussi, 0 erreur et 2 avertissements Fast Refresh preexistants.
- Build : reussi ; avertissement non bloquant sur la taille d'un chunk.
- Security scan : reussi ; aucune cle sensible detectee.

Docker Desktop et les services indispensables (PostgreSQL, Auth, REST, Kong et Storage) etaient operationnels. `analytics` et `pg_meta` sont restes en etat unhealthy avec une erreur locale `input/output error`; cette limite de l'outillage local n'a pas affecte PostgreSQL, les migrations, Auth, REST, Storage ou les tests RLS.

La reserve de repetabilite locale a ete reproduite et corrigee. Deux causes independantes existaient : les rappels de validation utilisaient des sources fixes alors que leur lien vers la demande est volontairement conserve avec `ON DELETE SET NULL`, ce qui provoquait une collision avec l'index d'idempotence lors d'une execution suivante ; l'URL signee locale expirait apres une seconde et pouvait expirer avant sa premiere lecture. Chaque execution utilise desormais un identifiant UUID distinct, le teardown local supprime dans un bloc `finally` les rappels, demandes, acceptations et versions documentaires de validation, puis refuse de terminer si un residu subsiste. Le TTL local de l'URL signee est de cinq secondes, sans modification du test d'expiration.

Trois executions consecutives ont ete lancees sur la meme base locale, sans reconstruction intermediaire :

| Execution | Suite generale | Suite juridique V2 | Total | Residus apres teardown |
| --- | --- | --- | --- | --- |
| 1 | 101/101 | 18/18 | 119/119 | 0 |
| 2 | 101/101 | 18/18 | 119/119 | 0 |
| 3 | 101/101 | 18/18 | 119/119 | 0 |

Le controle SQL final a confirme zero utilisateur, organisation, demande, rappel, acceptation ou version documentaire portant les marqueurs de validation, ainsi que zero objet Storage. Le helper de nettoyage refuse toute cible autre que `http://127.0.0.1` ou `http://localhost` et n'est jamais appele pour staging.

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

## Huit fixtures historiques de validation

En local, le test dedie avait cree huit lignes fictives avant migration. Les
neuf nouveaux champs sont restes `NULL` pour 8/8 lignes et l'empreinte SHA-256
des colonnes historiques est restee `5268894c...73f94`.

Les huit lignes precedemment citees sur staging etaient elles aussi des
fixtures temporaires d'une ancienne validation. Elles avaient ete nettoyees
avant la migration des hashes canoniques. Staging contenait donc zero
acceptation avant cette migration et zero apres ; l'empreinte du jeu vide est
restee identique. La preservation distante de huit preuves ne peut pas etre
revendiquee. L'immutabilite est etablie par les tests locaux et RLS dedies.

Les migrations ne contiennent aucun `UPDATE`, `DELETE` ou backfill de `public.legal_acceptances`. La migration forward remplace uniquement la fonction de garde. Les champs restent donc inconnus (`NULL`) pour une preuve historique lorsque l'information n'existait pas au moment de l'acceptation.

La base locale courante ne conserve aucune acceptation de validation. Le
nettoyage des fixtures ne constitue pas une mutation par migration.

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

## Validation visuelle du PDF arabe

Le rapport arabe a ete regenere depuis le dernier corpus avec l'empreinte SHA-256 `24203a8ac5aecedddca306bb8ca520982a905b2061fd0ccf79f00274b9f05b58`. L'empreinte couvre le composant PDF et sa fixture de generation. Le PDF A4 comporte deux pages et les deux captures versionnees ont ete remplacees uniquement apres inspection :

- `output/pdf/clikarage-delivery-report-ar.pdf` ;
- `docs/assets/legal/clikarage-delivery-report-ar-page-1.png` ;
- `docs/assets/legal/clikarage-delivery-report-ar-page-2.png`.

Les ligatures arabes, l'ordre RTL des titres, paragraphes et listes, les champs techniques LTR, les dates, heures, montants, adresses email, references et noms de fichiers sont lisibles. Aucun chevauchement, debordement, glyphe manquant ou coupure de pagination n'a ete observe. Les pieds de page `1/2` et `2/2` sont integralement dans la page ; leur boite de pixels se termine avant le bord inferieur. Les rapports FR, EN et AR utilisent le meme composant et le meme ordre de sections, avec des libelles localises.

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
LOCAL DOCKER — TEST:RLS : OUI — 3 EXECUTIONS CONSECUTIVES A 119/119
STAGING — DERIVE CONTROLEE : OUI
STAGING — MIGRATIONS JURIDIQUES APPLIQUEES : OUI
STAGING — TEST:RLS : OUI — 119/119
HUIT ACCEPTATIONS HISTORIQUES INCHANGEES : NON VERIFIABLE A DISTANCE ; HUIT FIXTURES LOCALES INCHANGEES
ISOLATION MULTI-TENANT : OUI
CONTROLE D'HABILITATION DPA : OUI
FLAGS TOUJOURS OFF : OUI
PRODUCTION MODIFIEE : NON
P0 RESTANTS : AUCUN
P1 RESTANTS : AUCUN
PRET POUR MERGE AVEC FLAGS OFF : OUI

## Addendum du 21 juillet 2026 - correction des trois P1

Cet addendum complete la validation precedente et remplace ses compteurs pour
la presente passe. La production et Vercel n'ont ete ni consultes ni modifies.
Tous les flags sont restes desactives.

### Perimetre corrige

- `/dpa` exige desormais la chaine fail-closed complete : documents V2,
  acceptations V2, puis DPA self-service. Une valeur absente, vide, `false`,
  `1`, `TRUE` ou invalide ne l'active pas.
- `LegalAcceptanceGate` interroge les preuves V2 lorsque le flux V2 est actif.
  Il controle le document, la version, le hash, la portee et le tenant. Une
  erreur de lecture bloque le passage. Flags OFF, le comportement legacy reste
  inchange et aucune preuve V2 n'est creee.
- `20260720230821_preserve_legal_acceptance_evidence_lifecycle.sql` supprime les
  deux dependances FK destructives, conserve les UUID comme identifiants
  pseudonymes immuables, fige le nom de l'organisation cote serveur et inclut
  le hash dans les index uniques V2. Elle ne contient aucun `UPDATE`, `DELETE`,
  `TRUNCATE` ou backfill de `public.legal_acceptances`.

### Validation locale actualisee

- Reconstruction exacte : 37/37 migrations et seed appliques.
- Migration historique modifiee : aucune ; les empreintes des quatre migrations
  juridiques anterieures sont controlees automatiquement.
- Matrice flags, routes, gate V2 et contrats SQL : 54/54.
- Suite applicative : 384/384.
- Test RLS execution 1 : 101/101 general + 19/19 juridique = 120/120.
- Test RLS execution 2 : 101/101 general + 19/19 juridique = 120/120.
- Test RLS execution 3 : 101/101 general + 19/19 juridique = 120/120.
- Cycle de vie transactionnel : la preuve survit a la suppression de la version,
  de l'acteur et de l'organisation, puis la transaction est annulee.
- Etat final : zero fixture juridique, demande, rappel ou objet Storage.
- Typecheck, build et security scan : reussis. Lint : zero erreur et deux
  avertissements Fast Refresh preexistants.

Docker Desktop s'est arrete une fois pendant l'initialisation. Apres
redemarrage, les services auxiliaires `analytics` et `pg_meta` ont encore
retourne une erreur Windows `input/output error`. La stack minimale PostgreSQL,
Auth, Kong, REST et Storage a ete reconstruite et a porte toutes les validations.

### Validation staging actualisee

- Cible unique : `zazdhzmfrtecxtglhoso` ; production interdite :
  `tftmfhwmzkhzlvgwcnje`.
- Derive avant application : uniquement `20260720230821`.
- Historique apres application : 37/37 ; dry-run final vide.
- RLS/RPC/Storage/concurrence : 101/101.
- Juridique V2 : 19/19.
- Cycle de vie transactionnel distant : reussi avec rollback integral.
- Nettoyage final : zero version, preuve, utilisateur, organisation, demande,
  rappel ou objet Storage de validation.

Neuf demandes, deux rappels et deux objets Storage fictifs datant du test du
20 juillet ont ete identifies par leurs marqueurs de validation. Les objets ont
ete supprimes par l'API Storage avec le compte fictif habilite, puis les lignes
de validation ont ete supprimees du staging. Aucun contenu metier reel n'a ete
utilise.

### Huit preuves historiques simulees

La validation precedente avait compare les huit preuves avant/apres migration :
8/8 champs nouveaux `NULL` et empreinte historique identique
`5268894c...73f94`. Ces fixtures avaient ensuite ete nettoyees ; le local
reconstruit et le staging contenaient donc zero acceptation au debut de cette
passe. La nouvelle migration est couverte par un contrat sans reecriture et ne
peut ni backfiller ni modifier ces preuves. Cet addendum ne pretend pas avoir
recontrole huit lignes absentes des environnements nettoyes.

LOCAL DOCKER - MIGRATION CYCLE DE VIE : OUI
LOCAL DOCKER - TEST:RLS : OUI - 3 EXECUTIONS A 120/120
STAGING - DERIVE CONTROLEE : OUI
STAGING - MIGRATION CYCLE DE VIE APPLIQUEE : OUI
STAGING - TEST:RLS : OUI - 120/120
HUIT ACCEPTATIONS HISTORIQUES INCHANGEES : NON VERIFIABLE A DISTANCE ; IMMUTABILITE COUVERTE PAR TESTS
ISOLATION MULTI-TENANT : OUI
CONTROLE D'HABILITATION DPA : OUI
FLAGS TOUJOURS OFF : OUI
PRODUCTION MODIFIEE : NON
P0 RESTANTS : AUCUN
P1 RESTANTS : AUCUN
PRET POUR NOUVELLE REVUE INDEPENDANTE : OUI

## Addendum du 23 juillet 2026 - RPC d'acceptation courante sur staging

### Cible, derive et snapshot initial

- Branche et SHA verifies avant toute ecriture :
  `feat/legal-production-readiness` a
  `0dfb60d466e71e507bba1ec35b0e86e91f0a8831`.
- Projet unique utilise : staging `zazdhzmfrtecxtglhoso`.
- Projet production interdit `tftmfhwmzkhzlvgwcnje` : non consulte et non
  modifie.
- Historique initial : 38 migrations distantes sur 39 locales.
- Dry-run initial : uniquement
  `20260723185453_restrict_legal_acceptance_writes_to_current_document_rpc.sql`.
- Preuves initiales : zero ligne ; empreinte MD5 non sensible du jeu vide
  `d41d8cd9...427e`.
- Registre `effective` initial : zero ligne ; aucune fixture juridique
  precedente.
- Avant migration, `authenticated` disposait de `SELECT` et `INSERT` sur
  `public.legal_acceptances`, avec une policy `INSERT`. Les deux RPC courantes
  n'existaient pas.

### Application et controles de securite

La CLI Supabase `2.109.1` a applique uniquement la migration `20260723185453`
au staging. Aucun seed, backfill manuel ou autre migration n'a ete execute.
L'historique final est 39/39 et le dry-run final est vide.

Apres migration :

- `anon` et `authenticated` ne disposent d'aucun droit direct `INSERT`,
  `UPDATE` ou `DELETE` sur les preuves ;
- la policy d'insertion legacy a disparu et seules les policies de lecture
  attendues subsistent ;
- RLS reste active ;
- `get_current_legal_acceptance_status_v2` et
  `accept_current_legal_document_v2` sont `SECURITY DEFINER`, utilisent un
  `search_path` explicitement vide, refusent `public` et `anon`, et accordent
  `EXECUTE` uniquement a `authenticated`.

La suite Data API a confirme le refus des insertions directes, de
`pilot_agreement`, du DPA historique `2026-07-02`, d'une ancienne version de
`terms_pro`, ainsi que l'impossibilite de fournir une version ou un hash au
RPC. Le serveur derive l'acteur, la date, la version, le hash, la portee,
l'organisation et l'habilitation. `terms_pro` et le DPA exigent un
representant habilite ; un membre simple, un responsable limite a un centre et
un autre tenant sont refuses. Une preuve courante repetee est idempotente et
reste non modifiable et non supprimable.

### Tests et rollback

- RLS/RPC/Storage staging : 101/101.
- RLS juridique V2 : 25/25.
- Tests juridiques applicatifs cibles : 134/134.
- Suite applicative complete : 422/422.
- Transaction distante dediee : 10 assertions reussies, dont preuve
  `terms_pro` autorisee, preuve `terms_client` individuelle, refus du membre
  simple, refus cross-tenant, hash/version serveur, idempotence et
  immutabilite. La transaction a ete integralement annulee.
- Typecheck : reussi.
- Lint : zero erreur, deux avertissements Fast Refresh preexistants.
- Build : reussi, avec l'avertissement de taille de bundles preexistant.
- Security scan : aucun secret evident ; 12 occurrences textuelles
  non bloquantes deja inventoriees.

La suite generale cree volontairement deux rappels fictifs afin de tester leur
idempotence. Les roles ordinaires ne possedent, a juste titre, aucun droit de
suppression directe sur cette table. Le nettoyage final a donc supprime
uniquement les marqueurs `rls_validation:*` au moyen de l'acces administratif
staging de validation, sans elargir les grants applicatifs. L'etat final
confirme zero rappel de validation, zero demande de validation, zero preuve,
zero version juridique de test et zero objet Storage.

### Preuves, flags et conclusion

Le snapshot apres migration est strictement identique au snapshot initial :
zero acceptation et meme empreinte du jeu vide. Aucune preuve historique ou V2
ne se trouvait sur staging pendant l'application ; aucune preservation de huit
lignes distantes n'est revendiquee. Les huit lignes citees dans les validations
anterieures etaient des fixtures temporaires deja nettoyees. L'immutabilite est
verifiee par les tests dedies et par le rollback transactionnel.

Les neuf flags produit de `.env.staging.local` sont explicitement `false`. Les
neuf flags juridiques et d'integration sont `false` dans `.env.example` et
absents de `.env.staging.local`, ce qui reste fail-closed. Aucun flag n'a ete
active.

STAGING AVANT : 38/39
STAGING APRES : 39/39
MIGRATION UNIQUE APPLIQUEE : OUI - 20260723185453
DRY-RUN FINAL : VIDE
PREUVES AVANT/APRES : 0/0, EMPREINTE IDENTIQUE
INSERT DIRECT AUTHENTICATED : REFUSE
UPDATE ET DELETE DIRECTS : REFUSES
PILOT AGREEMENT : REFUSE
DPA HISTORIQUE 2026-07-02 : REFUSE
ANCIEN TERMS PRO : REFUSE
HASH ET VERSION : RESOLUS COTE SERVEUR
TERMS PRO MEMBRE SIMPLE : REFUSE
TERMS PRO REPRESENTANT : AUTORISE
CROSS-TENANT : REFUSE
IDEMPOTENCE : VALIDEE
ROLLBACK : COMPLET
RLS/RPC/STORAGE : 101/101
RLS JURIDIQUE V2 : 25/25
FIXTURES RESIDUELLES : ZERO
FLAGS : OFF
PRODUCTION CONSULTEE OU MODIFIEE : NON
VERCEL PRODUCTION MODIFIE : NON
P0 RESTANTS : AUCUN
P1 RESTANTS : AUCUN TECHNIQUE
PRET POUR REVUE INDEPENDANTE : OUI

## Annexe - ecritures juridiques courantes via RPC du 23 juillet 2026

Cette validation est strictement locale. La migration additive
`20260723185453_restrict_legal_acceptance_writes_to_current_document_rpc.sql`
n'a pas ete appliquee au staging pendant cette passe.

La reconstruction Docker a applique les 39 migrations et `supabase/seed.sql`
depuis une base vide. La migration :

- revoque `INSERT`, `UPDATE` et `DELETE` directs sur
  `public.legal_acceptances` pour `anon` et `authenticated` ;
- conserve les lectures autorisees par RLS ;
- expose une RPC de statut et une RPC d'acceptation avec
  `SECURITY DEFINER`, `search_path` vide et droits `authenticated`
  explicitement accordes ;
- derive cote serveur l'acteur, l'horodatage, la version, le hash, la portee
  et l'habilitation ;
- refuse l'archive pilote, le DPA historique `2026-07-02`, les documents non
  courants, les membres non habilites et les appels cross-tenant ;
- ne contient aucun `UPDATE`, `DELETE` ou backfill de preuve existante.

La suite locale a valide 101/101 controles generaux et 25/25 controles
juridiques V2. Elle couvre notamment le refus d'un `INSERT` Data API, la
determination serveur du hash courant, l'idempotence, la portee
`organization` de `terms_pro`, l'absence d'action pour un membre simple,
l'autorite finale SQL et le nettoyage complet des fixtures.

La page `/pro/legal-status` utilise le registre et les preuves V2 lorsque le
flag d'acceptation V2 est actif. Avec les flags OFF, le parcours legacy
fail-closed reste en lecture seule et ne cree aucune preuve V2. Les pages de
revue rendent le modele canonique ; aucun PDF juridique runtime n'est genere
dans cette release.

LOCAL DOCKER - RECONSTRUCTION : OUI - 39/39
LOCAL DOCKER - TEST:RLS GENERAL : OUI - 101/101
LOCAL DOCKER - TEST:RLS JURIDIQUE V2 : OUI - 25/25
INSERT DIRECT DATA API : REFUSE
HASH ET VERSION : DERIVES COTE SERVEUR
FIXTURES RESIDUELLES : ZERO
STAGING - NOUVELLE MIGRATION APPLIQUEE : NON
PRODUCTION CONSULTEE OU MODIFIEE : NON
FLAGS : OFF

## Addendum final du 23 juillet 2026 - validation staging des hashes canoniques

### Cible et etat initial

- Branche : `feat/legal-production-readiness`.
- SHA valide : `56b30739a547802c76d4fc4116690906212e34ac`.
- Projet unique autorise : staging `zazdhzmfrtecxtglhoso`.
- Projet production interdit : `tftmfhwmzkhzlvgwcnje`, non consulte.
- Historique initial : 37 migrations distantes sur 38 locales.
- Dry-run initial : uniquement
  `20260723110428_refresh_legal_canonical_document_hashes.sql`.
- Aucune fixture de demande, rappel, acceptation, registre ou Storage ne
  subsistait avant l'application.

Le snapshot staging avant migration contenait zero acceptation juridique :
zero preuve `2026-07-02` et zero preuve V2. Son empreinte SHA-256 etait
`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
Il n'existait donc pas huit preuves historiques sur cette cible. Elles avaient
ete simulees et verifiees lors de la validation locale precedente, puis
nettoyees. Aucune ligne n'a ete creee pour masquer cette difference de contexte.

Le registre prive contenait 30 lignes, toutes `staged` ou `draft`, sans date
d'effet. Son empreinte avant migration etait
`0e5ba162d6cb1acd610fab13a3429622a7ae25caae0523b730c052dbfd2535a0`.

### Application et comparaison

La CLI a applique une seule fois et uniquement au staging la migration
`20260723110428`. Aucun seed, backfill additionnel, SQL manuel sur les preuves
ou migration historique n'a ete execute.

Apres migration :

- historique staging : 38/38 ;
- dry-run : vide, base distante a jour ;
- preuves : toujours zero ;
- empreinte des preuves : strictement identique ;
- registre : toujours 30 lignes ;
- hashes canoniques concernes : 24/24 correspondances, zero divergence ;
- lignes `service_levels` et `ai_policy` hors corpus client : 6 lignes
  volontairement inchangees ;
- empreinte du registre :
  `e3f1f448367b98d6866faa7990f19b582d8c949c6fd7db14fd42dc46630b052f`.

La migration ne reference pas `public.legal_acceptances`. Elle ne peut donc
modifier ni `accepted_at`, ni acteur, ni organisation, ni version, ni ancien
hash de preuve. Le test RLS prouve en outre qu'une preuve portant un autre hash
ne satisfait pas le gate courant et qu'une acceptation valide enregistre le
hash exact de la version affichee. Aucune preuve existante n'a ete reecrite
pour simuler une reacceptation.

### Tests staging et nettoyage

- RLS/RPC/Storage : 101/101.
- Juridique V2 : 19/19.
- Anonyme DPA refuse, membre simple non habilite et proprietaire habilite :
  reussis.
- Isolation client, garage, organisation et centre : reussie.
- Ancien hash traite comme preuve manquante par le gate courant : reussi.
- Registre prive non expose par la Data API : reussi.
- Immutabilite sans policy `UPDATE` ou `DELETE` : reussie.
- Cycle de vie transactionnel staging : preuve conservee apres suppression de
  l'acteur, de l'organisation et de la version ; rollback integral.
- Tests applicatifs du guard DPA, de la matrice des flags, du modele canonique
  et des changements de hash : 135/135.
- Audit final : zero fixture, zero acceptation et zero objet Storage.

Les neuf flags sont `false` dans `.env.example` et absents de
`.env.staging.local`; leur absence reste fail-closed. La branche distante et le
diff de la PR ne contiennent aucun chemin `docs/legal/internal/` ou
`docs/legal/source/`, aucun marqueur explicite de non-publication ou de
brouillon de travail, et le security scan ne detecte aucun secret.

STAGING AVANT MIGRATION : 37/37, DRY-RUN = 20260723110428 UNIQUEMENT
STAGING APRES MIGRATION : 38/38
MIGRATION APPLIQUEE : OUI, STAGING UNIQUEMENT
DRY-RUN FINAL : VIDE
PREUVES AVANT/APRES IDENTIQUES : OUI, ZERO LIGNE ET EMPREINTE IDENTIQUE
HUIT PREUVES HISTORIQUES INCHANGEES : NON VERIFIABLE SUR STAGING, ZERO PRESENTE AVANT/APRES
ANCIENS HASHES DE PREUVE CONSERVES : OUI PAR CONTRAT, AUCUNE PREUVE STAGING A COMPARER
REGISTRE COURANT MIS A JOUR : OUI, 24/24 HASHES
ANCIENNE PREUVE REFUSEE PAR LE GATE COURANT : OUI, TEST RLS ET CONTRAT APPLICATIF
NOUVELLE ACCEPTATION REQUISE : OUI
RLS STAGING : 101/101
TESTS JURIDIQUES STAGING : 19/19
FIXTURES RESIDUELLES : ZERO
FLAGS TOUJOURS OFF : OUI
PRODUCTION CONSULTEE OU MODIFIEE : NON
VERCEL PRODUCTION MODIFIE : NON
P0 RESTANTS : AUCUN
P1 RESTANTS : AUCUN TECHNIQUE ; ZERO ACCEPTATION STAGING AVANT/APRES DOCUMENTE
PRET POUR REVUE INDEPENDANTE : OUI, AVEC CETTE RESERVE FACTUELLE

## Annexe - validation locale prealable du 23 juillet 2026

Cette passe locale anterieure corrige les trois P1 de la revue independante sans consulter ni
modifier Supabase Production, Supabase Staging ou Vercel. Les constats staging
precedents restent historiques : la nouvelle migration
`20260723110428_refresh_legal_canonical_document_hashes.sql` a ete validee
uniquement sur Docker local.

### Acces DPA et flags

- `public: false` est applique par `DpaAccessGuard` independamment des flags.
- Un visiteur anonyme est redirige vers la connexion et un utilisateur sans
  organisation ne recoit pas le document.
- Un membre de l'organisation peut consulter le DPA prive, mais seuls un
  proprietaire d'organisation, un administrateur reseau ou un role legacy
  `owner`/`admin` non limite a un centre peuvent l'accepter.
- L'acceptation exige que les trois flags documents V2, acceptations V2 et DPA
  self-service soient exactement actifs. Toute valeur absente, vide, `1`,
  `TRUE`, `false` ou invalide reste desactivee.
- Le DPA historique direct et son archive passent par le meme guard.

### Document canonique et preuve

Le rendu, le calcul SHA-256 et l'enregistrement de la preuve utilisent le meme
modele canonique. La serialisation est deterministe, normalisee NFC et encodee
en UTF-8. Elle couvre la cle, la version, la langue, le titre, les sections,
tableaux, annexes, mentions de presentation et l'identite complete de
RODANBTECH, dont l'adresse, le SIREN, le SIRET et la mention TVA.

Avant insertion, le frontend recalcule le hash du document affiche et refuse
l'acceptation s'il differe du registre compile. La base continue de verifier
independamment le hash, la version, le statut, la langue, la portee et
l'habilitation. La migration forward actualise uniquement les versions privees
`staged`/`draft` sans date d'effet ; elle ne contient aucune modification de
`public.legal_acceptances`.

### Documentation publique

Les documents marques internes ou mixtes ont ete copies avant retrait dans
`C:\Users\New User\Downloads\ClikaragePrivateLegal\20260723-114321`.
La copie contient 12 fichiers, 156525 octets, et un manifeste SHA-256 verifie.
L'audit n'a trouve aucun secret, credential ou donnee personnelle privee, mais
des matrices et notes operationnelles qui n'avaient pas vocation a rester dans
l'arbre public. Leur presence anterieure sur la branche publique n'est pas
niee. Aucune reecriture d'historique n'a ete effectuee ou jugee indispensable
en l'absence de secret.

Le contrat automatise refuse tout fichier sous `docs/legal/internal` ou
`docs/legal/source` et les marquages explicites de document non public. Google
Workspace est presente uniquement comme messagerie professionnelle et
Squarespace comme gestionnaire du domaine/DNS, eventuellement du site vitrine ;
aucun des deux n'est presume recevoir toutes les donnees Clikarage.

### Corpus actif et archive

Avec les flags OFF, `/legal`, `/privacy`, `/terms` et le DPA prive affichent un
corpus commercial neutre en lecture seule. Ils ne proposent aucune nouvelle
acceptation historique. `/pilot-agreement` et les versions `2026-07-02`
demeurent des archives explicites, `noindex`, immuables et absentes de la
navigation active.

### Validation locale de cette passe

- Reconstruction Docker : 38/38 migrations puis seed, sans SQL manuel.
- Tests juridiques et matrice des flags : 135/135.
- Suite applicative : 408/408.
- RLS/RPC/Storage general : 101/101.
- RLS juridique V2 : 19/19.
- Cycle de vie transactionnel : preuve conservee apres suppression de l'acteur,
  de l'organisation et de la version ; transaction annulee.
- Teardown : aucune fixture juridique ou generale residuelle.
- Registre local : 30 versions non effectives ; aucune acceptation presente
  apres reconstruction et nettoyage.
- Typecheck, build et security scan : reussis.
- Lint : zero erreur, deux avertissements Fast Refresh preexistants.

Les huit preuves simulees de la validation precedente etaient absentes de la
base reconstruite propre. Elles n'ont donc pas ete recomptees pendant cette
passe. Leur snapshot anterieur reste la preuve avant/apres disponible, complete
par le contrat automatique qui interdit `UPDATE`, `DELETE`, `TRUNCATE` ou
backfill des acceptations dans les migrations juridiques forward.

LOCAL DOCKER - RECONSTRUCTION : OUI - 38/38
LOCAL DOCKER - TEST:RLS : OUI - 120/120
STAGING - ETAT LORS DE CETTE PASSE LOCALE : MIGRATION NON ENCORE APPLIQUEE
HUIT ACCEPTATIONS HISTORIQUES INCHANGEES : NON VERIFIABLE A DISTANCE ; HUIT FIXTURES DE TEST DEJA NETTOYEES
DPA PRIVE ET HABILITATION : OUI
HASH CANONIQUE COMPLET : OUI
FLAGS TOUJOURS OFF : OUI
PRODUCTION MODIFIEE : NON
P0 RESTANTS : AUCUN
P1 TECHNIQUES RESTANTS : AUCUN
PRET POUR NOUVELLE REVUE INDEPENDANTE : OUI

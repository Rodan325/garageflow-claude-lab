# Règles de sécurité Clikarage V1

## Portée

Ces règles sont des invariants du Full Product Commercial V1. Elles
s'appliquent au frontend, à Supabase Auth, PostgreSQL, PostgREST, aux RPC,
Edge Functions, Storage, imports, exports et outils d'administration.

La [matrice des rôles](./ROLE_MATRIX.md) précise les capacités métier. En cas
d'ambiguïté, la règle la plus restrictive s'applique.

## Invariants tenant et centre

1. Toute donnée métier appartient à une organisation identifiable.
2. Toute donnée locale appartient à un centre identifiable lorsque son usage
   est local.
3. L'autorisation est dérivée depuis la relation canonique, pas depuis un
   `garage_id`, `organization_id`, `center_id`, `client_id` ou `user_id` copié
   dans une ligne enfant.
4. Un membre de l'organisation A n'accède jamais à l'organisation B.
5. Un membre rattaché au centre A1 n'accède jamais au centre A2 sans capacité
   organisationnelle explicite.
6. Un client n'accède qu'à ses objets et aux objets explicitement partagés avec
   lui.
7. Une appartenance inactive, sans périmètre, ambiguë ou incohérente donne zéro
   accès opérationnel.
8. Un transfert inter-centres est explicite, atomique, historisé et vérifié des
   deux côtés.
9. Un rôle legacy, un libellé UI ou un identifiant fourni par le navigateur ne
   crée aucun héritage implicite de tenant, de centre ou de capacité.

Toute relation enfant qui répète le tenant de son parent utilise une contrainte
composite ou une autre garantie structurelle équivalente.

## RLS

- RLS est activée sur toute table exposée contenant des données tenant, client
  ou administratives.
- Chaque opération `SELECT`, `INSERT`, `UPDATE` et `DELETE` est analysée
  séparément.
- Les clauses `USING` et `WITH CHECK` valident le tenant, le centre, le rôle et
  l'état de la cible.
- Une policy `FOR ALL` accordée à tout membre est interdite sur les objets
  métier sensibles.
- `anon` n'accède qu'aux ressources publiques explicitement documentées.
- `authenticated` ne reçoit aucun droit par défaut au-delà de ses policies ou
  RPC autorisées.
- `service_role` reste réservé aux processus backend contrôlés et n'est jamais
  une solution aux permissions applicatives.
- Les policies évitent les appels récursifs et reposent sur des helpers testés
  dont les grants sont bornés.

Une policy n'est sûre qu'après tests positifs et négatifs par rôle, tenant,
centre et client.

## Fonctions `SECURITY DEFINER`

Une fonction privilégiée doit :

- justifier pourquoi `SECURITY INVOKER` ne suffit pas ;
- fixer `search_path = ''` ;
- qualifier tous les objets par leur schéma ;
- exiger `auth.uid()` lorsque l'appel est applicatif ;
- dériver l'acteur, son tenant, ses centres et son rôle côté serveur ;
- verrouiller les lignes critiques avant décision ;
- vérifier la cible et l'état courant avant mutation ;
- refuser les états ambigus ;
- être atomique et retourner un résultat minimal ;
- révoquer `EXECUTE` à `PUBLIC` et `anon` ;
- n'accorder `EXECUTE` qu'aux rôles réellement nécessaires ;
- ne jamais accepter `actor_id`, `actor_role`, `organization_id` ou une date
  client comme autorité.

Toute signature, ACL, configuration et définition est couverte par un contrat
de migration et un test d'appel direct.

## DML direct et RPC exclusives

Lorsque la sécurité exige une orchestration serveur, `INSERT`, `UPDATE` et
`DELETE` directs sont révoqués aux rôles applicatifs et la RPC devient le seul
chemin.

Cette règle s'applique notamment à :

- gestion des appartenances et rôles ;
- conversion demande/rendez-vous ;
- transitions d'atelier ;
- décisions de devis ;
- paiements, avoirs et remboursements ;
- transfert inter-centres ;
- finalisation et réouverture ;
- audit et archivage ;
- opérations de commerce affectant stock, réservation, vente ou marge.

Le frontend ne conserve aucun fallback vers un DML devenu interdit.

## Atomicité, idempotence et concurrence

- un workflow multi-écritures est exécuté dans une transaction serveur ;
- une `operation_id` ou clé d'idempotence stabilise les retries ;
- les contraintes d'unicité empêchent les doubles créations ;
- les lignes critiques sont verrouillées dans un ordre déterministe ;
- une erreur au milieu du workflow provoque un rollback complet ;
- les cas de double clic, retry réseau et appels concurrents sont testés ;
- les transitions reposent sur l'état courant relu sous verrou.

Une compensation explicite est requise lorsqu'une ressource externe ne peut pas
participer à la transaction PostgreSQL.

## Append-only et audit

Sont append-only :

- événements d'audit métier ;
- messages envoyés ;
- événements de timeline ;
- décisions client ;
- historique des rôles et affectations ;
- écritures du ledger financier ;
- changements de propriété et de kilométrage ;
- événements de stock, vente, livraison et garantie.

L'acteur, le timestamp serveur, le tenant, l'action, l'entité, la source et la
correlation doivent être dérivés ou vérifiés côté serveur.

Le journal d'audit :

- n'accepte ni mot de passe, ni secret, ni contenu personnel non nécessaire ;
- ne peut être modifié ou supprimé par un rôle applicatif ;
- est lisible uniquement dans le périmètre autorisé ;
- conserve des valeurs avant/après minimisées pour les actions sensibles ;
- possède une politique de rétention documentée.

## Archivage et suppression

- la suppression métier ordinaire est remplacée par un archivage ;
- une archive reste référencée par l'historique et les documents ;
- les suppressions en cascade ne doivent pas détruire messages, décisions,
  paiements, événements d'audit ou preuves ;
- une restauration d'archive respecte les mêmes permissions qu'une création ;
- l'anonymisation ou suppression réglementaire utilise une procédure séparée,
  auditée et inaccessible à la Data API ordinaire ;
- aucune procédure réglementaire n'est improvisée dans une PR fonctionnelle.

## Paiements et finance

- un paiement confirmé est immuable ;
- une correction crée un avoir, remboursement ou mouvement compensatoire lié ;
- les totaux sont calculés côté serveur à partir de lignes autorisées ;
- la devise, la TVA, le statut et les références sont validés ;
- coûts bruts, marges et exports financiers sont des capacités séparées ;
- une remise respecte un plafond serveur et produit un événement d'audit ;
- toute transition financière est idempotente ;
- l'absence d'intégration Stripe n'empêche pas le ledger manuel V1 ;
- aucune fonctionnalité ne prétend fournir une comptabilité réglementaire
  complète.

## Protection du dernier owner

- le dernier `organization_owner` actif ne peut être désactivé ou retiré par un
  workflow générique ;
- le transfert de propriété utilise une transaction distincte ;
- les owners de l'organisation sont verrouillés avant toute décision ;
- aucun membre ne peut se promouvoir ou modifier sa propre appartenance ;
- `network_admin` ne peut créer, modifier ou désactiver un égal ou un owner ;
- aucun rôle tenant ne peut attribuer un rôle plateforme.

## Authentification et invitations

- les utilisateurs choisissent leur mot de passe via Supabase Auth ;
- RODANBTECH et le garage ne connaissent jamais le mot de passe ;
- invitations et liens de récupération sont à usage borné, expirables et
  révocables ;
- l'email doit être vérifié avant les actions sensibles ;
- la désactivation d'une appartenance coupe l'accès sans supprimer l'identité ;
- les sessions d'un utilisateur désactivé sont traitées selon un runbook ;
- l'authentification ne remplace jamais la vérification d'autorisation.

## Storage et documents

- les buckets métier sont privés ;
- le chemin d'un objet encode un périmètre vérifiable, sans constituer à lui
  seul une preuve d'autorisation ;
- l'upload vérifie tenant, centre, dossier, type MIME, taille et rôle ;
- les noms de fichiers sont neutralisés ;
- les téléchargements utilisent des URLs signées courtes ou un proxy autorisé ;
- l'énumération des chemins est refusée ;
- la suppression respecte archivage, rétention et audit ;
- les métadonnées PostgreSQL et les octets Storage sont sauvegardés séparément.

## Imports, exports et données

- l'import commence par une prévisualisation et une validation des colonnes ;
- les formules CSV sont neutralisées ;
- les doublons et références invalides sont signalés avant commit ;
- l'import est atomique ou reprend depuis une clé idempotente ;
- les erreurs sont rattachées à des lignes sans exposer d'autres tenants ;
- les exports sont tenant-scoped, paginés et journalisés ;
- une organisation peut obtenir un manifeste de ses données ;
- les logs et rapports minimisent les données personnelles.

## Secrets, logs et monitoring

- aucun secret, mot de passe, service role ou chaîne de connexion n'entre dans
  le dépôt ou le bundle frontend ;
- seules les variables `VITE_` explicitement publiques sont exposées ;
- les logs excluent tokens, mots de passe, clés, documents et données
  personnelles non nécessaires ;
- les erreurs possèdent un identifiant de corrélation ;
- le monitoring distingue refus attendus, erreurs applicatives et incidents ;
- les messages utilisateurs restent compréhensibles sans révéler le schéma ;
- toute donnée de démonstration est isolée et signalée.

## Tests négatifs obligatoires

Chaque capacité sensible teste au minimum :

- `PUBLIC`, `anon`, utilisateur non authentifié et utilisateur inactif ;
- rôle inférieur, rôle égal et auto-modification ;
- tenant A contre tenant B ;
- centre A1 contre centre A2 ;
- client A contre client B du même garage et d'un autre garage ;
- identifiants de tenant, acteur, centre et cible forgés ;
- DML direct quand une RPC est exclusive ;
- statut fermé, archivé ou invalide ;
- double soumission, retry et concurrence ;
- erreur intermédiaire avec rollback ;
- accès Storage par chemin deviné ;
- absence de fixture ou résidu après teardown.

Un test qui vérifie uniquement un mock ou une chaîne SQL ne remplace pas un test
Data API/RPC réel sur une base jetable.

## Sauvegarde et restauration

Avant toute migration Production à risque :

- créer ou confirmer un backup logique chiffré récent ;
- conserver la clé séparément ;
- calculer une empreinte SHA-256 ;
- inclure rôles, schémas, données, historique de migrations, Auth applicatif et
  métadonnées Storage ;
- sauvegarder séparément les octets Storage ;
- restaurer dans un environnement Supabase jetable compatible ;
- utiliser `ON_ERROR_STOP=1` ;
- comparer lignes, empreintes, RLS, policies, fonctions, owners, contraintes et
  index ;
- supprimer tout plaintext et environnement jetable après validation.

Une archive non restaurée et comparée n'est pas un backup validé.

## Interdictions Production

Sans autorisation humaine nominative et limitée, il est interdit de :

- appliquer une migration ;
- exécuter un seed ou un backfill ;
- modifier une donnée réelle ;
- utiliser `migration repair`, `reset` ou du DDL manuel ;
- activer un feature flag ;
- modifier une variable Vercel ;
- déployer manuellement ;
- restaurer automatiquement un backup ou une base ;
- réaccorder un DML précédemment révoqué ;
- restaurer une policy vulnérable ;
- contourner un contrôle de santé ou un test RLS.

Les migrations sont additives et forward-only. Une migration déjà appliquée
n'est jamais réécrite.

Une exception à `migration repair` ou une restauration Production exige une
décision humaine distincte, nominative et documentée avec un runbook, une
fenêtre et un plan de comparaison. Elle ne constitue jamais un rollback
automatique après un NO-GO.

Les flags juridiques et fournisseurs restent absents ou `false` tant qu'une
autorisation séparée n'a pas été donnée.

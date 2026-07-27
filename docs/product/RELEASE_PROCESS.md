# Processus de release Clikarage V1

## Principes

- une branche et une PR par sujet cohérent ;
- aucun changement opportuniste dans une PR ;
- le SHA validé est immuable pendant la décision de merge ;
- les migrations sont additives et forward-only ;
- staging précède Production pour tout changement de schéma ou de sécurité ;
- une autorisation de phase ne vaut jamais pour une phase suivante ;
- les flags restent fail-closed et ne sont pas activés par une migration ;
- la preuve de validation est proportionnée au risque.

Le [périmètre V1](./FULL_PRODUCT_V1.md), la
[matrice des rôles](./ROLE_MATRIX.md) et les
[règles de sécurité](./SECURITY_RULES.md) sont les références permanentes.

## Classification d'un changement

### Fonctionnalité ordinaire

Un changement est ordinaire lorsqu'il :

- ne modifie pas RLS, rôle, permission ou tenant ;
- ne crée pas de migration ;
- ne touche pas un paiement ou une preuve ;
- n'introduit pas de concurrence ou de suppression ;
- reste réversible par déploiement applicatif.

Processus :

```text
spécification courte
→ branche
→ implémentation
→ tests ciblés
→ Draft PR
→ revue courte
→ suite complète une fois
→ merge autorisé
```

### Documentation pure

Pour une PR limitée à des documents Markdown, la validation est proportionnée
au diff : périmètre des fichiers, liens internes, lisibilité, cohérence,
secrets, données personnelles et fins de ligne. Ne pas lancer Docker, une
stack Supabase ou une suite applicative complète lorsqu'aucun code, test,
migration ou configuration n'a changé.

### Changement critique

Sont critiques :

- RLS, permissions et fonctions `SECURITY DEFINER` ;
- migrations et remédiations de données ;
- paiements, avoirs, remboursements et marges ;
- concurrence, idempotence et transactions multi-écritures ;
- données juridiques, preuves et feature flags ;
- archivage, anonymisation et opérations destructives ;
- Auth, Storage et administration plateforme ;
- architecture dont l'échec peut affecter plusieurs domaines.

Processus :

```text
analyse
→ décisions métier
→ tests de sécurité rouges
→ implémentation
→ validation locale
→ Draft PR
→ staging
→ revue renforcée
→ backup restaurable si nécessaire
→ migration Production contrôlée
→ smoke tests
```

## Cycle d'une PR

1. Fetch de `main`, vérification du SHA et du working tree.
2. Lecture des instructions et des documents produit concernés.
3. Identification des critères d'acceptation et risques.
4. Plan minimal sans refactorisation annexe.
5. Branche dédiée.
6. Implémentation avec tests positifs et négatifs.
7. Tests ciblés.
8. Contrôle du diff, des secrets et des données personnelles.
9. Draft PR documentant comportement, risque, déploiement et rollback.
10. Auto-revue.
11. Suite complète une seule fois sur le HEAD final.
12. Passage Ready et merge uniquement après autorisation.

Si le HEAD change après une validation, seuls les contrôles affectés sont
relancés immédiatement ; la suite complète est relancée une fois sur le nouveau
HEAD final.

## Tests ciblés et suite complète

### Tests ciblés

Ils sont exécutés pendant le développement et couvrent :

- unité ou composant concerné ;
- contrat API/RPC ;
- RLS et Storage concernés ;
- cas positif, refus et erreur ;
- régression directe ;
- mobile ou accessibilité si l'interface change.

### Suite complète

Elle est exécutée :

- une fois avant de déclarer la PR prête ;
- après toute modification substantielle issue de l'auto-revue ;
- après rebase ou changement de base affectant le code ;
- avant merge si les checks CI ne couvrent pas le HEAD exact.

Elle comprend, selon le dépôt :

- tests applicatifs ;
- typecheck ;
- lint ;
- build ;
- security scan ;
- tests RLS/RPC/Storage sur environnement non productif ;
- E2E critiques lorsque disponibles.

Il est interdit de répéter une suite coûteuse uniquement pour produire un
nouveau rapport si le SHA, les fichiers et l'environnement validé sont
strictement inchangés. Les checks CI du HEAD servent alors de preuve.

## Blocage fonctionnel et blocage environnemental

Un blocage fonctionnel est une régression, un test pertinent en échec, un
contrat non démontré ou un contrôle de sécurité insuffisant : il constitue un
NO-GO. Un blocage environnemental est une indisponibilité locale ou de CI sans
indice de défaut fonctionnel : il est documenté, recoupé avec les preuves
disponibles et ne justifie ni un contournement improvisé, ni une validation
fictive. Un NO-GO ne se contourne jamais ; il est levé par une correction ou
une autorisation explicitement limitée.

## Validation locale

Une migration est testée :

- sur une stack Supabase locale reconstruite depuis zéro ;
- incrémentalement depuis le schéma précédent ;
- avec dry-run cohérent ;
- sans modification silencieuse des données ;
- avec ancien et nouveau frontend lorsque l'ordre de déploiement importe ;
- avec tests de rollback, concurrence et anti-fuite selon le risque.

Ne jamais utiliser `--ignore-health-check` comme substitut à des services requis
réellement sains.

## Staging

Staging est obligatoire pour :

- migration ;
- changement RLS, RPC, Auth ou Storage ;
- feature dépendant d'un schéma ;
- changement de permission ou rôle ;
- workflow transactionnel ;
- paiement ou document sensible.

Avant écriture :

- vérifier projet, HEAD, inventaire et historique ;
- capturer un baseline non sensible ;
- confirmer que le dry-run ne contient que les migrations autorisées ;
- analyser les combinaisons ancien/nouveau frontend et ancien/nouveau schéma ;
- arrêter en cas de donnée incompatible ou de migration inattendue.

Après écriture :

- confirmer l'historique et le dry-run vide ;
- comparer le baseline ;
- exécuter les tests directs Data API/RPC/Storage ;
- prouver teardown et absence de fixture ;
- examiner logs, DB lint et Security Advisors ;
- documenter les risques résiduels.

Une validation staging n'autorise ni merge ni Production.

## Conditions de merge

Le merge exige :

- PR ouverte, base et branche attendues ;
- HEAD exact et diff inchangé ;
- checks obligatoires réussis ;
- aucune review bloquante ;
- critères d'acceptation démontrés ;
- plan de déploiement et rollback documentés ;
- compatibilité frontend/schéma connue ;
- autorisation humaine explicite.

Stratégie par défaut pour les phases contrôlées : **Create a merge commit**, avec
protection équivalente à `expected_head_sha`.

Ne jamais forcer, contourner une protection, pousser directement sur `main` ou
supprimer la branche avant validation post-déploiement.

## Migration Production

Avant une migration :

1. confirmer `main`, déploiement Vercel et projet Supabase ;
2. vérifier état, historique et dernière migration ;
3. comparer les données sensibles avec le baseline approuvé ;
4. confirmer un backup récent restauré et chiffré si le risque le nécessite ;
5. exécuter un dry-run contenant uniquement les migrations autorisées ;
6. obtenir une autorisation humaine nominative et limitée.

Application :

- utiliser le mécanisme normal `supabase db push` ;
- ne pas exécuter de seed, reset, repair, DDL manuel ou backfill non autorisé ;
- capturer début, fin, durée, erreurs et avertissements ;
- arrêter à la première divergence ou erreur.

Après application :

- confirmer historique et dry-run vide ;
- comparer inventaires et empreintes ;
- exécuter les tests non destructifs avec `ROLLBACK` ;
- confirmer grants, policies, fonctions et `search_path` ;
- restaurer la cible CLI sur staging.

## Déploiement Vercel

- le merge déclenche le déploiement automatique ;
- aucun déploiement manuel sans autorisation ;
- attendre l'état `READY` avant les smoke tests ;
- vérifier commit, target Production, domaine et alias ;
- ne modifier ni variable ni flag pendant une validation ;
- contrôler build, erreurs runtime et 5xx.

## Smoke tests

Le jeu minimal couvre sans créer de donnée réelle :

- accueil et connexion ;
- dashboard garage et client ;
- équipe et permissions visibles ;
- clients et véhicules ;
- demandes, planning et atelier ;
- devis et paiements si modifiés ;
- portail, documents et messagerie ;
- routes publiques et gestion des gates ;
- absence de page blanche, boucle, erreur console et 5xx.

Un changement critique ajoute ses cas métier et vérifie directement Supabase.

## Rollback

### Frontend

- revenir au dernier déploiement Production validé ;
- conserver le schéma additif s'il reste compatible ;
- ne pas déclencher un nouveau build improvisé.

### Base

- une migration qui échoue avant commit doit être transactionnellement annulée ;
- après succès, corriger par migration additive forward-only ;
- ne jamais réaccorder une permission vulnérable pour restaurer le service ;
- une restauration complète ou une réversion destructive exige une nouvelle
  autorisation humaine.

Le rollback est préparé avant écriture, mais n'est exécuté que lorsque ses
conditions sont réunies.

## Rapport court

Le rapport final contient uniquement les preuves utiles :

- phase, SHA, branche et PR ;
- fichiers ou migrations concernés ;
- résultats ciblés et complets ;
- staging et Production ;
- baseline avant/après ;
- erreurs, avertissements et risques ;
- flags actifs ;
- rollback éventuel ;
- prochaine autorisation attendue.

Ne pas recopier des logs sensibles ou des sorties exhaustives.

## Utilisation économique de Codex

Modèle par défaut : **GPT-5 Codex — Moyen**.

Utiliser **GPT-5 Codex — Élevé** uniquement pour :

- RLS et permissions ;
- migrations et remédiations ;
- paiements et calculs financiers ;
- concurrence et idempotence ;
- données juridiques ;
- opérations destructives ;
- architecture difficile.

Ne pas utiliser systématiquement l'effort maximal. Ne pas répéter une analyse,
un test ou une revue déjà validé sur le même SHA sans signal nouveau.

Préférer :

- une recherche ciblée aux audits exhaustifs répétés ;
- des tests proportionnés au diff ;
- une PR courte à une PR multi-domaines ;
- la CI du HEAD exact à une répétition locale sans changement ;
- un arrêt humain avant staging, Production ou décision métier ambiguë.

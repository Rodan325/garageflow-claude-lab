# Clikarage Full Product Commercial V1

## Statut du document

Ce document fige le périmètre fonctionnel du **Full Product Commercial V1** de
Clikarage à partir de `main` au SHA
`7ecb3a6fe840401170ea081be084d490c1ee6f7a`.

Les constats d'existant proviennent des audits de juillet 2026 :

- [audit fonctionnel](../audits/CLIKARAGE_FUNCTIONAL_AUDIT_2026-07.md) ;
- [inventaire des fonctionnalités](../audits/CLIKARAGE_FEATURE_INVENTORY_2026-07.md) ;
- [matrice des écarts](../audits/CLIKARAGE_GAP_MATRIX_2026-07.md) ;
- [roadmap MVP](../audits/CLIKARAGE_MVP_ROADMAP_2026-07.md) ;
- [matrice de couverture](../audits/CLIKARAGE_TEST_COVERAGE_MATRIX_2026-07.md).

Ces audits décrivent le SHA `a530678d78eb6492af800e2f8373ca4f7c6e0b2f`.
Depuis cet audit, l'isolation de la messagerie (Phase 3), la canonicalisation
des hashes de migration (Phase 2) et la première protection contre
l'escalade des appartenances (Phase 4A) ont été livrées. Les autres écarts
restent ouverts jusqu'à preuve contraire dans une PR dédiée.

Ce document définit la cible commerciale. Il ne déclare pas que les fonctions
listées sont déjà disponibles.

## Vision

**Positionnement :** Clikarage est le système opérationnel tout-en-un des
professionnels de l'automobile.

**Promesse :** un garage, une équipe, chaque véhicule, une seule plateforme.

**Différenciateur : VehicleOS.** Un véhicule possède un dossier canonique qui
relie tous les rôles, tous les canaux, tous les documents et tout l'historique,
sans duplication contradictoire entre le CRM, l'atelier, le commerce et le
portail client.

## Problèmes résolus

La V1 doit supprimer les ruptures opérationnelles suivantes :

- informations clients, véhicules et dossiers dispersées ;
- rendez-vous, atelier, devis et paiements sans continuité transactionnelle ;
- échanges client répartis entre plusieurs canaux non historisés ;
- droits approximatifs dépendant de l'interface plutôt que du serveur ;
- visibilité insuffisante sur la charge, les marges, les impayés et les ventes ;
- import, export, sauvegarde et support dépendant d'interventions techniques ;
- données de démonstration ou métriques simulées confondues avec la réalité.

## Utilisateurs cibles

- garages indépendants ;
- concessions et marchands automobiles ;
- organisations multi-centres ;
- propriétaires et administrateurs réseau ;
- responsables de centre et d'atelier ;
- réceptionnaires et conseillers service ;
- techniciens et mécaniciens ;
- commerciaux automobiles ;
- équipes comptables ;
- collaborateurs en lecture seule ;
- clients automobilistes ;
- support et administration RODANBTECH dans un périmètre séparé et traçable.

La cible V1 inclut le garage indépendant et l'organisation multi-centres. Une
capacité réseau ne doit jamais élargir les droits au-delà de l'organisation.

## Les dix domaines du V1

### 1. Plateforme et sécurité

**Inclus**

- authentification, vérification d'email et récupération d'accès ;
- organisations, centres, équipes et rôles ;
- permissions serveur par capacité, tenant et centre ;
- audit métier append-only ;
- archivage non destructif et procédures réglementaires séparées ;
- sauvegardes restaurables, exports, monitoring et gestion des erreurs.

**Critères d'acceptation**

- chaque table tenant possède une RLS testée positivement et négativement ;
- aucune action sensible ne dépend uniquement d'un bouton caché ;
- les accès inter-tenant, inter-centre et cross-client sont refusés ;
- les fonctions privilégiées dérivent l'acteur et le tenant côté serveur ;
- une sauvegarde chiffrée peut être restaurée avec zéro erreur SQL ;
- les incidents sont corrélables sans secret ni donnée personnelle inutile.

### 2. CRM clients et véhicules

**Inclus**

- personnes physiques et entreprises clientes ;
- coordonnées, consentements, préférences, notes et archivage ;
- recherche, déduplication et fusion contrôlée ;
- VehicleOS : identité véhicule canonique, kilométrage, propriétaires,
  documents, événements et relations avec les dossiers métier ;
- recherche par client, immatriculation, VIN, marque, modèle et statut.

**Critères d'acceptation**

- un client et un véhicule ne possèdent qu'une identité fonctionnelle ;
- les doublons sont détectés avant import ou création ;
- toute fusion conserve les références et un événement d'audit ;
- la timeline restitue demandes, rendez-vous, devis, interventions,
  documents, paiements, vente et garantie selon les droits ;
- l'archivage masque l'objet opérationnel sans casser son historique.

### 3. Demandes et rendez-vous

**Inclus**

- demande client et création garage ;
- qualification, proposition de date, confirmation, refus, report et annulation ;
- conversion transactionnelle et idempotente ;
- planning jour, semaine et calendrier ;
- capacité atelier, conflits, durée, centre et affectation ;
- rappels et historique des changements.

**Critères d'acceptation**

- un retry ou un double clic ne crée aucun rendez-vous en double ;
- toute conversion échoue ou réussit intégralement ;
- un conflit de capacité est détecté côté serveur ;
- un transfert de centre est explicite, autorisé et historisé ;
- les statuts et transitions invalides sont refusés.

### 4. Atelier

**Inclus**

- réception, état d'entrée, kilométrage, énergie et photos ;
- diagnostic et recommandations supplémentaires ;
- ordre de réparation versionné ;
- validation client, affectation technicien, pièces et main-d'œuvre ;
- temps prévu et réel, progression et commentaires bornés par visibilité ;
- contrôle qualité, véhicule prêt, restitution et rapport de livraison ;
- historique atelier non destructif.

**Critères d'acceptation**

- une state machine serveur unique remplace les workflows concurrents ;
- aucun travail facturable ne démarre sans base autorisée et traçable ;
- les pièces, temps et travaux réalisés sont distincts du devis initial ;
- seuls les responsables habilités finalisent ou rouvrent une intervention ;
- la restitution conserve les contrôles, documents et décisions associés.

### 5. Devis et finance opérationnelle

**Inclus**

- devis, versions, lignes de pièces et main-d'œuvre ;
- quantités, prix unitaires, TVA, remises contrôlées et totaux ;
- consultation, validation ou refus client avec preuve du contenu ;
- acomptes, paiements partiels, solde, impayés ;
- factures ou exports facturables, avoirs et remboursements ;
- coûts, marges et exports financiers.

**Limite assumée**

La V1 fournit une finance opérationnelle et des exports. Elle ne prétend pas
remplacer une comptabilité réglementaire complète, un logiciel de caisse
certifié ou un moteur fiscal international.

**Critères d'acceptation**

- une version acceptée ne peut pas être modifiée silencieusement ;
- les remises respectent un seuil et une permission serveur ;
- un paiement confirmé est immuable ;
- toute correction passe par un avoir, un remboursement ou une écriture liée ;
- les montants, coûts et marges sont visibles uniquement aux rôles autorisés ;
- les exports sont réconciliables avec le ledger opérationnel.

### 6. Relation client

**Inclus**

- invitation et activation sécurisées du portail ;
- accès aux seuls véhicules, demandes, devis et documents du client ;
- messagerie et pièces jointes ;
- suivi d'avancement et validation des travaux ;
- notifications internes, rappels d'entretien et historique véhicule ;
- récupération d'accès et mise à jour limitée des coordonnées.

**Critères d'acceptation**

- deux clients du même garage ne voient jamais leurs données respectives ;
- les messages restent append-only et liés au dossier autorisé ;
- les pièces jointes utilisent un stockage privé et des URLs bornées ;
- les décisions client sont horodatées et liées à une version ;
- un dossier fermé reste lisible mais ne reçoit plus d'écriture non autorisée.

### 7. Commerce automobile

**Inclus**

- acquisition, provenance et reprise ;
- stock, coûts, frais, préparation et prix cible ;
- prospects, sources, pipeline, essais et offres ;
- réservations, acomptes, vente, livraison et garantie ;
- marge prévisionnelle et réelle ;
- export d'une fiche d'annonce, sans multidiffusion exhaustive obligatoire.

**Critères d'acceptation**

- le véhicule de stock réutilise VehicleOS ;
- les statuts `acquis`, `en préparation`, `disponible`, `réservé`, `vendu`,
  `livré` et `archivé` sont contrôlés côté serveur ;
- chaque coût et changement de prix est historisé ;
- une vente et sa livraison sont atomiques ou compensables ;
- le commercial voit le prix cible et la marge autorisée, pas les coûts bruts
  sans capacité explicite ;
- la marge réelle se réconcilie avec coûts, frais, vente et remboursements.

### 8. Pilotage

**Inclus**

- chiffre d'affaires et marges ;
- activité, charge et performance atelier ;
- demandes, conversions, retards et véhicules prêts ;
- paiements et impayés ;
- activité et marge commerciales ;
- comparaison des centres et agrégats réseau ;
- exports des indicateurs.

**Critères d'acceptation**

- chaque indicateur est calculé depuis une source serveur documentée ;
- aucune valeur de démonstration n'apparaît comme métrique réelle ;
- les filtres de période, centre et organisation sont cohérents ;
- un `network_admin` voit des agrégats financiers, pas le détail sans capacité ;
- les chiffres affichés sont réconciliables avec les données sources.

### 9. Onboarding et exploitation

**Inclus**

- création autorisée d'un garage, centres et propriétaire ;
- invitations, activation, équipe et rôles ;
- configuration, horaires et catalogue de prestations ;
- import CSV avec prévisualisation, validation et reprise sûre ;
- exports, démonstration séparée, formation et support ;
- procédures de sauvegarde et restauration.

**Critères d'acceptation**

- le dirigeant configure son garage sans partage de mot de passe ;
- l'import produit un rapport déterministe et ne laisse pas d'état partiel ;
- la checklist de mise en service prouve que le garage est prêt ;
- les données de démonstration sont clairement isolées ;
- le support n'obtient aucun accès permanent aux données métier.

### 10. Qualité produit

**Inclus**

- responsive mobile et desktop ;
- navigation clavier et formulaires accessibles ;
- états de chargement, vides et erreurs compréhensibles ;
- performance, pagination et protection contre les doubles soumissions ;
- tests E2E des parcours critiques ;
- aucune page blanche ni workflow principal sans issue.

**Critères d'acceptation**

- les parcours atelier, vente, client et onboarding passent en E2E ;
- les vues critiques passent les contrôles mobile, clavier et contraste ;
- les listes volumineuses restent bornées et paginées ;
- les erreurs réseau ou métier n'effacent pas l'état valide ;
- les budgets de performance et les erreurs runtime sont surveillés.

## Fonctionnalités exclues du V1

Ces éléments sont placés dans le backlog V2 ou Enterprise et ne bloquent pas la
sortie du Full Product V1 :

- application mobile native ;
- intelligence artificielle avancée ;
- white-label complet ;
- API publique générale ;
- intégration avec tous les DMS ;
- comptabilité réglementaire complète ;
- fiscalité internationale ;
- marketplace de pièces ;
- rôles entièrement personnalisables ;
- automatisations marketing avancées ;
- multidiffusion exhaustive vers toutes les plateformes ;
- fonctions spécifiques à un seul grand groupe ;
- toute idée nouvelle non indispensable aux dix domaines figés.

Une capacité V2 peut être préparée techniquement, mais elle ne devient pas une
dépendance de sortie V1 sans décision formelle de changement de périmètre.

## Définition globale de terminé

Une fonctionnalité V1 n'est terminée que si tous les éléments applicables sont
présents :

1. interface utilisateur cohérente sur mobile et desktop ;
2. persistance et contraintes en base ;
3. validation côté client et côté serveur ;
4. permissions tenant, centre et rôle ;
5. erreurs, chargements, états vides et retry maîtrisés ;
6. audit, archivage et historique lorsque l'action est sensible ;
7. tests positifs, négatifs, cross-tenant et concurrence selon le risque ;
8. migration additive et compatibilité de déploiement si le schéma change ;
9. documentation opérationnelle et support ;
10. validation staging et Production selon le
    [processus de release](./RELEASE_PROCESS.md).

Une page, un bouton, une table, une RPC ou un test isolé ne suffit jamais à
déclarer une fonctionnalité terminée.

## Gel strict du périmètre

Le périmètre ci-dessus est gelé. Toute modification doit :

1. nommer le besoin utilisateur et le domaine V1 concerné ;
2. démontrer qu'il est indispensable à un critère d'acceptation existant ;
3. indiquer l'impact sur sécurité, dépendances et roadmap ;
4. retirer ou reporter un élément de poids comparable, ou obtenir une décision
   humaine explicite d'extension ;
5. mettre à jour ensemble ce document, la
   [matrice des rôles](./ROLE_MATRIX.md) et la
   [roadmap](./IMPLEMENTATION_ROADMAP.md) si elles sont affectées.

Par défaut, toute nouvelle idée est classée V2. La facilité technique, une
opportunité ponctuelle ou la demande d'un seul grand compte ne suffisent pas à
modifier le V1.

Les flags juridiques et fournisseurs restent absents ou `false`. Leur activation
relève d'une autorisation et d'un runbook séparés ; elle n'est pas autorisée par
ce cadrage.

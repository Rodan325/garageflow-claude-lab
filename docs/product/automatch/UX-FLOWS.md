# AutoMatch V1 — Parcours UX

> **Référentiel documentaire AutoMatch V1 sur branche dédiée :** consolidation R2, corrections R2.1 puis R2.2, vérifiées par Codex (PASS le 17/11/2026). Les décisions du fondateur prévalent. **Aucun GO technique.** Qualification 002 INCONCLUSIVE et réserve historique R2 ouverte.


### A. Parcours de l'automobiliste

| Étape | Description | Statut | Source |
|---|---|---|---|
| A0 Consultation publique | Exploration libre, sans compte | VALIDÉ | AM14 ; §2.8 |
| A1 Entrée | Onglet AutoMatch de la navigation inférieure, qui ouvre Découvrir | VALIDÉ | AM12 |
| A2 Préférences progressives | Préférences construites au fil de l'usage, communes aux deux vues | VALIDÉ | AM14 ; AM12 |
| A2a Conservation des préférences sans compte | — | INCONNU | U-28 |
| A3 Découvrir | Cartes immersives. Score en pourcentage expliqué (correspondances, compromis, informations manquantes), ou aucun pourcentage si les préférences sont insuffisantes | VALIDÉ | AM12 ; AM14 ; AM15 |
| A3a Swipe gauche | Passer, sans exclusion définitive | VALIDÉ | AM13 |
| A3b Réapparition d'un véhicule passé (règle, délai) | — | INCONNU | U-22 |
| A3c Swipe droit | Ouvre le parcours d'intérêt (A8), sans transmission | VALIDÉ | AM13 |
| A3d Fiche véhicule détaillée | Consultable depuis une carte ou une ligne de résultat | VALIDÉ (principe) ; contenu INCONNU | AM13 ; U-23 |
| A3e Véhicule vendu ou retiré définitivement | Absent des résultats actifs de Découvrir | VALIDÉ | AM20 |
| A4 Rechercher | Filtres explicites, affichage Liste ou Cartes ; Cartes réutilise Découvrir, avec les mêmes gestes ; le changement d'affichage conserve filtres et préférences | VALIDÉ | AM12 ; AM13 |
| A4a Cohérence | À critères identiques, même score et même éligibilité dans A3 et A4 | VALIDÉ | AM15 |
| A4b Véhicule vendu ou retiré définitivement | Absent des résultats actifs de Rechercher, Liste et Cartes | VALIDÉ | AM20 |
| A5 Budget | Strict ; aucun filtre n'élargit implicitement ; élargissement uniquement par action explicite | VALIDÉ ; forme INCONNUE | AM15 ; U-06 |
| A6 Favoris | Ajout possible sans compte ; conservation locale temporaire ; information sur le risque de perte ; indépendants des demandes ; jamais partagés automatiquement | VALIDÉ | AM13 ; AM17 |
| A6a Association des favoris | À l'authentification, confirmation explicite demandée avant toute association au compte | VALIDÉ | AM17 |
| A6b Refus d'association | Les favoris restent locaux | PROPOSÉ | R2 |
| A6c Favori indisponible | Le véhicule vendu ou retiré définitivement reste visible dans les favoris avec la mention « Indisponible » | VALIDÉ | AM20 |
| A7 Mes suivis | Depuis Découvrir ou Rechercher : Favoris, Demandes, Matchs | VALIDÉ | AM16 |
| A7a Demandes et Matchs pour un visiteur non authentifié | Présentation | PROPOSÉ | R2 |
| A8 Parcours d'intérêt (1) | Authentification obligatoire avant transmission ; placement exact : U-24 | VALIDÉ | AM2 / AM-06 |
| A8 (2) | Fiche acheteur complète, demandée seulement à ce stade, structurée, sans texte libre | VALIDÉ | AM14 ; Q2 |
| A8 (3) | Aperçu exact des données qui seront transmises | VALIDÉ | §2.9 |
| A8 (4) | Consentement explicite | VALIDÉ | §2.9 |
| A8 (5) | Transmission confirmée, puis mise à disposition dans la boîte professionnelle autorisée. Les délais démarrent à ce moment | VALIDÉ | AM18 |
| A9 Attente | Demande visible dans Mes suivis > Demandes ; expiration à 168 h | VALIDÉ | AM16 ; AM18 |
| A9a Retrait d’intérêt avant décision | La notion est reconnue par AM18 (plus de rappels après retrait) ; modalités encore proposées | VALIDÉ (notion), modalités PROPOSÉES | AM18 ; CL3 |
| A9b Retrait d’intérêt après match | Droit de l’acheteur à terminer le match par ce retrait, modalités et effets | PROPOSÉ | CL3 |
| A10 Issues | Acceptation : match. Refus : fin. Expiration : fin, sans match | VALIDÉ | §2.11 ; AM18 |
| A10a Libellés des issues pour l'acheteur | Messages neutres | PROPOSÉ | P-16 |
| A10b Véhicule vendu ou retiré définitivement avant décision | Demande clôturée sans match ni nouveau rappel, sans réactivation automatique | VALIDÉ ; libellé acheteur PROPOSÉ | AM20 |
| A10c Pause temporaire du véhicule | Effets métier non tranchés | INCONNU | U-30 |
| A11 Match | Visible dans Mes suivis > Matchs ; conversation ouverte ; aucune réservation | VALIDÉ | AM16 ; §2.12–2.13 |
| A12 Messagerie | Envoi si match actif ; coordonnées non transmises automatiquement | VALIDÉ | R1 ; Q1 |
| A12a Partage manuel de coordonnées | — | INCONNU | U-17 |
| A12b Suspension du professionnel | Conversations concernées normalement consultables en lecture seule par leurs participants autorisés, sauf modération ; aucune nouvelle demande transmissible | VALIDÉ | AM19 |
| A12c Envoi de l’acheteur pendant suspension | Aucun nouvel envoi dans les conversations concernées, y compris depuis l’acheteur | VALIDÉ | AM19 ; U-33 résolue |
| A13 Fin de match | Conversation immédiatement en `LECTURE_SEULE`, consultable dans Mes suivis > Matchs sans nouvel envoi. Distinct du blocage réversible pendant suspension (A12b). Aucune réactivation automatique après vente/retrait définitif (AM20) ; aucune transition de réouverture manuelle validée | VALIDÉ (Q4, AM19, AM20) ; réouverture manuelle non validée | Q4 ; AM16 ; AM19 ; AM20 |
| A13a Conservation | — | INCONNU | U-02 |

### B. Parcours du professionnel

La structure E1–E5 est une orientation **RETENUE** (AM11). Les détails sont **PROPOSÉS**, sauf mention contraire.

| Étape | Description | Statut | Source |
|---|---|---|---|
| B0 Accès | Boîte partagée entre les rôles commerciaux autorisés du centre ; owner seulement avec rôle explicite ; network admin sans accès automatique aux contenus | VALIDÉ | Q5 |
| B0a Liste des rôles commerciaux et point d'entrée | — | INCONNU | U-13 ; U-10 |
| B1 Demandes reçues (E1) | Demandes mises à disposition dans la boîte autorisée | VALIDÉ (principe) | AM18 ; AM11 |
| B1a Rappels | À 24 h et 72 h ; aucun après acceptation, refus ou retrait | VALIDÉ | AM18 |
| B1b Consultation | Ne réinitialise jamais les délais | VALIDÉ | AM18 |
| B1c Indicateur « non lue », état unique `EN_ATTENTE`, tri, filtres, délai restant affiché | — | PROPOSÉ | C3-P ; P-07 ; AM11 |
| B2 Fiche du projet (E2) | Données structurées seulement, sans texte libre | VALIDÉ | Q2 |
| B2a Pseudonyme, zone au département, antériorité, mention « déclaratif », signalement des changements de l'annonce | — | PROPOSÉ | P-04 ; P-10 ; P-11 ; P-12 ; AM11 |
| B2b Affichage du pourcentage | — | INCONNU | U-12 |
| B3 Décision (E3) | Acceptation ou refus explicite ; aucune acceptation possible après 168 h | VALIDÉ | §2.11 ; AM18 |
| B3a Motif, irréversibilité, confirmation serveur, rappel de non-réservation | — | PROPOSÉ | P-15–P-17 ; P-03 ; P-20 |
| B4 Suivi des matchs (E4) — principes | Plusieurs matchs sur un même véhicule ; aucun ne vaut réservation ; messagerie privée après match | VALIDÉ | §2.12–2.13 |
| B4a Suivi des matchs — modalités d'isolement | Vue par véhicule ; acheteurs jamais exposés les uns aux autres ; avertissement interne « plusieurs acheteurs en discussion » ; pas de classement ni de priorité affichés ; une conversation par match ; référent | PROPOSÉ (correction Codex 2) | P-02 ; P-18 ; P-19 ; AM11 |
| B5 Messagerie (E5) | Professionnel autorisé (Q5) et match actif pour envoyer ; il voit le prénom et l'initiale de l'acheteur ; pas de coordonnées automatiques | VALIDÉ | Q1 ; Q5 ; R1 |
| B5a Pièces jointes, accusés de lecture, signature, signalement | — | PROPOSÉ | P-21–P-23 ; AM11 |
| B6 Fin de match | `LECTURE_SEULE` immédiate | VALIDÉ | Q4 |
| B6a Origines et motifs d'interruption | — | PROPOSÉ | CL5 |
| B7 Suspension du professionnel | Blocage immédiat des nouvelles demandes, acceptations et envois concernés des deux côtés ; conversations normalement consultables en lecture seule sauf modération ; match non terminé ; reprise si match actif et permissions valides ; aucun accès administratif automatique | VALIDÉ | AM19 |
| B7a Suspension : périmètre et demandes déjà en attente | Effets sur délais/rappels, visibilité des annonces et périmètre exact | INCONNU | U-31 ; U-32 |
| B8 Véhicule vendu ou retiré définitivement | Demandes pendantes clôturées sans match ni rappel ; matchs actifs terminés ; conversations immédiatement en `LECTURE_SEULE` ; aucune réactivation automatique | VALIDÉ | AM20 |
| B8a Avertissement préalable au professionnel | Message avant de déclarer le véhicule vendu ou retiré définitivement | PROPOSÉ | CL2 |

---

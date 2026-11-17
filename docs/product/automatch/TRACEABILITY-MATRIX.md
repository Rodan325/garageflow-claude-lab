# AutoMatch V1 — Matrice de traçabilité

> **Référentiel documentaire AutoMatch V1 sur branche dédiée :** consolidation R2, corrections R2.1 puis R2.2, vérifiées par Codex (PASS le 17/11/2026). Les décisions du fondateur prévalent. **Aucun GO technique.** Qualification 002 INCONCLUSIVE et réserve historique R2 ouverte.


**Avertissements**
- La numérotation EX est PROPOSÉE.
- Critères historiques AM-nn : seul **AM-06** a un contenu connu (authentification avant transmission). Les autres sont « à rattacher », sans aucune correspondance inventée.
- Les AC-En-nn sont des critères candidats PROPOSÉS, distincts des critères AM-nn.

| Exigence | Contenu | Statut de l'exigence | Décisions | Critère historique AM-nn | Critères candidats AC (proposés) |
|---|---|---|---|---|---|
| EX-01 | Module natif ; navigation inférieure ; Découvrir par défaut | VALIDÉ | D11, AM12 | À rattacher | — |
| EX-02 | Moteur, préférences et éligibilité communs ; même score à critères identiques | VALIDÉ | AM12, AM15 | À rattacher | AC-E1-03 |
| EX-03 | Budget strict ; élargissement explicite seulement ; aucun dépassement compensé | VALIDÉ | AM15 | À rattacher | — |
| **EX-04a** | Score en pourcentage expliqué par critère (correspondances, compromis, informations manquantes) ; « indifférent » et données inconnues jamais comptés comme correspondances | VALIDÉ | AM15 ; correction Codex 6 | À rattacher | — |
| **EX-04b** | Versionnage des pondérations, version enregistrée à la transmission | **PROPOSÉ** | C7-P | À rattacher | — |
| EX-05 | Professionnels vérifiés ; exploration libre sans compte | VALIDÉ | D11, AM14 | À rattacher | — |
| EX-06 | Authentification, fiche complète pendant le parcours, aperçu, consentement avant transmission ; données structurées seulement | VALIDÉ | AM2, AM14, Q2, §2.9 | **AM-06** (authentification avant transmission, d'après la revue Codex) ; autres à rattacher | AC-E2-01 |
| EX-07 | Décision explicite ; délais calendaires 24 h, 72 h, 168 h à partir de T0, sans réinitialisation ; expiration sans match ; suspension : pas de nouvelle demande ni acceptation ; vente/retrait définitif : clôture des demandes pendantes sans match ni nouveau rappel. Effets sur délais pendant suspension et pause temporaire inconnus | VALIDÉ pour les comportements cités ; inconnues U-30/U-31 | §2.11 ; Q3 ; AM18 ; AM19 ; AM20 | À rattacher | AC-E3-01, AC-E3-02, AC-E3-04 |
| EX-08 | Conversation seulement après match accepté ; envoi si match actif et permissions ; prénom et initiale ; pas de coordonnées automatiques | VALIDÉ | §2.12, Q1, Q5, R1 | À rattacher | AC-E5-01, AC-E5-02 |
| EX-09 | Plusieurs matchs, aucune réservation (principes) | VALIDÉ | §2.13 | À rattacher | AC-E4-03, AC-E3-05 |
| EX-09b | Modalités d'isolement entre acheteurs | PROPOSÉ | P-02, P-18 | À rattacher | AC-E4-01 |
| EX-10 | Après fin effective du match, conversation immédiatement en `LECTURE_SEULE` (Q4) ; la suspension n’est pas une fin de match (AM19). Aucune réactivation automatique des demandes/conversations uniquement dans les cas de vente ou retrait définitif (AM20). Aucune transition de réouverture manuelle validée, sans interdiction générale ratifiée ; conservation et suppression ouvertes | VALIDÉ pour Q4/AM19/AM20 ; réouverture non validée ; conservation INCONNUE | Q4 ; AM19 ; AM20 ; U-02 | À rattacher | AC-E4-04, AC-E5-04 |
| EX-11 | Permissions Q5 avec refus par défaut ; les interdictions d’auto-modification, d’auto-promotion et d’auto-affectation sont documentées dans ROLE_MATRIX (RM-10 à RM-12). Aucun accès administratif automatique pendant suspension. Application technique non vérifiée | VALIDÉ pour Q5/AM19 ; référence documentaire pour ROLE_MATRIX | Q5 ; AM19 ; ROLE_MATRIX | À rattacher | AC-E1-01, AC-E5-03 |
| EX-12 | Minimisation des données avant match | VALIDÉ (Q1, Q2) ; détail PROPOSÉ (P-04, P-11) | Q1, Q2 | À rattacher | AC-E1-02, AC-E3-03 |
| EX-13 | Rechercher filtrable en Liste/Cartes ; Cartes réutilise Découvrir ; filtres et préférences conservés au changement d'affichage | VALIDÉ | AM12 | À rattacher | — |
| EX-14 | Swipe gauche (passer, sans exclusion définitive) ; swipe droit (parcours d'intérêt, sans transmission) ; fiche véhicule détaillée | VALIDÉ | AM12, AM13 | À rattacher | — |
| EX-15 | Préférences progressives ; pas de pourcentage artificiel si elles sont insuffisantes | VALIDÉ ; seuil INCONNU | AM14 | À rattacher | — |
| EX-16 | Mes suivis (Favoris, Demandes, Matchs), accessible depuis les deux vues, sans nouvel onglet, avec respect de la messagerie et de la lecture seule | VALIDÉ | AM16 | À rattacher | — |
| EX-17 | Favoris sans compte, locaux et temporaires ; association après confirmation ; aucun partage automatique ; information sur risque de perte ; indépendants des demandes. Véhicule vendu/retiré définitivement : favori conservé avec mention « Indisponible » | VALIDÉ ; durée locale INCONNUE | AM13 ; AM17 ; AM20 | À rattacher | — |
| EX-18 | Suspension : blocage immédiat et réversible des nouvelles demandes, acceptations et envois ; aucun nouvel envoi dans les conversations concernées, y compris depuis l’acheteur ; match non terminé ; consultation normalement en lecture seule par les participants autorisés, sauf restriction de modération ; reprise seulement si match actif et permissions valides ; aucun accès administratif automatique ; aucun nouvel état persistant validé. Représentation « états persistants inchangés » PROPOSÉE | Comportement VALIDÉ ; identifiant et représentation technique PROPOSÉS | AM19 ; R2.2 | À rattacher | — |
| EX-19 | Véhicule vendu ou retiré définitivement : disparition des résultats actifs, favori avec mention « Indisponible », demandes en attente clôturées sans match ni nouveau rappel, matchs actifs terminés et conversations immédiatement en `LECTURE_SEULE` ; aucune réactivation automatique ; pause temporaire non décidée ; noms techniques PROPOSÉS | Comportement VALIDÉ ; identifiant et noms PROPOSÉS | AM20 ; Q4 | À rattacher | — |

---

## Questions ouvertes

**U-01 est résolue par AM18, U-04 par AM2 / AM-06, U-05 par AM13 et U-33 par AM19.** U-30 est résolue uniquement pour la vente ou le retrait définitif (AM20) : son reliquat concerne les pauses temporaires. Les autres questions ci-dessous restent ouvertes.

| Réf. | Question | Origine |
|---|---|---|
| U-02 | Conservation et suppression des conversations en `LECTURE_SEULE` | Q4 |
| U-03 | Indicateur « lu » suivi par centre ou par membre (seulement si C3-P est retenu) | C3 |
| U-06 | Forme de l'action explicite d'élargissement du budget ; une commande de filtre peut-elle en tenir lieu ? | AM15 |
| U-07 | Persistance des filtres et de l'élargissement au-delà de la conservation Liste/Cartes | AM12 |
| U-08 | Le professionnel voit-il qu'un acheteur a élargi son budget ? | C4 |
| U-09 | Position, libellé et icône de l'entrée AutoMatch | AM12 |
| U-10 | Point d'entrée des écrans professionnels | AM11 |
| U-11 | Pondérations définitives | AM15 |
| U-12 | Visibilité du pourcentage pour le professionnel | C7 |
| U-13 | Liste exacte des rôles commerciaux autorisés | Q5 |
| U-14 | Périmètre des « contenus » interdits au network admin | Q5 |
| U-15 | Inventaire des termes historiques en conflit | C1 |
| U-16 | Identité professionnelle affichée à l'acheteur | Q1 |
| U-17 | Partage manuel de coordonnées dans un message | Q1 |
| U-18 | Durée et modalités de la conservation locale des favoris | AM17 |
| U-19 | Seuil de suffisance des préférences | AM14 |
| U-20 | Effet d'un critère « indifférent » et d'une donnée inconnue sur le pourcentage | AM15 |
| U-21 | Définition opérationnelle du « compromis » | AM15 |
| U-22 | Réapparition d'un véhicule passé : règle et délai | AM13 |
| U-23 | Contenu de la fiche véhicule détaillée | AM13 |
| U-24 | Placement de l'authentification dans le parcours d'intérêt | AM2 / AM14 |
| U-25 | Démarrage des délais si aucune boîte professionnelle autorisée n'est disponible | AM18 ; Q5 |
| U-26 | Fusion des favoris locaux avec des favoris déjà associés au compte | AM17 |
| U-27 | Effet d'un filtre sur le calcul du score (ex-RR-1) | AM12 ; AM15 |
| U-28 | Conservation des préférences d'un visiteur non authentifié | AM14 |
| U-29 | Liste exacte des champs structurés de la fiche acheteur | Q2 ; AM14 |
| U-30 | Effets d’une pause temporaire du véhicule sur résultats, favoris, demandes en attente, délais, rappels et matchs (le cas définitif est résolu par AM20) | AM20 (limite) |
| U-31 | Pendant une suspension : délais, rappels et expiration des demandes déjà en attente ; visibilité des annonces du professionnel suspendu | AM19 |
| U-32 | Périmètre de la suspension : organisation, centre, compte vendeur | AM19 |

---

## Journal des corrections depuis R1

| # | Correction | Source | Sections |
|---|---|---|---|
| J-01 | AM13 passe de PROPOSÉ (R1) à VALIDÉ ; U-05 est résolue | R2 | L1 §2, §3 · L2 · L3 A3 · L4 T3 · L5 EX-14 |
| J-02 | AM14 intégré : exploration sans compte, préférences progressives, fiche pendant le parcours, pas de pourcentage artificiel | R2 | L1 §1, §5, §7 · L3 A0–A2, A8 · L5 EX-05, EX-15 |
| J-03 | AM15 intégré : explication en trois catégories, budget, cohérence, pondérations non fixées | R2 | L1 §4, §5 · L5 EX-03, EX-04a |
| J-04 | AM16 intégré : Mes suivis | R2 | L1 §3, §6 · L3 A7, A9, A11, A13 · L5 EX-16 |
| J-05 | AM17 intégré : favoris | R2 | L1 §6 · L3 A6 · L4 états, transitions, permissions · L5 EX-17 |
| J-06 | AM18 intégré : T0, 24 h, 72 h, 168 h, délais calendaires, pas de réinitialisation, expiration sans match ; U-01 est résolue | R2 | L1 §8 · L3 A9, B1, B3 · L4 T5–T10, CL1 · L5 EX-07 |
| J-07 | AM19 inscrit comme PROPOSÉ ; P-09 et RR-2 lui sont rattachés ; la suspension n'est pas intégrée comme décision | R2 | L2 · L3 B7 · L4 T15, CL5 |
| J-08 | Dépréciation de `NOUVELLE` requalifiée en PROPOSÉE (C3-P) ; C3 classée « non résolue » | Codex 1 | L1 §2 · L2 C3 · L4 4.2 |
| J-09 | B4 et CL4 scindés entre principes validés et modalités d'isolement proposées ; ajout d'EX-09b | Codex 2 | L3 B4/B4a · L4 CL4 · L5 |
| J-10 | EX-04 scindé : EX-04a validé, EX-04b proposé | Codex 3 | L5 · L1 §5 |
| J-11 | U-04 résolue : authentification avant transmission validée (AM2 / AM-06, par la revue Codex, libellé non reproduit) ; ajout d'I-1 ; Demandes et Matchs réservés à l'acheteur authentifié | Codex 4 | L1 §1, §7 · L4 4.1, 4.4 · L5 EX-06 |
| J-12 | Tableau des conventions d'identifiants (AMn, AM-nn, EX, AC, U, Q, P) | Codex 5 | §0 |
| J-13 | « Indifférent » et données inconnues jamais comptés comme correspondances ; ajout de U-20 et U-21 | Codex 6 | L1 §5 · L5 EX-04a |
| J-14 | Restent ouverts : pondérations, seuils, conservation (U-02, U-18, U-28) ; ajout de U-18 à U-30 | Codex 7 | Questions ouvertes |
| J-15 | Tableau RM-1 à RM-9 référencé, avec la mention « application technique non vérifiée » | Codex 8 | L4 4.5 · L5 EX-11 |
| J-16 | Le résidu R1 sur filtres et score devient U-27 ; le résidu sur la modération reste RR-3 | Consolidation R2 | L1 §4 · L4 4.2 |
| J-17 | Q3 conservée comme source datée, précisée par AM18 sans réécriture ; P-24 reste sans effet propre | R2 (précédence) | L2 |

### Journal complémentaire R2.1 — 17 novembre 2026

| # | Date | Correction | Source | Sections |
|---|---|---|---|---|
| J-18 | 2026-11-17 | AM19 passe de PROPOSÉ à VALIDÉ. La suspension est modélisée comme un blocage réversible des permissions, sans fin de match ni état `SUSPENDU` validé | R2.1 §1 | L1 §2, §8, §9 · L2 2.1 · L3 A12b, B7 · L4 I-14, I-15, 4.2, T15, T16, 4.4, CL6 · L5 EX-18 |
| J-19 | 2026-11-17 | P-09 requalifié « sans effet propre » ; état persistant `SUSPENDU` inscrit comme proposition non validée | R2.1 §1 | L2 2.4 |
| J-20 | 2026-11-17 | AM20 intégré comme VALIDÉ, avec séparation entre cas définitifs et cas temporaires | R2.1 §2 | L1 §2, §4, §6, §8, §9 · L2 2.1 · L3 A3e, A6c, A10b, A10c, B8 · L4 I-16, 4.2, T11a/b, T13a/b, T17, CL2 · L5 EX-19 |
| J-21 | 2026-11-17 | Nom `CADUQUE` inscrit comme PROPOSÉ ; U-30 résolue pour le seul cas définitif, puis reformulée pour les pauses | R2.1 §2 | L2 2.4 · questions ouvertes |
| J-22 | 2026-11-17 | T14 restreint à la lecture seule issue d'une fin de match ; T16 ajoutée pour la reprise à la levée d'une suspension | R2.1 §3 | L4 T14, T16 · L3 A13 |
| J-23 | 2026-11-17 | CL3 scindé : retrait après match PROPOSÉ ; lecture seule après fin effective VALIDÉE (Q4) ; distinction avec AM20 ; T12 amendée | R2.1 §4 | L4 CL3, T12 · L3 A9a, A9b · L1 §2 |
| J-24 | 2026-11-17 | RM-10 à RM-12 ajoutés, avec une note de provenance ; RR-4 reformulé | R2.1 §5 | L2 2.3 · L4 4.5 · L5 EX-11 |
| J-25 | 2026-11-17 | EX-07, EX-10, EX-11 et EX-17 mis à jour ; EX-18 et EX-19 ajoutés (identifiants proposés) | R2.1 §6 | L5 |
| J-26 | 2026-11-17 | U-31 à U-33 ajoutées ; RR-2 résolu ; RR-3 maintenu | R2.1 §1, §6 | Questions ouvertes |
| J-27 | 2026-11-17 | Correction rédactionnelle : la référence « P-xx » de R2 L1 §8 est retirée | Consolidation R2.1 | L1 §8 |

### Journal complémentaire R2.2 — 17 novembre 2026

| # | Date | Correction | Source | Sections |
|---|---|---|---|---|
| J-28 | 2026-11-17 | U-33 résolue par AM19 : consultation en lecture seule par les participants autorisés et aucun nouvel envoi, y compris depuis l'acheteur | R2.2 §1 | L1 §9 (2 lignes) · L3 A12b, A12c · L4 4.4 acheteur, CL6 · L5 EX-18 · inconnues |
| J-29 | 2026-11-17 | T14 scindé en T14a (Q4), T14b (AM20), T14c (aucune transition de réouverture manuelle validée) et T14d (renvoi à T16). Retrait de l'interdiction générale formulée en R2.1 | R2.2 §2 | L1 §2 (2 entrées), §9 (2 lignes) · L3 A13 · L4 T14, CL6 · L5 EX-10 |
| J-30 | 2026-11-17 | Comportement validé par AM19 séparé de la modélisation des états persistants, qui devient PROPOSÉE (I-14-M, T15-M, T16-M, 4.2) | R2.2 §3 | L4 I-14, 4.2, T15, T16 · L5 EX-18 |

---

## Bilan documentaire consolidé — 17 novembre 2026

**Verdict indépendant de Codex sur R2 + R2.1 + R2.2 : PASS documentaire final**, selon V-1 à V-8, sans écart bloquant l’enregistrement canonique. Les corrections U-33, T14 et la séparation comportements/états techniques sont intégrées dans les cinq fichiers ; anciens statuts et journaux J-01 à J-30 conservés. Les passages antérieurs dans les journaux sont historiques et ne prévalent pas sur les formulations consolidées.

**Frontières et réserves conservées :**

1. Les décisions ultérieures du fondateur prévalent. AM19 et AM20 sont VALIDÉES ; aucun droit ou état technique supplémentaire ne l’est par implication.
2. Les noms d’états `CADUQUE`, `SUSPENDU` et `CLOS_VÉHICULE_INDISPONIBLE`, le maintien des états persistants inchangés pendant suspension, les droits après match (CL3) et les autres candidats restent PROPOSÉS.
3. U-33 est RÉSOLUE (AM19) ; U-30 reste ouverte uniquement pour les pauses temporaires ; U-31 et U-32 restent ouvertes. Les autres inconnues de ce registre ne sont pas ratifiées implicitement.
4. RR-2 est résolue pour la suspension par AM19 ; RR-3 (modération) et les détails de conservation restent ouverts. RM-10 à RM-12 sont documentées dans ROLE_MATRIX ; leur application technique n’a pas été vérifiée.
5. Les critères historiques AM-nn non reproduits restent à rattacher, sans correspondance inventée.
6. **Qualification réseau 002 INCONCLUSIVE ; réserve de sécurité historique R2 ouverte ; aucun GO technique**, aucune migration, test applicatif, publication ou déploiement autorisé par ce PASS documentaire.

**Portée :** cinq fichiers canoniques AutoMatch V1 sur branche documentaire dédiée, sans modification du code ni de `main`.

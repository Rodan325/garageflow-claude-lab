# AutoMatch V1 — Registre des décisions

> **Référentiel documentaire AutoMatch V1 sur branche dédiée :** consolidation R2, corrections R2.1 puis R2.2, vérifiées par Codex (PASS le 17/11/2026). Les décisions du fondateur prévalent. **Aucun GO technique.** Qualification 002 INCONCLUSIVE et réserve historique R2 ouverte.


## 0. Conventions (correction Codex 5)

| Famille | Forme | Nature | Statut de la numérotation |
|---|---|---|---|
| Décisions fondateur | `AM1…AM20`, sans tiret | Décisions produit | Fixée par le fondateur |
| Critères historiques | `AM-01…AM-18`, avec tiret | Critères d'acceptation du corpus historique | Historique. Seul AM-06 a un contenu connu ici, par la revue Codex |
| Questions arbitrées | `Q1…Q5` | Décisions sur les questions d'AM11 | Fixée par le fondateur |
| Exigences | `EX-01…EX-19` | Exigences consolidées | **PROPOSÉE** |
| Propositions | `P-01…P-24`, `C3-P`, `C7-P` | Propositions des agents | Agents |
| Critères candidats | `AC-En-nn` | Critères proposés dans AM11 | **PROPOSÉS**, distincts des critères AM-nn |
| Inconnues | `U-nn` | Questions non tranchées | Agents |
| Contradictions | `C1…C8` | Contradictions traitées dans les documents | Mission |
| Résidus | `RR-n` | Contradictions résiduelles | Agents |

**Statuts utilisés**

| Statut | Sens |
|---|---|
| VALIDÉ | Décision du fondateur |
| PROPOSÉ | Non ratifié |
| INCONNU | Non tranché, aucune source |
| ÉCARTÉ | Incompatible avec une décision validée (P-05 seulement) |
| RETENU | Orientation retenue sans ratification de son détail (AM10 et AM11 seulement) |

---

### 2.1 Décisions fondateur

| Réf. | Contenu | Statut | Source |
|---|---|---|---|
| AM1 | Libellé non disponible dans cette session | VALIDÉ (historique) | Corpus historique |
| AM2 | Établit l'authentification avant transmission (libellé exact non reproduit) | VALIDÉ (historique) | Corpus historique, par la revue Codex ; mission R2 |
| AM3–AM9 | Libellés non disponibles dans cette session | VALIDÉ (historique) | Corpus historique |
| AM10 | Orientation UX ; propositions détaillées non ratifiées | RETENU | CONSOLIDATION-001 §2 ; R2 |
| AM11 | Orientation UX de l'expérience vendeur pro (E1–E5, CL1–CL5) ; propositions détaillées non ratifiées | RETENU | Mission AM11 ; R2 |
| AM12 | Navigation inférieure ; Découvrir par défaut ; cartes immersives et swipe ; Rechercher filtrable en Liste/Cartes ; Cartes réutilise Découvrir ; filtres et préférences conservés au changement d'affichage ; même matching et même éligibilité ; aucun swipe ne transmet | VALIDÉ | Correction R1 ; R2 |
| AM13 | Swipe gauche : passer, sans exclusion définitive. Swipe droit : ouvre le parcours d'intérêt, sans transmission. Favoris indépendants des demandes. Fiche véhicule détaillée | VALIDÉ | R2 (remplace le statut « proposé » de R1) |
| AM14 | Exploration libre sans compte ; préférences progressives ; fiche acheteur complète seulement pendant le parcours d'intérêt ; pas de pourcentage artificiel si les préférences sont insuffisantes | VALIDÉ | R2 |
| AM15 | Explication par critère (correspondances, compromis, informations manquantes) ; budget strict, élargissement explicite ; cohérence entre Découvrir et Rechercher ; aucun dépassement compensé par le score ; pondérations non fixées | VALIDÉ | R2 |
| AM16 | Option A « Mes suivis » ; accès depuis Découvrir et Rechercher ; Favoris, Demandes, Matchs ; pas de nouvel onglet ; respect des permissions de messagerie et de la lecture seule | VALIDÉ | R2 |
| AM17 | Favoris sans compte ; conservation locale temporaire ; association au compte après confirmation explicite ; aucun partage automatique ; information sur le risque de perte | VALIDÉ | R2 |
| AM18 | Délais démarrant après transmission confirmée et mise à disposition dans la boîte autorisée ; 24 h, 72 h, 168 h ; calendaires ; aucun rappel après acceptation, refus ou retrait ; consultation sans réinitialisation ; expiration sans match | VALIDÉ | R2 |
| AM19 | Suspension : blocage immédiat des nouvelles demandes, acceptations et nouveaux envois dans les conversations concernées, y compris depuis l’acheteur ; consultation normalement en lecture seule sauf modération ; match non terminé ; reprise conditionnelle si match actif et permissions valides ; aucun accès administratif automatique ; aucun nouvel état persistant validé | VALIDÉ | Fondateur, 2026-11-17 ; R2.1/R2.2 |
| AM20 | Véhicule vendu ou retiré définitivement : retrait des résultats actifs ; favoris conservés avec mention « Indisponible » ; demandes en attente clôturées sans match ni rappel ; matchs actifs terminés, conversations immédiatement en `LECTURE_SEULE` ; aucune réactivation automatique. Les pauses temporaires et les noms techniques restent hors décision | VALIDÉ | Fondateur, 2026-11-17 ; R2.1 |

### 2.2 Questions arbitrées

| Réf. | Contenu | Statut | Source |
|---|---|---|---|
| Q1 | Après match : prénom et initiale du nom ; pas de téléphone ni d'e-mail automatique ; messagerie intégrée | VALIDÉ | CONSOLIDATION-001 §3 |
| Q2 | Avant match : informations structurées seulement, sans texte libre | VALIDÉ | CONSOLIDATION-001 §3 |
| Q3 | Expiration J+7, rappels J+1 et J+3 | VALIDÉ, précisé par AM18 (24 h, 72 h, 168 h, point de départ) | CONSOLIDATION-001 §3 ; AM18 |
| Q4 | Lecture seule immédiate en fin de match ; conservation à définir | VALIDÉ (conservation INCONNUE) | CONSOLIDATION-001 §3 |
| Q5 | Boîte partagée entre rôles commerciaux autorisés du centre ; owner seulement avec rôle explicite ; network admin sans accès automatique aux contenus | VALIDÉ | CONSOLIDATION-001 §3 |

### 2.3 Sources antérieures toujours applicables

| Réf. | Contenu | Statut | Source |
|---|---|---|---|
| D11 | AutoMatch professionnels d'abord ; stock de vendeurs pro vérifiés ; pas de vente entre particuliers en première étape ; aucune licence, API ou synchronisation présumée | VALIDÉ | `traceability.md` |
| ROLE_MATRIX | Restrictions documentées dans L4 §4.5, y compris interdiction d’auto-modification de son rôle, statut, centre ou périmètre, et interdiction d’auto-promotion / auto-affectation | Référence documentaire ; application technique non vérifiée | `ROLE_MATRIX.md` (revue Codex) |
| CONSOLIDATION-001 §2.1–2.13 | Décisions produit acquises, datées du 2026-11-17 ; plusieurs sont précisées par AM12–AM18 sans être contredites | VALIDÉ (sources datées) | CONSOLIDATION-001 |
| Correction R1 | Formulations des invariants de conversation et de la relation entre matching et filtres | VALIDÉ pour les passages remplacés | R1 |

### 2.4 Propositions

| Réf. | Contenu | Statut | Note |
|---|---|---|---|
| P-01 | Une demande par couple projet × véhicule | PROPOSÉ | |
| P-02 | Une conversation par match | PROPOSÉ | |
| P-03 | Décisions et envois confirmés par le serveur ; pas de mise à jour optimiste ni de file hors ligne | PROPOSÉ | |
| P-04 | Pseudonyme stable avant le match | PROPOSÉ | Compatible avec Q1 et Q2 |
| P-05 | Pas de score numérique | **ÉCARTÉ** | Contredit AM15 et §2.7 |
| P-06 | Canal d'origine masqué au professionnel | PROPOSÉ | |
| P-07 | Tri de la plus ancienne demande à la plus récente | PROPOSÉ | |
| P-08 | Pas de décision depuis la liste | PROPOSÉ | |
| P-09 | Vérification suspendue : matchs suspendus | PROPOSÉ, sans effet propre | Les comportements effectivement validés le sont uniquement par AM19 ; état « match suspendu » non validé |
| P-10 | Signalement des changements de l'annonce depuis l'intérêt | PROPOSÉ | |
| P-11 | Zone au niveau du département | PROPOSÉ | |
| P-12 | Antériorité signalée sans détails | PROPOSÉ | |
| P-13 | Auteur d'une décision visible en interne | PROPOSÉ | |
| P-14 | Message d'ouverture à l'acceptation | PROPOSÉ | Postérieur au match, compatible avec Q2 |
| P-15 | Motif de refus obligatoire, choisi dans une liste | PROPOSÉ | |
| P-16 | Motif jamais transmis à l'acheteur ; message neutre | PROPOSÉ | |
| P-17 | Refus irréversible, délai avant nouvel intérêt | PROPOSÉ | |
| P-18 | Vue par véhicule par défaut | PROPOSÉ | |
| P-19 | Membre référent réassignable | PROPOSÉ | À concilier avec la boîte partagée (Q5) |
| P-20 | Rappel de non-réservation à la première ouverture | PROPOSÉ | |
| P-21 | Pièces jointes limitées aux images | PROPOSÉ | |
| P-22 | Accusés de lecture | PROPOSÉ | |
| P-23 | Signature « Prénom — Garage » | PROPOSÉ | |
| P-24 | Relances à J+1 et J+3 | PROPOSÉ, sans effet propre | Le contenu est validé **uniquement au titre de Q3**, précisé par AM18 |
| C3-P | Un seul état métier `EN_ATTENTE` ; « non lue » comme indicateur ; dépréciation de `NOUVELLE` comme état | PROPOSÉ | AM18 (pas de réinitialisation à la consultation) est cohérent avec C3-P sans le valider |
| C7-P | Versionnage des pondérations, version enregistrée à la transmission | PROPOSÉ | |
| État persistant `SUSPENDU` | Modèle technique d’un état spécifique de suspension | PROPOSÉ, non validé | AM19 n’entérine aucun état persistant supplémentaire |
| Nom technique `CADUQUE` | Libellé de la clôture d’une demande en cas de retrait définitif du véhicule | PROPOSÉ | AM20 valide l’effet métier, pas le nom |
| Modélisation des états inchangés pendant suspension | Maintenir les états persistants de match et conversation, gérer le blocage par permissions | PROPOSÉ | I-14-M ; T15-M ; T16-M |

### 2.5 Contradictions C1–C8

| Réf. | Contradiction | Décision applicable | Correction documentaire | État après R2 |
|---|---|---|---|---|
| C1 | Noms identiques, règles différentes | Glossaire L1 §2 | Glossaire unique et table des termes dépréciés | Partiellement résolue (U-15) |
| C2 | Transmission automatique après swipe | AM12, AM13 | Règle historique dépréciée ; le swipe droit ouvre le parcours | Résolue |
| C3 | `NOUVELLE` et `EN_ATTENTE` | Aucune décision sur les noms d'état ; AM18 sur les délais | C3-P | **Proposée, non résolue** (correction Codex 1) |
| C4 | Clause de dépassement budgétaire | AM15 | Ancienne clause dépréciée | Résolue (forme de l'élargissement : U-06) |
| C5 | Navigation absente | AM12, AM16 | L1 §3 | Résolue (U-09, U-10 restent ouvertes) |
| C6 | Lien entre recherche, découverte et matching | AM12, AM15, R1 | L1 §4 | Résolue (U-27 reste ouverte) |
| C7 | Score non expliqué | AM15 | Score expliqué validé ; versionnage proposé (C7-P) | Partiellement résolue (U-11, U-12, U-19 à U-21) |
| C8 | Permissions et visibilité des conversations | Q5, ROLE_MATRIX | L4 §4.4 | Résolue (U-13, U-14 restent ouvertes) |

---

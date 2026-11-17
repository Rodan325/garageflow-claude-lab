# AutoMatch V1 — Spécification canonique

> **Référentiel documentaire AutoMatch V1 sur branche dédiée :** consolidation R2, corrections R2.1 puis R2.2, vérifiées par Codex (PASS le 17/11/2026). Les décisions du fondateur prévalent. **Aucun GO technique.** Qualification 002 INCONCLUSIVE et réserve historique R2 ouverte.


### §1 Positionnement

| Règle | Statut | Source |
|---|---|---|
| Module natif de Clikarage Ultimate, sans application séparée | VALIDÉ | D11 ; CONSOLIDATION-001 §2 ; AM12 |
| En V1, les vendeurs sont des professionnels vérifiés. Pas de vente entre particuliers | VALIDÉ | D11 ; CONSOLIDATION-001 §2 |
| Aucune licence, API ou synchronisation présumée | VALIDÉ | D11 (`traceability.md`) |
| Exploration libre, sans compte obligatoire | VALIDÉ | AM14 |
| Authentification obligatoire avant la transmission d'un intérêt | VALIDÉ | AM2 / AM-06, d'après la revue Codex (libellé non reproduit) |
| Hors périmètre V1 : vente entre particuliers, réservation, paiement, API externe | VALIDÉ | D11 ; §2.13 (aucune réservation) |

### §2 Glossaire canonique

| Terme | Définition | Statut |
|---|---|---|
| Préférences | Critères de l'acheteur, communs à Découvrir et Rechercher. Elles se construisent progressivement | VALIDÉ (AM12, AM14, AM15) |
| Découvrir | Vue d'ouverture par défaut. Cartes immersives et swipe, orientée exploration | VALIDÉ (AM12) |
| Rechercher | Résultats filtrables, affichage Liste ou Cartes | VALIDÉ (AM12) |
| Affichage Cartes de Rechercher | Réutilise l'expérience immersive de Découvrir | VALIDÉ (AM12) |
| Filtre | Commande explicite de Rechercher qui restreint les résultats. Ne permet jamais un élargissement implicite du budget | VALIDÉ (AM12, AM15, R1) |
| Swipe gauche | Passer le véhicule, sans l'exclure définitivement | VALIDÉ (AM13) |
| Swipe droit | Ouvre le parcours d'intérêt, sans transmission automatique | VALIDÉ (AM13) |
| Favori | Véhicule mis de côté indépendamment des demandes. Accessible sans compte et conservé localement de façon temporaire ; jamais partagé automatiquement. S’il est vendu ou retiré définitivement, il reste en favori avec la mention « Indisponible » | VALIDÉ (AM13, AM17, AM20) |
| Fiche véhicule | Fiche détaillée du véhicule. Contenu précis : U-23 | VALIDÉ (principe, AM13) |
| Score de compatibilité | Pourcentage expliqué critère par critère. Pas de pourcentage artificiel si les préférences sont insuffisantes | VALIDÉ (AM15, AM14) |
| Version des pondérations | Identifiant du jeu de pondérations ayant servi au calcul | PROPOSÉ (C7-P) |
| Parcours d'intérêt | Authentification, fiche acheteur complète, aperçu des données, consentement, puis transmission | VALIDÉ (AM2/AM-06, AM14, §2.9) ; ordre exact entre authentification et fiche : U-24 |
| Demande | Intérêt transmis après confirmation et mis à disposition dans la boîte professionnelle autorisée | VALIDÉ (§2.9, AM18) |
| Match | Demande acceptée explicitement par le professionnel. Ce n'est pas une réservation | VALIDÉ (§2.11, §2.13) |
| Conversation | Messagerie privée, ouverte seulement après un match accepté. Passe en `LECTURE_SEULE` dès la fin du match | VALIDÉ (§2.12, Q4, R1) |
| Mes suivis | Espace accessible depuis Découvrir et Rechercher, avec trois rubriques : Favoris, Demandes, Matchs. Ce n'est pas un onglet de navigation | VALIDÉ (AM16) |
| Une conversation par match | Granularité de la conversation | PROPOSÉ (P-02) |
| Statut `NOUVELLE` | Usage historique conflictuel. **Sa dépréciation est proposée**, elle n'est pas acquise | PROPOSÉ (C3-P) |
| Termes historiques en conflit | Inventaire à reprendre du corpus | INCONNU (U-15) |
| Suspension professionnelle | Restriction réversible des permissions concernées, sans fin de match. Aucun nouvel état persistant validé | VALIDÉ (AM19) |
| Blocage réversible des envois | Aucun nouvel envoi pendant la suspension dans les conversations concernées, y compris par l’acheteur ; conversations normalement consultables en lecture seule sauf restriction de modération. Ce blocage est distinct de l’état de fin de match `LECTURE_SEULE` | VALIDÉ (AM19) |
| `LECTURE_SEULE` (fin de match) | État atteint immédiatement après la fin effective d’un match ; n’implique pas à lui seul une interdiction générale de réouverture manuelle future | VALIDÉ (Q4) |
| Réouverture manuelle | Aucune transition de réouverture n’est validée actuellement ; ni permission nouvelle ni interdiction générale ratifiée | Aucune transition validée |
| Retrait d’intérêt (acheteur) | Avant décision, notion reconnue par AM18 ; modalités proposées. Après match, droit et effets proposés (CL3) | VALIDÉ (notion) / PROPOSÉ (modalités) |
| Retrait définitif du véhicule | Vente ou retrait définitif du stock, distinct d’un retrait d’intérêt | VALIDÉ (AM20) |
| Pause temporaire du véhicule | Cas distinct du retrait définitif ; effets non décidés | INCONNU (U-30) |

### §3 Navigation et vues

| Règle | Statut | Source |
|---|---|---|
| Entrée AutoMatch dans la navigation principale inférieure | VALIDÉ | AM12 |
| Ouverture par défaut sur Découvrir | VALIDÉ | AM12 |
| Accès immédiat à Rechercher | VALIDÉ | CONSOLIDATION-001 §2 ; AM12 |
| Rechercher : résultats filtrables, affichage Liste ou Cartes | VALIDÉ | AM12 |
| L'affichage Cartes réutilise l'expérience immersive de Découvrir, y compris les gestes d'AM13 | VALIDÉ | AM12 ; AM13 |
| Le passage Liste/Cartes conserve filtres et préférences | VALIDÉ | AM12 |
| « Mes suivis » accessible depuis Découvrir et Rechercher, sans nouvel onglet | VALIDÉ | AM16 |
| Position, libellé et icône de l'entrée | INCONNU | U-09 |
| Point d'entrée des écrans professionnels | INCONNU | U-10 |

### §4 Préférences, matching et filtres

| Règle | Statut | Source |
|---|---|---|
| Un seul moteur de matching, des préférences communes, les mêmes règles d'éligibilité | VALIDÉ | AM12 ; AM15 |
| À critères identiques, même score et même éligibilité dans Découvrir et dans Rechercher, quel que soit l'affichage | VALIDÉ | AM15 |
| Découvrir privilégie l'exploration. Rechercher ajoute des filtres explicites et les affichages Liste et Cartes | VALIDÉ | AM12 ; R1 |
| Préférences progressives | VALIDÉ | AM14 |
| Budget strict par défaut ; élargissement uniquement explicite | VALIDÉ | AM15 |
| Les filtres n'autorisent jamais un élargissement implicite du budget | VALIDÉ | AM15 ; R1 |
| Un bon score ne compense jamais un dépassement de budget | VALIDÉ | AM15 |
| Forme de l'action d'élargissement ; une commande de filtre peut-elle en tenir lieu ? | INCONNU | U-06 |
| Persistance des filtres et de l'élargissement, au-delà de la conservation Liste/Cartes | INCONNU | U-07 |
| Effet d'un filtre sur le calcul du score : restriction de l'ensemble ou modification des critères | INCONNU | U-27 (ex-RR-1) |
| Un véhicule vendu ou retiré définitivement disparaît des résultats actifs, dans Découvrir comme dans Rechercher | VALIDÉ | AM20 |
| Visibilité des annonces d’un professionnel suspendu | INCONNU | U-31 |

### §5 Score et explication (correction Codex 6)

| Règle | Statut | Source |
|---|---|---|
| Score exprimé en pourcentage, expliqué critère par critère | VALIDÉ | AM15 |
| L'explication distingue correspondances, compromis et informations manquantes | VALIDÉ | AM15 |
| Une **correspondance** suppose un critère exprimé par l'acheteur ET une donnée du véhicule connue qui le satisfait | VALIDÉ (application d'AM15 et de la correction Codex 6) | AM15 ; R2 |
| Un critère « indifférent » n'est jamais présenté comme une correspondance vérifiée | VALIDÉ | R2 (correction Codex 6) |
| Une donnée du véhicule inconnue est présentée comme « information manquante », jamais comme une correspondance | VALIDÉ | AM15 ; R2 |
| Effet d'un critère « indifférent » ou d'une donnée inconnue sur le pourcentage | INCONNU | U-20 |
| Définition opérationnelle du « compromis » (écart toléré pour chaque critère) | INCONNU | U-21 |
| Aucun pourcentage artificiel si les préférences sont insuffisantes | VALIDÉ | AM14 |
| Seuil de suffisance des préférences | INCONNU | U-19 |
| Affichage de remplacement quand les préférences sont insuffisantes (par exemple, une invitation à les compléter) | PROPOSÉ | Consolidation R2 |
| Pondérations définitives | INCONNU (non fixées) | AM15 ; U-11 |
| Versionnage des pondérations, version enregistrée à la transmission | PROPOSÉ | C7-P |
| Visibilité du pourcentage pour le professionnel | INCONNU | U-12 |
| Le budget n'est jamais traité comme un compromis hors élargissement explicite | VALIDÉ | AM15 (budget strict) |

### §6 Favoris et « Mes suivis »

| Règle | Statut | Source |
|---|---|---|
| Favoris indépendants des demandes | VALIDÉ | AM13 |
| Un véhicule vendu ou retiré définitivement reste dans les favoris avec la mention « Indisponible » | VALIDÉ | AM20 |
| Favoris accessibles sans compte, conservés localement de façon temporaire sur l'appareil | VALIDÉ | AM17 |
| Association au compte seulement après confirmation explicite | VALIDÉ | AM17 |
| Aucun partage automatique des favoris avec les professionnels | VALIDÉ | AM17 |
| L'utilisateur est informé du risque de perte des favoris non synchronisés | VALIDÉ | AM17 |
| Durée et modalités de la conservation locale | INCONNU | U-18 |
| Fusion avec des favoris déjà associés au compte | INCONNU | U-26 |
| Comportement si l'utilisateur refuse l'association (les favoris restent locaux) | PROPOSÉ | Consolidation R2 |
| « Mes suivis » : rubriques Favoris, Demandes, Matchs | VALIDÉ | AM16 |
| Les rubriques Demandes et Matchs n'existent que pour un acheteur authentifié | VALIDÉ (conséquence directe d'AM2/AM-06 et d'AM16) | AM2/AM-06 ; AM16 |
| Présentation de ces rubriques pour un visiteur non authentifié | PROPOSÉ | Consolidation R2 |
| « Mes suivis » respecte les permissions de messagerie et la lecture seule en fin de match | VALIDÉ | AM16 |

### §7 Transmission de l'intérêt

| Règle | Statut | Source |
|---|---|---|
| Le swipe droit, ou l'action équivalente, ouvre le parcours d'intérêt sans rien transmettre | VALIDÉ | AM13 ; AM12 |
| Authentification avant transmission | VALIDÉ | AM2 / AM-06 (revue Codex) |
| Fiche acheteur complète, demandée seulement pendant le parcours d'intérêt | VALIDÉ | AM14 |
| Aperçu des données, puis consentement, avant transmission | VALIDÉ | CONSOLIDATION-001 §2 |
| Avant le match, informations structurées uniquement, sans texte libre | VALIDÉ | Q2 |
| Placement de l'authentification dans le parcours | INCONNU | U-24 |
| Liste exacte des champs structurés | INCONNU | U-29 |
| Zone géographique au niveau du département | PROPOSÉ | P-11 |
| Pseudonyme de l'acheteur avant le match | PROPOSÉ | P-04 |
| Une demande par couple projet × véhicule | PROPOSÉ | P-01 |

### §8 Décision du professionnel et délais

| Règle | Statut | Source |
|---|---|---|
| Acceptation ou refus explicite | VALIDÉ | CONSOLIDATION-001 §2 ; AM11 (orientation) |
| Les délais démarrent seulement après la transmission confirmée ET la mise à disposition dans la boîte professionnelle autorisée | VALIDÉ | AM18 |
| Premier rappel au professionnel à 24 h | VALIDÉ | AM18 (précise Q3) |
| Deuxième rappel à 72 h | VALIDÉ | AM18 (précise Q3) |
| Expiration automatique à 168 h | VALIDÉ | AM18 (précise Q3) |
| Délais calendaires | VALIDÉ | AM18 |
| Aucun rappel après acceptation, refus ou retrait | VALIDÉ | AM18 |
| La consultation par le professionnel ne réinitialise jamais les délais | VALIDÉ | AM18 |
| Une demande expirée ne crée pas de match | VALIDÉ | AM18 |
| Véhicule vendu ou retiré définitivement : les demandes en attente sont clôturées sans match et sans nouveau rappel | VALIDÉ | AM20 |
| Nom technique de clôture `CADUQUE` | PROPOSÉ | AM20 (ne ratifie pas le nom) |
| Pause temporaire du véhicule : effets sur demandes, délais et rappels | INCONNU | U-30 |
| Délai si aucune boîte professionnelle autorisée n'est disponible | INCONNU | U-25 |
| Motif de refus obligatoire, jamais transmis à l'acheteur | PROPOSÉ | P-15, P-16 |
| Refus irréversible | PROPOSÉ | P-17 |
| Pas de décision depuis la liste | PROPOSÉ | P-08 |
| Décisions confirmées par le serveur, pas de file hors ligne | PROPOSÉ | P-03 |
| Pendant une suspension professionnelle : aucune nouvelle demande ni acceptation concernée | VALIDÉ | AM19 |
| Délais, rappels et expiration des demandes déjà en attente pendant une suspension | INCONNU | U-31 |

### §9 Match, messagerie et fin de match

| Règle | Statut | Source |
|---|---|---|
| Match seulement après acceptation explicite | VALIDÉ | §2.11 |
| Plusieurs matchs possibles sur un même véhicule | VALIDÉ | §2.13 |
| Aucun match ne constitue une réservation | VALIDÉ | §2.13 |
| Messagerie privée, seulement après match | VALIDÉ | §2.12 |
| Aucune conversation ne peut être ouverte avant un match accepté | VALIDÉ | R1 |
| L'envoi de messages exige un match actif et les permissions appropriées | VALIDÉ | R1 ; Q5 |
| À la fin du match, la conversation devient immédiatement `LECTURE_SEULE` | VALIDÉ | Q4 ; R1 |
| Véhicule vendu ou retiré définitivement : fin des matchs actifs et conversations immédiatement en `LECTURE_SEULE` | VALIDÉ | AM20 ; Q4 |
| Après vente ou retrait définitif, aucune réactivation automatique des anciennes demandes ou conversations | VALIDÉ | AM20 |
| Réouverture manuelle d’une conversation terminée | Aucune transition validée actuellement | — |
| Blocage réversible des envois pendant suspension et lecture seule immédiate après fin de match sont distincts | VALIDÉ | AM19 ; Q4 |
| Après le match, le professionnel voit le prénom et l'initiale du nom de l'acheteur | VALIDÉ | Q1 |
| Aucun téléphone ni e-mail transmis automatiquement ; échanges via la messagerie intégrée | VALIDÉ | Q1 |
| Partage manuel de coordonnées dans un message | INCONNU | U-17 |
| Conservation et suppression ultérieure des conversations | INCONNU | U-02 |
| Identité professionnelle affichée à l'acheteur | INCONNU | U-16 |
| La suspension bloque immédiatement nouvelles demandes, acceptations et envois dans les conversations concernées, y compris depuis l’acheteur | VALIDÉ | AM19 |
| Les conversations concernées restent normalement consultables en lecture seule par leurs participants autorisés, sauf restriction particulière de modération | VALIDÉ ; modalités de modération PROPOSÉES (RR-3) | AM19 |
| La suspension ne termine pas le match ; les envois reprennent seulement si le match reste actif et les permissions sont valides | VALIDÉ | AM19 |
| Aucun état persistant `SUSPENDU` n’est validé ; toute représentation persistante inchangée est une modélisation PROPOSÉE | VALIDÉ (limite) ; modélisation PROPOSÉE | AM19 |
| Aucun accès administratif automatique pendant une suspension | VALIDÉ | AM19 |
| Périmètre exact de suspension (organisation, centre, compte vendeur) | INCONNU | U-32 |
| Modalités d'isolement entre acheteurs d'un même véhicule | PROPOSÉ | P-02, P-18, CL4 |

### §10 Permissions professionnelles
Q5, appliqué côté serveur avec refus par défaut. Le tableau complet est en L4, §4.4.

---

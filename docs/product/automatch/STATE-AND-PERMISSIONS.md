# AutoMatch V1 — États et permissions

> **Référentiel documentaire AutoMatch V1 sur branche dédiée :** consolidation R2, corrections R2.1 puis R2.2, vérifiées par Codex (PASS le 17/11/2026). Les décisions du fondateur prévalent. **Aucun GO technique.** Qualification 002 INCONCLUSIVE et réserve historique R2 ouverte.


### 4.1 Invariants

| # | Invariant | Statut | Source |
|---|---|---|---|
| I-1 | Aucune transmission sans authentification | VALIDÉ | AM2 / AM-06 |
| I-2 | Aucune demande sans aperçu et consentement | VALIDÉ | §2.9 |
| I-3 | Aucun swipe ne transmet une demande | VALIDÉ | AM12 ; AM13 |
| I-4 | Pas de texte libre avant le match | VALIDÉ | Q2 |
| I-5 | Pas de match sans acceptation explicite ; une demande expirée ne crée pas de match | VALIDÉ | §2.11 ; AM18 |
| I-6 | Aucune conversation ouverte avant un match accepté | VALIDÉ | R1 |
| I-7 | L'envoi exige un match actif et les permissions appropriées | VALIDÉ | R1 ; Q5 |
| I-8 | Fin de match : la conversation devient immédiatement `LECTURE_SEULE` | VALIDÉ | Q4 ; R1 |
| I-9 | Aucune coordonnée transmise automatiquement | VALIDÉ | Q1 |
| I-10 | Aucun élargissement implicite du budget, ni par un filtre ni par le score | VALIDÉ | AM15 |
| I-11 | Favoris jamais partagés automatiquement avec les professionnels ; association au compte seulement après confirmation | VALIDÉ | AM17 |
| I-12 | La consultation professionnelle ne réinitialise jamais les délais | VALIDÉ | AM18 |
| I-13 | Contrôle côté serveur, refus par défaut | VALIDÉ (référence documentaire) ; application technique non vérifiée | ROLE_MATRIX ; D14 |
| I-14 | La suspension professionnelle ne termine pas le match et bloque réversiblement les permissions concernées | VALIDÉ | AM19 |
| I-14-M | Modélisation des états persistants inchangés pendant suspension, blocage porté par les permissions | Modélisation PROPOSÉE | R2.2 |
| I-15 | Une suspension ne confère aucun accès administratif automatique | VALIDÉ | AM19 |
| I-16 | Aucune réactivation automatique des demandes et conversations après vente/retrait définitif | VALIDÉ | AM20 |

### 4.2 Machines à états

**Favori**

| État | Statut |
|---|---|
| `LOCAL` (appareil, temporaire) | VALIDÉ (AM17). Noms d'état PROPOSÉS |
| `ASSOCIÉ_AU_COMPTE` (après confirmation explicite) | VALIDÉ (AM17) |
| Expiration ou perte du favori local : durée | INCONNU (U-18) |
| Mention « Indisponible » pour véhicule vendu ou retiré définitivement, qu’il soit favori local ou associé au compte | VALIDÉ (AM20) |

**Intérêt, avant transmission** (côté acheteur uniquement)
- États : `EN_COURS` (parcours ouvert), puis `CONSENTI` ou `ABANDONNÉ`.
- Statut : principe VALIDÉ (AM13, AM14, §2.9) ; noms PROPOSÉS.

**Demande**

| État | Entrée | Statut |
|---|---|---|
| `EN_ATTENTE` | Transmission confirmée et mise à disposition dans la boîte autorisée (T0 au sens d'AM18) | Principe VALIDÉ (AM18) ; nom PROPOSÉ (C3-P) |
| `ACCEPTÉE` | Acceptation explicite avant T0 + 168 h | VALIDÉ |
| `REFUSÉE` | Refus explicite | VALIDÉ |
| `EXPIRÉE` | T0 + 168 h sans décision | VALIDÉ (AM18) |
| `RETIRÉE` | Retrait de l'acheteur | Notion VALIDÉE (AM18) ; modalités PROPOSÉES |
| Clôturée sans match (nom `CADUQUE` proposé) | Véhicule vendu ou retiré définitivement | Effet métier VALIDÉ (AM20) ; nom PROPOSÉ |
| Effets sur pause temporaire | Pause du véhicule non définitive | INCONNU (U-30) |
| `NOUVELLE` | Usage historique | Dépréciation PROPOSÉE (C3-P) |

**Match**
- États historiques candidats : `ACTIF`, `INTERROMPU`, `CLOS_VÉHICULE_INDISPONIBLE`. Les noms restent PROPOSÉS.
- VALIDÉ (AM19) : une suspension ne termine pas le match et bloque réversiblement les permissions. Aucun nouvel état persistant n’est validé.
- Modélisation PROPOSÉE : l’état persistant reste `ACTIF` pendant la suspension. L’état spécifique `SUSPENDU` est PROPOSÉ et non validé.
- VALIDÉ (AM20) : le match actif se termine si le véhicule est vendu ou retiré définitivement ; nom `CLOS_VÉHICULE_INDISPONIBLE` PROPOSÉ.

**Conversation**
- VALIDÉ (Q4) : après la fin effective du match, passage immédiat en `LECTURE_SEULE`.
- VALIDÉ (AM19) : pendant une suspension, les conversations concernées restent normalement consultables en lecture seule par leurs participants autorisés, sauf restriction de modération ; aucun nouvel envoi, y compris depuis l’acheteur ; blocage réversible sans fin du match.
- Modélisation PROPOSÉE : l’état persistant reste `OUVERTE` pendant suspension et le blocage est assuré par les permissions ; ne pas confondre cette modélisation avec l’état post-fin `LECTURE_SEULE`.
- Archivage et suppression : INCONNU (U-02). Modération : modalités PROPOSÉES (RR-3).

### 4.3 Transitions

| # | De → vers | Déclencheur | Acteur | Statut | Source |
|---|---|---|---|---|---|
| T1 | — → Favori `LOCAL` | Ajout aux favoris | Visiteur ou acheteur | VALIDÉ | AM17 |
| T2 | `LOCAL` → `ASSOCIÉ_AU_COMPTE` | Confirmation explicite | Acheteur authentifié | VALIDÉ | AM17 |
| T3 | — → Intérêt `EN_COURS` | Swipe droit ou action d'intérêt | Visiteur ou acheteur | VALIDÉ | AM13 |
| T4 | `EN_COURS` → `CONSENTI` | Authentification, fiche, aperçu, consentement | Acheteur | VALIDÉ | AM2/AM-06 ; AM14 ; §2.9 |
| T5 | `CONSENTI` → Demande `EN_ATTENTE` | Transmission confirmée et mise à disposition (T0) | Système | VALIDÉ | AM18 |
| T6 | `EN_ATTENTE` → `EN_ATTENTE` (rappel) | T0 + 24 h, puis T0 + 72 h, calendaires | Système | VALIDÉ | AM18 |
| T7 | `EN_ATTENTE` → `ACCEPTÉE`, puis Match `ACTIF` et Conversation `OUVERTE` | Acceptation explicite avant T0 + 168 h | Rôle commercial autorisé | VALIDÉ | §2.11 ; AM18 ; Q5 |
| T8 | `EN_ATTENTE` → `REFUSÉE` | Refus explicite | Rôle commercial autorisé | VALIDÉ | §2.11 |
| T9 | `EN_ATTENTE` → `EXPIRÉE` | T0 + 168 h | Système | VALIDÉ | AM18 |
| T10 | `EN_ATTENTE` → `RETIRÉE` | Retrait | Acheteur | Notion VALIDÉE ; modalités PROPOSÉES | AM18 |
| T11a | Demande `EN_ATTENTE` → clôturée sans match, plus aucun rappel (nom `CADUQUE` proposé) | Véhicule vendu ou retiré définitivement | Système, sur événement du stock | VALIDÉ (effet), nom PROPOSÉ | AM20 |
| T11b | Demande `EN_ATTENTE` → ? | Pause temporaire du véhicule | — | INCONNU | U-30 |
| T12 | Match actif → terminé, puis conversation → `LECTURE_SEULE` ; la fin par retrait d’intérêt de l’acheteur après match est encore proposée | Interruption effective d’un match | Origines professionnel/acheteur/plateforme PROPOSÉES | Lecture seule VALIDÉE (Q4) ; modalités/origines PROPOSÉES (CL3/CL5) | Q4 ; CL3 ; CL5 |
| T13a | Match actif → terminé (nom `CLOS_VÉHICULE_INDISPONIBLE` proposé) ; conversation → `LECTURE_SEULE` immédiate | Véhicule vendu ou retiré définitivement | Système | VALIDÉ (effet), nom PROPOSÉ | AM20 ; Q4 |
| T13b | Match actif → ? | Pause temporaire | — | INCONNU | U-30 |
| T14a | Conversation → `LECTURE_SEULE` immédiatement après la fin effective du match | Fin effective du match | Système | VALIDÉ | Q4 |
| T14b | Aucune réactivation automatique des demandes/conversations | Vente ou retrait définitif du véhicule | Système | VALIDÉ | AM20 |
| T14c | `LECTURE_SEULE` → `OUVERTE` par réouverture manuelle | — | — | Aucune transition validée ; ni interdiction générale ni permission | — |
| T14d | Reprise des envois à levée d’une suspension | Voir T16, distinct de T14 | Plateforme | VALIDÉ seulement si match actif et permissions valides | AM19 |
| T15 | Blocage des nouvelles demandes, acceptations et envois dans les conversations concernées, y compris de l’acheteur ; match non terminé | Suspension du professionnel | Plateforme | VALIDÉ | AM19 |
| T15-M | États persistants inchangés pendant suspension | — | — | Modélisation PROPOSÉE | R2.2 |
| T16 | Reprise des envois si match toujours actif et permissions valides | Levée de suspension | Plateforme | VALIDÉ | AM19 |
| T16-M | Aucun changement d’état persistant à levée | — | — | Modélisation PROPOSÉE | R2.2 |
| T17 | Favori → mention « Indisponible », véhicule absent des résultats actifs | Vente ou retrait définitif | Système | VALIDÉ | AM20 |

**Effets annexes de T7 à T10 (VALIDÉ, AM18) :** aucun rappel après acceptation, refus ou retrait. Le véhicule vendu/retiré définitivement entraîne la clôture sans rappel (AM20) ; pauses temporaires : U-30.

### 4.4 Permissions

**Côté acheteur**

| Capacité | Visiteur non authentifié | Acheteur authentifié | Statut | Source |
|---|---|---|---|---|
| Explorer (Découvrir, Rechercher, fiche véhicule) | OUI | OUI | VALIDÉ | AM14 ; AM13 |
| Préférences progressives | OUI (conservation : U-28) | OUI | VALIDÉ ; conservation INCONNUE | AM14 |
| Favoris | OUI, en local | OUI, en local ou associés après confirmation | VALIDÉ | AM17 |
| Ouvrir le parcours d'intérêt | OUI | OUI | VALIDÉ | AM13 |
| Transmettre une demande | NON | OUI | VALIDÉ | AM2 / AM-06 |
| Mes suivis > Demandes et Matchs | Sans objet (aucune demande possible) | OUI, seulement les siens | VALIDÉ | AM16 ; AM2/AM-06 |
| Lire sa conversation | — | OUI, `OUVERTE` ou `LECTURE_SEULE` | VALIDÉ | AM16 ; Q4 |
| Envoyer un message | — | OUI si le match est actif et les permissions valides | VALIDÉ | R1 ; Q5 |
| Envoyer un message dans une conversation concernée par une suspension | — | NON | VALIDÉ | AM19 |
| Consulter une conversation concernée par une suspension | — | OUI, normalement en lecture seule, sauf restriction de modération | VALIDÉ | AM19 |
| Transmettre une demande à un professionnel suspendu | NON | NON | VALIDÉ | AM19 |
| Voir en favori un véhicule vendu ou retiré définitivement | OUI si favori local, avec « Indisponible » | OUI si favori, avec « Indisponible » | VALIDÉ | AM20 |

**Côté professionnel**

| Capacité | Rôle commercial autorisé du centre (liste : U-13) | Owner | Network admin | Autres rôles du centre, viewer compris | Support plateforme | Statut | Source |
|---|---|---|---|---|---|---|---|
| Lire les demandes de la boîte du centre | OUI (boîte partagée) | Seulement avec rôle commercial explicite | NON, pas d'accès automatique aux contenus (périmètre : U-14) | NON, sauf s'ils figurent dans la liste U-13 | NON | VALIDÉ | Q5 ; ROLE_MATRIX |
| Accepter ou refuser | OUI | Idem | NON | NON | NON | VALIDÉ | Q5 |
| Lire les conversations (`OUVERTE` ou `LECTURE_SEULE`) | OUI (boîte partagée) | Idem | NON | NON | NON | VALIDÉ | Q5 ; Q4 |
| Envoyer un message | OUI si le match est actif et les permissions valides | Idem, si le match est actif et les permissions valides | NON | NON | NON | VALIDÉ | Q5 ; R1 ; AM19 |
| Interrompre un match | OUI | Idem | NON | NON | — | PROPOSÉ | CL5 |
| Modération (contenus signalés) | — | — | — | — | Workflow séparé et tracé | PROPOSÉ | AM11 |
| Nouvelles demandes pendant suspension | NON | NON | NON | NON | — | VALIDÉ | AM19 |
| Accepter pendant suspension | NON | NON | NON | NON | — | VALIDÉ | AM19 |
| Envoyer dans les conversations concernées pendant suspension | NON | NON | NON | NON | — | VALIDÉ | AM19 |
| Lire les conversations concernées pendant suspension | OUI sauf modération | Seulement avec rôle commercial explicite, sauf modération | NON | NON | NON | VALIDÉ | AM19 ; Q5 |
| Reprendre les envois après suspension | OUI si match actif et permissions valides | Idem, avec rôle commercial explicite | NON | NON | NON | VALIDÉ | AM19 |
| Accès administratif automatique par suspension | NON | NON | NON | NON | NON | VALIDÉ | AM19 |

### 4.5 Restrictions de référence ROLE_MATRIX (correction Codex 8)

Toutes ces restrictions sont **référencées tel que documenté dans `ROLE_MATRIX.md`. Leur application technique n'a pas été vérifiée dans cette mission.**

| # | Restriction documentée | Lien avec AutoMatch |
|---|---|---|
| RM-1 | Droits appliqués côté base, RPC ou serveur ; une action masquée dans l'interface n'est jamais considérée comme interdite | I-13 |
| RM-2 | Une seule autorité serveur décide des droits ; un rôle legacy ne constitue pas une autorité durable | Q5 |
| RM-3 | Aucun héritage implicite d'un rôle legacy vers un périmètre organisation entière ou vers un autre centre | Boîte du centre |
| RM-4 | Appartenance cohérente, active et non ambiguë avant tout accès métier | B0 |
| RM-5 | `network_admin` ne gère que les rôles strictement inférieurs ; les interdictions d’auto-attribution sont explicitées par RM-10 à RM-12 | Q5 ; RR-4 |
| RM-6 | `platform_support` : métadonnées techniques seulement, aucun accès permanent aux données métier, pas d'impersonation ordinaire | Support = NON |
| RM-7 | `viewer` : aucune mutation directe ou par RPC | Exclu de la boîte commerciale (Q5) |
| RM-8 | `sales` décrit comme « Commerce des centres explicites » | Candidat à la liste U-13, sans décision |
| RM-9 | Refus des rôles inconnus (AM-PROP-06, `traceability.md`) | I-13 |
| RM-10 | Interdiction de modifier son propre rôle, statut, centre ou périmètre | Q5 : pas d’auto-attribution commerciale par un network admin |
| RM-11 | Refus explicite de l’auto-modification | Q5 et AM19 (pas de levée de sa propre suspension par auto-modification) |
| RM-12 | Interdiction d’auto-promotion et d’auto-affectation | Q5 : network admin et owner |

**RR-4 :** interdiction documentaire d’auto-attribution établie d’après `ROLE_MATRIX.md` (revue Codex : lignes 107–108, 155 et 191) ; **application technique non vérifiée**. Aucun droit AutoMatch supplémentaire n’en est déduit.

### 4.6 Cas limites

**CL1 — Absence de réponse**

| Élément | Statut |
|---|---|
| T0 : transmission confirmée et mise à disposition dans la boîte autorisée | VALIDÉ (AM18) |
| Rappels au professionnel à T0 + 24 h et T0 + 72 h, calendaires | VALIDÉ (AM18) |
| Expiration à T0 + 168 h, sans match ; acceptation tardive refusée | VALIDÉ (AM18) |
| Consultation sans effet sur les délais | VALIDÉ (AM18) |
| Message neutre à l'acheteur | PROPOSÉ |
| Indicateur de réactivité interne | PROPOSÉ |
| Aucune boîte autorisée disponible | INCONNU (U-25) |

**CL2 — Véhicule vendu ou retiré définitivement, distinct d’une pause temporaire**

| Élément | Statut |
|---|---|
| Retrait des résultats actifs Découvrir et Rechercher | VALIDÉ (AM20) |
| Maintien dans les favoris avec mention « Indisponible » | VALIDÉ (AM20) |
| Demandes en attente clôturées sans match ni nouveau rappel | VALIDÉ (AM20) |
| Matchs actifs terminés, conversations immédiatement en `LECTURE_SEULE` | VALIDÉ (AM20 ; Q4) |
| Aucune réactivation automatique après vente ou retrait définitif | VALIDÉ (AM20) |
| Aucun match ne vaut réservation | VALIDÉ (§2.13) |
| Noms `CADUQUE`, `CLOS_VÉHICULE_INDISPONIBLE` | PROPOSÉ |
| Avertissement préalable professionnel ; nouvel intérêt pour véhicule similaire | PROPOSÉ |
| Pause temporaire : résultats, favoris, demandes, délais, matchs | INCONNU (U-30) |

**CL3 — Retrait d’intérêt par l’acheteur**

| Élément | Statut |
|---|---|
| Retrait avant décision : notion reconnue, plus de rappel après retrait | VALIDÉ (AM18) |
| Modalités du retrait avant décision, à tout moment et sans motif | PROPOSÉ |
| Retrait après match : droit de mettre fin au match par ce retrait et modalités | PROPOSÉ (Q4 ne valide pas ce droit à lui seul) |
| Après fin effective, quelle qu’en soit l’origine, conversation immédiatement en `LECTURE_SEULE` | VALIDÉ (Q4) |
| Nouvel intérêt ultérieur traité comme une nouvelle demande | PROPOSÉ |
| Retrait d’intérêt de l’acheteur et retrait définitif du véhicule | Distinction acquise (AM20) |

**CL4 — Acceptations multiples (correction Codex 2)**

| Élément | Statut |
|---|---|
| **Principes :** plusieurs matchs possibles sur un véhicule ; aucun ne vaut réservation ; messagerie privée après match ; envoi limité aux rôles autorisés | VALIDÉ (§2.12–2.13, Q5) |
| **Modalités d'isolement :** une conversation par match ; acheteurs jamais exposés les uns aux autres ; aucun classement ni priorité affichés ; avertissement interne au professionnel ; mention générique possible à l'acheteur ; pas de plafond de matchs en V1 ; une seule décision retenue en cas de décisions concurrentes | PROPOSÉ (P-02, P-18, AM11) |

**CL5 — Interruption d'un match**

| Élément | Statut |
|---|---|
| Conversation en `LECTURE_SEULE` immédiate | VALIDÉ (Q4) |
| Origines (professionnel, acheteur, plateforme) et motif obligatoire côté professionnel | PROPOSÉ (CL5) |
| Réouverture manuelle après fin effective | Aucune transition validée ; aucune interdiction générale ratifiée |
| Suspension professionnelle | VALIDÉ (AM19) : ne termine pas en elle-même le match ; effets détaillés en CL6 |
| Conservation après interruption | INCONNU (U-02) |

**CL6 — Suspension professionnelle**

| Élément | Statut |
|---|---|
| Blocage immédiat des nouvelles demandes, acceptations et envois concernés, y compris depuis l’acheteur | VALIDÉ (AM19) |
| Match non terminé, aucun nouvel état persistant validé | VALIDÉ (AM19) |
| Conversations concernées normalement consultables en lecture seule par les participants autorisés, sauf restriction de modération | VALIDÉ (AM19) ; modalités PROPOSÉES (RR-3) |
| Reprise des envois seulement si match toujours actif et permissions valides | VALIDÉ (AM19) |
| Aucun accès administratif automatique | VALIDÉ (AM19) |
| Si le match prend fin pendant la suspension, `LECTURE_SEULE` immédiate ; lever la suspension ne rétablit pas les envois tant que le match reste terminé | VALIDÉ (Q4, AM19, le cas échéant AM20) |
| Périmètre organisation/centre/compte | INCONNU (U-32) |
| Délais des demandes en attente et visibilité des annonces | INCONNU (U-31) |
| Modélisation des états persistants inchangés | PROPOSÉ (I-14-M, T15-M, T16-M) |

---

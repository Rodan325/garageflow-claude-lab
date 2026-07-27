# Matrice de rôles Clikarage V1

## Objet

Cette matrice fixe la cible de permissions du Full Product Commercial V1.
Elle complète le [périmètre produit](./FULL_PRODUCT_V1.md) et doit être
appliquée côté base, RPC ou serveur. Une action cachée dans l'interface n'est
jamais considérée comme interdite.

Les rôles existants et les rôles cibles peuvent conserver des libellés legacy
pendant une migration, mais une seule autorité serveur doit décider des droits.

## Niveaux de rôles

### Plateforme

| Rôle | Périmètre | Règle |
|---|---|---|
| `platform_admin` | Administration RODANBTECH séparée | Hors interfaces garage ; actions sensibles explicitement autorisées et auditées |
| `platform_support` | Métadonnées techniques | Aucun accès permanent aux données métier ; pas d'impersonation ordinaire |

### Organisation

| Rôle | Périmètre | Règle |
|---|---|---|
| `organization_owner` | Toute son organisation | Autorité la plus élevée du tenant ; transfert de propriété par workflow séparé |
| `network_admin` | Toute son organisation | Administre uniquement les rôles strictement inférieurs ; jamais un égal ou un owner |

### Centre

| Rôle | Périmètre | Règle |
|---|---|---|
| `center_manager` | Un ou plusieurs centres explicites | Gestion opérationnelle locale ; aucune gestion des membres dans la première V1 |
| `workshop_manager` | Atelier des centres explicites | Planifie, affecte, valide et finalise les opérations techniques |
| `receptionist` | Relation client des centres explicites | CRM, demandes, devis client, paiements et restitution ; aucun coût brut |
| `technician` | Affectations explicites | Travaux et données techniques strictement nécessaires |
| `sales` | Commerce des centres explicites | Stock, prospects, offres et ventes ; prix cible et marge autorisée uniquement |
| `accounting` | Finance des centres ou de l'organisation explicitement accordée | Paiements, avoirs, remboursements et exports ; aucune mutation technique |
| `viewer` | Lecture explicitement bornée | Données minimisées ; aucune mutation directe ou via RPC |

### Client

| Rôle | Périmètre | Règle |
|---|---|---|
| `client` | Ses propres données | Actions limitées par le workflow, sans accès à un autre client ou garage |

## Légende des capacités

- **ORG** : action sur toute l'organisation.
- **CENTRE** : action limitée aux centres explicitement attribués.
- **ASSIGNÉ** : action limitée aux dossiers ou travaux affectés.
- **LIMITÉ** : lecture ou mutation bornée par une règle détaillée.
- **LECTURE** : lecture minimisée, sans mutation.
- **NON** : accès refusé côté serveur.
- **SÉPARÉ** : workflow de plateforme ou break-glass distinct, jamais implicite.

## Matrice cible par capacité

| Capacité métier | Owner | Network admin | Center manager | Workshop manager | Receptionist | Technician | Sales | Accounting | Viewer | Client |
|---|---|---|---|---|---|---|---|---|---|---|
| Paramètres globaux de l'organisation | ORG | LECTURE | NON | NON | NON | NON | NON | NON | LECTURE | NON |
| Centres, horaires et catalogue | ORG | ORG | CENTRE | LECTURE | LECTURE | LECTURE | LECTURE | LECTURE | LECTURE | NON |
| Inviter, désactiver, modifier un membre | ORG | ORG, rôles inférieurs | NON | NON | NON | NON | NON | NON | NON | NON |
| Affecter un membre à un centre | ORG | ORG, rôles inférieurs | NON | NON | NON | NON | NON | NON | NON | NON |
| Consulter l'équipe | ORG | ORG | CENTRE | CENTRE | CENTRE | CENTRE, minimisé | CENTRE, minimisé | CENTRE, minimisé | CENTRE, minimisé | NON |
| CRM clients et consentements | ORG | ORG | CENTRE | CENTRE, lecture | CENTRE | ASSIGNÉ, minimisé | CENTRE, prospects/clients utiles | CENTRE, finance utile | LECTURE minimisée | Ses données |
| Véhicules et VehicleOS | ORG | ORG | CENTRE | CENTRE | CENTRE | ASSIGNÉ | CENTRE, stock/vente | LECTURE finance | LECTURE minimisée | Ses véhicules |
| Demandes et rendez-vous | ORG | ORG | CENTRE | CENTRE | CENTRE | Planning minimal | CENTRE, commerce utile | LECTURE | LECTURE minimisée | Ses demandes |
| Transfert inter-centres | ORG | ORG | LIMITÉ, demande/acceptation | LIMITÉ | LIMITÉ | NON | LIMITÉ commerce | NON | NON | NON |
| Diagnostic et réception | ORG | ORG | CENTRE | CENTRE | CENTRE, saisie réception | ASSIGNÉ | NON | NON | LECTURE minimisée | LECTURE workflow |
| Affectation et progression atelier | ORG | ORG | CENTRE | CENTRE | CENTRE, coordination | ASSIGNÉ | NON | NON | LECTURE minimisée | LECTURE workflow |
| Finaliser ou rouvrir une intervention | ORG | ORG | CENTRE | CENTRE | NON | NON | NON | NON | NON | NON |
| Créer et versionner un devis | ORG | ORG | CENTRE | CENTRE, proposition technique | CENTRE | NON | CENTRE, commerce | LECTURE | LECTURE minimisée | NON |
| Modifier prix et remises | ORG | LIMITÉ par capacité | LIMITÉ par seuil | NON | LIMITÉ par seuil | NON | LIMITÉ par prix plancher | NON | NON | NON |
| Accepter ou refuser un devis | NON au nom du client sauf mandat tracé | NON | NON | NON | NON | NON | NON | NON | NON | Ses devis |
| Consulter paiements et impayés | ORG | Agrégats seulement | CENTRE, montants client | CENTRE, montants utiles | CENTRE | NON | CENTRE, vente utile | ORG ou CENTRE accordé | LECTURE minimisée | Ses paiements |
| Créer paiement/acompte | ORG | NON sans capacité | LIMITÉ | NON | CENTRE | NON | LIMITÉ réservation/vente | ORG ou CENTRE accordé | NON | NON |
| Avoir et remboursement | ORG | NON sans capacité | NON | NON | NON | NON | NON | ORG ou CENTRE accordé | NON | NON |
| Coûts bruts et marges détaillées | ORG | NON par défaut | NON par défaut | NON | NON | NON | NON | ORG ou CENTRE accordé | NON | NON |
| Prix cible/plancher et marge disponible | ORG | Agrégats | CENTRE si accordé | NON | NON | NON | CENTRE | LECTURE finance | NON | NON |
| Stock, prospects, essais et vente | ORG | ORG | CENTRE | Préparation seulement | CENTRE, relation client | Préparation assignée | CENTRE | LECTURE finance | LECTURE minimisée | Ses interactions |
| Documents métier | ORG | ORG | CENTRE | CENTRE | CENTRE | ASSIGNÉ, technique | CENTRE, commerce | CENTRE, finance | LECTURE minimisée | Ses documents |
| Messagerie | ORG | ORG | CENTRE | CENTRE | CENTRE | ASSIGNÉ ou centre selon capacité | CENTRE, dossiers gérés | LECTURE si nécessaire | LECTURE minimisée | Ses conversations |
| Exports opérationnels | ORG | ORG sans finance détaillée | CENTRE | LIMITÉ atelier | LIMITÉ CRM | NON | LIMITÉ commerce | Finance | NON | Export de ses données |
| Exports financiers | ORG | Agrégats seulement | NON par défaut | NON | NON | NON | LIMITÉ vente | ORG ou CENTRE accordé | NON | NON |
| Journal d'audit métier | ORG, lecture | ORG, lecture | CENTRE, lecture | CENTRE, lecture | NON par défaut | NON | NON | LIMITÉ finance | NON | NON |
| Archivage métier | ORG | ORG, objets inférieurs | CENTRE | LIMITÉ atelier | LIMITÉ CRM | NON | LIMITÉ commerce | LIMITÉ finance | NON | NON |

## Hiérarchie stricte

1. `organization_owner` peut gérer les membres de son organisation et promouvoir
   un rôle inférieur vers `network_admin`.
2. `network_admin` ne peut créer, modifier ou désactiver qu'un rôle strictement
   inférieur.
3. Aucun workflow générique ne peut attribuer `organization_owner`, transférer
   la propriété, retirer ou désactiver le dernier owner.
4. `center_manager` ne gère pas les membres dans la première V1.
5. Aucun membre ne peut modifier son propre rôle, statut, garage, centre ou
   périmètre.
6. Aucun rôle tenant ne peut attribuer un rôle plateforme.
7. Toute ambiguïté de rôle, de tenant ou de centre est refusée.

Le transfert de propriété et toute future délégation de gestion d'équipe au
`center_manager` exigent un workflow et une décision produit séparés.

## Accès aux données financières

- `organization_owner` accède aux montants, coûts et marges de son organisation.
- `network_admin` accède aux agrégats financiers ; le détail exige une capacité
  explicite accordée par l'owner.
- `center_manager` ne voit par défaut que les montants opérationnels de son centre.
- `receptionist` voit les prix client, acomptes, paiements, soldes et impayés
  nécessaires à la relation client ; il ne voit ni coûts bruts ni marges.
- `workshop_manager` voit les montants nécessaires à l'arbitrage technique, sans
  pouvoir modifier librement prix ou remises.
- `technician` ne voit ni paiements, ni coûts, ni marges.
- `sales` voit le prix cible, le prix plancher autorisé et la marge de négociation
  disponible ; les coûts bruts restent masqués.
- `accounting` voit et opère le ledger et les exports autorisés ; il ne modifie
  pas les diagnostics ou travaux.
- `viewer` reçoit une vue explicitement minimisée.
- `client` voit uniquement ses propres montants et documents.

Un paiement confirmé est immuable. Une correction utilise un avoir, un
remboursement ou une écriture compensatoire liée.

## Accès aux données clients

- les coordonnées complètes sont limitées aux rôles qui assurent la relation
  client ou la gestion du dossier ;
- le planning minimal du technicien exclut coordonnées, documents, montants,
  marges et détails non nécessaires ;
- les consentements ne sont modifiables que par le client ou un rôle habilité
  avec motif et audit ;
- les exports de coordonnées sont des capacités séparées ;
- un client ne peut lire ou modifier que ses propres données.

## Gestion des équipes

Seuls `organization_owner` et `network_admin` utilisent les RPC de gestion des
appartenances. Le serveur :

- dérive l'acteur et son organisation avec `auth.uid()` ;
- verrouille l'acteur, la cible et les lignes critiques ;
- vérifie la hiérarchie et le centre cible ;
- refuse l'auto-modification et les cibles cross-tenant ;
- protège le dernier owner ;
- journalise invitation, changement de rôle, affectation et désactivation.

Les identifiants fournis par le client ne constituent jamais une preuve
d'autorisation.

## Cas sans centre ou périmètre

Un membre actif sans `organization_role` explicite et sans couple
`center_id`/`center_role` cohérent possède **zéro accès opérationnel**.

Une appartenance inactive, ambiguë, multiple ou liée à un centre étranger est
également fail-closed. La compatibilité legacy ne peut jamais restaurer un accès
organisation-wide implicite.

## Support RODANBTECH

`platform_support` accède uniquement aux métadonnées techniques nécessaires au
diagnostic. Il ne connaît aucun mot de passe et ne dispose d'aucun accès
cross-tenant permanent aux données métier.

Un éventuel break-glass est hors parcours ordinaire et doit comporter :

- mandat temporaire ;
- tenant et finalité ciblés ;
- consentement ou base d'autorisation documentée ;
- expiration automatique ;
- justification ;
- journal append-only ;
- révocation et revue a posteriori.

`service_role` n'est jamais exposé au frontend ou à un rôle applicatif.

## Opérations toujours interdites

- auto-promotion ou auto-affectation ;
- modification d'un rôle égal ou supérieur par `network_admin` ;
- attribution d'un rôle plateforme depuis un workflow tenant ;
- suppression directe d'un paiement confirmé ;
- suppression définitive ordinaire d'un dossier historique ;
- modification ou suppression applicative d'un événement d'audit ;
- modification ou suppression applicative d'un message envoyé ;
- transfert silencieux d'un dossier vers un autre centre ;
- action cross-tenant ou hors centre ;
- utilisation de `organization_id`, `garage_id`, `center_id`, `actor_id` ou
  `user_id` fournis par le navigateur comme preuve d'autorité.

## Règle fail-closed

Une capacité est refusée lorsque le rôle, le statut, le centre, le tenant, la
cible, la transition ou le contexte financier n'est pas démontré côté serveur.
L'absence de policy, de capacité ou de test négatif signifie **NON**, jamais
permission implicite.

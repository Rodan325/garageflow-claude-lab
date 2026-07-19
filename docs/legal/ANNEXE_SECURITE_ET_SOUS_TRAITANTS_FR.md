# Annexe sécurité et registre des sous-traitants — Clikarage

Version : `[À FIXER]`

## 1. Gouvernance de la sécurité

RODANBTECH applique une approche fondée sur les risques. Les accès administratifs sont limités aux personnes autorisées. Les changements de production suivent un processus de revue, test, sauvegarde et retour arrière adapté à leur criticité.

Les incidents sont qualifiés, documentés et traités selon leur impact. Les secrets ne doivent jamais être stockés dans le code source ou exposés au frontend.

## 2. Contrôles d’accès

- comptes individuels ;
- rôles et permissions par organisation et centre ;
- séparation des interfaces garage, client et administration ;
- RLS sur les tables applicatives ;
- contrôles serveur pour les opérations sensibles ;
- révocation des comptes et sessions devenus inutiles ;
- limitation des accès support au strict nécessaire.

La protection contre les mots de passe compromis doit être activée dès que le plan technique le permet et avant un déploiement large.

## 3. Isolation des clients

Les données sont isolées par identifiants d’organisation, garage, centre, dossier et utilisateur. Les politiques RLS et contraintes relationnelles empêchent les accès cross-tenant.

Des tests automatisés et hébergés vérifient les autorisations, refus inter-organisations, chemins Storage et fonctions RPC.

## 4. Chiffrement et transport

Les communications utilisent TLS. Les fournisseurs d’infrastructure assurent le chiffrement au repos selon leurs services et contrats applicables.

Les sauvegardes manuelles contenant des données de production sont chiffrées, contrôlées par checksum et stockées séparément des clés de récupération.

## 5. Pièces jointes

- bucket privé pour les pièces jointes métier ;
- chemins canoniques contrôlés ;
- restrictions de rôle, organisation et dossier ;
- types et tailles de fichiers limités ;
- liens signés temporaires ;
- suppression par l’API Storage officielle ;
- aucun lien signé complet volontairement journalisé par l’application.

Les logos de marque peuvent être stockés dans un bucket public distinct, avec types et taille limités.

## 6. Journalisation

Les événements utiles à la sécurité, aux accès et aux opérations sensibles peuvent être journalisés. Les journaux ne doivent pas contenir de mot de passe, refresh token, clé privilégiée ou secret applicatif.

Les URLs signées peuvent apparaître dans les journaux techniques du fournisseur ; leur durée de validité doit rester courte et leur accès limité.

Durée cible des journaux de sécurité : 6 à 12 mois selon le risque, avec une cible par défaut de 12 mois.

## 7. Développement et changements

- revue de code ;
- tests TypeScript, lint, tests unitaires et tests d’intégration ;
- analyse de secrets ;
- migrations versionnées ;
- validation staging avant production ;
- feature flags pour l’activation progressive ;
- sauvegarde restaurable avant migration sensible ;
- retour arrière logique ou restauration isolée selon l’incident.

## 8. Continuité et sauvegardes

Le cycle exact de sauvegarde doit être défini dans le bon de commande ou le SLA. Avant tout engagement enterprise, RODANBTECH doit documenter :

- fréquence de sauvegarde ;
- durée de conservation ;
- RPO et RTO ;
- chiffrement ;
- emplacement des clés ;
- test périodique de restauration ;
- traitement séparé des objets Storage.

Les engagements ne doivent pas dépasser les garanties réellement disponibles auprès des fournisseurs.

## 9. Gestion des vulnérabilités

Les dépendances, alertes de sécurité et fournisseurs sont surveillés. Les vulnérabilités sont priorisées selon leur exploitabilité et leur impact.

Les délais de correction indicatifs sont :

- critique : mesure compensatoire immédiate et correction prioritaire ;
- élevée : correction planifiée rapidement ;
- moyenne ou faible : cycle normal de maintenance.

Ces délais ne constituent un SLA ferme que s’ils sont repris dans un contrat signé.

## 10. Suppression et fin de contrat

Les exports sont fournis selon le périmètre contractuel. Les données actives sont supprimées ou anonymisées après la période de réversibilité. Les sauvegardes expirent selon leur cycle documenté.

## 11. Registre initial des sous-traitants

| Prestataire | Service | Données possibles | Localisation principale | Transfert / garantie à confirmer | Statut avant signature |
|---|---|---|---|---|---|
| Supabase | Base, Auth, Storage, fonctions backend | Comptes, dossiers, véhicules, documents, logs | Production principale eu-west-3 Paris | Entité contractante, DPA, liste des sous-traitants et mécanisme de transfert | À confirmer contractuellement |
| Vercel Inc. | Hébergement interface web, CDN, logs | IP, navigateur, requêtes, ressources frontend, journaux techniques | Infrastructure distribuée | DPA, cadre de transfert et sous-traitants Vercel | À confirmer contractuellement |
| Squarespace Ireland Limited | Domaine et administration associée | Données de compte et DNS ; données métier non attendues | Irlande / services associés | DPA si traitement de données personnelles du service | À confirmer selon le compte |
| Google Workspace ou fournisseur réellement utilisé | Messagerie professionnelle | Coordonnées, échanges support et commerciaux | Selon contrat du compte | Entité, DPA et transferts | À identifier précisément |
| Fournisseur SMS futur | Notifications SMS | Numéro, message, statut de livraison | Non connecté | Contrat, DPA et pays | Non activé |
| Fournisseur paiement futur | Paiement de l’abonnement ou de services | Données de facturation ; aucune carte stockée par Clikarage | Non connecté | Contrat et conformité applicable | Non activé |

## 12. Changement de sous-traitant

RODANBTECH publie ou transmet la liste à jour. Tout ajout important est notifié au moins trente jours avant sa prise d’effet, sauf urgence de sécurité ou continuité.

Le Client dispose de quinze jours pour présenter une objection motivée liée aux données. Les parties recherchent une solution raisonnable avant toute résiliation des prestations affectées.

## 13. Points encore bloquants

- activer et tester la protection contre les mots de passe compromis ;
- fixer le cycle de sauvegarde production ;
- confirmer les entités contractantes et DPA fournisseurs ;
- créer les contacts dédiés confidentialité et sécurité ;
- définir une procédure formelle de réponse aux incidents ;
- établir la fréquence des tests de restauration et audits internes.

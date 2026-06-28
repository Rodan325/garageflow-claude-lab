# GarageFlow — Données personnelles (notes simples, esprit RGPD)

Document de référence en **langage clair** sur les données traitées par GarageFlow et les droits du client. Ce n'est pas un avis juridique : le **pack légal RGPD complet** (politique de confidentialité, CGU, DPA, registre, durées exactes) reste à finaliser avant production commerciale.

---

## Quelles données sont collectées
- **Compte client** : nom, e-mail, téléphone (pour vous identifier et vous contacter).
- **Véhicules** : marque, modèle, année, carburant, kilométrage, immatriculation, notes libres.
- **Demandes de rendez-vous** : prestation souhaitée, créneau, message, véhicule rattaché.
- **Devis** : lignes, montants, statut (envoyé / accepté / refusé), date d'acceptation.
- **Consentements de partage** : quel véhicule a été partagé avec quel garage, via quelle demande, à quelle date.

## Pourquoi elles sont collectées
- Permettre au client de **réserver** et de **suivre** ses demandes.
- Permettre au garage de **traiter la demande**, **préparer le rendez-vous**, **établir un devis** et **assurer le suivi**.
- Éviter au client de **ressaisir son véhicule** à chaque demande.

## Qui peut les voir
- **Le client** : toutes ses données (ses véhicules, ses demandes, ses devis).
- **Un garage** : uniquement les données **liées à ses propres demandes** — le client, le véhicule et le devis **de cette demande**. Un garage ne voit **jamais** l'ensemble des véhicules d'un client, ni les données d'un autre garage.
- **Le partage d'un véhicule** avec un garage est **explicite** (au moment d'envoyer la demande), **horodaté** et **révocable**.
- Aucune donnée n'est **revendue** ni cédée à des tiers à des fins commerciales.

## Combien de temps elles sont conservées
- Tant que le **compte client est actif** et nécessaire au service.
- À la **fin d'un pilote** ou sur demande, les données peuvent être **exportées** puis **supprimées**.
- Les **durées de conservation précises** (par catégorie) seront fixées dans la politique de confidentialité finale.

## Droits du client
- **Accès / export** : le client peut demander une copie de ses données.
- **Rectification** : il modifie ses véhicules et son profil directement dans l'application.
- **Suppression** : il peut supprimer un véhicule, ou demander la suppression de son compte et de ses données.
- **Retrait du partage** : un partage de véhicule avec un garage peut être **révoqué** (structure prévue : `client_vehicle_shares.revoked_at`).
- Pour exercer ces droits pendant le pilote : contacter l'éditeur (un parcours en libre-service est prévu).

## Documents véhicule (carte grise, assurance, contrôle technique…)
- Les documents véhicule **ne sont pas visibles sans consentement**.
- En V1, **aucun document n'est stocké** : la fonctionnalité est seulement **conçue** (voir `VEHICLE_DOCUMENTS_ROADMAP.md`).
- En V2, ils seront en **bucket privé**, accès **propriétaire uniquement**, **partage explicite document par document**, **révocable**, **sans URL publique permanente**.

## Principes appliqués
- **Minimisation** : on ne demande que ce qui est utile au traitement de la demande.
- **Cloisonnement** : chaque garage ne voit que ses données (RLS par garage — voir `SECURITY_AND_RLS.md`).
- **Consentement explicite** : le partage d'un véhicule est un acte volontaire, tracé et réversible.
- **Pas de secret côté navigateur** : aucune clé `service_role` n'est exposée au frontend.

---

## Textes d'interface (microcopy)

### Réservation (sous le choix du véhicule)
> « Les informations de votre véhicule sont utilisées pour permettre au garage de traiter votre demande, préparer le rendez-vous et établir un devis. »

### Partage du véhicule (avant l'envoi de la demande)
> « En partageant ce véhicule avec ce garage, vous l'autorisez à consulter les informations nécessaires au traitement de votre demande. »

*(Variante longue utilisée à l'envoi : « En envoyant cette demande, vous autorisez ce garage à consulter les informations de ce véhicule uniquement pour traiter votre demande, préparer un rendez-vous, établir un devis et assurer le suivi de l'intervention. »)*

### Documents (espace Mes véhicules — V2)
> « Les documents ajoutés restent privés. Vous choisissez quels documents partager avec un garage et pouvez retirer cet accès. »

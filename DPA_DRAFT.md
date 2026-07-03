# GarageFlow — Accord de sous-traitance RGPD (référence interne)

> **Note interne** : Relecture juridique recommandée avant commercialisation large, contrat payant important, traitement à grande échelle ou ajout de documents sensibles. La version publique fait foi : page **/dpa** (source : `src/features/legal/DpaPage.tsx`, valeurs dans `src/config/legal.ts`).

Version du document : 2026-07-02 · Dernière mise à jour : 2026-07-02

**Renforcements 2026-07-02 (rapprochement article 28 RGPD)** : instructions documentées avec droit de refuser une instruction illicite/dangereuse ; section dédiée « données sensibles interdites » (obligation d'informer les équipes) ; sous-traitants listés incluant un futur fournisseur email, avec information raisonnable du garage en cas de changement ; clause d'audit raisonnable (informations sur demande, pas d'audit sur site promis) ; sort des données détaillé (suppression, export, anonymisation, sauvegardes temporaires) ; non-réutilisation sauf sécurité/support/légal/statistiques anonymisées/accord écrit.

## 1. Objet
Encadre le traitement de données personnelles réalisé par RODANBTECH dans le cadre de la fourniture de GarageFlow à un garage participant au pilote.

## 2. Qualification des parties
- Le **garage participant** est responsable de traitement pour les données de ses propres clients (demandes, véhicules, devis).
- **RODANBTECH** intervient comme sous-traitant technique (fourniture, maintenance, sécurisation de GarageFlow), et peut être responsable de traitement pour ses propres comptes, la sécurité, la prospection éventuelle et la relation contractuelle avec le garage.

## 3. Durée
Durée du pilote, puis durée nécessaire à l'export, la suppression, la sécurité ou la conservation technique limitée.

## 4. Nature et finalités
Création/gestion de comptes ; transmission de demandes de rendez-vous ; gestion de véhicules ; création/envoi de devis ; acceptation/refus de devis ; support ; maintenance ; sécurité ; prévention des abus.

## 5. Catégories de données
- **Client** : identité, coordonnées, informations de véhicule, demandes, messages, devis, statuts d'acceptation/refus.
- **Garage** : identité, coordonnées, comptes utilisateurs, paramètres, prestations, demandes et devis.
- **Techniques** : logs limités, identifiants techniques, informations de session gérées par Supabase Auth.

## 6. Personnes concernées
Clients des garages ; utilisateurs garage ; utilisateurs client ; utilisateurs de test du pilote.

## 7. Instructions du responsable de traitement
Traitement uniquement pour fournir GarageFlow, selon les instructions documentées du garage, les conditions du pilote, les CGU, la politique de confidentialité et les besoins de sécurité du service.

## 8. Confidentialité
Pas de revente des données ; accès limité aux personnes/prestataires en ayant besoin pour fournir, maintenir ou sécuriser GarageFlow.

## 9. Sécurité (mesures en place)
Séparation des accès client/garage ; cloisonnement par garage ; Row Level Security Supabase ; tests d'isolation RLS (60/60) ; absence de clé service_role côté frontend ; limitation du périmètre pilote ; absence d'upload de documents sensibles ; politique de mot de passe renforcée ; vérification anti-fuite de secrets (`npm run security:scan`) ; HTTPS en déploiement.

## 10. Sous-traitants ultérieurs
- **Vercel Inc.** — hébergement frontend.
- **Supabase, Inc.** — base de données, authentification, infrastructure technique.
Changement/ajout de prestataire possible si nécessaire au fonctionnement, à la sécurité ou à l'évolution du service, sous réserve d'un niveau de protection adapté.

## 11. Transferts hors Union européenne
Certains prestataires peuvent être établis hors UE. Avant commercialisation large : vérifier la région d'hébergement Supabase, les garanties contractuelles des prestataires, les clauses contractuelles types éventuelles, les mesures complémentaires nécessaires.

## 12. Assistance au garage
Aide raisonnable pour : demandes d'accès, correction/suppression, export des données du pilote, demandes relatives aux droits des personnes.

## 13. Violation de données
Information du garage dans les meilleurs délais raisonnables après prise de connaissance d'un incident susceptible d'affecter des données personnelles, afin qu'il évalue ses obligations.

## 14. Fin de prestation
Suppression des données, export, prolongation du pilote ou migration vers une offre commerciale, au choix du garage.

## 15. Audit et preuve
Documentation raisonnable conservée : mesures de sécurité, tests RLS, politiques d'accès, limites du pilote (voir `SECURITY_AND_RLS.md`, `PILOT_SECURITY_GATE.md`).

## 16. Non-réutilisation
Pas de réutilisation des données des clients du garage pour le compte propre de RODANBTECH, sauf nécessité technique, sécurité, support, obligation légale ou accord écrit du garage.

## 17. Contact
anas.rodriguez@rodanbtech.com

## Points de vigilance internes
- Avant traitement à grande échelle : DPA signé par les deux parties (ce document sert de base), registre des traitements, et vérification des DPA aval (Supabase, Vercel).
- Vérifier la région UE du projet Supabase de production et documenter les transferts.

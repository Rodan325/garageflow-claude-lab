# GarageFlow — Politique de confidentialité (référence interne)

> **Note interne** : Relecture juridique recommandée avant commercialisation large, contrat payant important, traitement à grande échelle ou ajout de documents sensibles. La version publique fait foi : page **/privacy** (source : `src/features/legal/PrivacyPage.tsx`, valeurs dans `src/config/legal.ts`).

Version du document : 2026-07-02 · Dernière mise à jour : 2026-07-02

## Résumé rapide
- **Données collectées** : identité, coordonnées, compte, véhicule, demandes, messages, devis et statuts, logs techniques limités.
- **Pourquoi** : demandes de rendez-vous, devis et acceptation, support, sécurité.
- **Qui y accède** : l'utilisateur, le garage concerné par la demande uniquement, RODANBTECH (exploitation technique), prestataires strictement nécessaires (Supabase, Vercel).
- **Combien de temps** : durée du compte/pilote, puis export ou suppression sur demande (sauvegardes techniques temporaires).
- **Droits** : accès, rectification, suppression, limitation, opposition, portabilité, retrait du consentement.
- **Contact** : anas.rodriguez@rodanbtech.com · réclamation possible auprès de la CNIL.

## Tableau des données (public, page /privacy)
| Données | Caractère | Base légale | Destinataires | Durée indicative |
|---|---|---|---|---|
| Identité & coordonnées | Obligatoire (compte/demande) | Exécution du service | Garage concerné, RODANBTECH | Durée du compte/pilote |
| Compte (authentification) | Obligatoire | Exécution du service | RODANBTECH (Supabase Auth) | Durée du compte |
| Véhicule | Détails facultatifs | Consentement (partage) | Garage destinataire uniquement | Durée du compte/pilote |
| Demandes & messages | Obligatoire pour le service | Exécution du service | Garage concerné, RODANBTECH | Durée du pilote |
| Devis & statuts | Obligatoire pour le service | Exécution / précontractuel | Garage émetteur, client destinataire | Durée du pilote |
| Acceptations légales (doc, version, date) | Obligatoire (preuve) | Intérêt légitime / preuve | RODANBTECH | Durée du compte + preuve |
| Logs techniques | Automatique | Intérêt légitime (sécurité) | RODANBTECH | Durée limitée |

## Points clés (miroir de la page publique)
- Rôles : le **garage** est responsable de traitement pour ses clients ; **RODANBTECH** est prestataire technique/sous-traitant, et responsable distinct pour la sécurité/le support/l'amélioration du pilote.
- **Données interdites** pendant le pilote : carte grise, assurance, contrôle technique, factures, pièce d'identité, RIB/carte bancaire, données de santé, documents juridiques sensibles.
- **Pas de cookies publicitaires ni traceurs marketing** ; mécanismes techniques de session uniquement.
- **Acceptation enregistrée** : les acceptations des documents légaux sont horodatées avec la version du document (table `legal_acceptances`, lecture strictement personnelle).
- **Transferts hors UE** : prestataires possiblement hors UE (Vercel, Supabase) ; région UE Supabase à vérifier/documenter avant production large.
- **Sécurité** : RLS, cloisonnement par garage, tests d'isolation (68/68), pas de service_role frontend, HTTPS, politique de mot de passe renforcée, scan anti-secrets.

## Points de vigilance internes
- Établir la politique de conservation détaillée par catégorie avant commercialisation large.
- Mettre à jour la page et la version (`legalVersions.privacy`) à tout changement substantiel — la gate redemandera l'acceptation.

# Matrice de couverture des tests - juillet 2026

Commit audité : `a530678d78eb6492af800e2f8373ca4f7c6e0b2f`.

## Résultats exécutés pendant l'audit

| Commande | Résultat |
|---|---|
| `npm.cmd run typecheck` | Succès |
| `npm.cmd run lint` | Succès avec 2 avertissements Fast Refresh |
| `npm.cmd run test` | Échec : 69 fichiers réussis, 1 échoué; 431 tests réussis sur 432 |
| `npm.cmd run build` | Succès; avertissements chunks > 500 kB |
| `npm.cmd run security:scan` | Succès; aucun secret évident; 12 occurrences textuelles à examiner |
| `npm.cmd run test:rls` | Non exécuté : l'audit interdit toute modification de Supabase local, staging ou Production |

L'unique échec Vitest est reproductible sur le checkout Windows. Le hash attendu de
`20260719111617_add_legal_acceptance_versioning_contracts.sql` correspond au fichier
normalisé LF (`44524f...341bc`), tandis que le fichier CRLF lu par le test produit
`82ffe4...c666`. Le blob SQL n'est pas démontré comme modifié; le test est non portable.

## Matrice

| Fonctionnalité | Test unitaire | Test d'intégration | Test RLS | Test E2E | Test mobile | Résultat |
|---|---|---|---|---|---|---|
| Flags fail-closed | `features.test.ts`, `env.test.ts` | Non | N/A | Non | N/A | Bonne couverture des valeurs exactes |
| i18n globale FR/EN/AR | `i18n.test.tsx`, catalog tests | Shells/pages mockés | N/A | Non | RTL DOM, pas viewport | Bonne couverture logique, pas de parcours navigateur |
| Branding Clikarage/Speedy | `branding.test.ts`, `Logo.test.tsx` | Store local mock | N/A | Non | Classes seulement | Démo bien isolée |
| Auth login | Schémas/erreurs | `LoginPage.localization.test.tsx` avec provider mocké | Scripts RLS Auth indirects | Non | RTL DOM | Pas de vrai endpoint dans la suite Vitest |
| Signup client | `signupSchema.test.ts` | `SignupPage.routing.test.tsx` mocké | Trigger profil couvert par RLS externe | Non | Non | Client seulement; pas de signup garage |
| Vérification email | `VerifyEmailPage.test.tsx` mocké | Non hébergé | N/A | Non | Non | UI couverte, livraison mail non couverte |
| Récupération mot de passe | Non | Non | Non | Non | Non | Fonction absente |
| Guards staff/client | `guards.test.tsx` | Provider mocké | N/A | Non | Non | Ne teste pas l'absence de membership actif |
| Création/édition organisation | Non | Non | Policies générales | Non | Non | Couverture absente |
| Équipe/invitations/rôles | Non | Non | RLS général | Non | Non | Aucun test page; invitation absente |
| Clients CRM | Normalisation générique | Non | RLS général | Non | Non | CRUD réel sans test comportemental |
| Véhicules garage | Catalogue véhicule | Non | RLS général | Non | Non | Création réelle non testée |
| Véhicules client | Catalogue/types | Non | RLS général | Non | Non | CRUD page non testé |
| Liaison véhicule garage/client | Modèles partiels | Non | Partages RLS | Non | Non | Aucune cohérence end-to-end |
| Demande de rendez-vous client | `centerSelection.test.ts` | Non | RLS général | Non | Non | Capacité et conflit non testés |
| Inbox réservations garage | Non | Non | RLS général | Non | Non | Page opérationnelle non testée |
| Conversion demande en rendez-vous | Non | Aucun test Edge Function | RLS des writes seulement | Non | Non | Risque transaction/idempotence non couvert |
| Agenda | Non | Non | RLS général | Non | Non | Aucune couverture |
| Messagerie garage/client | Non | Non | Le script ne forge pas `request_id` + `garage_id` croisés | Non | Non | Faille racine non testée |
| Workflow atelier avancé | `lifecycle.test.ts` | Démo/RLS script | `rls-antileak.mjs` | Non | Non | State machine bien testée, page non testée |
| Workflow atelier legacy | Non | Non | CRUD membre | Non | Non | Transitions directes non couvertes |
| Recommandations | `model.test.ts` | Démo/RLS script | RLS/RPC script | Non | Non | Backend couvert, parcours UI non |
| Devis calculs/statuts | `quoteTotals`, `quoteStatus` | Contracts SQL | RLS script | Non | Non | Domaine le mieux couvert |
| Éditeur de devis | Logique indirecte | Non | RPC contracts | Non | Non | Pas de test formulaire |
| PDF devis | Non dédié au rendu binaire | Non | N/A | Non | RTL structurel | Absence de test visuel/snapshot PDF |
| Consultation/acceptation publique | Modèles statuts | RPC/RLS script | Oui dans scripts | Non | Non | Pas de test navigateur token |
| Pièces jointes | `model.test.ts`, migration contract | Script Storage réel prévu | `rls-antileak.mjs` | Non | Non | Solide au niveau contrat, UI non testée |
| Notifications | `model.test.ts` | Simulation démo | RLS script | Non | Non | Provider réel explicitement absent |
| Rapport de restitution | `model.test.ts`, `reportPdf.test.tsx` | Démo/RLS script | RLS script | Non | PDF arabe rendu, pas viewport | PDF arabe réellement généré; page non testée |
| Rappels | `model.test.ts` | Démo/RLS script | RLS script | Non | Non | Teardown anti-fuite contractuel, UI non |
| Transferts centre | `model.test.ts`, `demoFlow.test.ts` | Démo/RLS script | RLS script | Non | Non | Sous flag, pas de page réelle E2E |
| Dashboard indépendant | `operations.test.ts` | Non | Données sources RLS | Non | Contrat CSS étroit | Calculs purs couverts, queries/UI non |
| Dashboard réseau | `network/model.test.ts`, `data/network.test.ts` | Démo/RPC script | RLS script | Non | Non | Sous flag |
| Import CSV | 19 tests parse/limites/formules | Adaptateur démo | N/A | Non | Non | Bon parseur, aucun import base |
| Export/réversibilité | Non | Non | Non | Non | Non | Fonction absente |
| Légal V2 | Nombreux tests canon/hash/flags/pages | Providers Supabase mockés | `legal-v2-rls.mjs` | Non | RTL DOM/PDF rapport | Forte couverture, mais suite globale échoue sur CRLF |
| Cycle de vie preuves légales | Contrats migration | Script transactionnel dédié | RLS dédié | Non | N/A | Contrat hash non portable sous Windows |
| RLS multi-tenant générale | Quelques contracts | `rls-antileak.mjs` sur env DB | 102 checks documentés | Non | N/A | Non relancé pendant cet audit; trou sur messages |
| Storage privé | Modèles/contracts | `rls-antileak.mjs` | Upload/cross-tenant/signed URL | Non | Non | Test de script, pas d'E2E client |
| Accessibilité | Quelques aria/RTL | Composants isolés | N/A | Non | Non | Aucun axe, tab order ou focus trap E2E |
| Performance/listes longues | Non | Non | N/A | Non | Non | Pas de charge ni pagination |
| PWA/offline | Non | Build generateSW | N/A | Non | Non | Service worker construit, comportement non testé |
| Commerce véhicules d'occasion | Non | Non | Non | Non | Non | Domaine absent |
| Paiements manuels | Non | Non | Non | Non | Non | Domaine absent |

## Tests reposant principalement sur des mocks ou des contrats statiques

- `LoginPage.localization.test.tsx`, `SignupPage.routing.test.tsx`, `VerifyEmailPage.test.tsx`,
  `guards.test.tsx` et les tests du gate juridique remplacent Auth/Supabase par des mocks.
- Les fichiers `migration.test.ts` et plusieurs tests `*.contract.test.*` vérifient des
  chaînes SQL ou des propriétés de fichiers. Ils détectent les régressions de contrat,
  mais ne prouvent pas que PostgreSQL exécute le SQL.
- Les tests `demoFlow.test.ts` et une grande partie de `demo.test.ts` valident le store
  `localStorage`, pas le schéma Supabase utilisé par un garage réel.
- `productization.contract.test.ts` inspecte du texte et des classes; il ne remplace pas
  une vérification visuelle ou un parcours navigateur.

## Tests à ajouter en priorité

| Priorité | Test manquant | Défaut qu'il doit détecter |
|---|---|---|
| P0 | RLS message avec `request_id` de A et `garage_id` de B | Fuite/injection tenant |
| P0 | Matrice Data API par rôle sur chaque table core | CRUD trop large pour mechanic/viewer/front desk |
| P0 | Conversion demande rendez-vous sous concurrence et erreur injectée | Duplications et writes partiels |
| P0 | Audit log avec acteur/garage forgés | Journal non fiable |
| P1 | E2E onboarding dirigeant puis salarié | Absence d'invitation/activation |
| P1 | E2E client, véhicule, demande, réception, devis, OR, paiement, restitution | Parcours atelier incomplet |
| P1 | Conflit de deux réservations simultanées | Double booking |
| P1 | Archivage client/véhicule sans perte historique | Cascades destructives |
| P1 | Import réel avec rollback et retry | Import partiel/doublons |
| P1 | Export organisation et contrôle cross-tenant | Réversibilité/fuite |
| P2 | E2E desktop/mobile FR/EN/AR | Régressions responsive/i18n |
| P2 | Accessibilité axe + clavier | Labels/focus/contraste |
| P2 | 10 000 clients/véhicules avec pagination | Dégradation des listes |
| P2 | Test PDF devis visuel FR/EN/AR | Débordements et RTL |
| P2 | Normalisation LF avant hash migration | Échec Windows actuel |

## Conclusion de couverture

La suite est large en nombre, mais asymétrique. Les contrats SQL, le juridique, la
démonstration, les modèles purs et les scripts RLS avancés sont bien représentés.
Les pages opérationnelles, les Edge Functions, l'onboarding, l'agenda, le CRM,
les paiements et les parcours navigateur n'ont pas une couverture proportionnée à
leur criticité.

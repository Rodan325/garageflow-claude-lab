# Decisions requises avant activation juridique

Cette liste est un registre de decisions, pas un avis juridique. Le merge technique avec tous les flags desactives n'emporte ni publication, ni entree en vigueur, ni acceptation.

> Document à faire valider par un conseil juridique avant la première contractualisation commerciale importante.

## P0

Aucun P0 technique n'empeche le merge avec les flags OFF. Toute activation avant les decisions P1 ci-dessous serait en revanche bloquante.

## P1 avant publication ou contractualisation

| Decision | Proprietaire attendu | Preuve requise |
|---|---|---|
| Valider le texte francais des CGS, conditions Espace Client, confidentialite et DPA | Conseil juridique + RODANBTECH | version approuvee et hash |
| Fixer les dates de publication et d'effet | RODANBTECH apres avis juridique | decision datee, sans retroactivite |
| Confirmer prix, unite de facturation, renouvellement, preavis, responsabilite et ordre contractuel | Direction commerciale + conseil | Bon de commande et CGS coherents |
| Confirmer les bases legales et durees de conservation par finalite | Responsable de traitement + conseil | registre et matrice valides |
| Confirmer les entites contractantes Supabase, Vercel, Squarespace et Google Workspace | RODANBTECH | contrat, facture ou console du compte |
| Confirmer regions, transferts, DPA et mecanisme de notification des sous-traitants | RODANBTECH + conseil | registre fournisseur date |
| Definir le parcours des demandes de droits et des incidents | Direction + support | procedure testee et responsables nommes |
| Ajouter les notices courtes aux points de collecte reels | Produit + conseil | revue ecran par ecran |
| Decider si le user-agent est necessaire comme preuve et definir sa retention | Conseil + securite | analyse de minimisation |
| Valider qui peut engager l'organisation pour les CGS et le DPA | Direction + conseil | mapping de roles approuve |
| Valider les traductions EN et AR contre la version francaise approuvee | Traducteur juridique + conseil | revue de parite signee |

## P1 avant activation technique

- Executer les deux migrations additives sur une base locale puis staging explicitement non productifs.
- Verifier les huit acceptations historiques avant et apres migration, sans backfill.
- Tester l'acceptation utilisateur, l'acceptation organisation et le refus d'un membre non habilite sur une base migree.
- Passer les versions approuvees de `staged` a `effective` uniquement par une migration revue, avec date d'effet et hashes exacts.
- Activer `VITE_LEGAL_DOCS_V2_ENABLED` avant `VITE_LEGAL_ACCEPTANCE_V2_ENABLED`, puis observer les erreurs.
- Garder `VITE_DPA_SELF_SERVICE_ENABLED` faux tant que le pouvoir de representation et le parcours contractuel ne sont pas valides.

## P2 recommande avant deploiement large

- Definir un formulaire et un journal de traitement des demandes RGPD.
- Automatiser l'inventaire des domaines tiers et le comparer en CI.
- Formaliser la notification des changements de sous-traitants.
- Faire une revue accessibilite et langage clair des trois langues.
- Definir les formats et delais d'export en fin de contrat.
- Mettre en place l'application des durees de conservation une fois celles-ci validees.

## P3 futur

- Integrer un fournisseur transactionnel seulement apres DPA, secret serveur, journalisation et procedure d'incident.
- Publier une politique IA uniquement si une fonctionnalite IA externe est reellement active.
- Ajouter une gestion de consentement distincte si des traceurs non necessaires sont introduits.

## Decision de merge

Recommandation technique : merge acceptable avec les neuf flags juridiques et fournisseurs a `false`. Publication commerciale, acceptation V2 et DPA self-service : non autorises a ce stade.

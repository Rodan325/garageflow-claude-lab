# Checklist de release juridique Clikarage

Cette checklist doit etre executee pour une future release approuvee. Elle n'autorise aucune action distante par elle-meme.

## 1. Gate de merge avec flags OFF

- [ ] Revue juridique francaise en cours ou planifiee ; aucune mention de validation par un avocat.
- [ ] Corpus V2 `staged`/`draft`, `effectiveAt = null`.
- [ ] Les neuf flags de `.env.example` sont `false`.
- [ ] `/pilot-agreement` est figee, hors navigation principale et `noindex`.
- [ ] Les huit acceptations historiques ne sont ni modifiees ni completees.
- [ ] Les hashes du registre, du contenu et de la migration sont identiques.
- [ ] `npm.cmd run typecheck`, `lint`, `test`, `build` et `security:scan` reussissent.
- [ ] Aucun secret, `service_role`, token ou identite personnelle dans le diff.
- [ ] Aucune migration appliquee et aucun changement Vercel.

## 2. Gate de validation humaine

- [ ] Texte francais approuve par un conseil juridique.
- [ ] Versions EN et AR relues contre le francais de reference.
- [ ] Date de publication et date d'effet explicitement approuvees.
- [ ] Conditions commerciales et Bon de commande alignes.
- [ ] Entites, DPA, regions et transferts des fournisseurs confirmes sur les contrats du compte.
- [ ] Bases legales et durees de conservation validees.
- [ ] Notices au point de collecte validees ecran par ecran.
- [ ] Pouvoir des roles acceptant les CGS/DPA valide.
- [ ] Plan de communication et reacceptation limite aux changements materiels valide.

## 3. Gate base locale et staging

- [ ] Cible formellement non productive avant toute commande Supabase.
- [ ] Reconstruction complete depuis zero.
- [ ] Migration `20260719111617_add_legal_acceptance_versioning_contracts.sql` appliquee.
- [ ] Migration `20260719235753_harden_legal_acceptance_v2.sql` appliquee.
- [ ] Huit acceptations historiques preservees et champs ajoutes laisses `NULL`.
- [ ] Test d'isolation multi-tenant des acceptations.
- [ ] Acceptation DPA refusee pour un role non habilite.
- [ ] Hash, langue, version, statut, application et source controles par la base.
- [ ] Archive de la version acceptee recuperable.
- [ ] Advisors Supabase examines et aucun P0 ouvert.

## 4. Gate visuelle

- [ ] Pages legales FR, EN et AR sur desktop et mobile.
- [ ] Arabe RTL sans chevauchement ; emails, URL et identifiants en LTR.
- [ ] Impression et selection de texte verifiees.
- [ ] PDF arabe verifie contre les captures sous `docs/assets/legal/`.
- [ ] Aucun domaine tiers non inventorie dans le parcours juridique.
- [ ] Aucune police Google distante ; les fontes de l'application sont locales ou systeme.

## 5. Activation progressive future

1. Appliquer les migrations par le pipeline controle apres sauvegarde verifiee.
2. Faire un smoke test avec tous les flags OFF.
3. Publier une migration distincte rendant uniquement les versions approuvees `effective`.
4. Activer `VITE_LEGAL_DOCS_V2_ENABLED` sur staging, puis valider les routes.
5. Activer le registre des sous-traitants uniquement apres verification fournisseur.
6. Activer `VITE_LEGAL_ACCEPTANCE_V2_ENABLED` sur staging et tester les trois roles.
7. Activer en production par etapes avec supervision des erreurs.
8. Laisser DPA self-service, IA, Stripe, stockage documentaire, analytics et email transactionnel OFF tant que leurs prerequis ne sont pas satisfaits.

## 6. Rollback logique

- Desactiver d'abord `VITE_LEGAL_ACCEPTANCE_V2_ENABLED`, puis `VITE_LEGAL_DOCS_V2_ENABLED`.
- Ne pas supprimer les lignes d'acceptation deja creees.
- Ne pas modifier une version effective ; publier une nouvelle version corrective.
- Conserver les tables et colonnes additives ; les flags restaurent le parcours historique.
- En cas de divergence de contenu, bloquer l'acceptation et conserver les preuves pour analyse.

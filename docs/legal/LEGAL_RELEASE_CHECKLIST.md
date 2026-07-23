# Checklist de release juridique Clikarage

Cette checklist doit etre executee pour une future release approuvee. Elle n'autorise aucune action distante par elle-meme.

## 1. Gate de merge avec flags OFF

- [ ] Revue juridique francaise en cours ou planifiee ; aucune mention de validation par un avocat.
- [x] Corpus V2 `staged`/`draft`, `effectiveAt = null`.
- [x] Les neuf flags de `.env.example` sont `false` et leur absence est fail-closed.
- [x] `/pilot-agreement` est figee, hors navigation principale et `noindex`.
- [x] Les huit acceptations historiques ne sont ni modifiees ni completees par les migrations.
- [x] Les hashes du registre, du contenu et de la migration sont identiques.
- [x] Le rendu, le hash et l'acceptation utilisent le meme modele canonique
  couvrant aussi l'identite de l'editeur et la mention TVA.
- [x] Le DPA `public: false` est inaccessible aux anonymes et son acceptation
  exige l'habilitation organisationnelle et la chaine complete de flags.
- [x] Aucun fichier interne ou mixte ne reste sous `docs/legal/`.
- [x] `npm.cmd run typecheck`, `lint`, `test`, `build` et `security:scan` reussissent.
- [x] Aucun secret, `service_role`, token ou identite personnelle dans le diff.
- [x] Aucune migration production et aucun changement Vercel ; la migration de preuve a ete appliquee uniquement en local et sur staging.

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

- [x] Cible formellement non productive avant toute commande Supabase.
- [x] Reconstruction complete depuis zero.
- [x] Migration `20260719111617_add_legal_acceptance_versioning_contracts.sql` appliquee.
- [x] Migration `20260719235753_harden_legal_acceptance_v2.sql` appliquee.
- [x] Migration `20260720151800_preserve_legacy_legal_acceptance_fail_closed.sql` appliquee.
- [x] Migration `20260720230821_preserve_legal_acceptance_evidence_lifecycle.sql` appliquee en local et staging.
- [x] Migration `20260723110428_refresh_legal_canonical_document_hashes.sql`
  appliquee sur Docker local apres reconstruction 38/38.
- [x] Migration `20260723110428_refresh_legal_canonical_document_hashes.sql`
  appliquee seule sur staging ; historique 38/38 et dry-run final vide.
- [x] Snapshot staging avant/apres : zero acceptation et empreinte identique.
  Les huit preuves historiques simulees n'etaient pas presentes sur staging ;
  ne pas presenter ce controle comme une comparaison de huit lignes distantes.
- [x] Huit acceptations historiques preservees et champs ajoutes laisses `NULL` pendant la validation de migration.
- [x] Test d'isolation multi-tenant des acceptations.
- [x] Acceptation DPA refusee pour un role non habilite.
- [x] Hash, langue, version, statut, application et source controles par la base.
- [x] Archive de la version acceptee recuperable.
- [x] Trois executions RLS locales consecutives anterieures reussies a 120/120
  sans reconstruction ; la presente passe confirme 120/120 apres reconstruction.
- [x] Cycle de vie local et staging : la preuve survit a la suppression de l'acteur, de l'organisation et de la version documentaire.
- [x] Zero fixture juridique, organisation, utilisateur, demande, rappel ou document apres le teardown final.
- [x] Advisors Supabase examines et aucun P0 ouvert.

## 4. Gate visuelle

- [ ] Pages legales FR, EN et AR sur desktop et mobile.
- [ ] Arabe RTL sans chevauchement ; emails, URL et identifiants en LTR.
- [ ] Impression et selection de texte verifiees.
- [x] PDF arabe verifie contre les captures sous `docs/assets/legal/` (corpus SHA-256 `24203a8ac5aecedddca306bb8ca520982a905b2061fd0ccf79f00274b9f05b58`).
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

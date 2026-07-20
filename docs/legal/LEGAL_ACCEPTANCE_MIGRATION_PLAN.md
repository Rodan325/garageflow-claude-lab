# Plan de migration des preuves d'acceptation juridique

Statut : plan uniquement. Aucune migration de ce chantier n'a ete appliquee a une base distante.

## Etat historique

- `20260703132019_legal_acceptances.sql` cree le journal historique et ses policies.
- La production possede huit acceptations historiques selon l'audit de reference.
- Ces lignes ne disposent pas de toutes les preuves V2 et ne doivent jamais etre enrichies par supposition.
- Le parcours historique reste actif tant que les flags V2 sont faux.

## Migrations additives preparees

### `20260719111617_add_legal_acceptance_versioning_contracts.sql`

Ajoute des champs nullable pour la langue affichee, l'identifiant stable et l'organisation. Il conserve les anciennes lignes telles quelles et maintient la compatibilite avec les types de documents historiques.

### `20260719235753_harden_legal_acceptance_v2.sql`

- Cree `private.legal_document_versions` et le registre FR/EN/AR adresse par SHA-256.
- Enregistre toutes les versions V2 comme `staged`, sauf la charte IA en `draft`.
- N'ajoute aucune date d'effet.
- Ajoute des champs de preuve nullable aux acceptations.
- Controle par trigger l'identite `auth.uid()`, le hash, la langue, le statut effectif, la version applicative, la source et la portee.
- Derive le role habilite cote base pour une acceptation d'organisation.
- Ajoute une unicite partielle pour les nouvelles preuves utilisateur et organisation.
- Revoque l'acces direct au registre prive et limite la RPC de lecture au role `authenticated` avec verification d'appartenance.

## Invariants

- Aucun `UPDATE` ni `DELETE` des acceptations historiques.
- Aucun backfill de langue, hash, role ou organisation inconnu.
- Une version `staged` ou `draft` est techniquement inacceptable.
- Une version `effective` doit avoir une date d'effet et un hash exact pour la langue affichee.
- Un utilisateur ne peut pas se faire passer pour un autre utilisateur.
- Un membre non habilite ne peut pas engager l'organisation.
- Une preuve utilisateur ne peut pas revendiquer une organisation.

## Ordre de validation non productif

1. Confirmer explicitement une cible locale ou staging non productive.
2. Reconstruire toutes les migrations depuis zero.
3. Comparer les huit lignes historiques avant/apres sur une copie de donnees anonymisee.
4. Tester insertion historique, insertion V2 bloquee en `staged` et absence de mutation.
5. Dans une migration de test separee, rendre une version fictive effective avec son hash exact.
6. Tester acceptation utilisateur, acceptation organisation, idempotence et refus cross-tenant/non habilite.
7. Executer les advisors et inspecter `SECURITY DEFINER`, `search_path`, grants, RLS et index.
8. Refaire une reconstruction complete sans SQL manuel.

## Activation future

Une migration ulterieure, distincte et revue, devra fixer `published_at`, `effective_at` et `status = 'effective'` pour les seules versions approuvees. Elle ne doit etre creee qu'apres validation juridique et choix de la date reelle de deploiement.

Le frontend doit ensuite etre active dans cet ordre : documents V2, registre des sous-traitants, acceptation V2. Le DPA self-service reste un lot separe.

## Rollback logique

- Remettre les flags d'acceptation et de documents a faux.
- Ne pas supprimer le registre ni les nouvelles colonnes.
- Ne pas supprimer les preuves deja recueillies.
- Archiver une version defectueuse et publier une nouvelle version ; ne jamais changer le contenu associe a son hash.

## Validation actuelle

Les tests unitaires verifient statiquement l'absence de backfill, les contraintes, les policies, les grants, les hashes et l'alignement du registre. L'execution SQL et les scenarios RLS doivent encore etre valides sur une base non productive migree avant toute application distante.

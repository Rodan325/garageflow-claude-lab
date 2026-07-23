# Mapping d'integration du corpus juridique Clikarage

Statut au 20 juillet 2026 : corpus V2 integre pour revue et staging, derriere flags desactives. Aucune date d'effet n'est configuree et aucun document V2 ne peut etre accepte en production.

La source de travail initiale et sa revue de preintegration ont ete archivees
hors du depot public, car elles melangeaient corpus publiable, hypotheses
internes et fiche de validation. Le modele canonique versionne sous
`src/features/legal/` est la seule source du rendu et des hashes applicatifs.

## Documents publiables

| Source du pack | Identifiant | Version | Route | Statut | Acceptation | Flag |
|---|---|---|---|---|---|---|
| Mentions legales | `legal` | `legal-2026-01` | `/legal` | `staged` | information | `VITE_LEGAL_DOCS_V2_ENABLED` |
| CGS B2B et CGU Pro | `terms_pro` | `terms-2026-01` | `/terms/pro` | `staged` | organisation | `VITE_LEGAL_DOCS_V2_ENABLED` |
| Conditions Espace Client | `terms_client` | `terms-2026-01` | `/terms/client` | `staged` | utilisateur | `VITE_LEGAL_DOCS_V2_ENABLED` |
| Politique de confidentialite | `privacy` | `privacy-2026-01` | `/privacy` | `staged` | information | `VITE_LEGAL_DOCS_V2_ENABLED` |
| Cookies et traceurs | `cookies` | `cookies-2026-01` | `/cookies` | `staged` | information | `VITE_LEGAL_DOCS_V2_ENABLED` |
| DPA article 28 | `dpa` | `dpa-2026-01` | `/dpa` | `staged` | organisation | `VITE_LEGAL_DOCS_V2_ENABLED` |
| Registre des sous-traitants | `subprocessors` | `subprocessors-2026-01` | `/subprocessors` | `staged` | information | `VITE_SUBPROCESSOR_REGISTRY_ENABLED` |
| Resume securite | `security` | `security-2026-01` | `/security` | `staged` | information | `VITE_LEGAL_DOCS_V2_ENABLED` |
| Disponibilite, support et reversibilite | `service_levels` | `service-levels-2026-01` | `/service-levels` | `staged`, non public | aucune | `VITE_LEGAL_DOCS_V2_ENABLED` |
| Charte IA | `ai_policy` | `ai-policy-2026-01` | `/ai-policy` | `draft`, non public | aucune | `VITE_AI_FEATURES_ENABLED` |

Les contenus FR, EN et AR utilisent les memes identifiants de clauses. Le francais reste la langue juridique de reference. Les pages EN et AR indiquent que la version francaise prevaut en cas de divergence, sous reserve des regles imperatives applicables.

## Comportement avec les flags OFF

- `/legal`, `/privacy`, `/terms` et `/dpa` continuent d'afficher le corpus courant historique.
- Les nouvelles routes ne publient pas leur contenu V2.
- `LegalAcceptanceGate` conserve son comportement historique.
- Aucune requete n'est envoyee vers les nouvelles structures de preuve V2.
- `DPA_SELF_SERVICE_ENABLED`, `STRIPE_ENABLED`, `AI_FEATURES_ENABLED`, `DOCUMENT_STORAGE_ENABLED` et `TRANSACTIONAL_EMAIL_ENABLED` restent faux.

## Archives

- `/pilot-agreement` reste une archive historique figee et ne figure pas dans la navigation publique principale.
- `/legal/archive/:documentId/:version` sert les versions historiques connues uniquement.
- Toute archive affiche exactement `Archive historique — document non applicable aux nouveaux contrats`.
- Les archives ajoutent `noindex`, `nofollow` et `noarchive`, et ne proposent aucune action d'acceptation.
- Les anciennes acceptations conservent leur version et ne sont jamais reecrites.

## Documents non publics

Les matrices de travail, procedures internes et sources mixtes sont conservees
dans un espace prive distinct. Elles ne sont ni suivies par Git, ni importees
par le frontend. Leur contenu utile doit etre transforme en documentation
publique nettoyee avant toute reintegration.

## Frontieres connues

- Les informations courtes au point de collecte ne sont pas toutes integrees ; elles restent une decision P1 avant activation commerciale.
- Le corpus V2 n'a pas de date d'effet et ne doit pas etre presente comme applicable.
- La validation juridique humaine du texte francais puis des traductions demeure obligatoire.
- Les identites contractantes precises des fournisseurs doivent etre confirmees par les contrats ou factures du compte RODANBTECH.

# Revue juridique préalable à l'intégration - juillet 2026

## Décision

**Statut : GO SOUS FLAGS**

Le pack `Clikarage_Pack_Juridique_Complet_FR_2026_Sans_Pilote.md` peut servir de source au nouveau corpus, à condition que les documents restent au statut `staged`, sans date d'effet, derrière des flags désactivés par défaut et sans déclencher de nouvelle acceptation en production. Aucun P0 n'empêche cette intégration technique. Les P1 ci-dessous interdisent toutefois de présenter le corpus comme juridiquement validé ou immédiatement contractuel.

La version française est la référence de rédaction. Les versions anglaise et arabe seront des traductions informatives alignées sur les mêmes identifiants de clauses. Une validation juridique humaine demeure obligatoire avant toute contractualisation commerciale importante.

## Sources et périmètre examinés

- Source fournie, conservée sans publication globale : `docs/legal/source/Clikarage_Pack_Juridique_Complet_FR_2026_Sans_Pilote.md`.
- Empreinte SHA-256 de la source : `54ea0dd8454893a00f66fcca83068c3e20e1166201f7d5639502b2535e40f899`.
- Corpus commercial actuel : `commercialLegalContent.ts`, routes `/legal`, `/privacy`, `/terms` et `/dpa`.
- Archive immuable du 2 juillet 2026 : cinq composants historiques, `legalContent.ts` et `historicalLegal20260702.ts`, protégés par des contrats de hash.
- Acceptations : `LegalAcceptanceGate.tsx`, `legalAcceptance.ts`, migrations `20260703132019_legal_acceptances.sql` et `20260719111617_add_legal_acceptance_versioning_contracts.sql`.
- Collectes visibles : inscription, authentification, réservation, devis public, espace client, espace garage, recommandations, messages, rapports, pièces jointes et rappels.
- Mécanismes navigateur : Supabase Auth, `localStorage`, `sessionStorage`, service worker PWA et caches Workbox.
- Inspection HTTP publique du 20 juillet 2026 : application servie par Vercel, appel Google Fonts présent, aucun marqueur Vercel Analytics détecté dans le HTML initial.
- Revue des documents officiels fournisseurs disponibles au 20 juillet 2026 : DPA Supabase du 1er juin 2026, DPA et conditions Vercel, conditions et mentions Squarespace, DPA Google Cloud/Workspace.

## Inventaire et classification du pack

| Bloc du pack | Classification | Destination prévue | Publication |
| --- | --- | --- | --- |
| Mentions légales | Public | `/legal` | Sous flag V2 |
| Conditions générales B2B SaaS | Contractuel professionnel | `/terms/pro` | Sous flag V2 |
| Conditions utilisateurs professionnels | Contractuel professionnel | Incluses ou annexées à `/terms/pro` | Sous flag V2 |
| Conditions d'accès automobiliste | Public / contractuel limité | `/terms/client` | Sous flag V2 |
| Politique de confidentialité | Public | `/privacy` | Sous flag V2 |
| Politique cookies et stockage terminal | Public | `/cookies` | Sous flag V2 |
| Accord de sous-traitance | Contractuel professionnel | `/dpa` | Sous flag V2 |
| Registre prestataires / conservation / rôles | Public et interne selon la section | `/subprocessors` + documentation interne | Sous flag V2 pour le registre public |
| Annexe service et sécurité | Contractuel professionnel | `/service-levels` | Sous flag V2 |
| Charte IA future | Interne, inactive | `/ai-policy` non publiée tant que l'IA est désactivée | Non publiée |
| Checklist de publication | Interne | `docs/legal/internal/` | Jamais publique |
| Alignement technique et fiche de validation | Interne | `docs/legal/internal/` | Jamais public |

Le pack ne doit pas être rendu intégralement par une route : il mélange documents opposables, informations publiques, hypothèses de travail, réserves techniques et checklist interne.

## Correspondance routes actuelle et cible

| Route | État actuel | Cible V2 |
| --- | --- | --- |
| `/legal` | Document commercial 2026-01 | Mentions légales versionnées |
| `/privacy` | Politique commerciale 2026-01 avec réserves visibles | Politique de confidentialité versionnée |
| `/terms` | Conditions communes pro/client | Alias compatible vers le document adapté, sans casser les liens historiques |
| `/terms/pro` | Absente | Conditions B2B et utilisateurs professionnels |
| `/terms/client` | Absente | Conditions d'accès à l'Espace Client |
| `/cookies` | Absente | Cookies, stockage terminal et traceurs |
| `/subprocessors` | Absente | Registre public des prestataires actifs |
| `/security` | Absente | Mesures de sécurité publiques, sans promesse absolue |
| `/service-levels` | Absente | Annexe contractuelle sans SLA numérique inventé |
| `/dpa` | Projet DPA 2026-01 | DPA versionné et limité aux représentants habilités |
| `/ai-policy` | Absente | Route non publiée tant que l'IA est inactive |
| `/pilot-agreement` | Archive historique 2026-07-02 | Archive figée, `noindex`, hors navigation et hors acceptation |
| `/legal/archive/:documentId/:version` | Absente | Accès stable aux versions archivées acceptées |
| `/pro/legal-status` | Existe comme `/pro/legal-status` | Historique, version, langue et empreinte lorsque disponibles |

## Identité et informations officielles

- Produit : `Clikarage`, service logiciel, sans personnalité morale distincte.
- Éditeur et cocontractant : Anas RODRIGUEZ BENKARROUM, Entrepreneur individuel, nom commercial RODANBTECH.
- SIREN : `103 878 187`.
- SIRET : `103 878 187 00014`.
- RNE : immatriculation du 17 avril 2026.
- Adresse : 47 rue Vivienne, 75002 Paris, France.
- APE : `62.01Z`.
- Contact unique : `anas.rodriguez@rodanbtech.com`.
- Téléphone : `+33 7 81 18 93 65`.
- TVA : la formulation cible est `TVA non applicable, article 293 B du Code général des impôts.` Une vérification fiscale interne reste requise avant la première facture.
- Application : `https://app.rodanbtech.com/`.

La configuration actuelle contient encore la formulation imprécise `Pas de numéro de TVA intracommunautaire valide à ce jour`. Elle doit être remplacée uniquement dans le corpus V2. L'archive 2026-07-02 ne doit pas être mutée.

## Modèle juridique et rôles RGPD

- RODANBTECH est le cocontractant SaaS B2B du garage, groupe ou réseau.
- Le garage reste seul professionnel automobile vis-à-vis de l'automobiliste et seul responsable des diagnostics, devis, prix, travaux, délais, garanties et obligations métier.
- L'Espace Client est un outil de consultation, d'échange et de décision ; Clikarage n'est ni réparateur, ni expert automobile, ni assureur, ni intermédiaire de paiement.
- Le garage est en principe responsable de traitement pour les données de ses clients, véhicules et dossiers d'intervention.
- RODANBTECH agit comme sous-traitant lorsqu'il traite ces données sur instruction du garage pour fournir Clikarage.
- RODANBTECH agit comme responsable de traitement pour ses propres comptes contractuels, la sécurité, la facturation, la prospection, le support et la preuve juridique.
- La politique de confidentialité ne doit pas être présentée comme un consentement. Elle relève d'une information ou d'une prise de connaissance, selon le flux.

## Prestataires et état opérationnel

| Service | État vérifié | Entité / réserve |
| --- | --- | --- |
| Vercel | Actif pour frontend, CDN et déploiement | `Vercel Inc.` confirmé par ses conditions et son DPA ; transferts et sous-traitants à documenter selon le contrat du compte |
| Supabase | Actif pour Auth, PostgreSQL, API et infrastructure ; région principale Paris `eu-west-3` | Le DPA du 1er juin 2026 nomme `Supabase Pte. Ltd`; le contrat réellement accepté par RODANBTECH doit être archivé/confirmé |
| Squarespace | Actif pour domaine/DNS et site vitrine selon le compte | Pour un client hors États-Unis, les conditions générales désignent en principe `Squarespace Ireland Limited`; vérifier facture et contrat du compte |
| Google Workspace | Actif pour la messagerie professionnelle | Entité et DPA à confirmer depuis le contrat Admin du compte ; aucun fournisseur transactionnel dédié n'est identifié |
| Stripe | Prévu, non actif | Ne doit pas être décrit comme un prestataire actuel |
| OpenAI / IA externe | Non actif | Aucune politique IA publique ni traitement IA actuel à annoncer |
| SMS / DMS / CRM externe | Non connecté | Adaptateurs techniques seulement, aucune intégration réelle à annoncer |
| Vercel Web Analytics | Non détecté et désactivé dans la configuration | Ne pas annoncer de mesure d'audience active |
| Supabase Storage métier | Schéma préparé, fonctionnalité frontend sous flag | Ne pas présenter l'upload de documents métier comme généralisé tant que le flag est désactivé |

Les noms juridiques des fournisseurs ne doivent pas être déduits uniquement de leur marque. Le registre public doit distinguer le fournisseur actif, sa finalité, sa localisation principale, son mécanisme de transfert et la date de vérification.

## Traceurs, cookies et stockage terminal

État constaté dans le code :

- `localStorage` : langue `gf-lang`, thème `gf-theme`, branding `gf-brand`, centres/garages sélectionnés, mode pro et magasins de démonstration historiques `gf-*`.
- Supabase Auth : persistance de session sous la clé historique `garageflow-auth`.
- `sessionStorage` : rôle et compte de démonstration, type d'organisation, brouillon de réservation et service présélectionné.
- Service worker PWA / Workbox : caches techniques et mise à jour automatique.
- Aucun appel direct à `document.cookie`, aucun SDK publicitaire et aucune intégration d'analyse détectés.
- Google Fonts est chargé depuis `fonts.googleapis.com` / `fonts.gstatic.com` dans le dépôt et dans le HTML de production ; ce chargement tiers doit être supprimé au profit d'une police locale avant d'affirmer qu'aucune ressource de police externe n'est sollicitée.
- Aucun IndexedDB applicatif direct n'est détecté ; le service worker ou les bibliothèques peuvent néanmoins utiliser leurs propres stockages techniques.

La future page `/cookies` doit décrire ces mécanismes par finalité, durée ou condition d'effacement, caractère nécessaire et portée. Elle ne doit pas affirmer l'absence absolue de cookies sans vérification runtime et fournisseur.

## Collectes et notices contextuelles

| Point de collecte | État actuel | Action V2 |
| --- | --- | --- |
| Inscription client | Cases conditions + confidentialité ; confidentialité traitée comme acceptation | Séparer acceptation des conditions et information confidentialité ; lien vers versions et notice courte |
| Invitation professionnelle | Mécanisme sécurisé à finaliser | Ajouter notice, rôle, organisation et pouvoir d'acceptation |
| Réservation | Données de contact, véhicule et demande | Ajouter notice de collecte contextuelle |
| Saisie d'un automobiliste par un garage | Données saisies par le responsable de traitement garage | Afficher rappel de licéité et d'information du client |
| Devis et décision | Token public, versions historiques déjà enregistrables | Distinguer décision métier et acceptation de conditions d'accès ; conserver la preuve affichée |
| Messages | Contenu libre | Rappeler les catégories de données interdites et la visibilité |
| Historique partagé | Données dossier/véhicule | Clarifier accès du client et responsabilité du garage |
| Pièces jointes futures | Fonction sous flag | Notice avant activation, formats, visibilité et durée |
| Support | Email professionnel | Notice et durée de conservation à définir |
| Paiement Stripe futur | Inactif | Aucune notice active avant connexion réelle |

## Versions, statut et acceptation

Les versions préparées restent `legal-2026-01`, `privacy-2026-01`, `terms-2026-01` et `dpa-2026-01`. Aucune date d'entrée en vigueur ne doit être inventée. Le registre V2 doit porter :

- `documentId`, `version`, `publishedAt`, `effectiveAt` ;
- `status` parmi `draft`, `staged`, `effective`, `archived` ;
- `language`, `sha256`, `supersedes` ;
- `requiresAcceptance`, `acceptanceScope`, `materialChange`.

Tant que `effectiveAt` est nul et que les flags sont désactivés, les documents V2 sont des projets mis en scène, ne remplacent pas la version courante et ne redemandent aucune acceptation.

État actuel de `legal_acceptances` :

- preuve existante : utilisateur, rôle, type, version, date serveur, user-agent et contexte ;
- migration préparée : langue affichée, identifiant stable et organisation, tous nullables pour préserver les huit lignes historiques ;
- journal append-only par absence de policy `UPDATE` et `DELETE` ;
- lacunes : empreinte SHA-256, statut du document, version applicative, portée utilisateur/organisation et preuve du pouvoir du représentant ;
- risque : tout membre actif peut actuellement enregistrer une acceptation avec une organisation, y compris le DPA ;
- risque : l'idempotence est utilisateur + document + version et ne matérialise pas une acceptation organisationnelle unique ;
- risque : la confidentialité est incluse dans les documents « acceptés » alors qu'elle doit être une information ;
- user-agent : collecté systématiquement côté frontend ; sa nécessité et sa durée doivent être validées. Aucune adresse IP n'est collectée par ce flux.

Les huit acceptations historiques ne doivent jamais être réécrites ou complétées artificiellement. Une nouvelle migration additive est nécessaire pour les preuves V2, mais elle ne doit pas être appliquée dans cette tâche.

## Archive historique

- `/pilot-agreement` restitue bien le texte du 2 juillet 2026 et n'est plus dans le footer principal.
- Les fichiers historiques sont protégés par des empreintes automatisées.
- Les autres documents 2026-07-02 restent accessibles via `?version=2026-07-02`.
- Écarts : absence de balise `noindex`, bannière ne reprenant pas encore explicitement `Archive historique — document non applicable aux nouveaux contrats`, route d'archive générique absente.
- Les traductions historiques contiennent nécessairement le vocabulaire pilote. Elles constituent l'unique exception autorisée aux recherches globales.

## Incohérences et contenu à ne pas publier tel quel

- Le pack mélange des textes publiables et des éléments internes concernant les migrations, sauvegardes, flags, checklists et écarts techniques.
- Les sections internes du pack reflètent un instant antérieur sur certains points (historique de migrations, capacités préparées, niveau de traduction) et doivent être revalidées contre le dépôt actuel.
- Le corpus actif actuel expose des mentions telles que `bases légales à confirmer`, `durées proposées`, `doit être revu juridiquement` et `prestataires à confirmer`. Ces réserves sont légitimes en revue mais ne doivent pas figurer dans un document contractuel effectif.
- Le corpus actuel fusionne conditions professionnelles et accès automobiliste, alors que leurs parties, responsabilités et mécanismes d'acceptation diffèrent.
- Les informations actuelles sur la TVA et certains fournisseurs sont imprécises.
- Aucun SLA numérique, RPO, RTO, fréquence de sauvegarde ou délai de support ne peut être promis sans engagement opérationnel vérifié.
- Les fonctionnalités futures (paiement, IA, stockage de documents, notifications transactionnelles) doivent être décrites comme inactives ou être omises des documents effectifs.

## Risques classés

### P0 - Bloquant

Aucun P0 technique n'empêche une intégration `staged` sous flags. L'activation contractuelle en production resterait en revanche bloquée sans validation humaine et sans décision explicite sur la date d'effet.

### P1 - Important avant contractualisation

- Faire valider par un conseil les CGV/CGU B2B, les limitations de responsabilité, les conditions tarifaires, les pénalités, l'indemnité forfaitaire de 40 EUR, la reconduction, la résiliation et la réversibilité.
- Valider les bases légales et durées de conservation, notamment rappels marketing, destinataires de notifications, journaux et pièces jointes.
- Confirmer les entités contractantes, DPA, sous-traitants ultérieurs et mécanismes de transfert de chaque fournisseur actif.
- Limiter l'acceptation DPA aux propriétaires, administrateurs ou représentants expressément habilités de l'organisation.
- Étendre la preuve d'acceptation avec empreinte, statut, portée et version applicative, sans mutation historique.
- Séparer la prise de connaissance de la politique de confidentialité de l'acceptation contractuelle.
- Supprimer le chargement Google Fonts externe ou l'encadrer avant publication de la politique traceurs.
- Définir et tester le processus d'exercice des droits, d'export, de suppression et d'incident.

### P2 - Recommandé avant déploiement large

- Ajouter des notices de collecte contextuelles sur chaque formulaire pertinent.
- Créer le registre public des sous-traitants avec date de vérification et mécanisme de notification des changements.
- Ajouter les routes stables d'archives, une politique `noindex` et une navigation accessible.
- Documenter la rotation, la conservation et la suppression des journaux techniques et sauvegardes.
- Vérifier visuellement les documents FR/EN/AR, le RTL et le PDF arabe sur plusieurs formats.

### P3 - Amélioration future

- Automatiser la vérification périodique des liens et changements de DPA fournisseurs.
- Ajouter un export administrateur de la preuve contractuelle après validation du modèle d'autorité.
- Mettre en place un registre automatisé des demandes RGPD et des incidents.

## Décisions humaines requises

1. Valider juridiquement le texte français de référence et la hiérarchie contrat / bon de commande / conditions / DPA.
2. Fixer la date de publication et la date d'effet ; tant qu'elles ne sont pas décidées, conserver `effectiveAt = null`.
3. Valider les prix, périodes, taxes, renouvellement, résiliation, pénalités, responsabilité et réversibilité.
4. Confirmer la qualité de représentant habilité nécessaire pour engager une organisation et signer le DPA.
5. Valider les bases légales, durées, politique de rappels et collecte du user-agent.
6. Confirmer les entités fournisseurs depuis les contrats RODANBTECH et archiver leurs DPA.
7. Décider du mécanisme de notification des nouveaux sous-traitants.
8. Approuver les traductions anglaise et arabe en sachant que le français restera la référence.
9. Autoriser séparément toute migration d'acceptation et toute activation de flag.

## Conditions de passage de `staged` à `effective`

- Revue juridique humaine signée et décisions ci-dessus documentées.
- Empreintes finales calculées sur les textes publiés et immuables.
- Date d'effet fixée sans rétroactivité.
- Migration additive validée sur environnement de test, puis appliquée selon procédure contrôlée.
- Autorisation DPA testée côté base et frontend.
- Google Fonts externe supprimé et inventaire des domaines tiers validé.
- Tests FR/EN/AR, RTL, accessibilité, archives, acceptation et régression au vert.
- Flags activés progressivement, jamais tous par défaut.

## Conclusion

L'intégration peut commencer sur la branche actuelle uniquement sous flags désactivés. Elle doit produire un corpus V2 versionné, accessible à la revue mais non effectif, préserver l'archive historique et ne modifier aucune acceptation existante. Le statut ne vaut ni validation juridique ni autorisation de déploiement.

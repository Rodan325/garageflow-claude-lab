# Clikarage — Pack juridique complet FR 2026

**Version maître française — révision technique du 19 juillet 2026**

> Version maître à compléter et valider avant publication.

CLIKARAGE

PACK JURIDIQUE COMPLET

SaaS automobile B2B2C — France et Union européenne

Version maître française — révision technique du 19 juillet 2026

| Version maître Cette version française constitue la base contractuelle de référence. Toute traduction anglaise ou arabe doit être réalisée à partir de cette version stabilisée et indiquer qu’en cas de divergence, la version française prévaut, sauf stipulation contraire dans un bon de commande signé. |
| --- |

| Éditeur | Produit | Périmètre |
| --- | --- | --- |
| RODANBTECH | Clikarage | SaaS de gestion et de relation client pour garages et réseaux automobiles |

Document maître contractuel destiné à l’intégration dans Clikarage et à la contractualisation B2B. Les clauses identifiées comme variables doivent être complétées dans le Bon de commande ou dans un avenant signé.

## Mode d’emploi, périmètre vérifié et réserves de publication

| État de cette version Cette révision reprend la base contractuelle précédente et l’aligne sur le dépôt de référence `Rodan325/garageflow-claude-lab`, sur les informations officielles de RODANBTECH et sur l’architecture déclarée au 19 juillet 2026. Elle ne promet ni fonction, ni fournisseur, ni sauvegarde, ni niveau de service qui ne soit effectivement actif. |
| --- |

### 1. Architecture juridique retenue

- **Éditeur et cocontractant SaaS :** Anas RODRIGUEZ BENKARROUM, entrepreneur individuel exerçant sous le nom commercial RODANBTECH, édite et exploite Clikarage.
- **Client B2B :** le garage, centre, réseau ou groupe souscripteur reste seul professionnel de l’automobile vis-à-vis de ses clients. Il fixe ses prestations, prix, horaires, diagnostics, devis, factures, garanties et décisions d’atelier.
- **Rôles RGPD :** RODANBTECH agit comme responsable de traitement pour la gestion de sa plateforme, de ses comptes, de sa sécurité, de sa facturation et de ses propres relations commerciales. Pour les données métier traitées pour le compte d’un garage, le garage agit comme responsable de traitement et RODANBTECH comme sous-traitant au sens de l’article 28 du RGPD.
- **Automobilistes :** l’Espace Client est un canal technique mis à disposition par le garage. Il ne crée pas de contrat de réparation, vente ou garantie avec RODANBTECH.
- **Intelligence artificielle :** aucune API OpenAI ni autre fournisseur d’IA externe n’est actuellement intégré. Les clauses IA ne prennent effet que lorsqu’une fonctionnalité correspondante est activée et identifiée dans le Bon de commande et le registre des sous-traitants.

### 2. État opérationnel vérifié

| Champ | Valeur retenue | Statut |
| --- | --- | --- |
| Produit | Clikarage | Définitif |
| Application | `https://app.rodanbtech.com/` | Actif |
| Dépôt de référence | `Rodan325/garageflow-claude-lab` | Référence technique |
| Exploitant | Anas RODRIGUEZ BENKARROUM, nom commercial RODANBTECH | Confirmé |
| Forme | Entrepreneur individuel | Confirmé |
| SIREN | 103 878 187 | Confirmé |
| SIRET | 103 878 187 00014 | Confirmé |
| Immatriculation | Registre national des entreprises, 17 avril 2026 | Confirmé |
| Adresse | 47 rue Vivienne, 75002 Paris, France | Confirmé |
| Activité / APE | Programmation informatique — 62.01Z | Confirmé |
| Contact unique | `anas.rodriguez@rodanbtech.com` | Actif |
| TVA | Franchise en base retenue : « TVA non applicable, article 293 B du CGI » | À revalider dans l’espace fiscal avant la première facture |
| Frontend | Vercel | Actif |
| Backend / Auth / base | Supabase, projet principal en `eu-west-3` (Paris) | Actif |
| Stockage Supabase | Utilisation limitée aux éléments techniques/branding ; stockage métier de photos et documents non activé | État actuel |
| Domaine / DNS / vitrine | Squarespace | Actif |
| Messagerie société | Google Workspace | Actif |
| Mesure d’audience | Vercel Web Analytics déclaré ; activation effective à vérifier sur le déploiement | Conditionnel |
| Stripe | Prévu mais non intégré | Inactif |
| OpenAI / IA externe | Non utilisé | Inactif |
| E-mail transactionnel | Aucun prestataire dédié | Inactif |
| Chiffre d’affaires 2026 déclaré | 0 euro au 19 juillet 2026 | Déclaratif |

### 3. Choix contractuels par défaut de cette version

- Les prix, quotas et engagements commerciaux figurent dans le Bon de commande ; aucune grille tarifaire non décidée n’est inventée dans les présentes.
- Le support standard est fourni par e-mail les jours ouvrés, selon une obligation de moyens et sans astreinte 24/7.
- Aucun pourcentage de disponibilité, crédit de service, RPO ou RTO n’est garanti dans l’offre standard tant qu’un plan d’infrastructure, des sauvegardes et un dispositif de mesure adaptés ne sont pas activés.
- Le Client dispose par défaut de trente jours pour exporter les données après la fin du contrat. Les données actives sont ensuite supprimées dans un délai cible de trente jours, sous réserve des obligations légales et du cycle technique des prestataires.
- La responsabilité générale de RODANBTECH est plafonnée au montant payé au cours des douze mois précédant le fait générateur, avec un plancher contractuel de 1 000 euros pour un abonnement payant, sauf stipulation différente signée.

### 4. Conditions avant premier client réel

1. Confirmer formellement le régime de TVA dans l’espace fiscal professionnel.
2. Signer ou accepter les DPA applicables de Supabase, Vercel, Squarespace et Google Workspace.
3. Passer Supabase sur un plan de production comportant des sauvegardes avant d’y héberger des données métier critiques.
4. Corriger ou documenter les écarts de sécurité relevés dans l’audit technique : en-têtes de sécurité, protection contre les mots de passe compromis, dépendances de développement, observabilité et cohérence des migrations.
5. Auto-héberger la police Inter ou documenter le chargement Google Fonts et son transfert technique.
6. Vérifier en production l’activation de Vercel Web Analytics et réaliser un scan réel des traceurs.
7. Ne pas activer Stripe, un fournisseur IA, un outil d’e-mail transactionnel ou un nouveau stockage sans mettre à jour les politiques et le registre des sous-traitants.

<div style="page-break-before: always;"></div>

## Sommaire du pack

| Document | Intitulé |
| --- | --- |
| 1 | Mentions légales |
| 2 | Conditions générales de services et d’abonnement B2B |
| 3 | Conditions d’utilisation de l’Espace Garage / Pro |
| 4 | Conditions d’utilisation de l’Espace Client |
| 5 | Politique de confidentialité |
| 6 | Politique relative aux cookies et autres traceurs |
| 7 | Accord de sous-traitance des données personnelles — DPA |
| 8 | Registres opérationnels : sous-traitants et conservation |
| 9 | Annexe de niveau de service et de sécurité |
| 10 | Charte d’utilisation des fonctionnalités d’intelligence artificielle |
| 11 | Checklist de publication et de signature |
| 12 | Annexe d’alignement technique au dépôt |

DOCUMENT 1

MENTIONS LÉGALES

À publier sur le site vitrine, l’application, la PWA et les écrans d’authentification

## Éditeur du service

Le site, l’application web progressive et le service **Clikarage** sont édités par :

- **Anas RODRIGUEZ BENKARROUM**, entrepreneur individuel exerçant sous le nom commercial **RODANBTECH** ;
- siège social et établissement : **47 rue Vivienne, 75002 Paris, France** ;
- SIREN : **103 878 187** ; SIRET : **103 878 187 00014** ;
- immatriculation au **Registre national des entreprises (RNE)** le 17 avril 2026 ;
- activité principale : programmation informatique — code APE **62.01Z** ;
- TVA : **TVA non applicable, article 293 B du Code général des impôts**, sous réserve de confirmation du régime fiscal avant la première facturation ;
- contact unique juridique, support, sécurité et protection des données : **anas.rodriguez@rodanbtech.com**.

## Directeur de la publication

Le directeur de la publication est **Anas RODRIGUEZ BENKARROUM**, en qualité d’exploitant de RODANBTECH.

## Hébergement et infrastructure

- L’application `app.rodanbtech.com` est déployée au moyen des services de **Vercel Inc.**, 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.
- La base de données, l’authentification et les fonctions serveur sont fournies par **Supabase Pte. Ltd**, 65 Chulia Street #38-02/03, OCBC Centre, Singapore 049513. Le projet principal est hébergé dans la région **West EU (Paris), eu-west-3**. Des opérations techniques ou sous-traitants peuvent intervenir hors Espace économique européen conformément au DPA et aux clauses contractuelles types applicables.
- Le domaine `rodanbtech.com`, ses paramètres DNS et le site vitrine sont administrés ou hébergés par **Squarespace Ireland Limited**, Squarespace House, Ship Street Great, Dublin 8, D08 N12C, Irlande.
- La messagerie professionnelle est fournie par **Google Workspace**. L’entité contractante exacte est celle figurant sur la facture ou l’interface d’administration Google du compte RODANBTECH.

L’URL technique du projet Supabase, ses clés et identifiants internes ne sont pas publiés dans les présentes mentions.

## Propriété intellectuelle

La structure générale de Clikarage, ses logiciels, interfaces, textes, éléments graphiques, bases documentaires, marques, signes distinctifs et contenus éditoriaux appartenant à RODANBTECH ou concédés sous licence sont protégés. Toute reproduction, extraction, adaptation, décompilation ou exploitation non autorisée est interdite, sous réserve des exceptions impératives et des droits expressément accordés par contrat.

Les marques, logos et contenus des garages, réseaux, constructeurs, équipementiers ou plateformes tierces demeurent la propriété de leurs titulaires. Leur présence dans une démonstration ou un contenu utilisateur n’implique aucun partenariat, agrément ou affiliation sans mention écrite contraire.

## Responsabilité éditoriale et contenus des garages

Clikarage fournit un outil technique. Chaque garage demeure responsable des informations qu’il publie ou transmet, notamment ses prix, disponibilités, prestations, diagnostics, devis, factures, garanties, conseils, photographies et documents. RODANBTECH n’est ni réparateur automobile, ni vendeur de véhicules, ni expert automobile, ni assureur, ni mandataire du garage, sauf mandat écrit distinct.

## Signalement

Tout contenu manifestement illicite, atteinte à des droits, vulnérabilité de sécurité ou usage abusif peut être signalé à **anas.rodriguez@rodanbtech.com**, avec les éléments permettant d’identifier le contenu, le compte, le fait ou la vulnérabilité concernée.

## Données personnelles et traceurs

Les traitements de données personnelles, le stockage local, les cookies et les ressources tierces sont décrits dans la Politique de confidentialité et la Politique relative aux cookies et autres traceurs accessibles depuis le Service.

DOCUMENT 2

CONDITIONS GÉNÉRALES DE SERVICES ET D’ABONNEMENT B2B

Contrat SaaS entre RODANBTECH et le garage, le réseau ou l’organisation cliente

| Champ d’application Ces conditions sont réservées aux professionnels agissant pour les besoins de leur activité. Elles ne régissent pas le contrat de réparation, de vente ou de service conclu entre un garage et un automobiliste. |
| --- |

### 1. Définitions

« Abonnement » désigne le droit d’accès au Service pendant la durée et selon le périmètre convenus dans le Bon de commande.

« Client » désigne le professionnel, garage, groupe, franchiseur, franchisé, réseau ou organisation ayant souscrit le Service.

« Données Client » désigne les données, contenus, documents, paramétrages et informations importés, créés ou traités par le Client et ses Utilisateurs dans le Service.

« Espace Client » désigne l’interface mise à disposition des automobilistes pour prendre rendez-vous, consulter, accepter ou refuser certaines propositions, échanger et accéder à des documents.

« Service » désigne la plateforme Clikarage, ses modules, API, applications, interfaces, mises à jour et services associés décrits dans le Bon de commande.

« Utilisateur » désigne toute personne physique autorisée à utiliser le Service sous la responsabilité du Client.

### 2. Documents contractuels et ordre de priorité

Le contrat est formé, par ordre de priorité décroissant, du Bon de commande ou contrat-cadre signé, de ses annexes particulières, du DPA, de l’annexe de niveau de service le cas échéant, des présentes CGS et des conditions d’utilisation applicables aux Utilisateurs.

En cas de contradiction, le document de rang supérieur prévaut pour l’objet de la contradiction. Les documents commerciaux, démonstrations, feuilles de route et échanges préparatoires n’ont pas de valeur contractuelle sauf incorporation expresse dans un document signé.

### 3. Formation du contrat et habilitation

Le signataire déclare disposer du pouvoir nécessaire pour engager le Client. Le contrat prend effet à la date indiquée dans le Bon de commande ou, à défaut, à la première des dates suivantes : signature, activation de l’environnement de production ou paiement de la première facture.

Toute commande est ferme sous réserve des droits de résiliation expressément prévus. Aucun droit de rétractation consommateur ne s’applique à une souscription conclue pour les besoins de l’activité professionnelle du Client.

### 4. Objet et périmètre du Service

RODANBTECH concède au Client, pour la durée du contrat, un droit personnel, non exclusif, non transférable et limité d’accès et d’utilisation du Service pour ses besoins professionnels internes et, lorsque le module est activé, pour fournir un Espace Client à ses propres clients.

Le périmètre fonctionnel, le nombre de centres, d’Utilisateurs, les volumes, connecteurs, prestations d’installation, migrations, formations et niveaux de service sont ceux du Bon de commande. Toute fonctionnalité présentée comme bêta, aperçu, expérimentation ou feuille de route est fournie à titre d’évaluation et peut être modifiée ou retirée.

### 5. Mise à disposition, paramétrage et prérequis

Le Client fournit dans les délais les informations, accès, fichiers, règles métier, identités des administrateurs et validations nécessaires. Tout retard ou défaut de coopération peut décaler les dates de mise en service sans engager la responsabilité de RODANBTECH.

Le Client veille à disposer d’une connexion internet, d’équipements compatibles, de navigateurs maintenus et de mesures de sécurité appropriées. Les applications, systèmes, API ou équipements tiers restent soumis aux conditions de leurs éditeurs.

### 6. Comptes, habilitations et sécurité des accès

Le Client désigne ses administrateurs et gère les rôles selon le principe du moindre privilège. Les identifiants sont personnels ; les comptes partagés sont interdits sauf compte technique expressément documenté.

Le Client informe sans délai RODANBTECH de tout départ, changement de rôle, perte d’équipement, compromission ou usage suspect et révoque les accès concernés. Les actions effectuées au moyen d’un compte valablement authentifié sont présumées effectuées sous la responsabilité du Client, sauf preuve d’une défaillance imputable à RODANBTECH.

- utiliser des mots de passe robustes et uniques ;

- activer l’authentification multifacteur lorsqu’elle est disponible ou requise ;

- ne pas contourner les contrôles d’accès, quotas ou journaux ;

- maintenir à jour la liste des Utilisateurs et leurs habilitations.

### 7. Obligations de RODANBTECH

RODANBTECH fournit le Service avec diligence et selon les pratiques professionnelles raisonnablement attendues d’un éditeur SaaS, met en œuvre des mesures techniques et organisationnelles adaptées au risque, assure la maintenance et fournit l’assistance prévue au Bon de commande.

RODANBTECH ne garantit pas que le Service sera exempt de toute erreur ou interruption, mais s’engage à traiter les anomalies reproductibles selon leur criticité et les engagements expressément convenus.

### 8. Obligations du Client

Le Client utilise le Service conformément aux lois, règles professionnelles et documents contractuels. Il demeure responsable de son activité automobile, de ses décisions, de la qualité et de la licéité des Données Client, ainsi que des actes de ses Utilisateurs et prestataires.

Le Client s’interdit notamment de :

- traiter ou publier des données, documents, images ou contenus sans droit ou base légale ;

- utiliser le Service pour des pratiques trompeuses, discriminatoires, frauduleuses, dangereuses ou contraires à l’ordre public ;

- introduire un code malveillant, réaliser des tests de charge ou de sécurité non autorisés, aspirer le Service ou tenter d’accéder aux données d’un autre client ;

- revendre, louer, sous-licencier ou mettre le Service à disposition d’un tiers hors du périmètre contractuel ;

- supprimer ou contourner les avertissements, mécanismes de preuve, contrôles humains ou limites des fonctionnalités d’intelligence artificielle.

### 9. Données Client — propriété, contrôle et qualité

Le Client conserve tous ses droits sur les Données Client. RODANBTECH n’acquiert aucun droit de propriété sur celles-ci et ne les utilise que pour exécuter le contrat, sécuriser le Service, respecter la loi et, pour les données personnelles traitées pour le compte du Client, conformément au DPA.

Le Client vérifie l’exactitude, l’intégrité et la pertinence des Données Client avant toute décision métier. Il organise ses propres obligations de conservation légale, notamment pour les factures, pièces comptables, ordres de réparation, garanties et dossiers clients.

RODANBTECH peut produire des statistiques strictement agrégées et anonymisées ne permettant pas d’identifier le Client, ses établissements ou des personnes, à des fins de mesure, sécurité, capacité et amélioration du Service. Toute autre réutilisation requiert une base juridique et, lorsqu’elle porte sur des données traitées pour le compte du Client, une autorisation écrite conforme au DPA.

### 10. Données personnelles

Chaque partie respecte la réglementation applicable à la protection des données. Les rôles et obligations relatifs aux traitements effectués pour le compte du Client sont définis dans le DPA, qui fait partie intégrante du contrat.

Le Client est notamment responsable de l’information des personnes, du choix des bases légales, de la licéité des communications commerciales, du paramétrage des durées de conservation et de la réponse métier aux demandes de droits. RODANBTECH l’assiste dans les limites prévues au DPA.

### 11. Fonctionnalités d’intelligence artificielle

Les fonctionnalités d’intelligence artificielle ne sont pas actives à la date de cette version. Lorsqu’elles seront activées, elles pourront générer des suggestions, résumés, reformulations, classifications ou contenus à partir des données fournies, dans le seul périmètre indiqué au Bon de commande. Leurs résultats peuvent être incomplets, inexacts, inadaptés ou non originaux.

Le Client conserve un contrôle humain effectif et valide tout résultat avant utilisation, diffusion ou prise de décision. Aucun résultat ne constitue un diagnostic mécanique, une expertise, un avis juridique, fiscal, médical ou comptable, une estimation certifiée, une garantie de conformité ou une instruction de sécurité.

RODANBTECH n’utilisera pas les Données Client pour entraîner un modèle d’intelligence artificielle généraliste sans accord écrit préalable du Client. Aucun fournisseur d’IA externe n’est actuellement autorisé à recevoir les Données Client. Le Client évite de transmettre aux fonctions IA des données sensibles ou non nécessaires et respecte la Charte IA annexée.

### 12. Services et intégrations de tiers

Le Service peut interagir avec des solutions tierces choisies ou activées par le Client. Le Client autorise alors les échanges de données strictement nécessaires au fonctionnement du connecteur et accepte les conditions du tiers concerné.

RODANBTECH n’est pas responsable des indisponibilités, changements d’API, décisions de modération, pertes de données, tarifs ou manquements propres à un tiers, sauf faute directement imputable à l’intégration développée par RODANBTECH. En cas de retrait d’une API tierce, RODANBTECH peut adapter, suspendre ou remplacer le connecteur.

### 13. Maintenance, évolution et disponibilité

RODANBTECH peut réaliser des maintenances programmées, correctives ou de sécurité. Lorsque cela est raisonnablement possible, les maintenances susceptibles d’affecter sensiblement le Service sont annoncées à l’avance.

Le Service peut évoluer pour améliorer la sécurité, les performances, l’ergonomie, la conformité ou l’interopérabilité. RODANBTECH évite de supprimer sans solution raisonnable une fonctionnalité essentielle expressément incluse au Bon de commande. Toute dépréciation substantielle fait l’objet d’une information adaptée.

### 14. Support

Le support standard est accessible à `anas.rodriguez@rodanbtech.com` les jours ouvrés. RODANBTECH vise un premier retour sous deux jours ouvrés, sans que ce délai constitue un délai garanti de résolution. Tout support renforcé, astreinte ou engagement particulier doit figurer au Bon de commande. Le Client fournit les informations nécessaires à la reproduction de l’incident et coopère aux diagnostics.

Le support standard ne couvre pas la formation illimitée, les développements spécifiques, la correction de données saisies par le Client, les incidents provenant d’un tiers ou d’un équipement non compatible, ni les demandes relevant du conseil juridique, comptable ou automobile.

### 15. Prix, facturation et taxes

Les prix, unités de facturation, éventuels frais de mise en service, indexations et modalités de paiement figurent au Bon de commande. À la date de cette version, RODANBTECH applique la franchise en base et les factures portent la mention « TVA non applicable, article 293 B du Code général des impôts », tant que les conditions fiscales demeurent réunies.

Toute consommation dépassant les quotas inclus peut être facturée selon le tarif convenu ou faire l’objet d’une limitation raisonnable après information du Client. Les frais de tiers refacturés sont identifiés dans le Bon de commande.

### 16. Retard ou défaut de paiement

Toute somme non payée à l’échéance porte, de plein droit et sans rappel, intérêts au taux indiqué sur la facture, lequel ne peut être inférieur au minimum légal applicable entre professionnels. Une indemnité forfaitaire de quarante euros pour frais de recouvrement est également due pour chaque facture impayée, sans préjudice d’une indemnisation complémentaire sur justificatifs lorsque les frais réellement exposés sont supérieurs.

Après mise en demeure restée sans effet pendant dix jours, RODANBTECH peut suspendre tout ou partie du Service, sans effacer les Données Client ni priver le Client des mécanismes raisonnables de régularisation. Une contestation de bonne foi portant sur une partie de la facture ne dispense pas du paiement de la partie non contestée.

### 17. Indexation et révision tarifaire

Pour les contrats renouvelables, les prix peuvent être révisés à chaque échéance annuelle selon l’indice ou la formule du Bon de commande. À défaut de formule, toute hausse hors évolution de périmètre est notifiée au moins soixante jours avant le renouvellement ; le Client peut refuser le renouvellement conformément à l’article relatif à la durée.

Les modifications de taxes, coûts réglementaires ou tarifs imposés par un fournisseur indispensable peuvent être répercutées de manière documentée, sous réserve d’une information préalable raisonnable.

### 18. Propriété intellectuelle du Service

RODANBTECH demeure titulaire de tous les droits sur le Service, ses composants, modèles, documentations, méthodes, développements génériques, correctifs et améliorations. Le contrat ne transfère aucun droit de propriété intellectuelle au Client.

Les développements spécifiques sont régis par le Bon de commande. À défaut de stipulation expresse, RODANBTECH conserve les droits sur les composants réutilisables et concède au Client un droit d’usage dans le cadre de l’Abonnement. Les données, marques et contenus propres au Client lui appartiennent.

### 19. Retour d’expérience et références commerciales

Les suggestions et retours fonctionnels peuvent être utilisés par RODANBTECH pour améliorer le Service, sans divulguer d’informations confidentielles ni de Données Client.

RODANBTECH ne peut utiliser le nom, la marque, le logo, un témoignage, des résultats chiffrés ou le statut de client du Client comme référence commerciale qu’avec son accord écrit préalable, distinct et révocable pour les usages futurs.

### 20. Confidentialité

Chaque partie protège les informations non publiques de l’autre partie avec au moins le même soin que ses propres informations sensibles et uniquement pour exécuter le contrat. Sont confidentiels notamment les Données Client, accès, secrets, architectures, tarifs non publics, documents stratégiques, vulnérabilités et échanges signalés comme confidentiels ou dont la nature implique raisonnablement la confidentialité.

Cette obligation ne couvre pas les informations déjà licitement connues, devenues publiques sans faute, reçues licitement d’un tiers ou développées indépendamment. Une divulgation imposée par la loi est limitée au strict nécessaire et, si autorisé, précédée d’une information de l’autre partie.

L’obligation subsiste pendant cinq ans après la fin du contrat et sans limite pour les secrets d’affaires, secrets d’accès et données personnelles tant qu’ils conservent cette nature.

### 21. Sécurité et incidents

RODANBTECH applique les mesures décrites dans l’annexe de sécurité et les adapte aux risques. Le Client reconnaît qu’aucun système n’offre une sécurité absolue et s’engage à appliquer les mesures qui relèvent de son environnement et de ses Utilisateurs.

Les incidents de sécurité et violations de données sont gérés selon le plan d’incident et le DPA. Les parties coopèrent, préservent les preuves utiles et coordonnent leurs communications afin d’éviter toute information inexacte ou préjudiciable.

### 22. Garanties

RODANBTECH garantit disposer des droits nécessaires pour fournir le Service et s’engage à remédier, dans un délai raisonnable, à toute non-conformité substantielle reproductible signalée de manière documentée.

Sauf garanties expressément stipulées, le Service est fourni comme un outil de gestion et de communication. RODANBTECH ne garantit ni un volume de rendez-vous, ni un chiffre d’affaires, ni une marge, ni un classement, ni l’acceptation d’un devis, ni la conformité des décisions prises par le Client, ni la disponibilité continue des services de tiers.

### 23. Responsabilité

Chaque partie répond des dommages directs, certains et prévisibles causés par son manquement prouvé. Aucune partie n’est responsable des dommages indirects tels que perte d’opportunité, perte d’image, perte de bénéfice attendu, perte de clientèle ou préjudice commercial indirect, sauf lorsque leur réparation ne peut être exclue par la loi.

Sous réserve des exclusions ci-dessous, la responsabilité totale de RODANBTECH, toutes causes confondues sur une période de douze mois, est plafonnée au montant effectivement payé par le Client au titre du Service pendant les douze mois précédant le fait générateur, avec un plancher de 1 000 euros pour un abonnement payant, sauf plafond différent expressément convenu.

Le plafond ne s’applique pas aux dommages corporels, à la fraude ou faute intentionnelle, ni aux responsabilités qui ne peuvent être limitées par la loi. Pour les manquements à la confidentialité, à la protection des données ou une atteinte aux droits de propriété intellectuelle imputable à RODANBTECH, le Bon de commande peut prévoir un plafond majoré, par exemple deux fois le plafond général, en cohérence avec l’assurance souscrite.

Le Client indemnise RODANBTECH des conséquences d’une réclamation de tiers résultant de contenus, instructions, diagnostics, prestations, communications ou traitements illicites imputables au Client, sous réserve que RODANBTECH l’informe rapidement et lui permette de participer utilement à la défense.

### 24. Force majeure

Aucune partie n’est responsable d’un manquement causé par un événement échappant raisonnablement à son contrôle, imprévisible lors de la conclusion et dont les effets ne peuvent être évités par des mesures appropriées. La partie affectée informe l’autre partie, limite les conséquences et reprend l’exécution dès que possible.

Si l’empêchement essentiel se prolonge plus de soixante jours, chaque partie peut résilier la partie affectée du contrat sans indemnité, après notification écrite.

### 25. Durée, renouvellement, suspension et résiliation

La durée initiale, l’existence ou non d’un renouvellement et le préavis figurent au Bon de commande. À défaut de mention expresse, le contrat ne se renouvelle pas automatiquement.

En cas de manquement substantiel, l’autre partie peut résilier le contrat si le manquement n’est pas réparé dans les trente jours suivant une mise en demeure détaillée, ou immédiatement lorsqu’il est irrémédiable, illicite ou compromet gravement la sécurité, les données ou les droits de tiers.

RODANBTECH peut suspendre proportionnellement les accès en cas de menace de sécurité, usage illicite, atteinte aux systèmes ou impayé persistant. Sauf urgence, il informe le Client et lui donne la possibilité de remédier. La suspension ne doit pas être utilisée de manière abusive.

### 26. Réversibilité et sort des données

Pendant le contrat et durant une période de trente jours après sa fin, le Client peut exporter les données disponibles dans les formats standards proposés. Une assistance de migration supplémentaire peut être facturée selon devis.

À l’issue de la période de réversibilité, RODANBTECH supprime ou anonymise les Données Client dans un délai maximal de soixante jours, sauf obligation légale, demande d’une autorité, litige nécessitant leur conservation ou instruction écrite licite du Client. Les copies de sauvegarde sont purgées selon leur cycle, au plus tard sous quatre-vingt-dix jours supplémentaires, et restent protégées et non réutilisées.

Le Client demeure responsable d’effectuer ses exports avant l’expiration du délai et de conserver les documents soumis à ses obligations légales.

### 27. Audit et coopération

RODANBTECH met à disposition les informations raisonnablement nécessaires pour démontrer le respect de ses engagements. Les audits sont réalisés prioritairement sur pièces, au maximum une fois par an, avec un préavis d’au moins trente jours, pendant les heures ouvrées et sans compromettre la sécurité ou la confidentialité d’autres clients.

Un audit supplémentaire peut être demandé après un incident significatif, une injonction d’autorité ou un motif sérieux documenté. Les coûts sont supportés par le Client, sauf non-conformité substantielle imputable à RODANBTECH.

### 28. Sous-traitance contractuelle et cession

RODANBTECH peut recourir à des prestataires pour l’hébergement, la communication, l’assistance, l’IA ou d’autres fonctions, sous réserve du DPA pour les sous-traitants ultérieurs de données personnelles.

Le Client ne peut céder le contrat sans accord écrit de RODANBTECH, sauf réorganisation intragroupe ne diminuant pas les garanties de paiement et de conformité. RODANBTECH peut céder le contrat dans le cadre d’une transmission de son activité ou de ses actifs, sous réserve d’informer le Client et de maintenir les engagements essentiels.

### 29. Preuve et notifications

Les journaux, horodatages, versions acceptées, courriels, tickets et enregistrements électroniques conservés dans des conditions raisonnables constituent des éléments de preuve recevables, sans priver chaque partie de la possibilité de les contester par tout moyen.

Les notifications contractuelles sont adressées aux coordonnées du Bon de commande. Les mises en demeure, résiliations et notifications relatives à une violation importante sont envoyées par un moyen permettant d’en établir la réception.

### 30. Droit applicable et règlement des litiges

Le contrat est soumis au droit français. Les parties recherchent de bonne foi une solution amiable et organisent une escalade entre responsables habilités avant toute action, sauf urgence, mesure conservatoire ou délai de prescription.

Lorsque le Client et RODANBTECH ont tous deux la qualité de commerçant, tout litige relatif à la validité, l’interprétation, l’exécution ou la fin du contrat relève de la compétence exclusive du tribunal de commerce de Paris, y compris en référé, pluralité de défendeurs ou appel en garantie. Dans les autres cas, les juridictions compétentes sont déterminées par les règles impératives applicables.

### 31. Dispositions générales

La nullité d’une clause n’affecte pas les autres stipulations ; les parties la remplacent par une clause valable se rapprochant de son objectif. Le fait de ne pas exercer un droit n’emporte pas renonciation. Le contrat exprime l’intégralité de l’accord sur son objet.

RODANBTECH peut modifier les présentes CGS pour des motifs légaux, de sécurité ou d’évolution raisonnable. Les modifications substantielles sont notifiées avec un préavis d’au moins trente jours. Lorsqu’elles dégradent significativement un engagement essentiel en cours de période ferme, le Client peut résilier avant leur prise d’effet sans pénalité pour la période non consommée, sauf modification imposée par la loi ou indispensable à la sécurité.

DOCUMENT 3

CONDITIONS D’UTILISATION DE L’ESPACE GARAGE / PRO

Applicables individuellement aux salariés, dirigeants, prestataires et membres autorisés du Client

### 1. Accès et acceptation

L’accès à l’Espace Garage est réservé aux personnes autorisées par un Client disposant d’un abonnement actif. En créant ou utilisant un compte, l’Utilisateur accepte les présentes conditions et reconnaît agir dans le cadre professionnel défini par son organisation.

L’Utilisateur doit fournir des informations exactes et informer son administrateur de tout changement affectant ses droits d’accès.

### 2. Compte personnel

Le compte est nominatif. L’Utilisateur garde ses moyens d’authentification confidentiels, ne laisse pas une session ouverte sur un équipement accessible à des tiers et signale immédiatement toute suspicion de compromission.

RODANBTECH ou l’administrateur du Client peut suspendre un compte en cas de risque, départ, changement de fonction, usage abusif ou demande du Client.

### 3. Respect des habilitations

L’Utilisateur ne consulte, modifie, exporte ou partage que les informations nécessaires à sa mission. Il ne tente pas d’accéder à un autre garage, centre, client ou rôle, même si une interface ou une erreur technique semble le permettre.

Les exports, suppressions, changements de rôles, publications, devis et actions sensibles doivent respecter les procédures internes du Client.

### 4. Données professionnelles et clients

L’Utilisateur saisit uniquement des données utiles, exactes et obtenues licitement. Il évite les commentaires excessifs, injurieux, discriminatoires ou sans lien avec le dossier automobile. Il n’importe pas de documents personnels non nécessaires.

Toute donnée relative à la santé, aux opinions, à la vie privée ou à une autre catégorie sensible doit être exclue, sauf nécessité exceptionnelle, base légale et instruction documentée du Client.

### 5. Devis, factures, diagnostics et communications

L’Utilisateur vérifie les prix, taxes, identités, références, pièces, temps, conditions de garantie et mentions obligatoires avant tout envoi ou validation. Le Service ne remplace ni le contrôle métier, ni les procédures comptables, ni les obligations de conseil du garage.

Une demande de rendez-vous n’est définitivement acceptée qu’après confirmation explicite du garage. Un créneau affiché comme souhaité, proposé ou indicatif n’est pas un engagement tant que son statut ne l’indique pas clairement.

### 6. Intelligence artificielle

Tout contenu généré par IA doit être relu par une personne compétente. L’Utilisateur vérifie les faits, références, prix, diagnostics, recommandations et droits sur les contenus avant diffusion.

Il est interdit de présenter une suggestion IA comme une expertise certifiée, de laisser l’IA prendre seule une décision affectant significativement un client ou d’introduire des données sensibles ou inutiles dans une invite.

### 7. Usages interdits

- usurper l’identité d’un tiers ou créer des comptes non autorisés ;

- exporter massivement des données sans motif professionnel et autorisation ;

- envoyer des communications commerciales sans base légale ou mécanisme d’opposition ;

- modifier des preuves, journaux, statuts ou documents pour dissimuler une action ;

- introduire des logiciels malveillants, contourner les limitations ou tester la sécurité sans autorisation écrite ;

- utiliser les données d’un client à des fins personnelles ou étrangères à la relation garage-client.

### 8. Journaux et contrôles

Pour des finalités de sécurité, preuve, support et conformité, les actions peuvent être journalisées : connexion, création, modification, export, suppression, changement de statut ou d’habilitation. Le Client peut accéder aux journaux selon son offre et ses propres obligations.

Les contrôles doivent rester proportionnés, transparents et conformes au droit du travail applicable. RODANBTECH ne décide pas des usages de surveillance mis en place par le Client.

### 9. Fin d’accès

À la fin de la mission ou sur demande du Client, l’accès est révoqué. L’Utilisateur restitue ou supprime les exports et documents locaux qu’il n’est plus autorisé à conserver. Les obligations de confidentialité survivent à la fermeture du compte.

DOCUMENT 4

CONDITIONS D’UTILISATION DE L’ESPACE CLIENT

Applicables aux automobilistes utilisant l’interface fournie par leur garage

| Rôle de Clikarage Clikarage met à disposition l’outil numérique. Le garage sélectionné demeure seul responsable de ses prestations, diagnostics, prix, devis, factures, garanties, rendez-vous et obligations vis-à-vis de l’automobiliste. |
| --- |

### 1. Objet

L’Espace Client permet notamment de transmettre une demande, proposer un créneau, enregistrer un véhicule, suivre certains statuts, échanger des messages, consulter ou accepter des documents lorsque ces fonctions sont activées par le garage.

L’utilisation de l’Espace Client ne crée pas, à elle seule, un contrat de réparation, de vente ou de garantie avec RODANBTECH.

### 2. Compte et exactitude des informations

L’Utilisateur fournit des coordonnées et informations véhicule exactes et à jour. Il protège son lien de connexion, son mot de passe et les liens sécurisés vers ses devis ou documents.

En cas d’erreur, d’usurpation ou de perte d’accès, il contacte en priorité le garage concerné et, pour un problème technique, le support Clikarage.

### 3. Demandes et rendez-vous

Sauf indication explicite « confirmé », le créneau sélectionné constitue une préférence ou une demande adressée au garage. Le garage peut confirmer, refuser ou proposer un autre créneau selon ses disponibilités.

L’Utilisateur vérifie les informations de confirmation et prévient le garage en cas d’empêchement. Les conditions d’annulation, retard, véhicule immobilisé, diagnostic ou facturation sont celles communiquées par le garage.

### 4. Devis et décisions

L’acceptation électronique d’un devis engage l’Utilisateur selon les informations affichées et les conditions du garage. Avant d’accepter, l’Utilisateur vérifie l’identité du garage, le véhicule, les prestations, prix, taxes, durée de validité et éventuelles réserves.

Clikarage assure la transmission technique de l’action mais ne certifie pas le contenu du devis, la nécessité des travaux ou leur conformité. Toute question métier doit être adressée au garage.

### 5. Documents et historique véhicule

Les documents accessibles dans l’Espace Client sont fournis par le garage ou générés à partir de ses données. L’Utilisateur conserve les originaux et vérifie les documents importants.

Tout partage d’historique véhicule avec un garage doit être volontaire, limité et révocable selon les fonctionnalités disponibles. Le partage ne transfère pas la propriété du véhicule ni ne vaut garantie d’exhaustivité.

### 6. Messages et contenus

L’Utilisateur reste courtois, transmet uniquement les informations utiles au dossier et s’abstient de tout contenu illicite, dangereux, menaçant, diffamatoire, discriminatoire, frauduleux ou portant atteinte aux droits d’autrui.

Les urgences liées à la sécurité routière, à un accident, un incendie, une panne dangereuse ou un risque corporel ne doivent pas être traitées uniquement par messagerie : l’Utilisateur contacte les services d’urgence ou un professionnel approprié.

### 7. Disponibilité et limites

L’Espace Client peut être temporairement indisponible pour maintenance, incident réseau ou dépendance tierce. L’Utilisateur conserve les références de rendez-vous ou documents importants et contacte directement le garage lorsque la situation l’exige.

RODANBTECH n’est pas responsable des actes, retards, prestations, conseils, prix ou refus du garage. Cette limitation ne prive pas l’Utilisateur des droits impératifs qu’il détient à l’encontre de son garage ou de RODANBTECH pour une faute propre de ce dernier.

### 8. Données personnelles

Le garage est généralement responsable du traitement des données liées à la relation automobile. RODANBTECH les traite pour son compte afin de fournir l’Espace Client. Pour la création et la sécurité du compte Clikarage, RODANBTECH peut agir comme responsable de traitement distinct. Les détails figurent dans la Politique de confidentialité.

### 9. Suspension et suppression

Un compte peut être suspendu en cas de fraude, sécurité compromise, contenu illicite ou usage perturbant le Service. L’Utilisateur peut demander la fermeture de son compte, sans préjudice des données que le garage doit conserver pour respecter ses obligations légales ou défendre ses droits.

Une demande de suppression portant sur un dossier automobile est transmise au garage responsable, avec l’assistance technique de RODANBTECH lorsque nécessaire.

### 10. Droit applicable et réclamations

Les présentes conditions sont soumises au droit français, sous réserve des règles impératives protégeant l’Utilisateur. Les réclamations relatives à une prestation automobile doivent être adressées au garage ; les réclamations techniques ou relatives au compte Clikarage peuvent être adressées à `anas.rodriguez@rodanbtech.com`.

DOCUMENT 5

POLITIQUE DE CONFIDENTIALITÉ

Information transparente pour les utilisateurs professionnels, automobilistes, prospects et visiteurs

Dernière mise à jour : 19 juillet 2026. Cette politique explique comment RODANBTECH traite les données personnelles dans le cadre de Clikarage. Elle doit être adaptée aux outils effectivement activés.

## 1. Qui traite vos données ?

RODANBTECH peut intervenir selon deux rôles distincts :

- Responsable de traitement pour l’administration du site et de la plateforme, la création et la sécurité des comptes, la gestion des abonnements, la facturation, le support, la prévention de la fraude, les communications propres à RODANBTECH et le respect de ses obligations légales.

- Sous-traitant du garage ou du réseau pour les données métier que celui-ci saisit ou traite dans Clikarage : clients, véhicules, rendez-vous, devis, interventions, messages, documents, garanties, historique et données assimilées.

Lorsque votre demande concerne une prestation automobile, un devis, un rendez-vous ou un dossier géré par un garage, ce garage est votre interlocuteur principal pour l’exercice de vos droits. RODANBTECH l’assiste techniquement.

## 2. Coordonnées

- Responsable : Anas RODRIGUEZ BENKARROUM, entrepreneur individuel exerçant sous le nom RODANBTECH, 47 rue Vivienne, 75002 Paris, France.

- Contact vie privée et support : `anas.rodriguez@rodanbtech.com`.

- Délégué à la protection des données : aucun DPO formellement désigné à ce jour.

## 3. Catégories de personnes concernées

- dirigeants, salariés, prestataires et utilisateurs des garages ou réseaux clients ;

- automobilistes, propriétaires, conducteurs, prospects et contacts des garages ;

- prospects, partenaires, fournisseurs et visiteurs des sites RODANBTECH ;

- personnes contactant le support, exerçant un droit ou signalant un incident.

## 4. Données traitées

Selon le rôle et les fonctions effectivement utilisées, Clikarage traite notamment :

- identité, coordonnées professionnelles ou personnelles, garage de rattachement et rôle ;
- adresse e-mail, identifiants techniques, données d’authentification, sessions et preuve d’acceptation juridique ;
- demandes de rendez-vous, références, créneaux souhaités, messages, statut et historique ;
- données relatives aux véhicules : marque, modèle, immatriculation, VIN lorsqu’il est renseigné, kilométrage et historique partagé ;
- données de devis : prestations, lignes, prix, taxes, statut, validité et preuve d’acceptation ou de refus ;
- données d’atelier, clients et membres du garage lorsque les modules sont activés ;
- données techniques : adresse IP, type de navigateur, événements de sécurité, journaux d’accès et informations de diagnostic ;
- préférences de langue, thème, marque de démonstration et autres réglages enregistrés dans le navigateur ;
- logos de garage ou éléments de branding lorsque le stockage correspondant est utilisé.

Le stockage métier de photographies et documents automobiles n’est pas activé à la date de cette version. Aucune donnée de paiement n’est traitée par Stripe et aucune donnée n’est envoyée à OpenAI ou à un autre fournisseur d’IA.

Les données sensibles au sens de l’article 9 du RGPD ne sont ni demandées ni nécessaires. Leur saisie dans un champ libre doit être évitée.

## 5. Finalités, bases légales et durées

| Traitement | Rôle de RODANBTECH | Finalité | Base légale principale | Durée de référence |
| --- | --- | --- | --- | --- |
| Création et gestion des comptes Pro/Client | Responsable ou sous-traitant selon le compte | Authentification, accès, rôles et sécurité | Contrat / intérêt légitime / instructions du garage | Compte actif, puis archivage probatoire maximal de 3 ans |
| Acceptation des CGU et versions juridiques | Responsable | Preuve, opposabilité et conformité | Contrat / intérêt légitime | Durée du compte ou contrat + 5 ans |
| Données clients, véhicules, atelier, rendez-vous, devis et messages | Sous-traitant | Fournir les modules choisis par le garage | Instructions du garage ; base déterminée par le garage | Selon les instructions du garage ; à défaut, contrat + réversibilité de 30 jours |
| Demandes de réservation adressées à un garage | Sous-traitant | Transmettre, suivre et confirmer la demande | Mesures précontractuelles ou contrat déterminés par le garage | Selon la politique du garage ; à défaut, 3 ans après clôture de la demande |
| Administration, support et facturation SaaS | Responsable | Exécuter et gérer la relation B2B | Contrat / obligation légale | Contrat + 5 ans ; factures 10 ans |
| Sécurité, prévention des abus et journaux | Responsable et sous-traitant | Protéger les comptes, données et service | Intérêt légitime / obligation de sécurité | 6 à 12 mois en principe, plus en cas d’incident documenté |
| Prospection B2B propre de RODANBTECH | Responsable | Présenter Clikarage à des professionnels | Intérêt légitime, avec droit d’opposition | 3 ans après le dernier contact actif |
| Mesure d’audience Vercel, si effectivement activée | Responsable | Statistiques agrégées de fréquentation et performance | Intérêt légitime si les conditions d’exemption sont remplies ; sinon consentement | Selon la configuration et la documentation Vercel |
| Messagerie professionnelle Google Workspace | Responsable | Répondre aux demandes et conserver les échanges utiles | Contrat / intérêt légitime | Selon la nature du dossier, généralement 3 à 5 ans |
| Démonstration locale | Responsable | Permettre une démonstration sans écrire dans la base de production | Intérêt légitime | Données conservées dans le navigateur jusqu’à réinitialisation ou effacement local |

## 6. Sources des données

- vous-même, lors de la création d’un compte, d’une demande ou d’un échange ;

- le garage, son réseau, ses collaborateurs ou prestataires autorisés ;

- les systèmes intégrés par le garage, sous sa responsabilité ;

- les journaux techniques générés lors de l’utilisation ;

- des sources publiques ou professionnelles licites pour la prospection B2B, dans le respect du droit d’opposition.

## 7. Destinataires

- les personnes habilitées de RODANBTECH ayant besoin d’accéder aux données pour l’exploitation, le support, la sécurité, la facturation ou la conformité ;

- les membres habilités du garage ou du réseau concerné, selon leurs rôles ;

- les prestataires techniques identifiés dans la liste des sous-traitants, dans la limite de leur mission ;

- les autorités, juridictions, conseils ou assureurs lorsque la loi, un incident ou la défense de droits le justifie ;

- un acquéreur ou successeur de l’activité, sous garanties de confidentialité et d’information appropriées.

## 8. Sous-traitants et transferts internationaux

La liste à jour des prestataires et sous-traitants est reproduite dans le Document 8 du présent pack et doit être publiée dans l’espace juridique de Clikarage avant le premier client réel. Les prestataires sont sélectionnés au regard de leur sécurité, localisation, engagements et nécessité opérationnelle.

Lorsque des données sont transférées hors de l’Espace économique européen vers un pays ne bénéficiant pas d’une décision d’adéquation, RODANBTECH met en place un mécanisme de transfert approprié, tel que les clauses contractuelles types de la Commission européenne, et évalue si des mesures supplémentaires sont nécessaires. Le détail applicable est communiqué sur demande ou dans le DPA.

## 9. Sécurité

- contrôles d’accès fondés sur les rôles et isolation logique des organisations ;

- authentification, gestion de sessions et multifacteur pour les rôles sensibles lorsque disponible ;

- chiffrement des communications et protection des données stockées selon les services utilisés ;

- journalisation des actions sensibles, surveillance et procédures d’incident ;

- sauvegardes, tests de restauration et gestion des vulnérabilités selon le niveau de service ;

- minimisation des données envoyées aux intégrations et fonctions IA.

Aucune mesure ne supprime totalement les risques. Les utilisateurs doivent protéger leurs accès, maintenir leurs équipements à jour et signaler rapidement toute anomalie.

## 10. Décisions automatisées et IA

Clikarage n’a pas vocation à prendre, sans intervention humaine, une décision produisant des effets juridiques ou affectant de manière similaire une personne. Les suggestions, scores, classifications ou contenus générés doivent être contrôlés par le garage. Si une fonctionnalité future modifie cette situation, une information et les garanties requises seront mises en place avant activation.

## 11. Vos droits

- accès à vos données et obtention d’une copie ;

- rectification des données inexactes ;

- effacement dans les conditions prévues par la loi ;

- limitation du traitement ;

- opposition à un traitement fondé sur l’intérêt légitime, notamment à la prospection ;

- portabilité lorsque le traitement est fondé sur le consentement ou le contrat et automatisé ;

- retrait du consentement à tout moment, sans remettre en cause les traitements antérieurs ;

- définition de directives relatives au sort de vos données après votre décès, lorsque le droit français s’applique.

Pour un dossier géré par un garage, adressez votre demande au garage concerné. Vous pouvez également écrire à `anas.rodriguez@rodanbtech.com` ; RODANBTECH identifiera le responsable pertinent et l’assistera. Une preuve d’identité proportionnée peut être demandée en cas de doute raisonnable.

Vous pouvez introduire une réclamation auprès de la CNIL ou de l’autorité de contrôle compétente, sans préjudice de tout autre recours.

## 12. Cookies et traceurs

Le Service utilise des mécanismes de stockage et de session nécessaires à l’authentification, aux préférences, aux preuves d’acceptation et à la démonstration. Aucun traceur publicitaire n’est déclaré. Vercel Web Analytics ne doit être considéré comme actif qu’après vérification du déploiement et de sa configuration. Les détails figurent dans la Politique relative aux cookies et autres traceurs.

## 13. Mineurs

Clikarage est destiné à la gestion d’une relation automobile. Les comptes ne sont pas destinés aux enfants. Lorsqu’un mineur utilise le Service pour un véhicule ou une prestation, le garage doit vérifier sa capacité et les autorisations nécessaires selon le contexte.

## 14. Modification de la politique

Cette politique peut évoluer. Les changements importants sont signalés par un moyen approprié et la date de mise à jour est modifiée. Lorsque le droit l’exige, un nouveau consentement est recueilli.

DOCUMENT 6

POLITIQUE RELATIVE AUX COOKIES ET AUTRES TRACEURS

Version alignée sur le dépôt `garageflow-claude-lab`

## 1. Technologies utilisées

Clikarage peut utiliser des cookies, le `localStorage`, le `sessionStorage`, le cache PWA et d’autres mécanismes de lecture ou d’écriture dans le terminal. Leur qualification juridique dépend de leur fonction et non de leur nom technique.

## 2. État constaté

À la date de cette version :

- aucun cookie publicitaire, Meta Pixel ou Google Analytics n’a été identifié dans le dépôt de référence ;
- l’application utilise Supabase Auth et conserve techniquement la session dans le navigateur ;
- des préférences de langue, thème, marque, acceptation juridique et données de démonstration peuvent être enregistrées localement ;
- des clés techniques historiques contenant le terme « garageflow » sont volontairement conservées pour la continuité des sessions et des données de démonstration ; elles ne constituent pas une marque affichée à l’utilisateur ;
- Vercel Web Analytics est déclaré par l’exploitant, mais son chargement effectif doit être vérifié sur le déploiement avant de le présenter comme actif ;
- la police Inter est actuellement susceptible d’être chargée depuis Google Fonts, ce qui entraîne une requête technique vers Google. Son auto-hébergement est recommandé avant la mise en production réelle.

## 3. Traceurs strictement nécessaires

Les mécanismes nécessaires à l’authentification, à la sécurité, au maintien de la session, à l’équilibrage de charge, aux préférences expressément demandées, à l’acceptation des documents juridiques et au fonctionnement hors ligne peuvent être utilisés sans consentement préalable lorsqu’ils sont strictement limités à ces finalités.

## 4. Mesure d’audience

Vercel Web Analytics ne peut être utilisé sans consentement que si sa configuration respecte effectivement les conditions d’exemption applicables : finalité limitée à la mesure d’audience du seul service pour le compte exclusif de RODANBTECH, absence de suivi intersites, données minimisées, durée limitée et possibilité d’opposition lorsque le traitement repose sur l’intérêt légitime.

Si ces conditions ne sont pas démontrées, l’outil doit rester désactivé jusqu’au recueil d’un consentement valable.

## 5. Inventaire opérationnel

| Mécanisme | Fournisseur | Finalité | Durée | Statut juridique |
| --- | --- | --- | --- | --- |
| Session Supabase Auth | RODANBTECH / Supabase | Connexion, renouvellement et sécurité de session | Durée de session et paramètres Supabase | Nécessaire |
| Préférences de langue et thème | RODANBTECH | Mémoriser le choix demandé | Jusqu’à modification ou effacement navigateur | Nécessaire / préférence |
| Preuve d’acceptation juridique | RODANBTECH / Supabase | Version, date et acceptation des conditions | Selon politique de conservation | Nécessaire à la preuve contractuelle |
| Données de démonstration locales | RODANBTECH | Faire fonctionner la démo sans production | Jusqu’à réinitialisation ou effacement navigateur | Nécessaire à la fonctionnalité demandée |
| Cache PWA / service worker | RODANBTECH / Vercel | Installation, performance et fonctionnement hors ligne | Jusqu’à mise à jour ou suppression de l’application | Nécessaire |
| Vercel Web Analytics | Vercel | Audience et performance agrégées | Selon configuration Vercel | Conditionnel : exemption à vérifier ou consentement |
| Google Fonts | Google | Fourniture de la police Inter | Requête technique lors du chargement | Ressource tierce à auto-héberger ou documenter |

## 6. Choix de l’utilisateur

Tant qu’aucun traceur optionnel n’est activé, aucun bandeau d’acceptation généralisé n’est nécessaire. Un lien permanent vers la présente politique doit toutefois être disponible.

Dès qu’un traceur optionnel est ajouté, Clikarage doit :

- le bloquer avant le choix ;
- proposer « Accepter » et « Refuser » avec une facilité équivalente ;
- permettre un choix par finalité ;
- conserver une preuve du choix pendant une durée proportionnée ;
- proposer un moyen permanent de retirer le consentement.

## 7. Modification

Cette politique doit être revue après chaque ajout de fournisseur, SDK, script, contenu embarqué, solution d’analyse, paiement, messagerie, publicité ou outil d’intelligence artificielle.

DOCUMENT 7

ACCORD DE SOUS-TRAITANCE DES DONNÉES PERSONNELLES — DPA

Annexe au contrat B2B conformément à l’article 28 du RGPD

| Parties Responsable de traitement : le Client / garage. Sous-traitant : RODANBTECH. Le présent DPA ne couvre pas les traitements pour lesquels RODANBTECH détermine seul les finalités et moyens essentiels, décrits dans sa Politique de confidentialité. |
| --- |

### 1. Objet et durée

Le présent accord encadre les traitements de données personnelles réalisés par RODANBTECH pour le compte du Client dans le cadre de la fourniture de Clikarage. Il s’applique pendant la durée du contrat et jusqu’à la suppression ou restitution des données conformément à ses stipulations.

### 2. Instructions documentées

RODANBTECH traite les données uniquement sur instruction documentée du Client, y compris pour les transferts, sauf obligation résultant du droit de l’Union ou du droit d’un État membre. Dans ce cas, RODANBTECH informe le Client avant le traitement, sauf interdiction légale.

Le contrat, le Bon de commande, les paramétrages autorisés, les tickets validés et les instructions écrites des interlocuteurs habilités constituent des instructions documentées. Si RODANBTECH estime qu’une instruction viole la réglementation, il en informe le Client et peut suspendre l’instruction concernée jusqu’à clarification.

### 3. Description du traitement

La nature, les finalités, catégories de données, personnes concernées et durées sont décrites à l’Annexe 1. Le Client s’assure que ces informations reflètent son utilisation réelle et notifie toute modification significative.

### 4. Confidentialité du personnel

RODANBTECH veille à ce que les personnes autorisées à traiter les données soient soumises à une obligation de confidentialité appropriée, reçoivent des instructions et n’accèdent qu’aux données nécessaires à leur mission.

### 5. Sécurité

RODANBTECH met en œuvre les mesures techniques et organisationnelles décrites à l’Annexe 2, compte tenu de l’état des connaissances, des coûts, de la nature, de la portée, du contexte et des finalités, ainsi que des risques pour les personnes.

Les mesures peuvent évoluer à condition de ne pas diminuer substantiellement le niveau global de protection. Le Client met en œuvre les mesures relevant de son contrôle, notamment la gestion des comptes, équipements, rôles, exports, bases légales et durées de conservation.

### 6. Sous-traitants ultérieurs

Le Client autorise de manière générale RODANBTECH à recourir aux sous-traitants ultérieurs listés à l’Annexe 3 ou sur la page de registre contractuelle. RODANBTECH leur impose par contrat des obligations de protection au moins équivalentes pour les prestations concernées.

RODANBTECH informe le Client au moins trente jours avant l’ajout ou le remplacement d’un sous-traitant susceptible de traiter les Données Client, sauf urgence de sécurité ou continuité. Le Client peut formuler une objection motivée par des raisons sérieuses de protection des données. Les parties recherchent une solution ; à défaut, le Client peut résilier le module affecté ou le contrat si le sous-traitant est indispensable, sans pénalité pour la période future non consommée.

### 7. Transferts hors EEE

RODANBTECH ne transfère ni ne rend accessibles les données depuis un pays tiers sans mécanisme conforme. Lorsqu’aucune décision d’adéquation ne s’applique, les parties ou le sous-traitant ultérieur mettent en place les clauses contractuelles types pertinentes et, si nécessaire, des mesures supplémentaires.

RODANBTECH tient à disposition les informations raisonnables sur la localisation, le mécanisme utilisé et les catégories de données concernées, sous réserve des obligations de confidentialité et de sécurité.

### 8. Droits des personnes

Compte tenu de la nature du traitement, RODANBTECH aide le Client par des mesures techniques et organisationnelles appropriées à répondre aux demandes d’accès, rectification, effacement, limitation, opposition et portabilité.

Toute demande reçue directement concernant un traitement du Client est transmise sans délai indu au Client, sauf autorisation de répondre. RODANBTECH n’évalue pas seul le bien-fondé juridique de la demande. Les demandes complexes ou répétées excédant les fonctions standard peuvent faire l’objet d’un devis, sauf lorsqu’elles résultent d’un manquement de RODANBTECH.

### 9. Assistance à la conformité

RODANBTECH fournit une assistance raisonnable pour la sécurité, les violations, analyses d’impact, consultations préalables et échanges avec l’autorité, compte tenu des informations disponibles et de la nature du Service.

Le Client demeure responsable de la décision de réaliser une analyse d’impact, de la description de ses traitements et de ses obligations d’information. Une assistance exceptionnelle peut être facturée selon devis, sauf lorsqu’elle résulte d’un manquement de RODANBTECH.

### 10. Violations de données

RODANBTECH notifie au Client toute violation de données personnelles affectant les données traitées pour son compte sans délai indu après en avoir pris connaissance et vise une notification initiale dans les quarante-huit heures suivant la confirmation raisonnable de l’incident. Cette notification peut être complétée progressivement.

La notification précise, à mesure que les informations deviennent disponibles : la nature de la violation, les catégories et volumes approximatifs, les conséquences probables, les mesures prises ou proposées, les coordonnées du point de contact et les informations utiles aux obligations du Client.

RODANBTECH enquête, contient, remédie et conserve une documentation. Le Client décide des notifications à l’autorité et aux personnes, sauf obligation propre de RODANBTECH. Aucune communication publique nommant l’autre partie n’est faite sans coordination, sauf obligation légale.

### 11. Documentation et audits

RODANBTECH met à disposition les informations nécessaires pour démontrer le respect du présent DPA et permet des audits selon les modalités des CGS. Les audits respectent la confidentialité, la sécurité, les droits des autres clients et la continuité du Service.

RODANBTECH peut fournir des attestations, rapports de tests, politiques, questionnaires ou synthèses. Un audit sur site est réservé aux situations où ces éléments sont insuffisants au regard d’un risque sérieux, d’un incident ou d’une demande d’autorité.

### 12. Sort des données

À la fin des prestations, selon le choix du Client et sous réserve des obligations légales, RODANBTECH restitue les données exportables puis les supprime ou les anonymise selon les délais contractuels. Les sauvegardes sont supprimées à l’expiration de leur cycle et restent isolées de l’usage courant.

RODANBTECH peut conserver les éléments strictement nécessaires à la preuve de ses obligations, à la défense de droits ou au respect d’une obligation légale, avec accès restreint et sans autre usage.

### 13. Responsabilité et priorité

La responsabilité relative au présent DPA est régie par le contrat principal, sous réserve des droits des personnes et autorités qui ne peuvent être limités. En cas de contradiction sur la protection des données, le DPA prévaut sur les CGS pour le point concerné.

## ANNEXE 1 — Description des traitements

| Rubrique | Description |
| --- | --- |
| Objet | Mise à disposition d’un SaaS de gestion automobile, relation client, rendez-vous, véhicules, atelier, devis, documents, communication et fonctions associées. |
| Durée | Durée du contrat, période de réversibilité et cycles de suppression / sauvegarde. |
| Nature des opérations | Collecte, enregistrement, organisation, consultation, modification, rapprochement, communication autorisée, hébergement, sauvegarde, export, suppression, assistance et journalisation. |
| Finalités | Exécuter les fonctionnalités choisies par le garage, permettre sa relation client, sécuriser et maintenir le Service, fournir le support selon ses instructions. |
| Personnes | Clients, prospects et contacts du garage ; propriétaires ou conducteurs ; salariés et prestataires du garage ; contacts de partenaires lorsque importés. |
| Données | Identité, coordonnées, comptes, messages, consentements, véhicule, immatriculation, VIN, kilométrage, historique, prestations, devis, factures, paiements si activés, documents, photos, journaux et données techniques. |
| Données sensibles | Non requises par défaut. Leur saisie doit être évitée. Si un cas exceptionnel existe, le Client doit le documenter et mettre en place des garanties adaptées. |
| Fréquence | Continue pendant l’utilisation du Service. |

## ANNEXE 2 — Mesures techniques et organisationnelles

| Domaine | Mesures |
| --- | --- |
| Gouvernance | Politiques de sécurité et confidentialité, rôles définis, revue des risques, procédure d’incident, engagements de confidentialité. |
| Contrôle d’accès | Comptes nominatifs, RBAC, moindre privilège, révocation, MFA pour rôles sensibles lorsque disponible, séparation des environnements. |
| Isolation | Séparation logique par organisation/garage, politiques de contrôle d’accès en base, tests anti-fuite et validation côté serveur. |
| Chiffrement | TLS pour les communications ; chiffrement au repos fourni par l’hébergeur ; gestion sécurisée des secrets ; URLs temporaires pour fichiers sensibles lorsque disponibles. |
| Développement | Revue de code, validation des entrées, dépendances maintenues, prévention XSS/injection, secrets hors frontend, environnements distincts. |
| Disponibilité | Continuité et sauvegardes selon l’offre réellement souscrite. Dans la configuration actuelle gratuite, aucune sauvegarde automatique, restauration, RPO ou RTO n’est garantie par RODANBTECH. |
| Journalisation | Événements d’authentification et actions sensibles, protection des journaux, accès restreint, durées proportionnées. |
| Vulnérabilités | Mises à jour, scans ou tests adaptés, traitement priorisé, canal de signalement et suivi des correctifs. |
| Sous-traitants | Évaluation, DPA, localisation, contrôle des accès, notification des changements et retrait des accès en fin de prestation. |
| Données et IA | Minimisation, filtrage des données inutiles, consignes de non-envoi des données sensibles, absence d’entraînement généraliste sans accord. |
| Personnel | Accès selon besoin d’en connaître, sensibilisation, confidentialité, procédures d’arrivée/départ. |
| Effacement | Fonctions d’export/suppression, délais contractuels, purge des sauvegardes selon cycle, supports sécurisés. |

## ANNEXE 3 — Sous-traitants ultérieurs autorisés

L’autorisation générale donnée à RODANBTECH porte uniquement sur les fournisseurs actifs ci-dessous. Un fournisseur futur n’est autorisé qu’après information et mise à jour du registre.

| Prestataire | Service | Données concernées | Localisation principale | Garantie / transfert | Statut |
| --- | --- | --- | --- | --- | --- |
| Supabase Pte. Ltd | PostgreSQL, API, Auth, Edge Functions, stockage limité | Comptes, données métier, journaux et branding selon modules | Base principale Paris `eu-west-3`; opérations techniques possibles ailleurs | DPA Supabase à demander/signature via dashboard ; SCC intégrées pour transferts | Actif |
| Vercel Inc. | Hébergement frontend, CDN, déploiement, journaux et éventuellement Web Analytics | IP, requêtes, journaux techniques, événements d’audience si activés | Infrastructure mondiale, entité américaine | DPA Vercel et SCC | Actif ; Analytics à vérifier |
| Squarespace Ireland Limited | Domaine, DNS, site vitrine | Données de compte, DNS, journaux et visiteurs du site vitrine | Irlande et sous-traitants | DPA Squarespace et mécanismes de transfert | Actif |
| Google Cloud France SARL ou entité figurant au contrat Workspace | Messagerie professionnelle | Expéditeur, destinataire, métadonnées et contenu des échanges | EEE et infrastructure Google | DPA Google Workspace, SCC le cas échéant | Actif ; entité à confirmer sur facture |
| Google LLC / Google Fonts | Police web externe | IP, navigateur, en-têtes techniques | Infrastructure Google | À supprimer par auto-hébergement ou documenter | Actif dans le code audité, correction recommandée |
| Stripe | Paiements et abonnements | Données de paiement | — | Politique et DPA à intégrer avant activation | Non actif |
| Fournisseur IA | Fonctionnalités IA | Aucune donnée actuellement | — | DPA, no-training, région et analyse de transfert avant activation | Non actif |
| Fournisseur e-mail transactionnel | Notifications automatiques | Aucune donnée actuellement | — | DPA et minimisation avant activation | Non actif |

DOCUMENT 8

REGISTRES OPÉRATIONNELS

Liste des prestataires, durées de conservation et matrice des rôles

## A. Registre public / contractuel des prestataires

| Version | Prestataire | Fonction | Entité retenue | Région / transfert | Données | Statut au 19/07/2026 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026.07-r3 | Supabase | Base, Auth, API, fonctions, stockage limité | Supabase Pte. Ltd | Base Paris `eu-west-3`; SCC pour transferts | Comptes et données SaaS | Actif |
| 2026.07-r3 | Vercel | Frontend, CDN, déploiement | Vercel Inc. | États-Unis / infrastructure mondiale, DPA + SCC | IP, requêtes, logs | Actif |
| 2026.07-r3 | Vercel Web Analytics | Mesure d’audience | Vercel Inc. | À vérifier au déploiement | Événements agrégés | Conditionnel |
| 2026.07-r3 | Squarespace | Domaine, DNS, vitrine | Squarespace Ireland Limited | Irlande + sous-traitants | Compte, DNS, visiteurs vitrine | Actif |
| 2026.07-r3 | Google Workspace | Messagerie | Entité Google du contrat | EEE + transferts encadrés | E-mails et métadonnées | Actif |
| 2026.07-r3 | Google Fonts | Ressource typographique | Google | Requête externe | IP et en-têtes | À auto-héberger |
| 2026.07-r3 | Stripe | Paiement | Non déterminée | — | Aucune | Non actif |
| 2026.07-r3 | OpenAI / IA | IA externe | Aucun | — | Aucune | Non actif |

## B. Politique de conservation retenue

| Catégorie | Durée de référence | Justification | Action |
| --- | --- | --- | --- |
| Prospects B2B RODANBTECH | 3 ans après dernier contact actif | Intérêt légitime | Suppression ou conservation d’une opposition minimale |
| Contrats, commandes et preuves B2B | 5 ans après fin | Prescription et preuve | Archivage restreint |
| Factures et pièces comptables | 10 ans | Obligation légale | Archivage sécurisé |
| Comptes utilisateurs | Durée d’activité puis 3 ans en archivage probatoire | Contrat, sécurité et preuve | Suppression/pseudonymisation du surplus |
| Preuves d’acceptation CGU/CGS | Durée du compte ou contrat + 5 ans | Preuve contractuelle | Archivage restreint |
| Journaux d’authentification et sécurité | 6 à 12 mois | Sécurité | Prolongation uniquement en cas d’incident |
| Journaux d’audit métier | Durée décidée par le garage, défaut 24 mois | Instructions du responsable | Suppression ou anonymisation |
| Tickets et échanges support | 3 ans après clôture | Contrat et preuve | Suppression anticipée des pièces sensibles inutiles |
| Demandes de rendez-vous | Politique du garage ; défaut 3 ans après clôture | Relation client / preuve | Suppression ou anonymisation |
| Données métier du garage | Politique et obligations du garage | Garage responsable de traitement | Paramétrage ou instruction écrite |
| Données après résiliation | Export 30 jours, suppression active cible sous 30 jours supplémentaires | Réversibilité | Suppression ; copies techniques selon cycle effectif |
| Données de démonstration locales | Jusqu’à réinitialisation ou effacement du navigateur | Fonction de démonstration | Effacement local par l’utilisateur |
| Incidents de sécurité | 5 ans ou durée du contentieux | Sécurité et défense des droits | Accès très restreint |

## C. Matrice des rôles de traitement

| Traitement | Responsable | Sous-traitant | Commentaire |
| --- | --- | --- | --- |
| Gestion de la plateforme, comptes, sécurité et acceptations | RODANBTECH | Supabase, Vercel | Finalités et moyens essentiels déterminés par RODANBTECH |
| Abonnement et facturation SaaS | RODANBTECH | Prestataire de paiement lorsqu’il sera activé | Stripe n’est pas encore actif |
| Clients, véhicules, réservations, atelier, devis, messages et documents du garage | Garage / réseau | RODANBTECH puis ses sous-traitants | Traitement métier pour le compte du garage |
| Partage d’historique véhicule demandé par le client | Garage pour l’usage métier ; RODANBTECH pour le mécanisme technique | RODANBTECH | Le partage doit être volontaire, traçable et révocable selon la fonction |
| Prospection propre du garage | Garage | RODANBTECH si un module est activé | Le garage choisit la base légale, les destinataires et le message |
| Prospection propre RODANBTECH | RODANBTECH | Google Workspace ou futur fournisseur autorisé | Gestion de l’opposition par RODANBTECH |
| Mesure d’audience du site | RODANBTECH | Vercel si activé | Exemption de consentement à vérifier en configuration réelle |
| Statistiques irréversiblement anonymisées | Hors RGPD après anonymisation effective | — | Aucune réidentification raisonnablement possible |

DOCUMENT 9

ANNEXE DE NIVEAU DE SERVICE ET DE SÉCURITÉ

Version standard actuelle — obligation de moyens, sans SLA chiffré

## 1. Disponibilité

RODANBTECH met en œuvre des efforts raisonnables pour maintenir Clikarage accessible. **Aucun taux de disponibilité mensuel n’est garanti dans l’offre standard actuelle.** Un engagement chiffré ne devient contractuel que s’il figure dans un Bon de commande signé et si un dispositif de mesure, une infrastructure et des sauvegardes correspondants sont actifs.

## 2. Maintenance et exclusions

Les interruptions peuvent notamment résulter de maintenances, mises à jour de sécurité, incidents Vercel ou Supabase, limites de quotas, panne réseau, navigateur ou équipement du Client, erreur de configuration, usage abusif, force majeure ou fonctionnalité de démonstration.

Lorsque cela est raisonnablement possible, une maintenance planifiée ayant un impact significatif est annoncée à l’avance.

## 3. Support standard

| Niveau | Exemple | Premier retour visé | Engagement de résolution |
| --- | --- | --- | --- |
| Critique | Service principal indisponible ou suspicion de fuite grave | Dès que possible les jours ouvrés | Meilleurs efforts |
| Majeur | Fonction essentielle fortement dégradée | 1 jour ouvré | Meilleurs efforts |
| Normal | Anomalie non bloquante | 2 jours ouvrés | Planification raisonnable |
| Demande | Question, aide ou suggestion | 2 jours ouvrés | Aucun délai garanti |

Canal : `anas.rodriguez@rodanbtech.com`. Aucun support 24/7 n’est inclus.

## 4. Sauvegardes et reprise

La capture d’infrastructure fournie indique un projet Supabase sur une offre gratuite sans sauvegarde affichée. En conséquence :

- aucune sauvegarde automatique, restauration, immutabilité, RPO ou RTO n’est promise dans l’offre actuelle ;
- Clikarage ne doit pas être présenté comme système d’archivage légal unique ;
- le garage doit conserver ses originaux, factures, pièces comptables et documents réglementaires dans ses propres systèmes ;
- avant le premier hébergement de données métier critiques, RODANBTECH doit souscrire un plan de production avec sauvegardes et tester la restauration ;
- les engagements de reprise seront ensuite ajoutés par avenant ou SLA.

## 5. Mesures de sécurité réellement documentées

- Supabase Auth avec comptes séparés pour les espaces professionnels et clients ;
- isolation logique multi-garage et politiques RLS en base ;
- contrôle d’accès par rôle et garde d’acceptation des documents juridiques ;
- secrets non intégrés au frontend, clé publique `anon` uniquement ;
- tokens de devis longs et aléatoires, contrôles et transitions côté serveur ;
- données de démonstration séparées et locales, sans écriture dans la production ;
- chiffrement en transit et au repos fourni par les hébergeurs selon leurs offres.

## 6. Travaux de sécurisation obligatoires avant montée en charge

- ajouter les en-têtes CSP, X-Content-Type-Options, protection contre l’intégration en iframe, Referrer-Policy et Permissions-Policy ;
- activer la protection Supabase contre les mots de passe compromis ;
- corriger les vulnérabilités des dépendances de développement et automatiser l’audit ;
- réconcilier les migrations du dépôt et de la production ;
- ajouter monitoring, alertes, disponibilité externe et journalisation d’incidents ;
- étendre les tests anti-fuite au stockage et aux fonctions RPC ;
- auto-héberger les polices et vérifier les appels tiers en production.

DOCUMENT 10

CHARTE D’UTILISATION DES FONCTIONNALITÉS D’INTELLIGENCE ARTIFICIELLE

Règles préparatoires applicables uniquement après activation d’une fonctionnalité d’IA

## 0. État actuel

Aucun fournisseur d’intelligence artificielle externe n’est intégré à Clikarage au 19 juillet 2026. La présente charte constitue un cadre d’activation future et ne doit pas être interprétée comme la description d’un traitement actuellement réalisé.

## 1. Principes

- Assistance, jamais substitution aveugle : l’utilisateur reste décideur et responsable.

- Minimisation : ne transmettre que les données nécessaires à la tâche.

- Transparence : signaler un contenu généré ou modifié par IA lorsque le contexte ou la réglementation l’exige.

- Traçabilité : conserver, pour les usages sensibles, l’auteur de la demande, la version, les validations et modifications.

- Non-discrimination : contrôler les biais et ne pas déduire des caractéristiques sensibles sans base légale.

- Sécurité : ne jamais fournir de secrets, mots de passe, clés, données de carte, documents d’identité ou données de santé non nécessaires.

## 2. Usages autorisés sous contrôle humain

- reformuler une annonce ou un message à partir de faits vérifiés ;

- résumer un dossier ou une intervention pour faciliter la lecture ;

- proposer une checklist, un brouillon ou une classification ;

- suggérer des travaux complémentaires à soumettre au jugement d’un professionnel compétent ;

- traduire un texte avec relecture, en particulier pour les termes techniques et contractuels.

## 3. Usages interdits ou soumis à validation renforcée

- diagnostic mécanique autonome présenté comme certain ;

- décision automatique de refuser un client, fixer un prix individualisé ou évaluer sa solvabilité ;

- génération ou altération de preuves, factures, historiques, contrôles, kilométrages ou documents officiels ;

- conseil de sécurité critique sans validation d’un professionnel compétent ;

- reconnaissance de personnes, inférence de données sensibles ou surveillance non autorisée ;

- utilisation de contenus protégés sans droit ou imitation trompeuse d’une marque/personne ;

- envoi de Données Client à un outil IA externe non autorisé par l’organisation.

## 4. Vérifications obligatoires avant diffusion

1. Comparer le résultat aux données source et corriger les hallucinations ou omissions.

2. Vérifier les références véhicule, pièces, prix, taxes, dates, garanties et obligations de sécurité.

3. Retirer les données personnelles non nécessaires et vérifier le destinataire.

4. Contrôler le ton, la non-discrimination, les droits d’auteur et l’absence de promesse trompeuse.

5. Identifier clairement les limites et obtenir l’approbation requise avant envoi, publication ou décision.

## 5. Données et entraînement

Les Données Client ne doivent pas servir à entraîner un modèle généraliste du fournisseur ou de RODANBTECH sans accord écrit explicite, information appropriée et mécanisme de gouvernance. Les fournisseurs IA doivent être configurés, lorsque possible, sans réutilisation pour entraînement et avec une rétention minimale.

## 6. Compétence et sensibilisation

Le Client veille à ce que les utilisateurs des fonctions IA disposent d’une compréhension suffisante de leurs capacités, limites, risques de biais, confidentialité et supervision. RODANBTECH fournit des indications d’usage adaptées au niveau de risque des fonctions proposées.

## 7. Incident IA

Tout résultat dangereux, fuite de données, comportement discriminatoire, contenu illicite ou anomalie répétée est signalé à `anas.rodriguez@rodanbtech.com`. La fonction concernée peut être suspendue pendant l’enquête. Les utilisateurs conservent les éléments utiles sans les diffuser davantage.

DOCUMENT 11

CHECKLIST DE PUBLICATION ET DE SIGNATURE

Contrôle final avant le premier client réel et avant chaque évolution majeure

| Domaine | Contrôle | Fait |
| --- | --- | --- |
| Identité | SIREN/SIRET, adresse, RNE, TVA et directeur de publication vérifiés sur justificatifs officiels | ☐ |
| Contacts | Adresse unique anas.rodriguez@rodanbtech.com active et supervisée ; adresses spécialisées à créer avant montée en charge | ☐ |
| Hébergement | Vercel, Supabase, Squarespace et Google Workspace alignés avec les contrats et la production | ☐ |
| Sous-traitants | DPA signés, liste à jour, transferts et SCC vérifiés | ☐ |
| Cookies | Scan réel en production ; aucun traceur optionnel avant consentement ; refus aussi simple que l’acceptation | ☐ |
| Acceptations | Version + horodatage + utilisateur + preuve conservés pour CGS/CGU/DPA | ☐ |
| Rôles RGPD | Pages et contrats distinguent clairement responsable/sous-traitant | ☐ |
| Conservation | Durées configurées, suppression client documentée, réversibilité testée | ☐ |
| Droits | Workflow accès/export/rectification/suppression testé de bout en bout | ☐ |
| Sécurité | RLS/isolement, secrets et procédures vérifiés ; headers, monitoring, backups et restauration activés avant données critiques | ☐ |
| Violation | Canal 24×7, modèle de notification et responsabilités validés | ☐ |
| IA | Fournisseurs autorisés, no-training vérifié, minimisation, avertissements et validation humaine | ☐ |
| Commercial | Prix, engagement, indexation, quotas, frais tiers et retard de paiement alignés aux factures | ☐ |
| Responsabilité | Plafonds cohérents avec assurance RC Pro/cyber et négociation enterprise | ☐ |
| SLA | Seuls les niveaux réellement mesurés sont promis ; monitoring et rapports disponibles | ☐ |
| Marques | Aucun logo client/réseau utilisé sans autorisation ; démos clairement non officielles | ☐ |
| Traductions | EN/AR issues de la version maître ; revue terminologique ; version prévalente indiquée | ☐ |
| App stores | Déclarations de confidentialité cohérentes avec les traitements réels | ☐ |
| Revue finale | Avocat/Conseil et DPO ou référent privacy ont validé la version à publier | ☐ |

DOCUMENT 12

ANNEXE D’ALIGNEMENT TECHNIQUE AU DÉPÔT

Référence de conformité entre les textes et `Rodan325/garageflow-claude-lab`

## 1. Fonctionnalités juridiquement prises en compte

- application React/Vite installable en PWA ;
- espaces public, garage et client ;
- authentification Supabase et contrôles de routes ;
- gestion multi-garage avec isolation RLS ;
- réservations, clients, véhicules, rendez-vous, messages et devis ;
- acceptation ou refus de devis au moyen de liens sécurisés ;
- partage d’historique véhicule sous contrôle du client ;
- preuve d’acceptation des documents juridiques ;
- mode de démonstration local et séparé de la production ;
- branding Clikarage et scénarios de démonstration non officiels.

## 2. Technologies de terminal documentées

Les noms internes historiques tels que `garageflow-auth`, les clés `gf-*` et certains identifiants de démonstration sont maintenus pour éviter la perte de session et de données locales. Ils ne doivent pas être renommés sans migration technique. Les politiques publiques parlent de « stockage local technique » sans exposer inutilement ces noms.

## 3. Fonctions non actives ou non garanties

- OpenAI ou autre IA externe : non actif ;
- Stripe : non actif ;
- e-mails transactionnels automatiques : non actifs ;
- stockage métier de photos/documents : non actif ;
- sauvegardes Supabase, PITR, RPO et RTO : non garantis ;
- SLA chiffré ou support 24/7 : non inclus ;
- Vercel Web Analytics : activation technique à vérifier ;
- traductions complètes des espaces Pro/Client en anglais et arabe : non garanties tant que les écrans concernés restent en français.

## 4. Écarts techniques à traiter

| Priorité | Écart | Conséquence juridique ou contractuelle |
| --- | --- | --- |
| Avant production | Cohérence migrations dépôt/production | Impossible de garantir une reconstruction et une gouvernance fiables sans réconciliation |
| Avant données critiques | Absence de sauvegardes vérifiées | Interdiction de promettre archivage, restauration, RPO ou RTO |
| Avant montée en charge | Absence d’observabilité et alerting | Détection et notification d’incident plus difficiles |
| Sécurité | En-têtes applicatifs incomplets | Surface d’attaque et conformité sécurité à améliorer |
| Auth | Protection mots de passe compromis désactivée | Mesure de sécurité recommandée non active |
| Dépendances | Vulnérabilités de développement signalées | À corriger et surveiller en CI |
| Vie privée | Google Fonts externe | Requête vers un tiers ; auto-hébergement recommandé |
| Traceurs | Analytics non détecté dans les dépendances | Ne pas déclarer la collecte comme certaine sans vérification du déploiement |
| International | i18n partielle | Ne pas annoncer une application entièrement trilingue |

## 5. Règle de mise à jour

Toute modification du dépôt ajoutant un SDK, un script externe, un stockage, une API, un moyen de paiement, une fonctionnalité IA, une messagerie ou une nouvelle catégorie de données doit déclencher, avant déploiement :

1. un contrôle des flux et des traceurs ;
2. la mise à jour de la politique de confidentialité et du registre des sous-traitants ;
3. la vérification du DPA et des transferts ;
4. l’ajout des clauses ou consentements nécessaires ;
5. la mise à jour de la version juridique acceptée par les utilisateurs lorsque le changement est substantiel.

## Sources juridiques principales utilisées pour la rédaction

- Règlement (UE) 2016/679 (RGPD), notamment articles 5, 6, 12 à 22, 28, 32 à 36 et 44 à 49.

- Décision d’exécution (UE) 2021/915 relative aux clauses contractuelles types entre responsables et sous-traitants ; décision (UE) 2021/914 relative aux transferts vers des pays tiers.

- Loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique, mentions d’identification de l’éditeur.

- Code civil, notamment articles 1170, 1171, 1218 et 1231-3.

- Code de commerce, notamment articles L. 441-10 et D. 441-5 sur les retards de paiement entre professionnels.

- Recommandations et référentiels de la CNIL relatifs aux cookies, à la mesure d’audience, aux sous-traitants, aux violations de données et aux durées de conservation.

- Conditions, DPA et documentations officielles des prestataires Vercel, Supabase, Squarespace et Google Workspace, dans leurs versions consultées en juillet 2026.

- Règlement (UE) 2024/1689 sur l’intelligence artificielle, notamment obligations de culture IA et transparence applicables selon les fonctions et dates d’entrée en application.

| Version consolidée — prête à contractualiser après contrôles préalables identifiés Les informations d’identité, d’hébergement et de contact sont intégrées. Les champs restant entre crochets concernent uniquement un client ou un Bon de commande particulier. Avant le premier client réel, confirmer la TVA, les DPA, les sauvegardes, les traceurs et les mesures de sécurité listées dans la checklist. |
| --- |

<div style="page-break-before: always;"></div>

## Fiche de validation interne

| Rôle | Nom | Date | Visa / observations |
| --- | --- | --- | --- |
| Fondateur / direction |  |  |  |
| Référent technique / sécurité |  |  |  |
| Référent protection des données |  |  |  |
| Expert-comptable / fiscal |  |  |  |
| Conseil juridique |  |  |  |

Référence de version publiée : ____________________

Date d’entrée en vigueur : ____________________

URL / dépôt d’archive : ____________________

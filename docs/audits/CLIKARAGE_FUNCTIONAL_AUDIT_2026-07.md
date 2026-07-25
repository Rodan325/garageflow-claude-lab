# Audit fonctionnel, technique et produit Clikarage

Date : 24 juillet 2026

Branche : `main`

SHA : `a530678d78eb6492af800e2f8373ca4f7c6e0b2f`

Nature : audit du dépôt uniquement

## 1. Résumé exécutif

Clikarage est un démonstrateur produit avancé et un socle SaaS sérieux, mais pas encore
un produit commercial complet pour un premier garage payant. Le dépôt contient une
PWA trilingue, un portail client, un back-office garage, un cycle de devis robuste,
des modèles atelier avancés, des RLS substantielles et une démonstration réaliste.

La maturité est cependant très hétérogène :

- Les devis, l'authentification client, l'i18n, le branding, les pièces jointes
  sécurisées et l'archive juridique sont les blocs les plus solides.
- Les modules atelier avancé, recommandations, rapports, rappels, notifications,
  réseau et intégrations ont un backend et parfois une UI, mais neuf feature flags
  les maintiennent OFF pour les vrais comptes. Ils sont automatiquement actifs dans
  la démonstration, ce qui rend celle-ci plus complète que le produit réel.
- L'onboarding d'un garage, les invitations d'équipe, la récupération de mot de
  passe, l'import réel, l'ordre de réparation, le suivi des temps et les paiements
  manuels manquent.
- Le commerce de véhicules d'occasion n'existe pas au-delà d'une Edge Function
  inutilisée de génération de texte.
- Quatre risques P0 racines interdisent l'utilisation de données d'un garage payant :
  liaison message/tenant incohérente, autorisations de rôle trop larges, conversion
  rendez-vous non atomique et audit métier non fiable.

Verdict produit : prêt pour une démonstration encadrée; non prêt pour un garage
pilote manipulant des données réelles, un premier client payant ou une inscription
autonome.

## 2. Périmètre et méthode

L'audit a inspecté :

- les 46 composants `*Page.tsx` et les routes de `src/App.tsx`;
- les composants, hooks et 13 modules de `src/data`;
- les 40 migrations SQL, 36 tables publiques et la table privée
  `private.legal_document_versions`;
- les policies RLS, fonctions `SECURITY DEFINER`, triggers, grants et buckets;
- les trois Edge Functions;
- les 70 fichiers de tests, les scripts RLS, le seed et le store de démonstration;
- les flags de `.env.example`, `src/lib/env.ts` et `src/lib/features.ts`;
- les TODO, placeholders, simulations et chaînes indiquant une fonction future;
- la documentation d'activation et les documents juridiques.

Une route, une table ou un bouton n'a pas été considéré comme une fonctionnalité
complète sans persistance, autorisation, erreurs, tests et parcours cohérent.

Limites :

- aucun environnement Supabase n'a été consulté ou modifié;
- aucun test RLS n'a été exécuté, car il écrit des fixtures;
- aucune variable Vercel n'a été lue;
- les états Production `40/40`, huit preuves legacy et flags OFF proviennent du
  contexte de release validé, pas d'une requête réalisée pendant cet audit;
- les Edge Functions présentes dans Git ne prouvent pas leur déploiement.

## 3. État Git et divergence

Au début de l'audit, le worktree a été aligné sur `origin/main`. Les valeurs locales
et distantes étaient toutes deux :

```text
a530678d78eb6492af800e2f8373ca4f7c6e0b2f
```

Le worktree était propre. Aucune divergence avec le SHA Production indiqué n'a été
constatée. Les seuls fichiers ajoutés sont les cinq livrables sous `docs/audits`.

## 4. Architecture observée

| Couche | Observation | Preuve |
|---|---|---|
| Frontend | React 18, Vite, TypeScript strict, React Router, TanStack Query, Tailwind | `package.json`, `src/App.tsx` |
| PWA | `vite-plugin-pwa`, service worker généré | `vite.config.ts`, résultat build |
| Backend | Supabase Auth, Postgres, PostgREST/RPC, Storage, Edge Functions | `src/lib/supabase.ts`, `supabase/` |
| Données | 36 tables publiques, 1 table privée, 40 migrations | `supabase/migrations` |
| Tenant | `garages` représente l'organisation; `garage_centers` les établissements | migrations `20260713011000`, `20260715050000` |
| Auth | Profils staff/client; premier membership actif chargé | `AuthProvider.tsx:74-97` |
| Démo | Store séparé `localStorage`, comptes client/garage/réseau, branding Speedy | `src/lib/demo.ts`, `src/branding` |
| i18n | FR/EN/AR, `lang/dir`, catalogue global et contenu démo localisé | `src/i18n` |
| PDF | Devis et rapport de restitution via `@react-pdf/renderer` | `quotePdf.tsx`, `reportPdf.tsx` |
| Sécurité | RLS sur les tables, scripts anti-fuite, Storage privé | migrations, `scripts/rls-antileak.mjs` |
| Juridique | Corpus courant canonique, archives legacy, registre V2 privé, flags OFF | `src/features/legal`, migrations 34-40 |

## 5. Niveau de maturité

L'inventaire analyse 197 fonctionnalités atomiques :

| Statut | Nombre | Part approximative |
|---|---:|---:|
| COMPLETE | 20 | 10 % |
| PARTIELLE | 83 | 42 % |
| UI_SEULEMENT | 1 | 1 % |
| BACKEND_SEULEMENT | 15 | 8 % |
| MOCK_OU_DEMO | 8 | 4 % |
| ABSENTE | 57 | 29 % |
| INDETERMINEE | 1 | 1 % |
| BUGGUEE | 12 | 6 % |
| Total | 197 | 100 % avec arrondis |

Cette distribution correspond à une maturité « pré-commerciale » : la surface
fonctionnelle est large, mais le chemin critique atelier n'est pas fermé et beaucoup
de fonctionnalités sont plus avancées en démo qu'en compte réel.

## 6. Fonctionnalités réellement complètes

Les principales capacités classées `COMPLETE` sont :

- vérification email après inscription client;
- comptes et données de démonstration isolés;
- création/numérotation atomique des devis;
- lignes, quantités, prix, TVA et totaux serveur;
- conditions et date de validité obligatoires à l'envoi;
- versionnement et révision des devis;
- PDF de devis;
- consultation publique par jeton;
- protection fonctionnelle contre la modification silencieuse d'un devis accepté;
- preview CSV, limites, neutralisation de formules et erreurs ligne par ligne;
- uploads privés, MIME, taille et URL signée;
- absence de secrets évidents dans le frontend;
- flags juridiques fail-closed;
- conservation et consultation des preuves/archives juridiques;
- DPA self-service inactif.

Preuves principales : `src/data/quotes.ts`, migrations
`20260616011744_quote_server_authoritative.sql`,
`20260617191239_quote_lifecycle.sql`, `src/features/pro/quotePdf.tsx`,
`src/features/integrations/csvImport.ts`, migration
`20260715030000_attachments_notifications.sql`, et les tests associés.

## 7. Fonctionnalités partielles ou seulement préparées

### CRM et véhicules

Le garage peut créer et rechercher des clients et véhicules. Il ne peut pas éditer
un client depuis une fiche dédiée, l'archiver, fusionner les doublons ou consulter
une timeline. Les véhicules existent dans deux tables différentes :
`vehicles` pour le garage et `client_vehicles` pour l'automobiliste. La conversion
d'une demande crée encore une copie dans le CRM garage.

### Rendez-vous

Le client peut demander un créneau; le garage peut accepter, refuser ou proposer une
alternative et créer un rendez-vous. Il n'existe ni capacité atelier, ni détection de
conflit, ni assignation, ni vraie vue calendrier, ni historique des changements. La
conversion est une suite de writes non transactionnels.

### Atelier

Deux implémentations coexistent :

- un Kanban legacy sur `repairs`, actif avec les flags OFF, dont les transitions
  reposent largement sur le frontend;
- un workflow avancé sur `service_requests`, timeline append-only et RPC de
  transition, activé dans la démo ou par flag.

Le second est mieux conçu, mais ne contient toujours pas une fiche de réception,
un ordre de réparation, des temps, des lignes réalisées ou un paiement.

### Portail client

Le portail gère profil, véhicules, demandes et messages. Timeline, recommandations,
attachments et rapports sont conditionnels. Les devis passent par une route publique
à jeton plutôt que par une bibliothèque client authentifiée. L'intégrité des messages
présente un P0.

### Réseau

Les centres, rôles réseau, agrégats et transferts disposent d'un modèle et de RPCs.
Ils sont sous flag et ne doivent pas être affichés à un indépendant. Le socle est
`PARTIELLE`, non requis pour le premier garage indépendant.

## 8. Fonctionnalités simulées

- import CSV : preview et rapport réels, écriture simulée seulement;
- notifications externes : outbox et statuts réels, provider `demo-simulator`;
- données des comptes de présentation : store navigateur, pas Supabase;
- satisfaction : valeur vide ou de démonstration, aucune collecte;
- Edge Functions IA : fallback déterministe et éventuel appel fournisseur, mais
  aucune invocation dans l'application;
- plusieurs scénarios avancés sont complets dans le store démo alors que leurs flags
  sont OFF pour les vrais comptes.

## 9. Fonctionnalités absentes

Les absences structurantes sont :

- onboarding autonome d'un garage et invitations;
- récupération de mot de passe;
- gestion complète de l'équipe;
- archivage client et historique interactions;
- dossier véhicule canonique, historique kilométrage/propriétaires;
- capacité atelier, conflits, assignation et reschedule;
- fiche de réception et état d'entrée;
- ordre de réparation;
- temps prévu/réel et lignes réellement consommées;
- paiements manuels, remboursement/avoir;
- facture ou export facturable;
- export organisation;
- console de support et suspension;
- commerce VO : acquisition, coûts, stock, prospects, essais, vente, livraison,
  marge et garantie.

## 10. P0

Quatre écarts racines affectent 16 lignes de l'inventaire :

### P0-1 - liaison cross-tenant des messages

`service_request_messages` possède une FK sur `request_id` et une FK indépendante sur
`garage_id`. La policy garage vérifie le membership du `garage_id`; la branche client
vérifie la propriété du `request_id`. Rien ne garantit que les deux désignent le même
garage.

Conséquence : un identifiant forgé peut exposer le message d'une demande au mauvais
garage. Les scripts RLS testent de nombreux cas cross-tenant, mais pas cette
combinaison.

### P0-2 - autorisations de rôle trop larges

Les policies historiques `customers_rw`, `vehicles_rw`, `appointments_rw`,
`repairs_rw`, `quotes_rw`, `documents_rw` et `tasks_rw` accordent `FOR ALL` à tout
membre actif du garage. Une policy ultérieure autorise tout membre à supprimer une
demande et ses messages en cascade.

Conséquence : les rôles affichés ne sont pas des frontières de sécurité. Un mécanicien
peut modifier ou supprimer des données qu'il devrait seulement consulter.

### P0-3 - conversion demande/rendez-vous non atomique

L'Edge Function `request-to-appointment` crée successivement customer, véhicule,
appointment, puis met à jour la demande. Elle n'utilise ni transaction serveur, ni
verrou, ni contrainte d'unicité sur `service_request_id`.

Conséquence : retry ou panne partielle produit des doublons et des données orphelines.

### P0-4 - audit non fiable

La table `audit_logs` n'est alimentée par aucun code métier. Tout membre peut insérer
une ligne et fournir librement `actor_id` et `metadata`.

Conséquence : aucune preuve fiable des actions sensibles ne peut être produite.

## 11. P1, P2 et P3

La matrice complète est dans `CLIKARAGE_GAP_MATRIX_2026-07.md`.

- P1 : 25 écarts racines, 93 fonctionnalités affectées. Les plus structurants sont
  onboarding, rôles, dossier véhicule, planning, workflow unique, OR, paiements,
  import/export, pagination, observabilité et validation juridique humaine.
- P2 : 18 écarts racines, 58 fonctionnalités affectées. Ils concernent surtout la
  fluidité CRM, le calendrier, les documents, les notifications, l'accessibilité,
  la performance et les tests navigateur.
- P3 : 9 écarts racines, 30 fonctionnalités affectées. Ils couvrent notamment le
  commerce VO, le réseau, les providers externes et des dettes de tooling.

## 12. Dette technique

- Deux modèles véhicule et deux workflows atelier coexistent.
- Les rôles legacy et les rôles organisation/centre ne sont pas une autorité unique.
- Les modules avancés dégradent silencieusement en cas de schéma absent, utile pour
  le déploiement progressif mais susceptible de masquer une erreur de configuration.
- Les queries de listes chargent toutes les lignes.
- Le bundle principal minifié vaut 830.89 kB et le chunk React PDF 1,457.66 kB.
- Il n'existe pas d'ErrorBoundary globale ni d'observabilité applicative.
- Le test d'immuabilité des migrations est sensible à CRLF/LF.
- Le package et certains commentaires gardent des identifiants techniques historiques
  GarageFlow; ils ne sont pas une marque visible et sont conservés pour compatibilité.

## 13. Risques de sécurité

- P0 message/tenant et droits de rôle détaillés plus haut.
- Les suppressions en cascade sont incompatibles avec un historique métier fiable.
- Les Edge Functions IA n'appliquent pas de contrôle de tenant/rôle/flag dans leur
  propre corps. Leur déploiement et la présence d'une clé sont indéterminés.
- Les fonctions avancées récentes ont généralement un `search_path` explicite,
  `auth.uid()` et des grants bornés; plusieurs fonctions legacy utilisent seulement
  `set search_path = public`.
- L'audit log peut être forgé.
- L'absence de pagination favorise les extractions massives par un membre autorisé.
- La sécurité des logs Production est `INDETERMINEE` depuis le dépôt seul.

Points positifs : RLS activée, contrôle cross-tenant substantiel sur les modules
avancés, bucket privé, types et tailles contrôlés, URLs signées courtes, aucun
`service_role` dans le frontend et aucun secret évident détecté.

## 14. Risques métier

- Une démonstration peut laisser croire que le workflow avancé est disponible pour un
  garage réel alors qu'il dépend des flags.
- Le garage ne peut pas achever son cycle financier.
- L'absence d'OR fragilise la liaison devis/travaux.
- L'absence d'import/export rend l'entrée et la sortie client coûteuses.
- Les KPI atelier peuvent être faux ou vides avec le workflow legacy.
- Sans invitation, récupération de mot de passe et support outillé, l'exploitation
  dépend d'interventions techniques.
- La validation juridique humaine et le verrou d'activation restent obligatoires.

## 15. Scénario 1 - atelier

| Étape | Verdict | Preuve | Contournement actuel | Blocage |
|---|---|---|---|---|
| 1. Créer un client | Partielle | `ClientsPage.tsx`, `useCreateCustomer` | Création minimale | Rôle trop large, pas d'édition/archive |
| 2. Ajouter son véhicule | Partielle | `VehiclesPage.tsx`, table `vehicles` | Création garage | Dossier distinct du portail |
| 3. Créer un rendez-vous | Partielle | `CalendarPage.tsx`, BookingFlow | Création manuelle/demande | Aucun conflit/capacité |
| 4. Réceptionner le véhicule | Partielle | stage `vehicle_received` avancé | Changer un statut | Pas de fiche d'entrée, flag OFF |
| 5. Réaliser un diagnostic | Partielle | recommandations avancées | Note/recommandation | Pas de diagnostic global, flag OFF |
| 6. Créer un devis | Possible | QuoteEditor + RPCs | Aucun | Domaine solide |
| 7. Client consulte et accepte | Possible | `/devis/:token`, RPC accept | Lien public | Pas intégré au portail, preuve perfectible |
| 8. Créer/poursuivre l'OR | Impossible | aucun OR | Utiliser repair/status | Pas de contrat d'exécution |
| 9. Enregistrer travaux, pièces, temps | Impossible | aucune time entry/lignes réalisées | Notes libres/rapport | Données non structurées |
| 10. Marquer prêt | Partielle | stage `vehicle_ready` ou repair legacy | Changer le statut | Deux workflows |
| 11. Paiement partiel puis final | Impossible | aucune table | Hors Clikarage | Bloquant financier |
| 12. Restituer | Partielle | stage/rapport | Changer le statut | Pas de paiement/OR requis |
| 13. Conserver l'historique | Partielle | timeline avancée, quotes | Consulter plusieurs pages | Suppression possible, pas de timeline véhicule |

Conclusion : parcours atelier complet `NON`.

## 16. Scénario 2 - vente d'un véhicule

| Étape | Verdict | Preuve | Contournement actuel | Blocage |
|---|---|---|---|---|
| 1. Acquérir | Impossible | aucune table commerce | Fichier externe | Module absent |
| 2. Enregistrer les coûts | Impossible | aucun ledger | Tableur | Module absent |
| 3. Préparation | Partielle | repair générique | Utiliser atelier | Pas relié au stock |
| 4. Passer disponible | Impossible | statuts stock absents | Champ libre | State machine absente |
| 5. Fiche d'annonce | Impossible | Edge Function inutilisée | Texte externe | Pas d'UI/persistance |
| 6. Ajouter un prospect | Impossible | aucune table | CRM externe | Module absent |
| 7. Programmer un essai | Impossible | aucun type/flux essai | Agenda générique | Pas de lien prospect/véhicule |
| 8. Réserver | Impossible | aucune réservation stock | Hors outil | Module absent |
| 9. Enregistrer la vente | Impossible | aucune vente | Hors outil | Module absent |
| 10. Livrer | Impossible | rapport atelier seulement | Hors outil | Module absent |
| 11. Calculer la marge | Impossible | aucun coût/vente | Tableur | Module absent |
| 12. Suivre la garantie | Impossible | champ rapport libre | Notes | Aucun dossier VO |

Conclusion : parcours vente complet `NON`.

## 17. Scénario 3 - portail client

| Étape | Verdict | Preuve | Contournement actuel | Blocage |
|---|---|---|---|---|
| 1. Invitation par le garage | Impossible | aucune invitation | Inscription publique | Rattachement manuel |
| 2. Activation du compte | Possible | signup/verify Auth | Client s'inscrit | Pas de recovery |
| 3. Voir uniquement ses véhicules | Partielle | RLS `client_vehicles_self` | Véhicules portail | Dossier garage séparé |
| 4. Demander un rendez-vous | Partielle | BookingFlow | Demande | Pas de disponibilité réelle |
| 5. Consulter un devis | Possible | route token | Lien reçu | Pas de liste portail |
| 6. Accepter/refuser | Possible | RPCs publiques | Lien token | Preuve à renforcer |
| 7. Suivre l'intervention | Partielle | timeline conditionnelle | Statut legacy | Feature OFF |
| 8. Récupérer ses documents | Partielle | attachments/rapport conditionnels | URL signée ponctuelle | Feature OFF, pas de bibliothèque |
| 9. Échanger avec le garage | Buggée | messages persistants | Utiliser le chat | P0 tenant |
| 10. Ne voir aucun autre client | Buggée | RLS généralement correcte | Aucun | La faille message empêche un verdict complet |

Conclusion : parcours client complet `NON`.

## 18. Scénario 4 - onboarding garage

| Étape | Verdict | Preuve | Contournement actuel | Blocage |
|---|---|---|---|---|
| 1. RODANBTECH autorise l'organisation | Partielle | `platform_admins` backend | Action manuelle externe | Pas de workflow/audit |
| 2. Dirigeant reçoit une invitation | Impossible | aucune Edge Function | Création manuelle Auth | Invitation absente |
| 3. Choisit son mot de passe | Partielle | signup client seulement | Admin crée le compte | Flux staff absent |
| 4. Configure le garage | Partielle | SettingsPage | Paramètres partiels | Centres/horaires incomplets |
| 5. Invite ses salariés | Impossible | TeamPage annonce le futur | Intervention externe | Fonction absente |
| 6. Attribue les rôles | Impossible depuis UI | table/policy backend | SQL/admin externe | Pas de matrice produit |
| 7. Importe les données | Simulation | IntegrationsPage | Saisie manuelle | Aucun import réel |
| 8. Corrige les erreurs | Simulation | rapport CSV local | Corriger le fichier | Pas de job réel |
| 9. Déclare le garage prêt | Impossible | aucune checklist | Décision informelle | Pas de readiness |
| 10. RODANBTECH ne connaît aucun mot de passe | Possible en principe | Supabase Auth | Créer une invitation hors produit | Flux produit absent |

Conclusion : onboarding garage complet `NON`.

## 19. Analyse des tests

Résultats :

- Typecheck : succès.
- Lint : succès, 2 avertissements Fast Refresh.
- Vitest : `431/432`, échec du hash migration à cause de CRLF/LF.
- Build : succès, deux gros chunks signalés.
- Security scan : aucun secret évident; 12 mentions textuelles non bloquantes.
- RLS : non relancé par respect de l'interdiction d'écrire dans Supabase.

La suite compte 70 fichiers et couvre bien modèles purs, démo, i18n, juridique,
contrats de migration et scripts RLS. Elle ne contient aucun framework E2E committé.
Les principales pages métier n'ont pas de test comportemental dédié. Voir
`CLIKARAGE_TEST_COVERAGE_MATRIX_2026-07.md`.

## 20. Roadmap recommandée

Ordre :

1. fermer les quatre P0;
2. livrer provisioning, invitations, recovery et rôles;
3. unifier clients/véhicules;
4. rendre le planning transactionnel;
5. unifier le workflow atelier;
6. ajouter OR, exécution structurée et paiements manuels;
7. activer rapports/attachments/notifications internes après tests;
8. livrer import/export réel;
9. ajouter E2E, pagination et observabilité;
10. seulement ensuite considérer réseau, providers et commerce VO.

La roadmap détaillée est dans `CLIKARAGE_MVP_ROADMAP_2026-07.md`.

## 21. Conclusion

```text
SHA AUDITÉ : a530678d78eb6492af800e2f8373ca4f7c6e0b2f
CODE MODIFIÉ : NON (documentation d'audit uniquement)
SUPABASE MODIFIÉ : NON
VERCEL MODIFIÉ : NON

FONCTIONNALITÉS ANALYSÉES : 197
COMPLÈTES : 20
PARTIELLES : 83
UI SEULEMENT : 1
BACKEND SEULEMENT : 15
MOCK OU DÉMO : 8
ABSENTES : 57
INDÉTERMINÉES : 1
BUGGUÉES : 12

P0 : 4 écarts racines, 16 fonctionnalités affectées
P1 : 25 écarts racines, 93 fonctionnalités affectées
P2 : 18 écarts racines, 58 fonctionnalités affectées
P3 : 9 écarts racines, 30 fonctionnalités affectées

PARCOURS ATELIER COMPLET : NON
PARCOURS VENTE COMPLET : NON
PARCOURS CLIENT COMPLET : NON
ONBOARDING GARAGE COMPLET : NON

PRÊT POUR DÉMONSTRATION : OUI
PRÊT POUR GARAGE PILOTE : NON
PRÊT POUR PREMIER CLIENT PAYANT : NON
PRÊT POUR INSCRIPTION AUTONOME : NON
PRÊT POUR COMMERCIALISATION À GRANDE ÉCHELLE : NON

TOP 10 DES ACTIONS :
1. Corriger l'intégrité tenant des messages.
2. Appliquer une vraie matrice de permissions SQL et UI.
3. Rendre la conversion demande/rendez-vous transactionnelle et idempotente.
4. Remplacer les suppressions destructives et fiabiliser l'audit.
5. Construire provisioning, invitations et récupération d'accès.
6. Unifier le dossier véhicule.
7. Finaliser planning, conflits et assignations.
8. Ajouter ordre de réparation, pièces et temps réalisés.
9. Ajouter paiements manuels et export facturable.
10. Livrer import/export réel et E2E critiques.

ESTIMATION GLOBALE PAR TAILLES : 13 XS, 33 S, 99 M, 48 L, 4 XL;
les doublons doivent être regroupés en chantiers racines.
RISQUE PRINCIPAL : les frontières de tenant et de rôle ne sont pas uniformément
garanties par le serveur sur le socle legacy.
RECOMMANDATION FINALE : conserver Clikarage en démonstration encadrée, corriger le
lot P0, puis fermer un périmètre atelier après-vente limité avant tout garage payant.
```

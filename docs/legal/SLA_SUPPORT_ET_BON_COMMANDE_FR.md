# Modèle de bon de commande, support et SLA — Clikarage

Ce document est un modèle à adapter à chaque client. Aucun engagement de niveau de service n’existe tant qu’un bon de commande ou SLA n’est pas signé.

## A. Bon de commande

### 1. Parties

- Prestataire : Anas RODRIGUEZ BENKARROUM, Entrepreneur individuel, RODANBTECH
- Client : `[dénomination, forme, capital, siège, RCS/SIREN, représentant]`
- Contact opérationnel : `[À COMPLÉTER]`
- Contact facturation : `[À COMPLÉTER]`
- Contact données/sécurité : `[À COMPLÉTER]`

### 2. Périmètre

- Nombre de garages/centres : `[À COMPLÉTER]`
- Pays : `[À COMPLÉTER]`
- Modules activés : `[À COMPLÉTER]`
- Utilisateurs inclus : `[À COMPLÉTER]`
- Volume ou limites d’usage : `[À COMPLÉTER]`
- Environnement et intégrations : `[À COMPLÉTER]`

### 3. Prix

- Licence réseau annuelle HT : `[À COMPLÉTER]`
- Abonnement par centre et par mois HT : `[À COMPLÉTER]`
- Mise en service HT : `[À COMPLÉTER]`
- Formation / intégration / développement spécifique : `[À COMPLÉTER]`
- Indexation ou révision : `[À COMPLÉTER]`

Les taxes sont ajoutées selon la réglementation applicable.

### 4. Facturation et règlement

- Fréquence : mensuelle / trimestrielle / annuelle
- Délai de paiement : 30 jours date de facture, sauf accord licite différent
- Mode : virement / prélèvement / autre
- Aucun escompte pour paiement anticipé sauf accord écrit
- Pénalités de retard : taux BCE le plus récent + 10 points, sans pouvoir être inférieur au minimum légal
- Indemnité forfaitaire de recouvrement : 40 euros par facture impayée à l’échéance

### 5. Durée

- Date de début : `[À COMPLÉTER]`
- Durée initiale : `[À COMPLÉTER]`
- Renouvellement : `[À COMPLÉTER]`
- Préavis : `[À COMPLÉTER]`

### 6. Documents contractuels

Le Client reconnaît avoir reçu et accepté :

1. le présent bon de commande ;
2. les conditions particulières ;
3. le SLA, s’il est souscrit ;
4. le DPA ;
5. les Conditions de services B2B version `[À COMPLÉTER]`.

### 7. Clause de compétence très apparente

**POUR LES LITIGES ENTRE PARTIES AYANT TOUTES DEUX LA QUALITÉ DE COMMERÇANT, ET SOUS RÉSERVE DES RÈGLES IMPÉRATIVES, COMPÉTENCE EXPRESSE EST ATTRIBUÉE AUX JURIDICTIONS COMMERCIALES DE PARIS APRÈS ÉCHEC DE LA PROCÉDURE AMIABLE PRÉVUE AU CONTRAT.**

Cette clause doit être adaptée si la qualité des parties ou le contrat international impose une autre solution.

## B. Support standard

### Horaires

Jours ouvrés en France, 9 h 00–18 h 00, hors jours fériés, sauf offre différente.

### Canaux

- email support : `[À CRÉER]`
- portail ou formulaire : `[À CRÉER]`
- téléphone réservé aux incidents critiques : uniquement si prévu au contrat

### Priorités indicatives

| Priorité | Définition | Première réponse cible standard |
|---|---|---|
| P1 critique | Service indisponible pour la majorité des utilisateurs, perte ou exposition probable de données, aucun contournement | 2 heures ouvrées |
| P2 élevée | Fonction essentielle fortement dégradée, contournement limité | 4 heures ouvrées |
| P3 normale | Fonction non critique dégradée, contournement disponible | 1 jour ouvré |
| P4 demande | Question, évolution ou assistance non urgente | 2 jours ouvrés |

Ces délais sont des objectifs de première réponse, non des délais garantis de résolution, sauf SLA signé.

## C. SLA optionnel

### 1. Disponibilité mensuelle

Niveau recommandé pour un premier contrat enterprise : **99,5 %** par mois, sous réserve que les plans Vercel, Supabase et de supervision réellement souscrits permettent cet engagement.

Une option 99,9 % ne doit être proposée qu’après validation de l’architecture, de la redondance, du support fournisseur, du monitoring et de la capacité d’astreinte.

### 2. Calcul

Disponibilité = (minutes totales de la période – minutes d’indisponibilité imputable) / minutes totales de la période.

Sont exclus :

- maintenance planifiée annoncée ;
- maintenance urgente de sécurité ;
- force majeure ;
- panne d’un équipement ou réseau du Client ;
- usage contraire au contrat ;
- fonctions expérimentales ;
- suspension légitime ;
- service tiers non sous le contrôle raisonnable de RODANBTECH, sauf engagement différent.

### 3. Maintenance planifiée

Préavis cible : 72 heures. Fenêtre privilégiée : heures de faible activité. La maintenance urgente peut intervenir sans préavis suffisant lorsqu’elle protège le service ou les données.

### 4. Crédits de service

| Disponibilité mensuelle | Crédit sur la redevance mensuelle affectée |
|---|---:|
| < 99,5 % et ≥ 99,0 % | 5 % |
| < 99,0 % et ≥ 98,0 % | 10 % |
| < 98,0 % | 25 % |

Le crédit est plafonné à 25 % de la redevance du mois affecté. Il constitue le recours contractuel principal pour le non-respect isolé du SLA, sans exclure les droits ne pouvant légalement être limités.

La demande doit être présentée dans les trente jours avec les éléments nécessaires.

### 5. Objectifs de reprise

- RPO cible : `[À FIXER selon sauvegardes et plan fournisseur]`
- RTO cible : `[À FIXER après test de reprise]`

Aucun RPO/RTO ne doit être contractualisé avant vérification périodique par restauration.

## D. Réversibilité

- export standard inclus : CSV/PDF et formats disponibles dans le produit ;
- fenêtre d’export : 30 jours après fin de contrat ;
- assistance de migration : sur devis ;
- suppression active : sous 60 jours après la fin de la réversibilité, sauf obligation légale ;
- sauvegardes : selon cycle documenté.

## E. Déploiement réseau

Pour un réseau multi-centres, prévoir :

- pilote mesuré ;
- critères d’acceptation ;
- gouvernance centrale ;
- responsables locaux ;
- calendrier de formation ;
- import et qualité des données ;
- support niveau 1 par le réseau ou RODANBTECH ;
- indicateurs : temps de réponse aux devis, appels évités, taux d’acceptation, dossiers clôturés, rappels convertis ;
- procédure de déploiement et de retrait par vagues.

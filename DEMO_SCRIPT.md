# GarageFlow — Script de démo (≈ 6 minutes)

> Fil rouge : **« Le client réserve. Le garage confirme. Le devis est prêt. »**

## Préparation
- `npm run dev` → `http://127.0.0.1:4174`.
- Deux fenêtres : une large (garage), une étroite/mobile (client).
- Aucun Supabase requis pour la démo : utiliser le **mode démo local** (boutons sur `/login`). Sinon comptes réels (`owner@demo-garage.fr` / `client@demo.fr`, mot de passe `Demo1234!`).

## 1. Landing (30 s)
- Page d'accueil sobre : titre « Recevez vos demandes de rendez-vous en ligne… ».
- Cliquer **Problèmes / Solution / Parcours** → la page **scrolle** (pas de 404, même avec HashRouter).

## 2. Côté client — réserver sans login (90 s) *(fenêtre étroite)*
1. « Espace client » → choisir **Garage Central Lyon** (logo affiché).
2. Liste des **prestations** (durée, prix, prochains créneaux) → **Réserver** sur une prestation.
3. Parcours : **créneau** (jours en ligne, horaires) → **véhicule + coordonnées**.
4. À la dernière étape : *« Identifiez-vous pour confirmer »* → **Démo client** (ou login). Le brouillon est conservé.
5. **Confirmation** : référence `GF-…`, prestation, garage, date, statut. → « Voir ma demande ».

## 3. Côté garage — traiter + devis (180 s) *(fenêtre large)*
1. **Démo garage** (ou login owner). Dashboard sobre : 3 KPI + « À traiter » + « À faire aujourd'hui ».
2. **Réservations** : ouvrir la demande.
   - Montrer **Proposer un autre créneau**, **Appeler**, puis **Confirmer le RDV** (1 clic → RDV créé dans l'agenda + client/véhicule reliés, sans double saisie ; en cas d'échec agenda, message clair + Réessayer, jamais de faux succès).
3. **Créer un devis** (depuis la demande) :
   - Client et véhicule **suggérés** (par téléphone/email normalisés et plaque) ; modifiables.
   - Lignes préremplies depuis la prestation ; ajout/édition ; **Total HT / TVA / TTC** en direct.
   - **Enregistrer & aperçu** → document à l'écran → **Télécharger le PDF** (vrai fichier `.pdf` : logo, garage, client tél/email, immatriculation, lignes, totaux, conditions, **Bon pour accord**).
   - Numéro **DV-AAAA-NNNN** (séquence par garage).
4. *(Atelier avancé)* Montrer **Prestations** (créer « Vidange 5W30 » : durée, prix, TVA, lignes par défaut, visible client) et **Atelier** (kanban).

## 4. Côté client — suivi (30 s) *(étroit)*
- Onglet **Demandes** : la réservation est passée **Confirmée**. Ouvrir le détail, échanger un message.

## 5. Robustesse & sécurité (45 s)
- **Mode Essentiel / Atelier avancé** : simple par défaut, complet sur demande.
- Argument sécurité : isolation par garage (RLS), `npm run test:rls` = 16/16 ; aucune clé `service_role` côté navigateur ; un client ne modifie que le statut de sa demande ; pas de doublon client/véhicule ; devis numérotés sans collision.

## Réinitialiser
- Mode démo : « Quitter la démo » puis vider `localStorage` (ou bouton de relance).
- Réel : ré-exécuter le seed `supabase/migrations/0004_seed.sql` sur un projet de test.

## Points de vente
- Moins d'appels, demandes centralisées, agenda propre.
- De la demande au **devis propre** en moins de 2 minutes.
- Simple pour un garage classique, assez complet pour un garage technique.

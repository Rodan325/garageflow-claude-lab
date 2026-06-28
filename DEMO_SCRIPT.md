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
   - Onglet **Véhicules** : le client a déjà un véhicule enregistré (VW Golf 7) → il le **réutilise** sans tout ressaisir ; il peut en ajouter / modifier / archiver.
   - À l'étape véhicule, montrer le **texte de consentement** : le client autorise ce garage à consulter les infos du véhicule **uniquement** pour traiter sa demande.
4. À la dernière étape : *« Identifiez-vous pour confirmer »* → **Démo client** (ou login). Le brouillon est conservé.
5. **Confirmation** : référence `GF-…`, prestation, garage, date, statut. → « Voir ma demande ».

## 3. Côté garage — traiter + devis (180 s) *(fenêtre large)*
1. **Démo garage** (ou login owner). Dashboard sobre : 3 KPI + « À traiter » + « À faire aujourd'hui ».
2. **Réservations** : ouvrir la demande.
   - Montrer **Proposer un autre créneau**, **Appeler**, puis **Confirmer le RDV** (1 clic → RDV créé dans l'agenda + client/véhicule reliés, sans double saisie ; en cas d'échec agenda, message clair + Réessayer, jamais de faux succès).
3. **Créer un devis** (depuis la demande) :
   - Client et véhicule **suggérés** (par téléphone/email normalisés et plaque) ; modifiables.
   - Lignes préremplies depuis la prestation ; ajout/édition ; **Total HT / TVA / TTC** en direct.
   - Numéro **DV-AAAA-NNNN** (séquence par garage).
   - **Enregistrer & envoyer** → le devis passe en **Envoyé**, un **lien client** sécurisé est copié dans le presse-papier.
4. **Cycle de vie** sur la liste des devis : statut (Brouillon → Envoyé → Accepté/Refusé/Expiré), dates (créé / envoyé / décision), actions selon statut (Modifier, Envoyer, Lien client, PDF, Réviser).
5. *(Atelier avancé)* Montrer **Prestations** (créer « Vidange 5W30 » : durée, prix, TVA, lignes par défaut, visible client) et **Atelier** (kanban).

## 4. Côté client — devis + suivi (60 s) *(étroit)*
- Ouvrir le **lien du devis** (`/devis/:token`) : document propre — garage, logo, n°, dates, véhicule, lignes, **HT/TVA/TTC**, conditions. **Télécharger le PDF**.
- **Accepter** (confirmation claire ; le garage peut planifier l'intervention) **ou Refuser** avec un motif optionnel.
- Côté garage, le devis apparaît **Accepté** / **Refusé** (avec le motif) ; il n'est plus modifiable — bouton **Réviser** pour repartir d'un brouillon.
- Onglet **Demandes** : la réservation est passée **Confirmée**. Ouvrir le détail, échanger un message.

## 5. Robustesse & sécurité (45 s)
- **Mode Essentiel / Atelier avancé** : simple par défaut, complet sur demande.
- Argument sécurité : isolation par garage (RLS), `npm run test:rls` = **42/42** ; aucune clé `service_role` côté navigateur ; un client ne modifie que le statut de sa demande ; **devis consultable seulement via un lien tokenisé non devinable**, accepter/refuser réservés au client (un garage ne peut pas accepter à sa place) ; pas de doublon client/véhicule ; devis numérotés sans collision et totaux recalculés côté serveur.

## Réinitialiser
- Mode démo : bouton **« Réinitialiser les données »** dans le bandeau démo (réinjecte le seed sans quitter). Sinon **« Quitter la démo »**, ou en console : `localStorage.removeItem('gf-demo-store-v4')`.
- Un ancien store est **migré automatiquement** au chargement (clés manquantes complétées, anciens devis complétés) → plus de crash `unshift`.
- Réel : ré-exécuter le seed `supabase/migrations/0004_seed.sql` sur un projet de test.

## Points de vente
- Moins d'appels, demandes centralisées, agenda propre.
- De la demande au **devis propre** en moins de 2 minutes.
- Simple pour un garage classique, assez complet pour un garage technique.

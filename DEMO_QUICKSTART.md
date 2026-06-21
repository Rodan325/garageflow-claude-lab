# GarageFlow — Démarrage rapide de la démo (≈ 5 min)

Lancer GarageFlow en local et tester les parcours, **sans aucune configuration Supabase** grâce au mode démo.

## 1. Installation
```bash
npm install
```

## 2. Lancement
```bash
npm run dev
```
Ouvrir **http://127.0.0.1:4174**.

> Pas besoin de `.env` ni de Supabase pour la démo : tout fonctionne en **mode démo local** (données fictives dans le navigateur).

## 3. Entrer en mode démo
Sur la page **/login** :
- **« Démo garage »** → espace garage (back-office) avec des données déjà remplies.
- **« Démo client »** → espace client (réservation + suivi).

Les deux partagent les mêmes données locales : une réservation faite côté client apparaît côté garage.

Le bandeau jaune en haut propose **« Réinitialiser les données »** (repartir du jeu de démo) et **« Quitter la démo »**.

## 4. Parcours à tester (le fil rouge)
1. **Client** : Démo client → **Réserver** une prestation → choisir un créneau → véhicule + coordonnées → **Envoyer la demande** → écran de confirmation (référence `GF-…`).
2. **Garage** : Démo garage → **Réservations** → ouvrir la demande → **Confirmer le RDV**.
3. **Devis** : depuis la demande → **Créer un devis** → ajuster les lignes → renseigner **« Valable jusqu'au »** → **Enregistrer & envoyer** (le lien client est copié).
4. **Client** : ouvrir le **lien du devis** (`/#/devis/<token>`) → **Télécharger le PDF** → **Accepter** (ou **Refuser** avec motif).
5. **Garage** : page **Devis** → le devis est **Accepté** → tester **Créer une révision**.

Le jeu de démo contient déjà des devis dans tous les statuts : **brouillon, envoyé, accepté, refusé, expiré** et une **révision**.

## 5. Commandes de test
```bash
npm run typecheck   # types (0 erreur)
npm run lint        # qualité (0 erreur)
npm run test        # tests unitaires
npm run build       # build de production -> dist/
npm run test:rls    # isolation + cycle de vie devis (nécessite .env Supabase)
```
> `test:rls` est le seul script qui requiert un `.env` valide (il se connecte au vrai Supabase avec la clé publique). Les autres tournent sans Supabase.

## 6. Réinitialiser la démo
- Bouton **« Réinitialiser les données »** dans le bandeau démo, ou
- Console du navigateur :
  ```js
  localStorage.removeItem('gf-demo-store-v4'); location.reload()
  ```

## Comptes (mode réel, si `.env` configuré)
| Rôle | Email | Mot de passe |
|---|---|---|
| Gérant | `owner@demo-garage.fr` | `Demo1234!` |
| Client | `client@demo.fr` | `Demo1234!` |

## Aller plus loin
- Script commercial : `SALES_DEMO_SCRIPT.md`
- Offre pilote (à envoyer au garage) : `PILOT_OFFER.md`
- Déploiement pilote : `PILOT_DEPLOYMENT_CHECKLIST.md`

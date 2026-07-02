# GarageFlow — Checklist de lancement pilote

Runbook à dérouler **avant la première démo à un vrai garage**. Tout doit être ✅ avant de contacter le premier garage.

> Documents liés : déploiement détaillé → [PILOT_DEPLOYMENT_CHECKLIST](./PILOT_DEPLOYMENT_CHECKLIST.md) · rendez-vous garage → [GARAGE_DEMO_CHECKLIST](./GARAGE_DEMO_CHECKLIST.md) · suivi → [PROSPECTING_TRACKER_TEMPLATE](./PROSPECTING_TRACKER_TEMPLATE.md).

---

## 1. Variables d'environnement (`.env`)
Le frontend n'utilise **que** la clé publique. Ne **jamais** exposer `service_role`.
- [ ] `VITE_SUPABASE_URL` renseignée.
- [ ] `VITE_SUPABASE_ANON_KEY` (clé **anon** publique) renseignée.
- [ ] `.env` présent en local (copié depuis `.env.example`) et **non commité** (déjà gitignoré).
- [ ] Mêmes variables configurées chez l'hébergeur (Vercel/Netlify) pour le build.
- [ ] *(Démo locale uniquement : aucun `.env` requis — le mode démo fonctionne sans Supabase.)*

## 2. Configuration Supabase
- [ ] Projet `garageflow-c` (eu-west-3) accessible, ou projet dédié au garage.
- [ ] Clé `anon` récupérée ; clé `service_role` **non utilisée côté front**.
- [ ] Auth e-mail activée ; *(recommandé)* Leaked Password Protection activé.
- [ ] Bucket `garage-logos` présent (public en lecture, écriture membre, pas de listing).

## 3. Migrations à appliquer
- [ ] Migrations `supabase/migrations/0001` → `0020` appliquées dans l'ordre.
- [ ] RPC présentes : `create_quote_with_lines`, `update_quote_with_lines`, `send_quote`, `revise_quote`, `get_quote_public`, `accept_quote_public`, `decline_quote_public`, `next_quote_number`, `expire_quotes`.
- [ ] `src/types/database.types.ts` à jour si le schéma a changé.

## 4. RLS à vérifier
- [ ] RLS **activée** sur toutes les tables (par défaut : refus).
- [ ] Isolation par garage (A ne lit/écrit jamais B).
- [ ] Devis : totaux **recalculés serveur** ; accept/refus **réservés au client** (trigger `guard_quote_transition`) ; consultation par **jeton non devinable** uniquement.
- [ ] `npm run test:rls` → **60/60 réussis**.
- [ ] Après le test, compteur de devis du garage de démo remis à 0 si besoin.

## 5. Commandes de build & test
```bash
npm install
npm run typecheck   # 0 erreur
npm run lint        # 0 erreur (2 warnings fast-refresh tolérés)
npm run test        # vert
npm run build       # -> dist/
npm run test:rls    # 60/60 (nécessite .env Supabase)
```
- [ ] Les 5 commandes passent.

## 6. Vérification du mode démo
- [ ] `npm run dev` → http://127.0.0.1:4174.
- [ ] `/login` → **Démo garage** et **Démo client** fonctionnent (sans Supabase).
- [ ] Bandeau démo : **Réinitialiser les données** et **Quitter la démo** OK.
- [ ] Le jeu de démo montre des devis dans **tous les statuts** (brouillon, envoyé, accepté, refusé, expiré, révision) et au moins **une demande en attente** côté garage.

## 7. Vérification parcours client
- [ ] Accueil client → garage sélectionné, prestations visibles.
- [ ] **Réserver** → choix créneau (jour + heure) → véhicule + coordonnées → **Envoyer**.
- [ ] Écran **« Demande envoyée »** avec référence `GF-…`.
- [ ] Onglet **Demandes** : la demande apparaît avec son statut.

## 8. Vérification parcours garage
- [ ] **Démo garage** → Dashboard (KPI + « À traiter »).
- [ ] **Réservations** : la demande client est là.
- [ ] **Confirmer le RDV** (ou proposer un autre créneau) → RDV + client + véhicule créés, pas de faux succès.

## 9. Vérification devis / PDF
- [ ] **Créer un devis** depuis la demande → client/véhicule pré-remplis.
- [ ] Lignes depuis une prestation → **Total HT / TVA / TTC** corrects.
- [ ] **Valable jusqu'au** obligatoire avant envoi (sinon blocage clair).
- [ ] **Enregistrer & envoyer** → statut **Envoyé** + lien client copié.
- [ ] **Télécharger le PDF** → logo, coordonnées garage, client, véhicule/immatriculation, lignes, HT/TVA/TTC, conditions, « Bon pour accord ».
- [ ] **Réviser** un devis envoyé/accepté → nouvelle version en brouillon (badge « Révision »).

## 10. Vérification liens devis `/devis/:token`
- [ ] Sur un devis envoyé → **Copier le lien client** → ouvrir `…/#/devis/<token>`.
- [ ] La page client affiche le devis complet + **Télécharger le PDF**.
- [ ] **Accepter** → confirmation ; côté garage le devis passe **Accepté**.
- [ ] **Refuser** avec motif → côté garage le motif s'affiche.
- [ ] Un **jeton invalide** affiche « Devis introuvable » (pas d'erreur brute).
- [ ] Un devis **expiré** ne peut pas être accepté.

## 11. Vérification mobile
- [ ] Parcours client refait sur **téléphone** (ou viewport 375px) : pas de scroll horizontal, boutons accessibles.
- [ ] Page devis `/devis/:token` lisible et **PDF téléchargeable** depuis mobile.
- [ ] Espace garage utilisable sur petit écran (dashboard, devis, réservations).

## 12. Déploiement (si démo en ligne)
- [ ] `npm run build` → `dist/` déployé (Vercel/Netlify/GitHub Pages).
- [ ] HashRouter → aucune réécriture serveur nécessaire.
- [ ] HTTPS actif ; un lien `/#/devis/<token>` s'ouvre en public.
- [ ] Variables d'env configurées côté hébergeur.

---

## Plan 72h (3 prochaines actions concrètes)

### Jour 1 — Déployer / vérifier la démo
- [ ] Dérouler les sections 5 à 11 de cette checklist (tests verts + parcours OK).
- [ ] Décider du support de démo : **local** (`npm run dev`) ou **URL en ligne** déployée.
- [ ] Préparer le matériel : `GARAGE_DEMO_CHECKLIST.md` ouvert, `PILOT_OFFER.md` prêt à envoyer, lien démo sous la main.
- [ ] Faire **une répétition complète** du parcours (client → garage → devis → acceptation → révision) en 8 minutes chrono.

### Jour 2 — Contacter 10 garages
- [ ] Lister 10 garages locaux dans `PROSPECTING_TRACKER_TEMPLATE.md` (statut « À contacter »).
- [ ] Contacter via le canal adapté (visite / appel / SMS / e-mail) avec les messages de `SALES_OUTREACH.md`.
- [ ] Pour chaque garage : noter date, canal, réponse, prochaine action. Viser **2 créneaux de démo** proposés à chaque intéressé.

### Jour 3 — Relancer + proposer 2 démos
- [ ] Relancer les non-réponses (SMS/appel) — voir relances dans `SALES_OUTREACH.md`.
- [ ] **Caler au moins 2 démos** dans l'agenda.
- [ ] Confirmer chaque démo par SMS avec le lien et l'heure.
- [ ] Mettre à jour les statuts dans le tracker (« Démo prévue »).

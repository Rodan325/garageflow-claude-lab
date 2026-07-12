# Clikarage — Checklist de rendez-vous garage

Aide-mémoire pour une démo réussie (sur place ou en visio), ~10 minutes. Objectif : montrer la valeur et **repartir avec un pilote accepté ou une date de décision**.

> Script détaillé : [SALES_DEMO_SCRIPT](./SALES_DEMO_SCRIPT.md) · argumentaire : [SALES_ARGUMENTS](./SALES_ARGUMENTS.md) · offre : [PILOT_OFFER](./PILOT_OFFER.md).

---

## 1. Avant le rendez-vous (5 min de prépa)
- [ ] Tester que la démo se lance (local `npm run dev` → http://127.0.0.1:4174, ou URL en ligne).
- [ ] **Réinitialiser les données démo** (bandeau) pour partir propre.
- [ ] Ouvrir deux fenêtres : une **large** (espace garage), une **étroite / téléphone** (espace client).
- [ ] Se connecter en **Démo garage** d'un côté, **Démo client** de l'autre.
- [ ] Avoir prêts : `PILOT_OFFER.md` (à envoyer), de quoi prendre des notes, le tracker de prospection.
- [ ] Connaître le nom du garage et la personne en face. Couper les notifications.

## 2. Ce qu'on ouvre pendant la démo
- [ ] Fenêtre client : page d'accueil client (garage sélectionné).
- [ ] Fenêtre garage : Dashboard + onglet Réservations + onglet Devis.
- [ ] Un onglet prêt pour coller un **lien de devis** `/devis/:token`.

## 3. Ordre exact des pages à montrer
1. **Client — Accueil** : prestations, prix, créneaux. → *« Vos clients voient ça à votre nom. »*
2. **Client — Réserver** : prestation → créneau → véhicule + coordonnées → **Envoyer**. → *« 30 secondes, sans vous appeler. »*
3. **Garage — Réservations** : la demande vient d'arriver. → *« Tout au même endroit. »*
4. **Garage — Confirmer le RDV** : un clic crée RDV + fiche client + véhicule. → *« Zéro double saisie. »*
5. **Garage — Créer un devis** : pré-rempli, lignes par prestation, TVA/total auto, date de validité. → *« Un devis propre en une minute. »*
6. **Garage — Enregistrer & envoyer** : statut Envoyé, lien client copié. → *« Le client reçoit un lien. »*
7. **Client — /devis/:token** : document + **Télécharger PDF** + **Accepter**. → *« Il valide en ligne, vous avez la trace. »*
8. **Garage — Devis** : statut **Accepté**, puis montrer **Refusé (motif)**, **Expiré**, **Créer une révision**. → *« Vous suivez tout. »*

## 4. Questions à poser (pendant / après la démo)
- [ ] Aujourd'hui, comment recevez-vous les demandes de RDV ?
- [ ] Qui les confirme, et comment ?
- [ ] Comment faites-vous vos devis ? Combien de temps ça prend ?
- [ ] Comment le client valide-t-il un devis ? Avez-vous une trace ?
- [ ] Quels logiciels utilisez-vous déjà (agenda, gestion, compta) ?
- [ ] Qu'est-ce qui vous fait perdre le plus de temps ?
- [ ] Qu'aimeriez-vous automatiser en priorité ?
- [ ] Combien de demandes / devis par semaine, à peu près ?

## 5. Notes à prendre (à remplir en direct)
- Outils actuels : ____________________
- Volume demandes / semaine : __________ · Devis / semaine : __________
- Principale perte de temps : ____________________
- Réaction à la démo (ce qui a plu / interrogé) : ____________________
- Objections soulevées : ____________________
- Décideur ? Qui utilisera l'outil ? ____________________
- Niveau d'intérêt (1–5) : ______

## 6. Comment conclure
- [ ] Reformuler : *« Si je résume, ce qui vous prend du temps c'est [X] et [Y] — c'est exactement là-dessus que Clikarage aide. »*
- [ ] Vérifier l'adhésion : *« Est-ce que vous voyez ça vous faire gagner du temps au quotidien ? »*
- [ ] **Proposer le pilote tout de suite** (ne pas repartir sans une suite).

## 7. Comment proposer le pilote
- [ ] Présenter l'offre : **30 jours, paramétrage + accompagnement inclus** (voir `PILOT_OFFER.md`).
- [ ] Proposer **l'option 1 (pilote gratuit)** par défaut ; options payantes seulement si déjà convaincu.
- [ ] Obtenir un **engagement concret** : soit on démarre (récupérer logo + prestations), soit une **date de décision** précise.
- [ ] Caler la mise en service : *« Je peux configurer votre garage cette semaine et vous commencez dès [jour]. »*
- [ ] Mettre à jour le statut dans `PROSPECTING_TRACKER_TEMPLATE.md` (Démo faite / Pilote accepté / À relancer).

## 8. Après le rendez-vous (le jour même)
- [ ] Envoyer un **récap court** + `PILOT_OFFER.md` par e-mail/WhatsApp.
- [ ] Noter la **prochaine action** et la date de relance dans le tracker.
- [ ] Si pilote accepté : demander **logo + liste des prestations + horaires** pour le paramétrage.

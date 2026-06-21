# GarageFlow — Script de démonstration commerciale (7–10 min)

> Public : un garagiste indépendant (gérant ou chef d'atelier).
> Objectif : montrer en moins de 10 minutes que GarageFlow **fait gagner du temps** et **donne une image pro**, puis proposer un pilote.
> Ton : simple, concret, pas technique. On parle de **demandes**, **rendez-vous** et **devis**, pas de « base de données » ni de « RLS ».

## Avant de commencer (30 s de préparation, hors démo)
- Lancer `npm run dev` → ouvrir `http://127.0.0.1:4174`.
- Deux fenêtres prêtes : une **large** (espace garage), une **étroite / téléphone** (espace client).
- Entrer en **mode démo** : sur `/login`, boutons **« Démo garage »** et **« Démo client »** (aucun compte ni Supabase requis).
- Astuce : le bandeau jaune en haut a un bouton **« Réinitialiser les données »** pour repartir propre entre deux démos.

---

## 1. Le problème du garage (45 s) — *parler, pas cliquer*
> « Aujourd'hui, vos clients appellent, laissent des messages, repassent. Vous notez les rendez-vous sur un carnet ou un agenda, et les devis partent par SMS, par mail, ou à l'oral. Résultat : du temps perdu au téléphone, des oublis, et des devis qu'on ne retrouve plus. »

**Transition :** « Je vais vous montrer comment ça se passe avec GarageFlow, côté client puis côté garage. »

## 2. La réservation côté client (90 s) — *fenêtre étroite*
- Page d'accueil client → **Garage Central Lyon** (logo, prestations avec durée et prix).
- Cliquer **Réserver** sur « Révision constructeur ».
- Choisir un **jour** puis un **horaire**.
- Renseigner **véhicule** + **coordonnées** → **Envoyer la demande**.
- Montrer l'écran **« Demande envoyée »** avec une **référence** (GF-…).

> « En 30 secondes, le client a réservé, sans vous appeler. Vous, vous recevez tout au même endroit. »

**Transition :** « Voyons ce que ça donne de votre côté. »

## 3. La boîte de réception du garage (60 s) — *fenêtre large*
- Espace garage → **Réservations**.
- Montrer la nouvelle demande : client, véhicule, prestation, créneau souhaité.

> « Toutes vos demandes arrivent ici, triées. Plus de post-it, plus de rappels manqués. »

## 4. Confirmer le rendez-vous (45 s)
- Ouvrir la demande → **Confirmer le RDV** (ou **Proposer un autre créneau** si vous êtes complet).
- Montrer que le **rendez-vous est créé** et le **client + véhicule** enregistrés automatiquement.

> « Un clic : le rendez-vous est posé, la fiche client est créée. Pas de double saisie. »

**Transition :** « Et maintenant, le plus important pour vous : le devis. »

## 5. Créer le devis (90 s)
- Depuis la demande → **Créer un devis** (ou un devis manuel).
- Le **client** et le **véhicule** sont **pré-remplis**.
- Partir d'une **prestation** → les lignes se remplissent ; ajuster une quantité / un prix.
- Montrer le **Total HT / TVA / TTC** qui se calcule tout seul.
- Renseigner **« Valable jusqu'au »** (obligatoire avant envoi).

> « Vous faites un devis propre en une minute, numéroté automatiquement (DV-2026-0007). Les totaux sont calculés pour vous : pas d'erreur de TVA. »

## 6. Envoyer au client (45 s)
- Cliquer **Enregistrer & envoyer**.
- Le devis passe **Envoyé**, un **lien client** est copié.
- Coller le lien dans la fenêtre étroite (ou montrer un devis déjà envoyé via **Lien client**).

> « Le client reçoit un lien. Il n'a pas besoin de compte, il ouvre, il lit. »

## 7. Le client accepte (45 s) — *fenêtre étroite*
- Sur la page du devis : garage, véhicule, lignes, total, **Télécharger le PDF**.
- Cliquer **Accepter** → confirmation claire.

> « Le client accepte en ligne. Vous avez une trace, une date, et un PDF propre. »

## 8. Le suivi côté garage (30 s) — *fenêtre large*
- Retour sur **Devis** : le devis est passé **Accepté** (avec la date).
- Montrer un devis **Refusé** (avec motif), un devis **Expiré**, et **Créer une révision** sur un devis accepté.

> « Vous voyez tout de suite ce qui est accepté, refusé ou en attente. Et si un client revient, vous repartez du devis en un clic. »

## 9. Les bénéfices concrets (45 s) — *récap parlé*
- **Moins de téléphone** : les demandes arrivent en ligne, triées.
- **Zéro double saisie** : demande → RDV → client → devis s'enchaînent.
- **Des devis pros** : numérotés, calculés, en PDF, avec votre logo.
- **Une image sérieuse** : le client réserve et accepte en ligne, comme chez les grands.

## 10. La proposition de pilote (45 s)
> « Je vous propose de tester GarageFlow gratuitement pendant 3 à 4 semaines, avec vos vraies prestations et vos vrais clients. On configure ensemble votre garage, votre logo et vos tarifs. Vous me dites au bout de 2 semaines si ça vous fait gagner du temps. »

→ Remettre la fiche **PILOT_OFFER.md**.

---

## Objections fréquentes & réponses

| Objection | Réponse courte |
|---|---|
| « Mes clients ne sont pas à l'aise avec internet. » | « Ils n'ont rien à installer : ils réservent depuis un lien, et le devis s'ouvre comme une page web. Vous pouvez aussi saisir une demande pour eux. » |
| « Je n'ai pas le temps de configurer ça. » | « C'est moi qui configure votre garage, vos prestations et votre logo pendant le pilote. Vous n'avez qu'à utiliser. » |
| « J'ai déjà un agenda / un logiciel. » | « GarageFlow ne remplace pas tout : il s'occupe surtout des **demandes en ligne** et des **devis**, là où on perd le plus de temps. On teste juste cette partie. » |
| « Ça coûte combien ? » | « Le pilote est gratuit. On parle de tarif seulement si ça vous a fait gagner du temps. » |
| « Et si je suis complet ? » | « Vous proposez un autre créneau en un clic, ou vous refusez poliment. Le client est prévenu tout de suite. » |
| « Mes devis sont compliqués (pièces + main d'œuvre). » | « Le devis a autant de lignes que vous voulez, avec quantités, prix et TVA. Vous pouvez partir d'une prestation type et ajuster. » |
| « Les données de mes clients, c'est sécurisé ? » | « Chaque garage ne voit que ses propres clients et devis, c'est cloisonné. Rien n'est public sauf le lien d'un devis, et ce lien n'est pas devinable. » |

## Si quelque chose ne s'affiche pas en démo
- Cliquer **« Réinitialiser les données »** dans le bandeau, ou recharger la page.
- En dernier recours, vider le stockage : `localStorage.removeItem('gf-demo-store-v4')` puis recharger.

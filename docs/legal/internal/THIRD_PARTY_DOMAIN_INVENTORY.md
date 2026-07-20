# Inventaire interne des domaines tiers

Etat du code de la branche au 20 juillet 2026. Une verification runtime doit etre refaite a chaque release.

| Domaine/categorie | Usage | Etat attendu | Controle |
|---|---|---|---|
| `*.supabase.co` | API, Auth, Storage | actif selon environnement | URL fournie par `VITE_SUPABASE_URL` |
| domaine Vercel de l'application | hebergement frontend | actif | headers et requetes de page |
| `fonts.googleapis.com`, `fonts.gstatic.com` | anciennes polices distantes | absent du build de cette branche | test de source et capture reseau |
| Stripe | paiement | absent | `VITE_STRIPE_ENABLED=false` |
| fournisseur IA | IA externe | absent | `VITE_AI_FEATURES_ENABLED=false` |
| email transactionnel | notifications | absent | `VITE_TRANSACTIONAL_EMAIL_ENABLED=false` |
| analytics Vercel | mesure d'audience | absent/non prouve | `VITE_VERCEL_ANALYTICS_ENABLED=false` |
| SMS, DMS, CRM, calendrier | adaptateurs futurs | absent | aucune cle frontend |

Toute nouvelle origine reseau doit etre ajoutee ici, classee, documentee dans la politique pertinente et couverte par un test avant activation.

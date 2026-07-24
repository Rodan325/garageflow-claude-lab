# Verification des prestataires juridiques

Derniere revue documentaire : 20 juillet 2026. Les liens ci-dessous sont des sources publiques. L'entite opposable au compte RODANBTECH doit etre confirmee par le contrat, la facture ou la console du compte avant publication.

## Prestataires actuellement constates

| Prestataire | Fonction constatee | Source publique | Conclusion publiable | Verification encore requise |
|---|---|---|---|---|
| Supabase | Base, Auth et Storage | [DPA Supabase, 1 juin 2026](https://supabase.com/downloads/docs/Supabase%2BDPA%2B260601.pdf), [regions](https://supabase.com/docs/guides/platform/regions) | Infrastructure Supabase ; region de production documentee `eu-west-3` | Contrat du compte, entite facturante, liste de sous-traitants et transferts |
| Vercel | Hebergement du frontend | [Vercel Terms](https://vercel.com/legal/terms), [Vercel DPA](https://vercel.com/legal/dpa) | Hebergement web Vercel | Plan, entite contractante du compte, regions et sous-traitants |
| Squarespace | Administration du domaine, selon le compte | [Squarespace Terms](https://www.squarespace.com/terms-of-service) | Ne pas le presenter comme hebergeur applicatif | Entite contractante et role exact sur facture |
| Google Workspace | Messagerie du domaine, selon la configuration | [Google Workspace DPA](https://workspace.google.com/terms/dpa_terms.html) | Prestataire de messagerie seulement apres confirmation du compte | Edition, entite contractante, DPA et emplacement administratif |

Les noms publics rencontres dans les documents fournisseur ne remplacent pas la verification du contrat propre a RODANBTECH. Le registre public V2 utilise donc une formulation prudente et n'affirme pas une entite de compte non prouvee.

## Prestataires inactifs ou non prouves

| Prestataire/categorie | Statut | Regle |
|---|---|---|
| Stripe | Inactif | Ne pas le presenter comme destinataire ; flag faux |
| Fournisseur IA externe | Inactif | Charte IA en `draft`, route non publique |
| Email transactionnel | Adaptateur seulement | Aucun fournisseur ni secret frontend |
| SMS, push, DMS, CRM | Simules ou interfaces | Aucun appel externe declare |
| Vercel Web Analytics | Non constate dans le code audite | Flag faux ; nouvelle verification runtime avant activation |

## Verification runtime et dependances

- La page de production controlee le 20 juillet 2026 chargeait encore Google Fonts depuis le deploiement alors en ligne.
- Le code de cette branche retire cet appel et utilise une pile de fontes locales/systeme.
- Ce changement ne doit etre affirme en production qu'apres un futur deploiement controle et une nouvelle capture reseau.
- Aucun script Stripe, IA, analytics ou widget tiers n'est ajoute par le corpus juridique.

## Procedure de maintenance

1. Verifier chaque trimestre les contrats et listes de sous-traitants actifs.
2. Consigner date, URL, entite de compte, fonction, donnees, regions, transferts et DPA.
3. Conserver la preuve de la notification client pour tout changement pertinent.
4. Mettre a jour le registre dans une nouvelle version ; ne jamais modifier retroactivement une version acceptee.

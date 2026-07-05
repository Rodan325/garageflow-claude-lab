import { legalConfig as c, legalVersions } from '@/config/legal'
import { LegalLayout, H2, P, UL, MailLink } from './LegalLayout'

export function DpaPage() {
  return (
    <LegalLayout title="Accord de sous-traitance RGPD" version={legalVersions.dpa}>
      <H2>1. Objet</H2>
      <P>
        Cet accord encadre les traitements de données personnelles réalisés par {c.tradingName} en qualité de
        sous-traitant, conformément à l’article 28 du Règlement général sur la protection des données (RGPD).
      </P>
      <P>
        Il s’applique aux données que {c.tradingName} traite pour le compte d’un garage participant, dans le cadre de
        la fourniture de {c.appName} pendant le pilote.
      </P>

      <H2>2. Qualification des parties</H2>
      <P>Chaque partie agit dans un rôle clairement défini :</P>
      <UL
        items={[
          <>le <strong>garage participant</strong> est responsable de traitement pour les données de ses propres clients ;</>,
          <><strong>{c.tradingName}</strong> agit comme sous-traitant pour les données traitées au nom du garage ;</>,
          <><strong>{c.tradingName}</strong> reste responsable de traitement distinct pour ses propres besoins : gestion des comptes, sécurité, facturation éventuelle et relation contractuelle avec le garage.</>,
        ]}
      />

      <H2>3. Instructions documentées</H2>
      <P>{c.tradingName} traite les données uniquement sur la base :</P>
      <UL
        items={[
          'des présentes conditions ;',
          'des instructions raisonnables et documentées du garage ;',
          'des besoins techniques nécessaires au fonctionnement du service ;',
          'des obligations légales applicables.',
        ]}
      />
      <P>
        Si une instruction paraît illicite ou dangereuse, {c.tradingName} peut la refuser ou demander une clarification
        avant de l’exécuter.
      </P>

      <H2>4. Personnes concernées</H2>
      <P>Les traitements peuvent concerner :</P>
      <UL
        items={[
          'les clients du garage ;',
          'les utilisateurs de l’espace garage ;',
          'les utilisateurs de l’espace client ;',
          'les administrateurs ou testeurs autorisés du pilote.',
        ]}
      />

      <H2>5. Données traitées</H2>
      <P>Le pilote se limite à des données courantes de prise de rendez-vous et de devis :</P>
      <UL
        items={[
          'identité (nom, prénom) ;',
          'coordonnées (email, téléphone) ;',
          'informations de véhicule (marque, modèle, année, carburant, kilométrage, immatriculation) ;',
          'demandes de rendez-vous et messages associés ;',
          'devis et lignes de devis ;',
          'statuts et horodatages (demandes, envois, acceptations, refus) ;',
          'logs techniques limités.',
        ]}
      />

      <H2>6. Données sensibles interdites</H2>
      <P>
        Aucune donnée ni aucun document sensible ne doit être saisi pendant le pilote : carte grise, assurance,
        contrôle technique, factures, pièce d’identité, RIB, carte bancaire, données de santé ou documents juridiques
        sensibles. Le garage informe ses équipes de cette règle et évite de demander ce type d’information via{' '}
        {c.appName}.
      </P>

      <H2>7. Finalités</H2>
      <P>Les données sont traitées pour :</P>
      <UL
        items={[
          `fournir et faire fonctionner ${c.appName} ;`,
          'gérer les demandes de rendez-vous et leur suivi ;',
          'créer, envoyer et suivre les devis ;',
          'assurer la sécurité, la maintenance et le support ;',
          'permettre l’export et la suppression des données à la demande du garage.',
        ]}
      />

      <H2>8. Durée</H2>
      <P>
        Les données sont traitées pendant la durée du pilote, puis pendant la période raisonnable nécessaire à leur
        export, à leur suppression et à l’expiration des sauvegardes techniques.
      </P>

      <H2>9. Confidentialité</H2>
      <P>
        {c.tradingName} réserve l’accès aux données aux seules personnes et aux seuls prestataires qui en ont besoin
        pour fournir, maintenir ou sécuriser {c.appName}. Les données ne sont jamais revendues.
      </P>

      <H2>10. Sécurité</H2>
      <P>{c.tradingName} met en œuvre des mesures de sécurité raisonnables, notamment :</P>
      <UL
        items={[
          'le cloisonnement des données par garage (Row Level Security Supabase) ;',
          'la séparation des accès client et garage ;',
          'des tests d’isolation anti-fuite exécutés régulièrement ;',
          'des mots de passe gérés par Supabase Auth, jamais stockés en clair ;',
          'l’absence de clé service_role côté navigateur ;',
          'le chiffrement des échanges (HTTPS) en déploiement ;',
          'une vérification anti-fuite de secrets dans le code ;',
          'la minimisation des données et l’interdiction des documents sensibles pendant le pilote.',
        ]}
      />

      <H2>11. Sous-traitants ultérieurs</H2>
      <P>Pour fournir le service, {c.tradingName} s’appuie notamment sur :</P>
      <UL
        items={[
          `${c.backendProviderName} — base de données, authentification et infrastructure technique ;`,
          `${c.frontendHostName} — hébergement de l’application ;`,
          'un fournisseur d’envoi d’emails, s’il est activé ultérieurement.',
        ]}
      />
      <P>
        {c.tradingName} peut faire évoluer cette liste si un changement est nécessaire au fonctionnement, à la sécurité
        ou à l’évolution du service. Un niveau de protection adapté est alors maintenu et le garage en est
        raisonnablement informé en cas de changement significatif.
      </P>

      <H2>12. Transferts hors Union européenne</H2>
      <P>
        Le projet Supabase utilisé pour le pilote est configuré en région {c.backendDataRegion}. Certains prestataires
        techniques, notamment {c.frontendHostName} ou {c.backendProviderName}, peuvent néanmoins être établis hors
        Union européenne. Pendant le pilote, {c.appName} limite volontairement les données traitées et n’autorise aucun
        document sensible. Avant toute commercialisation large, {c.tradingName} vérifiera les garanties contractuelles
        applicables, notamment les clauses contractuelles types et les mesures complémentaires éventuelles.
      </P>

      <H2>13. Assistance aux droits des personnes</H2>
      <P>{c.tradingName} aide raisonnablement le garage à répondre aux demandes des personnes concernées :</P>
      <UL
        items={[
          'accès ;',
          'rectification ;',
          'suppression ;',
          'opposition ;',
          'limitation ;',
          'portabilité.',
        ]}
      />

      <H2>14. Violation de données</H2>
      <P>
        En cas d’incident susceptible d’affecter des données personnelles, {c.tradingName} informe le garage dans les
        meilleurs délais raisonnables après en avoir eu connaissance, afin qu’il puisse évaluer ses propres
        obligations.
      </P>

      <H2>15. Sort des données</H2>
      <P>À la fin du pilote, le garage choisit le sort de ses données :</P>
      <UL
        items={[
          'suppression des données ;',
          'export des données ;',
          'anonymisation éventuelle ;',
          'conservation technique temporaire dans les sauvegardes, puis suppression selon des délais techniques raisonnables.',
        ]}
      />

      <H2>16. Audit et preuve</H2>
      <P>
        Sur demande raisonnable, {c.tradingName} fournit les informations permettant de démontrer le respect de ses
        obligations, dans la limite de la sécurité, de la confidentialité et des moyens disponibles pendant le pilote.
        Une documentation raisonnable est conservée sur les mesures de sécurité, les tests d’isolation, les politiques
        d’accès et les limites du pilote.
      </P>

      <H2>17. Non-réutilisation</H2>
      <P>{c.tradingName} ne réutilise pas les données des clients du garage pour son propre compte, sauf :</P>
      <UL
        items={[
          'nécessité de sécurité ;',
          'support ;',
          'obligation légale ;',
          'statistiques anonymisées ou agrégées ;',
          'accord écrit du garage.',
        ]}
      />

      <H2>18. Contact</H2>
      <P>Pour toute demande liée à la protection des données : <MailLink email={c.privacyContactEmail} /></P>
    </LegalLayout>
  )
}

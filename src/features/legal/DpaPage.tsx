import { legalConfig as c, legalVersions } from '@/config/legal'
import { LegalLayout, H2, P, UL, MailLink } from './LegalLayout'

export function DpaPage() {
  return (
    <LegalLayout title="Accord de sous-traitance RGPD" version={legalVersions.dpa}>
      <H2>1. Objet</H2>
      <P>
        Le présent accord encadre le traitement de données personnelles réalisé par {c.tradingName} pour le compte du
        garage participant dans le cadre de la fourniture de {c.appName} pendant le pilote.
      </P>

      <H2>2. Qualification des parties</H2>
      <UL
        items={[
          <>le <strong>garage participant</strong> est responsable de traitement pour les données de ses propres clients ;</>,
          <><strong>{c.tradingName}</strong> est sous-traitant pour les données traitées au nom du garage ;</>,
          <><strong>{c.tradingName}</strong> est responsable de traitement distinct pour ses propres données de compte, la sécurité, la facturation éventuelle et la prospection éventuelle.</>,
        ]}
      />

      <H2>3. Instructions documentées</H2>
      <P>{c.tradingName} traite les données selon :</P>
      <UL
        items={[
          'les présentes conditions ;',
          'les instructions raisonnables et documentées du garage ;',
          'les besoins techniques nécessaires au service ;',
          'les obligations légales applicables.',
        ]}
      />
      <P>
        Si une instruction semble illicite ou dangereuse, {c.tradingName} peut la refuser ou demander une
        clarification avant de l’exécuter.
      </P>

      <H2>4. Catégories de personnes concernées</H2>
      <UL
        items={[
          'clients du garage ;',
          'utilisateurs garage ;',
          'utilisateurs client ;',
          'administrateurs ou testeurs autorisés.',
        ]}
      />

      <H2>5. Catégories de données</H2>
      <UL
        items={[
          'identité (nom, prénom) ;',
          'coordonnées (email, téléphone) ;',
          'véhicules (marque, modèle, année, carburant, kilométrage, immatriculation) ;',
          'demandes de rendez-vous ;',
          'devis ;',
          'statuts (demandes et devis, acceptation/refus horodatés) ;',
          'messages ;',
          'logs techniques limités.',
        ]}
      />

      <H2>6. Données sensibles interdites</H2>
      <P>
        Aucune donnée sensible ou document sensible ne doit être saisi pendant le pilote (carte grise, assurance,
        contrôle technique, factures, pièce d’identité, RIB, carte bancaire, données de santé, documents juridiques
        sensibles). Le garage doit informer ses équipes et éviter de demander ces données via {c.appName}.
      </P>

      <H2>7. Nature et finalités du traitement</H2>
      <UL
        items={[
          `fournir ${c.appName} ;`,
          'gérer les demandes de rendez-vous ;',
          'gérer les devis ;',
          'gérer les statuts ;',
          'assurer la sécurité ;',
          'assurer la maintenance ;',
          'assurer le support ;',
          'permettre l’export et la suppression des données.',
        ]}
      />

      <H2>8. Durée</H2>
      <P>
        Le traitement est réalisé pendant la durée du pilote, puis pendant une période raisonnable nécessaire à
        l’export, à la suppression et à l’expiration des sauvegardes techniques.
      </P>

      <H2>9. Confidentialité</H2>
      <P>
        {c.tradingName} limite l’accès aux données aux seules personnes ou prestataires ayant besoin d’y accéder pour
        fournir, maintenir ou sécuriser {c.appName}, et ne revend pas les données personnelles.
      </P>

      <H2>10. Sécurité</H2>
      <P>{c.tradingName} met en œuvre des mesures raisonnables, notamment :</P>
      <UL
        items={[
          'Row Level Security Supabase ;',
          'séparation des accès client/garage ;',
          'tests d’isolation anti-fuite exécutés régulièrement ;',
          'mots de passe gérés par Supabase Auth (jamais stockés en clair) ;',
          'absence de clé service_role côté frontend ;',
          'HTTPS en déploiement ;',
          'vérification anti-fuite de secrets dans le code ;',
          'interdiction des documents sensibles pendant le pilote ;',
          'minimisation des données collectées ;',
          'accès restreint aux données ;',
          'logs techniques limités.',
        ]}
      />

      <H2>11. Sous-traitants ultérieurs</H2>
      <P>{c.tradingName} utilise notamment :</P>
      <UL
        items={[
          `${c.backendProviderName} — base de données, authentification, infrastructure technique ;`,
          `${c.frontendHostName} — hébergement frontend ;`,
          'un fournisseur d’envoi d’emails, s’il est configuré ultérieurement.',
        ]}
      />
      <P>
        {c.tradingName} peut ajouter ou modifier un sous-traitant technique si cela est nécessaire au fonctionnement,
        à la sécurité ou à l’évolution du service, à condition de maintenir un niveau de protection adapté et d’en
        informer raisonnablement le garage.
      </P>

      <H2>12. Transferts hors Union européenne</H2>
      <P>
        Certains prestataires peuvent être établis hors Union européenne. Le choix de la région d’hébergement Supabase
        doit être vérifié et documenté avant toute production large. Avant une commercialisation large,{' '}
        {c.tradingName} devra vérifier les garanties contractuelles applicables (clauses contractuelles types et
        mesures complémentaires éventuelles).
      </P>

      <H2>13. Assistance — droits des personnes</H2>
      <P>{c.tradingName} aide raisonnablement le garage à répondre aux demandes :</P>
      <UL
        items={[
          'd’accès ;',
          'de rectification ;',
          'de suppression ;',
          'd’opposition ;',
          'de limitation ;',
          'de portabilité.',
        ]}
      />

      <H2>14. Violation de données</H2>
      <P>
        {c.tradingName} informe le garage dans les meilleurs délais raisonnables après avoir eu connaissance d’une
        violation susceptible d’affecter des données personnelles, afin de lui permettre d’évaluer ses obligations.
      </P>

      <H2>15. Sort des données en fin de prestation</H2>
      <P>À la fin du pilote, au choix du garage :</P>
      <UL
        items={[
          'suppression des données ;',
          'export des données ;',
          'anonymisation éventuelle ;',
          'conservation technique temporaire dans les sauvegardes ;',
          'suppression définitive selon des délais techniques raisonnables.',
        ]}
      />

      <H2>16. Audit et preuve</H2>
      <P>
        {c.tradingName} fournit, sur demande raisonnable, les informations nécessaires pour démontrer le respect des
        obligations prévues par le présent accord, dans la limite de la sécurité, de la confidentialité et des moyens
        disponibles pendant le pilote. {c.tradingName} conserve une documentation raisonnable sur les mesures de
        sécurité, les tests d’isolation, les politiques d’accès et les limites du pilote.
      </P>

      <H2>17. Non-réutilisation</H2>
      <P>
        {c.tradingName} ne réutilise pas les données des clients du garage pour son propre compte, sauf :
      </P>
      <UL
        items={[
          'nécessité de sécurité ;',
          'support ;',
          'obligations légales ;',
          'statistiques anonymisées ou agrégées ;',
          'accord écrit du garage.',
        ]}
      />

      <H2>18. Contact</H2>
      <P>Pour toute demande liée à la protection des données : <MailLink email={c.privacyContactEmail} /></P>
    </LegalLayout>
  )
}

import { legalConfig as c } from '@/config/legal'
import { LegalLayout, H2, P, UL, MailLink } from './LegalLayout'

export function DpaPage() {
  return (
    <LegalLayout title="Accord de sous-traitance RGPD">
      <H2>1. Objet</H2>
      <P>
        Le présent accord encadre le traitement de données personnelles réalisé par {c.tradingName} dans le cadre de
        la fourniture de {c.appName} à un garage participant au pilote.
      </P>

      <H2>2. Qualification des parties</H2>
      <P>
        Le garage participant est <strong>responsable de traitement</strong> pour les données de ses propres clients
        lorsqu’il utilise {c.appName} pour gérer ses demandes, véhicules et devis.
      </P>
      <P>
        {c.tradingName} intervient comme <strong>sous-traitant technique</strong> pour fournir, maintenir et sécuriser{' '}
        {c.appName}.
      </P>
      <P>
        {c.tradingName} peut également être responsable de traitement pour certaines données nécessaires à la gestion
        de ses propres comptes, à la sécurité, à la prospection éventuelle et à la relation contractuelle avec le
        garage.
      </P>

      <H2>3. Durée</H2>
      <P>
        Le traitement est réalisé pendant la durée du pilote, puis pendant la durée nécessaire à l’export, la
        suppression, la sécurité ou la conservation technique limitée.
      </P>

      <H2>4. Nature et finalités du traitement</H2>
      <P>Les traitements portent sur :</P>
      <UL
        items={[
          'la création et gestion de comptes ;',
          'la transmission de demandes de rendez-vous ;',
          'la gestion de véhicules ;',
          'la création et envoi de devis ;',
          'l’acceptation ou le refus de devis ;',
          'le support ;',
          'la maintenance ;',
          'la sécurité ;',
          'la prévention des abus.',
        ]}
      />

      <H2>5. Catégories de données</H2>
      <P><strong>Données client :</strong></P>
      <UL
        items={[
          'identité ;',
          'coordonnées ;',
          'informations de véhicule ;',
          'demandes ;',
          'messages ;',
          'devis ;',
          'statuts d’acceptation ou de refus.',
        ]}
      />
      <P><strong>Données garage :</strong></P>
      <UL
        items={[
          'identité du garage ;',
          'coordonnées ;',
          'comptes utilisateurs ;',
          'paramètres ;',
          'prestations ;',
          'demandes et devis.',
        ]}
      />
      <P><strong>Données techniques :</strong></P>
      <UL
        items={[
          'logs limités ;',
          'identifiants techniques ;',
          'informations de session gérées par Supabase Auth.',
        ]}
      />

      <H2>6. Personnes concernées</H2>
      <UL
        items={[
          'clients des garages ;',
          'utilisateurs garage ;',
          'utilisateurs client ;',
          'utilisateurs de test du pilote.',
        ]}
      />

      <H2>7. Instructions du responsable de traitement</H2>
      <P>
        {c.tradingName} traite les données uniquement pour fournir {c.appName}, selon les instructions documentées du
        garage, les présentes conditions, les CGU, la politique de confidentialité et les besoins nécessaires à la
        sécurité du service.
      </P>

      <H2>8. Confidentialité</H2>
      <P>
        {c.tradingName} s’engage à ne pas revendre les données personnelles et à limiter l’accès aux données aux
        seules personnes ou prestataires ayant besoin d’y accéder pour fournir, maintenir ou sécuriser {c.appName}.
      </P>

      <H2>9. Sécurité</H2>
      <P>{c.tradingName} met en œuvre des mesures raisonnables, notamment :</P>
      <UL
        items={[
          'séparation des accès client/garage ;',
          'cloisonnement par garage ;',
          'Row Level Security Supabase ;',
          'tests d’isolation RLS ;',
          'absence de clé service_role côté frontend ;',
          'limitation du périmètre pilote ;',
          'absence d’upload de documents sensibles ;',
          'politique de mot de passe renforcée ;',
          'vérification anti-fuite de secrets ;',
          'HTTPS en déploiement.',
        ]}
      />

      <H2>10. Sous-traitants ultérieurs</H2>
      <P>{c.tradingName} utilise notamment :</P>
      <UL
        items={[
          `${c.frontendHostName} pour l’hébergement frontend ;`,
          `${c.backendProviderName} pour la base de données, l’authentification et l’infrastructure technique.`,
        ]}
      />
      <P>
        {c.tradingName} peut changer ou ajouter un prestataire technique si cela est nécessaire au fonctionnement, à
        la sécurité ou à l’évolution du service, sous réserve de maintenir un niveau de protection adapté.
      </P>

      <H2>11. Transferts hors Union européenne</H2>
      <P>Certains prestataires peuvent être établis hors Union européenne.</P>
      <P>Avant une commercialisation large, {c.tradingName} devra vérifier :</P>
      <UL
        items={[
          'la région d’hébergement Supabase ;',
          'les garanties contractuelles des prestataires ;',
          'les éventuelles clauses contractuelles types ;',
          'les mesures complémentaires nécessaires.',
        ]}
      />

      <H2>12. Assistance au garage</H2>
      <P>{c.tradingName} aide raisonnablement le garage à :</P>
      <UL
        items={[
          'répondre aux demandes d’accès ;',
          'corriger ou supprimer des données ;',
          'exporter les données du pilote ;',
          'traiter les demandes relatives aux droits des personnes.',
        ]}
      />

      <H2>13. Violation de données</H2>
      <P>
        En cas d’incident de sécurité susceptible d’affecter des données personnelles, {c.tradingName} s’engage à
        informer le garage dans les meilleurs délais raisonnables après en avoir pris connaissance, afin de permettre
        au garage d’évaluer ses obligations.
      </P>

      <H2>14. Fin de prestation</H2>
      <P>À la fin du pilote, le garage peut demander :</P>
      <UL
        items={[
          'la suppression des données ;',
          'l’export des données ;',
          'la prolongation du pilote ;',
          'la migration vers une offre commerciale.',
        ]}
      />

      <H2>15. Audit et preuve</H2>
      <P>
        {c.tradingName} conserve une documentation raisonnable sur les mesures de sécurité, les tests RLS, les
        politiques d’accès et les limites du pilote.
      </P>

      <H2>16. Non-réutilisation</H2>
      <P>
        {c.tradingName} ne réutilise pas les données des clients du garage pour son propre compte, sauf nécessité
        technique, sécurité, support, obligation légale ou accord écrit du garage.
      </P>

      <H2>17. Contact</H2>
      <P>Pour toute demande liée à la protection des données : <MailLink email={c.privacyContactEmail} /></P>
    </LegalLayout>
  )
}

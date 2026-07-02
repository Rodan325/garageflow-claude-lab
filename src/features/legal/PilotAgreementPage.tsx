import { Link } from 'react-router-dom'
import { legalConfig as c } from '@/config/legal'
import { LegalLayout, H2, P, UL, MailLink } from './LegalLayout'

export function PilotAgreementPage() {
  return (
    <LegalLayout title="Conditions du pilote garage">
      <H2>1. Objet</H2>
      <P>
        Les présentes conditions définissent le cadre d’un pilote {c.appName} entre {c.tradingName} et un garage
        participant. Le pilote vise à tester un outil de gestion des demandes de rendez-vous, véhicules, devis et
        acceptation client.
      </P>

      <H2>2. Parties</H2>
      <P>
        <strong>Prestataire :</strong> {c.legalBusinessName}, {c.editorLegalStatus.toLowerCase()}, SIRET {c.siret},
        siège situé {c.editorAddress}.
      </P>
      <P>
        <strong>Garage participant :</strong> le garage professionnel qui accepte de tester {c.appName} dans le cadre
        du pilote.
      </P>

      <H2>3. Durée</H2>
      <P>
        La durée standard du pilote est de {c.commercialOffer.pilotDurationDays} jours, sauf accord différent écrit
        entre les parties.
      </P>

      <H2>4. Périmètre du pilote</H2>
      <P>Le pilote porte uniquement sur :</P>
      <UL
        items={[
          'la réception de demandes de rendez-vous ;',
          'la gestion de véhicules renseignés par le client ;',
          'la confirmation ou le suivi des demandes ;',
          'la création de devis ;',
          'l’envoi de devis ;',
          'l’acceptation ou le refus du devis par le client.',
        ]}
      />

      <H2>5. Exclusions</H2>
      <P>Le pilote exclut :</P>
      <UL
        items={[
          'l’import massif de base client ;',
          'l’upload de carte grise ;',
          'l’upload d’assurance ;',
          'l’upload de contrôle technique ;',
          'l’upload de factures ;',
          'la collecte de pièces d’identité ;',
          'la collecte de données bancaires ;',
          'le paiement en ligne ;',
          'la signature électronique qualifiée ;',
          'l’usage comme logiciel de comptabilité ou logiciel de caisse certifié.',
        ]}
      />

      <H2>6. Obligations du garage</H2>
      <P>Le garage s’engage à :</P>
      <UL
        items={[
          `utiliser ${c.appName} uniquement pour le périmètre du pilote ;`,
          'ne pas saisir de documents sensibles interdits ;',
          'informer ses équipes du caractère pilote du service ;',
          'vérifier les devis avant envoi ;',
          'rester responsable de ses prix, prestations et relations avec ses clients ;',
          'respecter ses propres obligations professionnelles et réglementaires.',
        ]}
      />

      <H2>7. Obligations de {c.tradingName}</H2>
      <P>{c.tradingName} s’engage à :</P>
      <UL
        items={[
          `fournir un accès pilote à ${c.appName} ;`,
          'faire ses meilleurs efforts pour maintenir le service accessible ;',
          'limiter la collecte aux données nécessaires ;',
          'ne pas revendre les données ;',
          'maintenir une séparation des accès client/garage ;',
          'corriger les anomalies signalées selon leur priorité ;',
          'permettre l’export ou la suppression des données du pilote sur demande raisonnable.',
        ]}
      />

      <H2>8. Données personnelles</H2>
      <P>
        Le garage reste responsable du traitement des données de ses clients. {c.tradingName} agit comme prestataire
        technique et sous-traitant dans le cadre du pilote.
      </P>
      <P>
        L’accord de sous-traitance RGPD est disponible sur la page{' '}
        <Link to="/dpa" className="font-medium text-primary hover:underline">Accord de sous-traitance RGPD</Link>.
      </P>

      <H2>9. Prix du pilote</H2>
      <P>Le prix du pilote peut être :</P>
      <UL
        items={[
          'gratuit ;',
          'ou faire l’objet d’un accord écrit séparé ;',
          'ou être intégré dans une offre de configuration / accompagnement.',
        ]}
      />
      <P>Aucun paiement en ligne n’est activé dans {c.appName} pendant le pilote.</P>

      <H2>10. Fin du pilote</H2>
      <P>À la fin du pilote, les parties peuvent décider :</P>
      <UL
        items={[
          'd’arrêter le test ;',
          'de prolonger le pilote ;',
          'de supprimer les données ;',
          'd’exporter certaines données ;',
          'de passer sur une offre commerciale.',
        ]}
      />

      <H2>11. Limitation de responsabilité</H2>
      <P>
        {c.appName} étant en version pilote, {c.tradingName} ne garantit pas l’absence totale d’erreurs ou
        d’interruptions. Le garage reste responsable de la vérification des informations, devis, prix et prestations.
      </P>

      <H2>12. Droit applicable</H2>
      <P>Les présentes conditions sont soumises au droit français.</P>

      <H2>13. Contact</H2>
      <P><MailLink /> · {c.contactPhone}</P>
    </LegalLayout>
  )
}

import { Link } from 'react-router-dom'
import { legalConfig as c, legalVersions } from '@/config/legal'
import { LegalLayout, H2, P, UL, MailLink } from './LegalLayout'

export function PilotAgreementPage() {
  return (
    <LegalLayout title="Conditions du pilote garage" version={legalVersions.pilotAgreement}>
      <H2>1. Objet du pilote</H2>
      <P>
        Les présentes conditions définissent le cadre d’un pilote {c.appName} entre {c.tradingName} et un garage
        participant. Le pilote sert à tester {c.appName} sur un périmètre volontairement limité : gestion des demandes
        de rendez-vous, véhicules renseignés, devis et acceptation client.
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

      <H2>3. Acceptation</H2>
      <P>Le garage accepte les présentes conditions :</P>
      <UL
        items={[
          'par la création d’un compte garage ;',
          'par coche explicite d’acceptation (aucune case n’est pré-cochée) ;',
          'par l’utilisation de l’espace garage ;',
          'ou par validation écrite séparée si applicable.',
        ]}
      />
      <P>L’acceptation est horodatée et conservée dans un journal d’acceptation, avec la version du document.</P>

      <H2>4. Durée</H2>
      <P>
        La durée standard du pilote est de {c.commercialOffer.pilotDurationDays} jours. Toute prolongation intervient
        uniquement par accord écrit ou confirmation par email entre les parties.
      </P>

      <H2>5. Périmètre inclus</H2>
      <P>Le pilote couvre les usages suivants :</P>
      <UL
        items={[
          'la réception et le suivi de demandes de rendez-vous ;',
          'la gestion de véhicules renseignés par le client ;',
          'le suivi des statuts des demandes ;',
          'la création et l’envoi de devis ;',
          'l’acceptation ou le refus du devis par le client.',
        ]}
      />

      <H2>6. Périmètre exclu</H2>
      <P>À l’inverse, le pilote ne couvre pas, notamment :</P>
      <UL
        items={[
          'les documents sensibles (carte grise, assurance, contrôle technique, factures, identité, RIB…) ;',
          'le paiement en ligne ;',
          'la signature électronique qualifiée ;',
          'la comptabilité ;',
          'la caisse (logiciel de caisse certifié) ;',
          'les obligations fiscales du garage ;',
          'le diagnostic automobile ;',
          'l’expertise automobile ;',
          'la garantie mécanique ;',
          'la gestion complète d’assurance ;',
          'l’import massif de base client.',
        ]}
      />

      <H2>7. Conditions financières</H2>
      <UL
        items={[
          'le pilote est gratuit, sauf accord écrit contraire ;',
          'si une configuration ou prestation payante est prévue, elle doit faire l’objet d’un accord écrit séparé ;',
          `aucun paiement en ligne n’est activé dans ${c.appName} pendant le pilote.`,
        ]}
      />

      <H2>8. Obligations du garage</H2>
      <P>Le garage s’engage à :</P>
      <UL
        items={[
          `utiliser ${c.appName} uniquement dans le cadre du pilote ;`,
          'ne pas stocker de documents sensibles interdits ;',
          'vérifier chaque devis avant envoi ;',
          'informer ses équipes du caractère pilote du service ;',
          'respecter ses obligations RGPD auprès de ses propres clients ;',
          'répondre aux demandes de ses clients ;',
          'garder ses identifiants confidentiels ;',
          'signaler tout incident constaté ;',
          'ne pas importer de base client massive sans accord ;',
          `ne pas utiliser ${c.appName} comme outil critique exclusif.`,
        ]}
      />

      <H2>9. Obligations de {c.tradingName}</H2>
      <P>{c.tradingName} s’engage à :</P>
      <UL
        items={[
          'fournir un accès raisonnable au service ;',
          'maintenir les mesures de sécurité prévues ;',
          'ne pas revendre les données ;',
          'aider à l’export ou à la suppression des données en fin de pilote ;',
          'corriger les anomalies critiques selon ses moyens ;',
          'documenter les limites du pilote.',
        ]}
      />

      <H2>10. Responsabilités</H2>
      <P>
        Le garage reste seul responsable de la relation commerciale, des devis, prix, délais, diagnostics,
        prestations, réparations, garanties et obligations professionnelles.
      </P>
      <P>
        {c.tradingName} n’intervient pas dans la décision de réparer, facturer, refuser, accepter, garantir ou
        diagnostiquer un véhicule.
      </P>

      <H2>11. Limitation de responsabilité</H2>
      <P>
        Pendant le pilote, la responsabilité de {c.tradingName} est limitée aux dommages directs prouvés, dans la
        limite permise par le droit applicable.
      </P>
      <UL
        items={[
          'si le pilote est gratuit, la responsabilité financière totale de RODANBTECH ne pourra pas dépasser 100 €, sauf faute lourde, faute dolosive ou obligation légale impérative ;',
          'si un accord payant séparé existe, cette limite est portée au montant effectivement payé par le garage au titre des 3 derniers mois.',
        ]}
      />

      <H2>12. Confidentialité</H2>
      <P>
        Le garage et {c.tradingName} s’engagent à garder confidentielles les informations non publiques échangées
        pendant le pilote.
      </P>

      <H2>13. Données personnelles</H2>
      <P>
        Le garage reste responsable du traitement des données de ses clients. {c.tradingName} agit comme prestataire
        technique et sous-traitant dans le cadre du pilote. L’accord de sous-traitance RGPD est disponible sur la page{' '}
        <Link to="/dpa" className="font-medium text-primary hover:underline">Accord de sous-traitance RGPD</Link>.
      </P>

      <H2>14. Fin du pilote</H2>
      <P>À la fin du pilote, les parties peuvent décider :</P>
      <UL
        items={[
          'de la suppression des données ;',
          'de l’export des données ;',
          'de la prolongation du pilote (par écrit) ;',
          'du passage sur une offre commerciale ;',
          'de la désactivation des accès.',
        ]}
      />

      <H2>15. Résiliation</H2>
      <P>
        Chaque partie peut arrêter le pilote à tout moment avec notification par email. {c.tradingName} peut arrêter
        immédiatement le pilote en cas d’abus, de risque de sécurité, de saisie de données interdites ou de
        non-respect des présentes conditions.
      </P>

      <H2>16. Référence commerciale</H2>
      <P>
        Aucune des parties n’utilise publiquement le nom de l’autre comme référence commerciale sans accord écrit
        préalable.
      </P>

      <H2>17. Droit applicable</H2>
      <P>Les présentes conditions sont soumises au droit français.</P>

      <H2>18. Contact</H2>
      <P><MailLink /> · {c.contactPhone}</P>
    </LegalLayout>
  )
}

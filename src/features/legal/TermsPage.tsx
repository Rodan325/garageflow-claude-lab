import { Link } from 'react-router-dom'
import { legalConfig as c } from '@/config/legal'
import { LegalLayout, H2, P, UL, MailLink } from './LegalLayout'

export function TermsPage() {
  return (
    <LegalLayout title="Conditions générales d’utilisation">
      <H2>1. Objet</H2>
      <P>
        Les présentes conditions générales d’utilisation encadrent l’accès et l’utilisation de {c.appName} en version
        pilote. {c.appName} est un outil permettant notamment :
      </P>
      <UL
        items={[
          'aux garages de recevoir et suivre des demandes de rendez-vous ;',
          'de gérer certains clients et véhicules ;',
          'de créer et envoyer des devis ;',
          'aux clients de transmettre une demande, consulter un devis et l’accepter ou le refuser en ligne.',
        ]}
      />

      <H2>2. Éditeur</H2>
      <P>
        {c.appName} est édité par {c.legalBusinessName}, {c.editorLegalStatus.toLowerCase()}, SIRET {c.siret}, siège
        situé {c.editorAddress}.
      </P>
      <P>Contact : <MailLink /> · {c.contactPhone}</P>

      <H2>3. Version pilote</H2>
      <P>
        {c.appName} est proposé en version pilote. Certaines fonctionnalités peuvent être modifiées, ajoutées,
        suspendues ou supprimées pendant la phase de test. Le pilote est limité volontairement et ne doit pas être
        utilisé pour stocker des documents sensibles.
      </P>

      <H2>4. Accès au service</H2>
      <P>
        L’accès peut nécessiter un compte client ou garage. L’utilisateur s’engage à fournir des informations exactes,
        à maintenir la confidentialité de ses identifiants et à prévenir {c.tradingName} en cas d’accès non autorisé.
      </P>

      <H2>5. Rôle du garage</H2>
      <P>Le garage est responsable :</P>
      <UL
        items={[
          'des prestations qu’il propose ;',
          'des informations qu’il saisit ;',
          'des prix et devis qu’il émet ;',
          'de la relation commerciale avec ses clients ;',
          'de l’exécution des prestations automobiles ;',
          'de ses obligations professionnelles, fiscales, comptables et réglementaires.',
        ]}
      />
      <P>
        {c.appName} ne remplace pas un logiciel de comptabilité, un logiciel de caisse certifié, un conseil juridique
        ou un contrôle professionnel automobile.
      </P>

      <H2>6. Rôle du client</H2>
      <P>
        Le client s’engage à fournir des informations exactes et à ne pas saisir de documents ou données sensibles
        pendant le pilote.
      </P>
      <P>
        L’acceptation d’un devis via {c.appName} matérialise l’accord du client sur le devis présenté, sous réserve
        des conditions commerciales du garage concerné.
      </P>

      <H2>7. Données interdites pendant le pilote</H2>
      <P>Il est interdit de stocker dans {c.appName} :</P>
      <UL
        items={[
          'carte grise ;',
          'assurance ;',
          'contrôle technique ;',
          'factures d’entretien ;',
          'pièce d’identité ;',
          'données bancaires ;',
          'données de santé ;',
          'documents juridiques sensibles ;',
          'contenus illicites ou abusifs.',
        ]}
      />

      <H2>8. Disponibilité</H2>
      <P>
        {c.tradingName} fait ses meilleurs efforts pour maintenir {c.appName} accessible, mais ne garantit pas une
        disponibilité continue pendant la phase pilote. Des interruptions peuvent intervenir pour maintenance,
        correction, sécurité ou évolution du service.
      </P>

      <H2>9. Sécurité</H2>
      <P>
        L’utilisateur s’engage à ne pas tenter de contourner les protections d’accès, tester abusivement les systèmes,
        extraire des données, perturber le service ou utiliser {c.appName} de manière frauduleuse.
      </P>

      <H2>10. Propriété intellectuelle</H2>
      <P>
        {c.appName}, son interface, ses textes, éléments graphiques, fonctionnalités, composants et contenus sont
        protégés. Aucun droit de propriété intellectuelle n’est transféré à l’utilisateur.
      </P>

      <H2>11. Données personnelles</H2>
      <P>
        Les traitements de données personnelles sont décrits dans la{' '}
        <Link to="/privacy" className="font-medium text-primary hover:underline">Politique de confidentialité</Link>.
      </P>

      <H2>12. Responsabilité</H2>
      <P>{c.tradingName} ne pourra être tenu responsable :</P>
      <UL
        items={[
          'des erreurs saisies par un garage ou un client ;',
          'd’un devis incorrect établi par un garage ;',
          'de la mauvaise exécution d’une prestation automobile ;',
          'd’un usage non conforme du service ;',
          'd’une indisponibilité temporaire du service pendant le pilote ;',
          'de la saisie volontaire de documents interdits par un utilisateur.',
        ]}
      />

      <H2>13. Suspension ou suppression d’accès</H2>
      <P>{c.tradingName} peut suspendre ou supprimer un accès en cas :</P>
      <UL
        items={[
          'd’usage abusif ;',
          'de tentative d’accès non autorisé ;',
          'de saisie de données interdites ;',
          'de comportement frauduleux ;',
          'de non-respect des présentes conditions.',
        ]}
      />

      <H2>14. Droit applicable</H2>
      <P>Les présentes conditions sont soumises au droit français.</P>

      <H2>15. Contact</H2>
      <P>Pour toute question : <MailLink /></P>
    </LegalLayout>
  )
}

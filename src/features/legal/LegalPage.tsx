import { Link } from 'react-router-dom'
import { legalConfig as c, legalVersions } from '@/config/legal'
import { LegalLayout, H2, P, UL, MailLink, ExtLink } from './LegalLayout'

export function LegalPage() {
  return (
    <LegalLayout title="Mentions légales" version={legalVersions.legalNotice}>
      <H2>Éditeur du site</H2>
      <P>{c.appName} est édité par :</P>
      <UL
        items={[
          <>Nom / dénomination : <strong>{c.legalBusinessName}</strong></>,
          <>Forme juridique : {c.editorLegalStatus}</>,
          <>Responsable de publication : {c.publicationDirector}</>,
          <>Adresse du siège : {c.editorAddress}</>,
          <>Email : <MailLink /></>,
          <>Téléphone : {c.contactPhone}</>,
          <>SIREN : {c.siren}</>,
          <>SIRET : {c.siret}</>,
          <>Immatriculation : {c.rneStatus}</>,
          <>Inscription Insee : {c.inseeStatus}</>,
          <>Code NAF/APE : {c.nafApeCode} — {c.nafApeLabel}</>,
          <>Activité NAF 2025 : {c.naf2025Code} — {c.naf2025Label}</>,
          <>TVA intracommunautaire : {c.vatNumber}</>,
          <>EORI : {c.eoriNumber}</>,
          <>Effectif : {c.employees}</>,
        ]}
      />

      <H2>Hébergement</H2>
      <P><strong>Frontend :</strong></P>
      <UL
        items={[
          c.frontendHostName,
          c.frontendHostAddress,
          <ExtLink href={c.frontendHostWebsite} />,
        ]}
      />
      <P><strong>Infrastructure technique :</strong></P>
      <UL
        items={[
          c.backendProviderName,
          <ExtLink href={c.backendProviderWebsite} />,
          <>Usage : {c.backendPurpose}.</>,
          <>Région : {c.backendDataRegion}</>,
        ]}
      />

      <H2>Contact</H2>
      <P>Pour toute question concernant {c.appName} : <MailLink /></P>

      <H2>Version pilote</H2>
      <P>
        {c.appName} est actuellement proposé en version pilote. Le service est susceptible d’évoluer avant une
        commercialisation large.
      </P>

      <H2>Propriété intellectuelle</H2>
      <P>
        Les textes, interfaces, logos, éléments graphiques, fonctionnalités, bases documentaires et contenus de{' '}
        {c.appName} sont protégés. Toute reproduction, extraction, adaptation ou réutilisation non autorisée est
        interdite, sauf accord écrit préalable de {c.tradingName}.
      </P>

      <H2>Responsabilité</H2>
      <P>
        {c.appName} est un outil d’aide à la gestion des demandes de rendez-vous, véhicules et devis pour garages.{' '}
        {c.appName} ne fournit pas de conseil juridique, fiscal, comptable, technique automobile ou réglementaire.
        Chaque garage reste responsable des informations qu’il saisit, des devis qu’il émet, des prix qu’il applique,
        des prestations qu’il réalise et de sa relation commerciale avec ses clients.
      </P>

      <H2>Données personnelles</H2>
      <P>
        Les informations relatives au traitement des données personnelles sont détaillées dans la{' '}
        <Link to="/privacy" className="font-medium text-primary hover:underline">Politique de confidentialité</Link>.
      </P>

      <H2>Documents contractuels</H2>
      <P>
        Les <Link to="/terms" className="font-medium text-primary hover:underline">conditions d’utilisation</Link>, les{' '}
        <Link to="/pilot-agreement" className="font-medium text-primary hover:underline">conditions du pilote garage</Link>{' '}
        et l’<Link to="/dpa" className="font-medium text-primary hover:underline">accord de sous-traitance RGPD</Link>{' '}
        sont accessibles depuis le footer légal.
      </P>
    </LegalLayout>
  )
}

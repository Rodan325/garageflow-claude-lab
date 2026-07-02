import { legalConfig as c } from '@/config/legal'
import { LegalLayout, H2, P, UL, MailLink, ExtLink } from './LegalLayout'

export function PrivacyPage() {
  return (
    <LegalLayout title="Politique de confidentialité">
      <H2>1. Objet</H2>
      <P>
        Cette politique explique comment {c.appName} traite les données personnelles dans le cadre de sa version
        pilote. {c.appName} permet notamment :
      </P>
      <UL
        items={[
          'à un client de transmettre une demande de rendez-vous à un garage ;',
          'de renseigner un véhicule ;',
          'de suivre une demande ;',
          'de recevoir un devis ;',
          'd’accepter ou refuser un devis en ligne ;',
          'à un garage de gérer ses demandes, clients, véhicules et devis.',
        ]}
      />

      <H2>2. Qui traite les données ?</H2>
      <P>{c.appName} est édité par {c.legalBusinessName}, {c.editorLegalStatus.toLowerCase()}. Selon le contexte :</P>
      <UL
        items={[
          'le garage utilisateur est responsable du traitement des données de ses propres clients ;',
          `${c.appName} intervient comme prestataire technique et sous-traitant pour fournir l’outil au garage ;`,
          `${c.appName} traite également certaines données pour assurer la sécurité, la maintenance, le support et l’amélioration du service pilote.`,
        ]}
      />
      <P>Contact données personnelles : <MailLink email={c.privacyContactEmail} /></P>
      <P>{c.dpo}.</P>

      <H2>3. Données collectées pendant le pilote</H2>
      <P><strong>Données client :</strong></P>
      <UL
        items={[
          'nom et prénom ;',
          'email ;',
          'téléphone ;',
          'informations de compte ;',
          'véhicule : marque, modèle, année, carburant, kilométrage, immatriculation si renseignée ;',
          'demandes de rendez-vous ;',
          'messages ou informations saisies dans la demande ;',
          'devis reçus ;',
          'statut d’acceptation ou de refus du devis ;',
          'motif de refus éventuel ;',
          'dates et statuts liés aux demandes et devis.',
        ]}
      />
      <P><strong>Données garage :</strong></P>
      <UL
        items={[
          'nom du garage ;',
          'coordonnées du garage ;',
          'horaires ;',
          'prestations proposées ;',
          'informations de compte utilisateur ;',
          'demandes reçues ;',
          'clients et véhicules liés aux demandes ;',
          'devis créés, envoyés, acceptés ou refusés ;',
          'paramètres du garage.',
        ]}
      />
      <P><strong>Données techniques :</strong></P>
      <UL
        items={[
          'informations nécessaires à l’authentification ;',
          'identifiants techniques de session gérés par Supabase Auth ;',
          'logs techniques limités ;',
          'informations nécessaires à la sécurité et au bon fonctionnement de l’application.',
        ]}
      />
      <P>{c.appName} ne stocke pas les mots de passe en clair.</P>

      <H2>4. Données interdites pendant le pilote</H2>
      <P>Pendant le pilote, {c.appName} ne doit pas être utilisé pour stocker :</P>
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
          'tout document sensible non nécessaire au test du service.',
        ]}
      />
      <P>
        Si un utilisateur saisit malgré tout ce type d’information dans un champ libre, {c.tradingName} ou le garage
        pourra demander sa suppression.
      </P>

      <H2>5. Finalités</H2>
      <P>Les données sont utilisées pour :</P>
      <UL
        items={[
          'créer et gérer un compte ;',
          'permettre au client d’envoyer une demande de rendez-vous ;',
          'permettre au garage de consulter et traiter la demande ;',
          'permettre au garage de confirmer un rendez-vous ;',
          'permettre au garage de créer et envoyer un devis ;',
          'permettre au client d’accepter ou refuser un devis ;',
          'assurer le support technique ;',
          'sécuriser l’application ;',
          'prévenir les abus ;',
          `améliorer ${c.appName} pendant le pilote ;`,
          'respecter les obligations légales applicables.',
        ]}
      />

      <H2>6. Bases légales</H2>
      <P>Selon les cas, les traitements reposent sur :</P>
      <UL
        items={[
          'l’exécution du service ou de mesures précontractuelles ;',
          `l’intérêt légitime de ${c.tradingName} et du garage pour assurer la sécurité, le support, la prévention des abus et l’amélioration du service ;`,
          'le consentement du client lorsqu’il partage volontairement les informations de son véhicule avec un garage dans le cadre d’une demande ;',
          'le respect d’obligations légales lorsque cela est applicable.',
        ]}
      />

      <H2>7. Destinataires</H2>
      <P>Les données peuvent être consultées par :</P>
      <UL
        items={[
          'le client pour ses propres informations ;',
          'le garage uniquement pour les demandes, véhicules et devis qui le concernent ;',
          `${c.tradingName} pour l’exploitation technique, la maintenance, la sécurité et le support ;`,
          'les prestataires techniques strictement nécessaires au fonctionnement du service, notamment Supabase et Vercel.',
        ]}
      />
      <P>{c.appName} ne revend pas les données personnelles.</P>

      <H2>8. Durée de conservation</H2>
      <P>Pendant le pilote :</P>
      <UL
        items={[
          'les données de compte sont conservées pendant la durée du compte ou du pilote ;',
          'les demandes et devis sont conservés pendant la durée du pilote ;',
          'à la fin du pilote, le garage peut demander l’export ou la suppression des données ;',
          'les données supprimées peuvent subsister temporairement dans des sauvegardes techniques avant suppression définitive ;',
          'les logs techniques sont conservés pour une durée limitée nécessaire à la sécurité et au diagnostic.',
        ]}
      />
      <P>
        Pour une commercialisation large, une politique de conservation plus détaillée pourra être établie selon les
        obligations légales, comptables et contractuelles applicables.
      </P>

      <H2>9. Sécurité</H2>
      <P>{c.appName} met en place plusieurs mesures de sécurité :</P>
      <UL
        items={[
          'séparation des espaces client et garage ;',
          'accès cloisonnés par garage ;',
          'Row Level Security Supabase ;',
          'tests d’isolation RLS ;',
          'pas de clé secrète dans le navigateur ;',
          'pas de clé service_role côté frontend ;',
          'pas d’upload de documents sensibles pendant le pilote ;',
          'mots de passe gérés par Supabase Auth ;',
          'HTTPS obligatoire en déploiement ;',
          'politique de mot de passe renforcée ;',
          'vérification anti-fuite de secrets dans le code ;',
          'limitation volontaire du périmètre du pilote.',
        ]}
      />

      <H2>10. Droits des personnes</H2>
      <P>Les utilisateurs peuvent demander :</P>
      <UL
        items={[
          'l’accès à leurs données ;',
          'la rectification ;',
          'la suppression ;',
          'la limitation ;',
          'l’opposition lorsque applicable ;',
          'la portabilité lorsque applicable ;',
          'le retrait du consentement lorsque le traitement repose sur le consentement.',
        ]}
      />
      <P>Pour exercer ces droits : <MailLink email={c.privacyContactEmail} /></P>
      <P>
        Les personnes concernées peuvent également introduire une réclamation auprès de la CNIL :{' '}
        <ExtLink href={c.cnilWebsite} />
      </P>

      <H2>11. Cookies et traceurs</H2>
      <P>
        Pendant le pilote, {c.appName} n’utilise pas de cookies publicitaires ni de traceurs marketing. L’application
        utilise uniquement des mécanismes techniques nécessaires au fonctionnement du service, notamment pour
        maintenir une session utilisateur et assurer la sécurité.
      </P>
      <P>
        Si des outils d’analyse d’audience ou de marketing sont ajoutés plus tard, cette politique sera mise à jour et
        un consentement sera demandé lorsque nécessaire.
      </P>

      <H2>12. Transferts hors Union européenne</H2>
      <P>
        {c.appName} utilise des prestataires techniques pouvant être établis hors Union européenne, notamment{' '}
        {c.frontendHostName} pour l’hébergement frontend et {c.backendProviderName} pour l’infrastructure technique.
      </P>
      <P>
        Le projet Supabase de production doit être configuré en région Union européenne lorsque cela est disponible et
        adapté au service. Avant une commercialisation large, les garanties contractuelles des prestataires, le choix
        de région et les éventuels transferts hors Union européenne devront être vérifiés.
      </P>

      <H2>13. Modification de la politique</H2>
      <P>
        Cette politique peut être mise à jour pour tenir compte de l’évolution du service, des obligations légales ou
        des prestataires techniques.
      </P>
    </LegalLayout>
  )
}

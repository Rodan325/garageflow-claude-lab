import { legalConfig as c, legalVersions } from '@/config/legal'
import { LegalLayout, H2, P, UL, MailLink, ExtLink } from './LegalLayout'

const SUMMARY: { label: string; value: string }[] = [
  { label: 'Données collectées', value: 'Identité, coordonnées, compte, véhicule, demandes, messages, devis et statuts, logs techniques limités.' },
  { label: 'Pourquoi', value: 'Permettre les demandes de rendez-vous, les devis et leur acceptation, le support et la sécurité du service.' },
  { label: 'Qui y accède', value: 'Vous, le garage concerné par votre demande uniquement, RODANBTECH pour l’exploitation technique, et les prestataires strictement nécessaires (Supabase, Vercel).' },
  { label: 'Combien de temps', value: 'Pendant la durée du compte ou du pilote, puis export ou suppression sur demande (sauvegardes techniques temporaires).' },
  { label: 'Vos droits', value: 'Accès, rectification, suppression, limitation, opposition, portabilité, retrait du consentement.' },
  { label: 'Contact', value: 'anas.rodriguez@rodanbtech.com — réclamation possible auprès de la CNIL.' },
]

const DATA_TABLE: { data: string; nature: string; base: string; dest: string; duration: string }[] = [
  { data: 'Identité & coordonnées (nom, email, téléphone)', nature: 'Obligatoire (compte / demande)', base: 'Exécution du service', dest: 'Garage concerné, RODANBTECH', duration: 'Durée du compte, puis archivage limité ≤ 12 mois' },
  { data: 'Informations de compte (authentification)', nature: 'Obligatoire', base: 'Exécution du service', dest: 'RODANBTECH (via Supabase Auth)', duration: 'Durée du compte, puis ≤ 12 mois après clôture' },
  { data: 'Véhicule (marque, modèle, année, carburant, km, plaque)', nature: 'Plaque et détails facultatifs', base: 'Consentement (partage avec le garage)', dest: 'Garage destinataire de la demande uniquement', duration: 'Durée du compte / pilote' },
  { data: 'Demandes & messages', nature: 'Obligatoire pour le service', base: 'Exécution du service', dest: 'Garage concerné, RODANBTECH', duration: 'Pilote, puis ≤ 12 mois sauf preuve' },
  { data: 'Devis & statuts (acceptation/refus horodatés)', nature: 'Obligatoire pour le service', base: 'Exécution du service / mesures précontractuelles', dest: 'Garage émetteur, client destinataire', duration: 'Pilote ; ≤ 5 ans si accepté/refusé (preuve)' },
  { data: 'Acceptations légales (document, version, date)', nature: 'Obligatoire (preuve)', base: 'Intérêt légitime / obligation de preuve', dest: 'RODANBTECH', duration: 'Durée du compte, puis ≤ 5 ans (preuve)' },
  { data: 'Logs techniques limités', nature: 'Automatique', base: 'Intérêt légitime (sécurité)', dest: 'RODANBTECH', duration: '≤ 90 jours sauf incident de sécurité' },
]

export function PrivacyPage() {
  return (
    <LegalLayout title="Politique de confidentialité" version={legalVersions.privacy}>
      <section className="rounded-xl border border-border bg-muted/30 p-4">
        <h2 className="text-base font-semibold">Résumé rapide</h2>
        <dl className="mt-2 space-y-1.5 text-sm">
          {SUMMARY.map(({ label, value }) => (
            <div key={label} className="sm:flex sm:gap-2">
              <dt className="shrink-0 font-medium sm:w-40">{label}</dt>
              <dd className="text-muted-foreground">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-xs text-muted-foreground">
          Pas de cookies publicitaires, pas de traceurs marketing, pas de documents sensibles pendant le pilote. Votre
          acceptation des documents légaux est enregistrée (version + date).
        </p>
      </section>

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

      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="p-2 font-semibold">Données</th>
              <th className="p-2 font-semibold">Caractère</th>
              <th className="p-2 font-semibold">Base légale</th>
              <th className="p-2 font-semibold">Destinataires</th>
              <th className="p-2 font-semibold">Durée indicative</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-muted-foreground">
            {DATA_TABLE.map((row) => (
              <tr key={row.data}>
                <td className="p-2 font-medium text-foreground">{row.data}</td>
                <td className="p-2">{row.nature}</td>
                <td className="p-2">{row.base}</td>
                <td className="p-2">{row.dest}</td>
                <td className="p-2">{row.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
      <P>Durées indicatives appliquées pendant le pilote :</P>
      <UL
        items={[
          <><strong>Données de compte</strong> : durée du compte, puis suppression ou archivage limité sous 12 mois maximum après clôture, sauf obligation légale ou preuve nécessaire.</>,
          <><strong>Demandes et messages du pilote</strong> : durée du pilote, puis export ou suppression sur demande du garage ; conservation maximale indicative de 12 mois après la fin du pilote, sauf accord contraire ou nécessité de preuve.</>,
          <><strong>Devis et statuts</strong> : durée du pilote ; si un devis est accepté ou refusé, conservation possible jusqu’à 5 ans comme élément de preuve, sauf suppression compatible avec les obligations applicables.</>,
          <><strong>Acceptations légales</strong> : durée du compte, puis jusqu’à 5 ans comme preuve de l’acceptation des documents applicables.</>,
          <><strong>Logs techniques</strong> : 90 jours maximum, sauf incident de sécurité nécessitant une conservation plus longue.</>,
          <><strong>Sauvegardes techniques</strong> : rotation/suppression technique sous 90 jours maximum lorsque le prestataire le permet.</>,
        ]}
      />
      <P>
        Ces durées sont indicatives pour le pilote et pourront être ajustées avant commercialisation large selon les
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

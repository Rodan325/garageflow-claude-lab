import { Link } from 'react-router-dom'
import { legalConfig as c, legalVersions } from '@/config/legal'
import { LegalLayout, H2, P, UL, MailLink } from './LegalLayout'

export function TermsPage() {
  return (
    <LegalLayout title="Conditions générales d’utilisation" version={legalVersions.terms}>
      <H2>1. Objet</H2>
      <P>
        Les présentes conditions générales d’utilisation (« CGU ») encadrent l’accès et l’utilisation de {c.appName}{' '}
        en version pilote. {c.appName} est un outil permettant notamment :
      </P>
      <UL
        items={[
          'aux garages de recevoir et suivre des demandes de rendez-vous ;',
          'de gérer certains clients et véhicules ;',
          'de créer et envoyer des devis ;',
          'aux clients de transmettre une demande, consulter un devis et l’accepter ou le refuser en ligne.',
        ]}
      />

      <H2>2. Définitions</H2>
      <UL
        items={[
          <><strong>{c.appName}</strong> : l’application logicielle éditée par {c.tradingName}, objet des présentes CGU.</>,
          <><strong>{c.tradingName}</strong> : {c.legalBusinessName}, {c.editorLegalStatus.toLowerCase()}, éditeur de {c.appName}.</>,
          <><strong>Garage utilisateur</strong> : le professionnel de l’automobile disposant d’un compte garage et utilisant {c.appName} pour gérer ses demandes, clients, véhicules et devis.</>,
          <><strong>Client final</strong> : la personne qui transmet une demande de rendez-vous à un garage, renseigne un véhicule ou répond à un devis via {c.appName}.</>,
          <><strong>Compte</strong> : l’accès personnel et identifié à {c.appName} (client ou garage).</>,
          <><strong>Demande</strong> : la demande de rendez-vous transmise par un client à un garage via {c.appName}.</>,
          <><strong>Véhicule</strong> : les informations descriptives d’un véhicule renseignées par un client ou un garage (marque, modèle, année, carburant, kilométrage, immatriculation).</>,
          <><strong>Devis</strong> : le document chiffré établi par un garage sous sa responsabilité et transmis au client via {c.appName}.</>,
          <><strong>Version pilote</strong> : la phase de test du service, au périmètre volontairement limité, décrite à l’article 4.</>,
          <><strong>Données sensibles interdites</strong> : les documents et données listés à l’article 10, dont le stockage dans {c.appName} est interdit pendant le pilote.</>,
        ]}
      />

      <H2>3. Acceptation des CGU</H2>
      <UL
        items={[
          `l’utilisation de ${c.appName} implique l’acceptation des présentes CGU ;`,
          'lors de la création de compte, l’utilisateur doit cocher une case d’acceptation explicite (aucune case n’est pré-cochée) ;',
          'l’acceptation est horodatée et conservée dans un journal d’acceptation, avec la version du document acceptée ;',
          'en cas de nouvelle version importante des CGU, une nouvelle acceptation pourra être demandée avant de poursuivre l’utilisation.',
        ]}
      />

      <H2>4. Version pilote</H2>
      <P>{c.appName} est proposé en version pilote :</P>
      <UL
        items={[
          'le service est en phase de test ;',
          'le périmètre est volontairement limité ;',
          'aucune disponibilité continue n’est garantie ;',
          'les fonctionnalités sont susceptibles d’évoluer, d’être suspendues ou supprimées ;',
          'le service ne doit faire l’objet d’aucun usage critique ou exclusif sans vérification humaine des informations.',
        ]}
      />

      <H2>5. Accès au service</H2>
      <P>
        L’accès peut nécessiter un compte client ou garage. L’utilisateur s’engage à fournir des informations exactes,
        à maintenir la confidentialité de ses identifiants et à prévenir {c.tradingName} en cas d’accès non autorisé.
      </P>

      <H2>6. Rôle de {c.tradingName}</H2>
      <P>{c.tradingName} fournit un outil technique. {c.tradingName} n’est pas :</P>
      <UL
        items={[
          'réparateur automobile ;',
          'garagiste ;',
          'courtier en assurance ;',
          'expert automobile ;',
          'conseiller juridique ;',
          'comptable ;',
          'logiciel de caisse certifié ;',
          'prestataire de paiement ;',
          'tiers de confiance pour expertise technique automobile.',
        ]}
      />

      <H2>7. Responsabilité du garage</H2>
      <P>Le garage est seul responsable :</P>
      <UL
        items={[
          'des prestations proposées ;',
          'des diagnostics ;',
          'des prix ;',
          'des devis ;',
          'des délais annoncés ;',
          'de la qualité des réparations ;',
          'de la conformité de ses obligations professionnelles ;',
          'de la relation commerciale avec ses clients ;',
          'des informations qu’il saisit ;',
          'de la vérification du devis avant envoi ;',
          'de la décision de réaliser ou non une prestation.',
        ]}
      />
      <P>
        {c.appName} ne remplace pas un logiciel de comptabilité, un logiciel de caisse certifié, un conseil juridique
        ou un contrôle professionnel automobile.
      </P>

      <H2>8. Responsabilité du client</H2>
      <P>Le client est responsable :</P>
      <UL
        items={[
          'de l’exactitude des informations fournies ;',
          'du véhicule renseigné ;',
          'de ses messages ;',
          'de la lecture du devis avant acceptation ;',
          'de ne pas saisir de données sensibles interdites.',
        ]}
      />

      <H2>9. Devis et acceptation</H2>
      <UL
        items={[
          `${c.appName} permet de transmettre un devis, mais le devis reste établi sous la responsabilité du garage ;`,
          'le garage doit vérifier le devis avant envoi ;',
          'le client doit lire le devis avant acceptation ;',
          'l’acceptation du devis est horodatée, avec la version des documents applicables au moment de l’acceptation ;',
          'l’acceptation ne remplace pas les obligations légales ou commerciales du garage ;',
          `en cas de contradiction entre ${c.appName} et un document contractuel signé séparément, le document contractuel signé séparément peut prévaloir selon le contexte.`,
        ]}
      />

      <H2>10. Données interdites pendant le pilote</H2>
      <P>Il est strictement interdit de stocker dans {c.appName} :</P>
      <UL
        items={[
          'carte grise ;',
          'assurance ;',
          'contrôle technique ;',
          'factures ;',
          'pièce d’identité ;',
          'RIB ;',
          'carte bancaire ;',
          'données de santé ;',
          'documents juridiques sensibles ;',
          'données de mineurs non nécessaires ;',
          'données relatives à des infractions ;',
          'tout document ou information non nécessaire au pilote.',
        ]}
      />
      <P>{c.tradingName} peut supprimer ou demander la suppression des informations interdites.</P>

      <H2>11. Usage interdit</H2>
      <P>Sont interdits :</P>
      <UL
        items={[
          'toute tentative d’accès non autorisé ;',
          'le contournement des mécanismes de sécurité ou de cloisonnement des données ;',
          'l’extraction massive de données ;',
          'le reverse engineering abusif ;',
          'le spam ;',
          'l’usurpation d’identité ;',
          'la saisie de fausses informations ;',
          'tout usage illicite ;',
          'le dépôt de contenu injurieux, diffamatoire ou frauduleux.',
        ]}
      />

      <H2>12. Suspension</H2>
      <P>{c.tradingName} peut suspendre un compte en cas :</P>
      <UL
        items={[
          'd’usage abusif ;',
          'de risque de sécurité ;',
          'de saisie de données interdites ;',
          'de non-respect des CGU ;',
          'de demande légitime d’un garage pilote ;',
          'de fin de pilote.',
        ]}
      />

      <H2>13. Disponibilité</H2>
      <P>{c.tradingName} fait ses meilleurs efforts mais ne garantit pas :</P>
      <UL
        items={[
          'une disponibilité continue ;',
          'l’absence totale d’erreur ;',
          'l’absence de maintenance ;',
          'la compatibilité avec tous les appareils ;',
          'la conservation infinie des données.',
        ]}
      />

      <H2>14. Limitation de responsabilité</H2>
      <P>
        Dans la limite permise par le droit applicable, {c.tradingName} ne pourra être responsable que des dommages
        directs prouvés résultant d’un manquement imputable à {c.tradingName}.
      </P>
      <P>Sont notamment exclus :</P>
      <UL
        items={[
          'les dommages indirects ;',
          'la perte de chiffre d’affaires ;',
          'la perte de clientèle ;',
          'la perte d’image ;',
          'la perte de chance ;',
          'les litiges entre un garage et son client ;',
          'les erreurs de diagnostic ;',
          'la mauvaise exécution d’une réparation ;',
          'un devis erroné saisi par le garage ;',
          'des données interdites saisies par un utilisateur ;',
          'une indisponibilité temporaire en phase pilote.',
        ]}
      />
      <P>
        Cette limitation ne s’applique pas en cas de faute lourde ou dolosive de {c.tradingName}, ni aux obligations
        légales impératives, ni aux droits qui ne peuvent être exclus par la loi.
      </P>
      <P>
        Lorsque l’utilisateur agit en qualité de consommateur, les présentes limitations ne privent pas l’utilisateur
        des droits impératifs dont il bénéficie en vertu de la loi applicable.
      </P>

      <H2>15. Preuve</H2>
      <P>
        Les journaux techniques, horodatages, statuts, acceptations de documents et acceptations de devis peuvent
        servir d’éléments de preuve du parcours utilisateur.
      </P>

      <H2>16. Données personnelles</H2>
      <P>
        Les traitements de données personnelles sont décrits dans la{' '}
        <Link to="/privacy" className="font-medium text-primary hover:underline">Politique de confidentialité</Link>.
      </P>

      <H2>17. Propriété intellectuelle</H2>
      <P>
        {c.appName}, son interface, ses textes, éléments graphiques, fonctionnalités, composants et contenus sont
        protégés. Aucun droit de propriété intellectuelle n’est transféré à l’utilisateur.
      </P>

      <H2>18. Modification des CGU</H2>
      <P>
        {c.tradingName} peut modifier les CGU. En cas de modification substantielle, une nouvelle acceptation pourra
        être demandée.
      </P>

      <H2>19. Droit applicable</H2>
      <P>Les présentes conditions sont soumises au droit français.</P>

      <H2>20. Contact</H2>
      <P>Pour toute question : <MailLink /> · {c.contactPhone}</P>
    </LegalLayout>
  )
}

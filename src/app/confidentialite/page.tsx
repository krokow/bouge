import type { Metadata } from 'next';
import { Callout, LegalLayout, LegalTable } from '@/components/ui/PageHero';
import { SCHEDULE, STUDIO } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: `Comment le studio ${STUDIO.name} traite vos données personnelles, et comment exercer vos droits.`,
  robots: { index: false, follow: true },
};

export default function ConfidentialitePage() {
  return (
    <LegalLayout title="Politique de confidentialité" updatedAt="14 septembre 2026">
      <Callout title="Site de démonstration" tone="ciel">
        Cette version du site est une démonstration&nbsp;: <strong>aucune donnée n’est envoyée à un serveur</strong>.
        Les comptes, réservations et paiements simulés restent exclusivement dans la mémoire de votre navigateur
        (stockage local), et disparaissent si vous effacez les données du site. Le texte ci-dessous décrit le
        traitement prévu pour la version de production.
      </Callout>

      <h2>1. Responsable de traitement</h2>
      <p>
        {STUDIO.legalName}, {STUDIO.address.street}, {STUDIO.address.postalCode} {STUDIO.address.city}, est
        responsable des traitements décrits ci-dessous. Contact&nbsp;:{' '}
        <a href={`mailto:${STUDIO.email}`}>{STUDIO.email}</a>.
      </p>
      <p>
        Compte tenu de sa taille et de la nature de son activité, le studio n’est pas tenu de désigner un délégué
        à la protection des données. Les demandes sont traitées directement par le gérant.
      </p>

      <h2>2. Données collectées et finalités</h2>
      <LegalTable>
        <table>
        <thead>
          <tr>
            <th>Données</th>
            <th>Finalité</th>
            <th>Base légale</th>
            <th>Conservation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Nom, prénom, email, mot de passe</td>
            <td>Création et gestion du compte client</td>
            <td>Exécution du contrat</td>
            <td>3 ans après la dernière séance</td>
          </tr>
          <tr>
            <td>Téléphone</td>
            <td>Vous joindre en cas d’imprévu sur un créneau</td>
            <td>Intérêt légitime</td>
            <td>3 ans après la dernière séance</td>
          </tr>
          <tr>
            <td>Réservations, formules, participants</td>
            <td>Organisation des séances</td>
            <td>Exécution du contrat</td>
            <td>3 ans après la séance</td>
          </tr>
          <tr>
            <td>Informations de santé communiquées librement</td>
            <td>Adapter les exercices en toute sécurité</td>
            <td>Consentement explicite</td>
            <td>Jusqu’au retrait du consentement</td>
          </tr>
          <tr>
            <td>Données de paiement</td>
            <td>Encaissement des séances réglées en ligne</td>
            <td>Exécution du contrat</td>
            <td>Conservées par le prestataire de paiement</td>
          </tr>
          <tr>
            <td>Factures et pièces comptables</td>
            <td>Obligations comptables et fiscales</td>
            <td>Obligation légale</td>
            <td>10 ans (art. L123-22 du code de commerce)</td>
          </tr>
          <tr>
            <td>Adresse email (communications)</td>
            <td>Actualités du studio</td>
            <td>Consentement</td>
            <td>Jusqu’au désabonnement</td>
          </tr>
        </tbody>
      </table>
      </LegalTable>

      <h3>Données de santé</h3>
      <p>
        Les informations que vous communiquez sur votre état physique (blessure, douleur, traitement, grossesse)
        relèvent des données sensibles au sens de l’article 9 du RGPD. Elles ne sont collectées que si vous
        choisissez de les transmettre, ne servent qu’à adapter la séance, ne sont accessibles qu’au coach, et ne
        sont jamais transmises à un tiers ni utilisées à des fins commerciales. Vous pouvez en demander
        l’effacement à tout moment sans que cela remette en cause vos réservations.
      </p>

      <h2>3. Paiement en ligne</h2>
      <p>
        En production, les paiements par carte seront traités par un prestataire de paiement agréé (Stripe). Les
        numéros de carte sont saisis directement sur l’infrastructure certifiée PCI-DSS du prestataire et ne
        transitent jamais par les serveurs du studio, qui n’en conserve que les quatre derniers chiffres à titre de
        justificatif.
      </p>
      <p>
        Dans la présente démonstration, aucun paiement n’est effectué&nbsp;: les champs de carte bancaire sont
        factices et les données saisies ne quittent pas votre navigateur.
      </p>

      <h2>4. Destinataires</h2>
      <p>
        Vos données ne sont ni vendues ni louées. Elles sont accessibles au gérant du studio et, en production,
        aux prestataires techniques strictement nécessaires&nbsp;: hébergeur, service d’envoi d’emails
        transactionnels, prestataire de paiement. Chacun agit en sous-traitant au sens de l’article 28 du RGPD et
        est lié par un contrat encadrant ces traitements.
      </p>
      <p>Aucun transfert de données hors de l’Union européenne n’est prévu.</p>

      <h2>5. Cookies et traceurs</h2>
      <p>Le site utilise deux catégories de traceurs&nbsp;:</p>
      <ul>
        <li>
          <strong>Strictement nécessaires</strong> — session de connexion, réservation en cours, mémorisation de
          votre choix en matière de cookies. Ils ne nécessitent pas de consentement (article 82 de la loi
          Informatique et Libertés).
        </li>
        <li>
          <strong>Mesure d’audience et marketing</strong> — déposés uniquement après votre accord, recueilli via
          le bandeau affiché à votre arrivée. Refuser est aussi simple qu’accepter.
        </li>
      </ul>
      <p>
        Votre choix est conservé treize mois, puis à nouveau demandé. Vous pouvez le modifier à tout moment via le
        lien «&nbsp;Gérer les cookies&nbsp;» en bas de chaque page.
      </p>
      <p>
        Le site n’intègre aucun bouton de réseau social traçant, aucune police hébergée par un tiers et aucune
        régie publicitaire&nbsp;: les typographies sont servies depuis notre propre domaine.
      </p>

      <h3>La carte de la page Contact</h3>
      <p>
        La carte affichée sur la page Contact utilise les fonds cartographiques d’
        <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer">
          OpenStreetMap
        </a>
        , un projet cartographique libre. Google Maps a été écarté volontairement&nbsp;: ce service dépose des
        cookies et transmet des données à des fins publicitaires, ce qui aurait imposé de bloquer la carte tant
        que vous n’y auriez pas consenti.
      </p>
      <p>
        OpenStreetMap ne dépose <strong>aucun cookie</strong> et n’effectue aucun suivi publicitaire. L’affichage
        des fonds de carte suppose en revanche, comme pour toute image chargée depuis un autre domaine, que votre
        adresse IP soit transmise à ses serveurs&nbsp;; elle n’est utilisée que pour vous livrer les images
        demandées. Les fonds de carte ne sont d’ailleurs chargés qu’au moment où la carte approche de votre écran,
        et jamais si vous ne descendez pas jusqu’à elle. Voir la{' '}
        <a href="https://wiki.osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener noreferrer">
          politique de confidentialité de la fondation OpenStreetMap
        </a>
        .
      </p>

      <h2>6. Emails automatiques</h2>
      <p>
        Trois emails sont envoyés dans le cadre de l’exécution du contrat, sans possibilité de désinscription
        puisqu’ils sont indispensables&nbsp;: la confirmation de réservation, le rappel envoyé{' '}
        {SCHEDULE.reminderHoursBefore}&nbsp;heures avant la séance, et la notification d’annulation ou de report.
        Toute communication de nature commerciale suppose au contraire votre accord préalable et comporte un lien
        de désinscription.
      </p>

      <h2>7. Vos droits</h2>
      <p>
        Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de
        portabilité, ainsi que du droit de retirer votre consentement à tout moment lorsque le traitement repose
        sur celui-ci.
      </p>
      <p>
        Pour les exercer&nbsp;: <a href={`mailto:${STUDIO.email}`}>{STUDIO.email}</a>. Une réponse est apportée
        dans un délai d’un mois. Une pièce d’identité peut être demandée en cas de doute raisonnable sur votre
        identité.
      </p>
      <p>
        Depuis votre espace personnel, vous pouvez à tout moment consulter et corriger vos informations, et
        supprimer votre compte.
      </p>
      <p>
        Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la
        CNIL&nbsp;: 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07 —{' '}
        <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">
          www.cnil.fr
        </a>
        .
      </p>

      <h2>8. Sécurité</h2>
      <p>
        En production, les échanges sont chiffrés en HTTPS, les mots de passe stockés sous forme de condensés
        calculés côté serveur avec un algorithme dédié (Argon2id), et l’accès à l’espace d’administration limité
        au seul compte du gérant. Les sauvegardes sont chiffrées et leur restauration testée périodiquement.
      </p>

      <h2>9. Modifications</h2>
      <p>
        Cette politique peut évoluer. La date de dernière mise à jour figure en tête de page. Toute modification
        substantielle est portée à la connaissance des clients disposant d’un compte.
      </p>
    </LegalLayout>
  );
}

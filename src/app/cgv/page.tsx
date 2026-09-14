import type { Metadata } from 'next';
import { OFFERS } from '@/data/offers';
import { Callout, LegalLayout, LegalTable } from '@/components/ui/PageHero';
import { formatPrice } from '@/lib/format';
import { SCHEDULE, STUDIO } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Conditions générales de vente',
  description: `Conditions générales de vente des prestations de coaching du studio ${STUDIO.name}.`,
  robots: { index: false, follow: true },
};

export default function CgvPage() {
  return (
    <LegalLayout title="Conditions générales de vente" updatedAt="14 septembre 2026">
      <Callout title="Document de démonstration" tone="orange">
        Ce texte propose une trame complète et cohérente avec le fonctionnement réel du site (délais, paiements,
        annulations). Il doit être relu et validé par un professionnel du droit avant la mise en ligne, et
        complété avec les informations d’identification de l’entreprise.
      </Callout>

      <h2>Article 1 — Objet</h2>
      <p>
        Les présentes conditions générales régissent la vente des prestations de coaching sportif proposées par{' '}
        {STUDIO.legalName} (ci-après «&nbsp;le studio&nbsp;»), réservées via le site, et s’appliquent à toute
        réservation. Le client reconnaît en avoir pris connaissance et les avoir acceptées avant de valider sa
        réservation.
      </p>

      <h2>Article 2 — Prestations et tarifs</h2>
      <p>
        Les prestations proposées sont les suivantes. Les prix sont exprimés en euros, toutes taxes comprises, et
        s’entendent par personne.
      </p>
      <LegalTable>
        <table>
        <thead>
          <tr>
            <th>Formule</th>
            <th>Durée</th>
            <th>Participants</th>
            <th>Prix</th>
          </tr>
        </thead>
        <tbody>
          {OFFERS.map((offer) => (
            <tr key={offer.id}>
              <td>{offer.name}</td>
              <td>{offer.durationMin} min</td>
              <td>
                {offer.maxParticipants > 1 ? `${offer.minParticipants} à ${offer.maxParticipants}` : '1'}
              </td>
              <td>
                {formatPrice(offer.pricePerPersonCents)} {offer.priceUnit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </LegalTable>
      <p>
        Le studio se réserve le droit de modifier ses tarifs à tout moment. Le prix applicable est celui affiché
        au moment de la réservation. Toute séance déjà réservée reste facturée au tarif accepté.
      </p>

      <h2>Article 3 — Réservation</h2>
      <p>
        La réservation s’effectue en ligne, dans la limite des créneaux disponibles. Elle est ferme dès l’écran de
        confirmation et donne lieu à l’envoi d’un email récapitulatif comportant une référence de réservation.
      </p>
      <p>
        Un délai minimum de {SCHEDULE.minNoticeHours}&nbsp;heures est requis entre la réservation et le début de
        la séance. Les créneaux sont ouverts à la réservation jusqu’à {SCHEDULE.bookingHorizonDays}&nbsp;jours à
        l’avance.
      </p>
      <p>
        Le nombre de participants est limité à {Math.max(...OFFERS.map((o) => o.maxParticipants))}&nbsp;personnes
        par séance. Le client réservant pour plusieurs personnes se porte fort du respect des présentes conditions
        par chacun des participants.
      </p>

      <h2>Article 4 — Paiement</h2>
      <p>Le client choisit au moment de la réservation entre&nbsp;:</p>
      <ul>
        <li>
          <strong>le paiement en ligne</strong> par carte bancaire, débité à la validation de la réservation&nbsp;;
        </li>
        <li>
          <strong>le paiement sur place</strong>, réglé au studio avant le début de la séance, par carte ou espèces.
        </li>
      </ul>
      <p>
        En cas de non-paiement sur place, le studio se réserve le droit de refuser l’accès à la séance, qui reste
        due. Une facture est remise sur demande.
      </p>

      <h2>Article 5 — Annulation et report par le client</h2>
      <p>
        Le client peut annuler ou reporter sa séance <strong>librement et sans frais</strong> depuis son espace
        personnel, jusqu’à <strong>{SCHEDULE.cancellationNoticeHours}&nbsp;heures</strong> avant l’horaire prévu.
        En cas de paiement en ligne, le remboursement intervient sous 14&nbsp;jours sur le moyen de paiement
        d’origine.
      </p>
      <p>
        Passé ce délai, l’annulation n’est plus possible en ligne, le créneau ne pouvant raisonnablement plus être
        proposé à un autre client. Le client est invité à contacter directement le studio au {STUDIO.phone}. Selon
        le motif invoqué, le studio peut accorder un report à titre commercial&nbsp;; à défaut, la séance est due.
      </p>
      <p>
        Toute séance non honorée sans annulation préalable est intégralement due et n’ouvre droit à aucun report.
      </p>

      <h2>Article 6 — Annulation par le studio</h2>
      <p>
        En cas d’indisponibilité du coach ou de force majeure, le studio prévient le client dans les meilleurs
        délais et lui propose un report. À défaut d’accord sur un nouveau créneau, la séance est intégralement
        remboursée.
      </p>

      <h2>Article 7 — Retard</h2>
      <p>
        La séance commence à l’heure réservée et s’achève à l’heure prévue, le créneau suivant étant susceptible
        d’être occupé. Un retard du client réduit d’autant la durée effective de la séance, sans réduction de
        prix. Au-delà de 20&nbsp;minutes de retard, la séance peut être considérée comme non honorée.
      </p>

      <h2>Article 8 — Formule mensuelle</h2>
      <p>
        La formule mensuelle donne accès à quatre séances par mois calendaire. Les séances non consommées ne sont
        ni reportées sur le mois suivant ni remboursées. La formule se reconduit tacitement chaque mois et peut
        être résiliée à tout moment, sans préavis ni frais, la résiliation prenant effet à la fin de la période
        en cours.
      </p>

      <h2>Article 9 — Droit de rétractation</h2>
      <p>
        Conformément à l’article L.221-28 12° du code de la consommation, le droit de rétractation ne s’applique
        pas aux prestations de loisirs fournies à une date ou à une période déterminée. La réservation d’une
        séance à date fixe n’ouvre donc pas de droit de rétractation&nbsp;: seules les conditions d’annulation de
        l’article 5 s’appliquent.
      </p>

      <h2>Article 10 — Santé et responsabilité</h2>
      <p>
        Le client déclare être en état de pratiquer une activité physique et n’avoir connaissance d’aucune
        contre-indication médicale. Il informe le coach de tout antécédent, douleur, traitement ou grossesse
        susceptible d’influer sur la séance. En cas de doute, le studio peut demander un certificat médical de
        non-contre-indication.
      </p>
      <p>
        Le coach adapte les exercices, mais la responsabilité du studio ne saurait être engagée en cas de
        dissimulation d’une information de santé, de non-respect des consignes données pendant la séance, ou de
        dommage résultant d’un état antérieur non signalé.
      </p>

      <h2>Article 11 — Effets personnels</h2>
      <p>
        Des casiers fermant à clé sont mis à disposition. Le studio décline toute responsabilité en cas de vol,
        perte ou détérioration d’effets personnels laissés hors de ces casiers.
      </p>

      <h2>Article 12 — Données personnelles</h2>
      <p>
        Le traitement des données collectées lors de la réservation est décrit dans la{' '}
        <a href="/confidentialite/">politique de confidentialité</a>.
      </p>

      <h2>Article 13 — Réclamation et médiation</h2>
      <p>
        Toute réclamation doit être adressée à <a href={`mailto:${STUDIO.email}`}>{STUDIO.email}</a>. À défaut de
        solution amiable dans un délai de deux mois, le client peut recourir gratuitement à un médiateur de la
        consommation, conformément à l’article L.612-1 du code de la consommation. Les coordonnées du médiateur
        retenu par le studio seront précisées ici avant la mise en ligne.
      </p>

      <h2>Article 14 — Droit applicable</h2>
      <p>
        Les présentes conditions sont soumises au droit français. En cas de litige, et à défaut de résolution
        amiable, les tribunaux français sont compétents.
      </p>
    </LegalLayout>
  );
}

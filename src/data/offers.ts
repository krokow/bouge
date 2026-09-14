import type { Offer } from '@/lib/types';

/**
 * Catalogue des offres du studio.
 *
 * MIGRATION : cette constante remplace un `SELECT * FROM offers`. Le jour où le
 * gérant doit pouvoir éditer ses offres, il suffit de remplacer cet import par
 * un appel au repository — la forme des objets ne change pas.
 */
export const OFFERS: Offer[] = [
  {
    id: 'decouverte',
    name: 'Séance découverte',
    tagline: 'On fait connaissance, on pose les bases.',
    description:
      'Une heure pour faire le point : votre histoire avec le sport, vos contraintes, votre objectif. ' +
      'Melvin évalue votre mobilité et votre condition physique, puis vous fait travailler pour de vrai — ' +
      'on ne repart pas sans avoir bougé. Vous ressortez avec un plan clair, même si vous n’allez pas plus loin.',
    durationMin: 60,
    minParticipants: 1,
    maxParticipants: 2,
    pricePerPersonCents: 3500,
    priceUnit: 'la séance',
    highlights: [
      'Bilan mobilité et condition physique',
      'Première séance encadrée, adaptée à votre niveau',
      'Plan d’entraînement remis à la fin',
      'Sans engagement, une seule fois par personne',
    ],
    audience: 'Vous n’avez jamais poussé la porte, ou vous revenez après une longue pause.',
    color: 'ciel',
    bookable: true,
  },
  {
    id: 'individuel',
    name: 'Coaching individuel',
    tagline: 'Une heure, un coach, vous.',
    description:
      'Le format le plus direct pour progresser vite. Chaque séance est construite sur la précédente : ' +
      'charge, technique, respiration, récupération. Melvin corrige en temps réel, personne d’autre ne passe devant. ' +
      'C’est aussi le format retenu pour préparer une échéance précise — trail, triathlon, retour de blessure, test physique.',
    durationMin: 60,
    minParticipants: 1,
    maxParticipants: 1,
    pricePerPersonCents: 7500,
    priceUnit: 'la séance',
    highlights: [
      'Programmation sur-mesure, revue à chaque séance',
      'Correction technique en direct',
      'Préparation d’un objectif daté possible',
      'Douche et vestiaire compris',
    ],
    audience: 'Vous savez où vous voulez aller et vous voulez y aller proprement.',
    color: 'orange',
    featured: true,
    bookable: true,
  },
  {
    id: 'petit-comite',
    name: 'Petit comité',
    tagline: 'À deux ou à trois. Jamais plus.',
    description:
      'La dynamique de groupe sans la foule. Vous venez avec qui vous voulez — conjoint, collègue, ami, parent — ' +
      'et Melvin adapte l’intensité pour chacun dans la même séance. Trois personnes maximum : c’est la limite ' +
      'au-delà de laquelle on ne peut plus corriger tout le monde, donc on ne la dépasse pas.',
    durationMin: 60,
    minParticipants: 2,
    maxParticipants: 3,
    pricePerPersonCents: 4500,
    priceUnit: 'par personne',
    highlights: [
      '2 à 3 personnes, niveaux différents acceptés',
      'Intensité ajustée individuellement',
      'Le format le plus régulier sur la durée',
      'Tarif dégressif par rapport à l’individuel',
    ],
    audience: 'Vous tenez mieux quand quelqu’un vous attend à 7h.',
    color: 'jade',
    bookable: true,
  },
  {
    id: 'abonnement',
    name: 'Formule mensuelle',
    tagline: 'Quatre séances par mois, le rythme qui tient.',
    description:
      'Quatre séances individuelles par mois, réservables quand vous voulez dans le planning, ' +
      'avec un suivi écrit entre les séances et l’accès prioritaire aux créneaux de forte affluence ' +
      '(7h-9h et 18h-20h). C’est la formule de celles et ceux qui installent le sport dans leur semaine pour de bon.',
    durationMin: 60,
    minParticipants: 1,
    maxParticipants: 1,
    pricePerPersonCents: 26000,
    priceUnit: 'par mois',
    sessionsIncluded: 4,
    highlights: [
      '4 séances individuelles par mois',
      'Accès prioritaire aux créneaux 7h-9h et 18h-20h',
      'Suivi écrit entre les séances',
      'Sans engagement de durée, résiliable au mois',
    ],
    audience: 'Vous ne voulez plus vous reposer la question chaque semaine.',
    color: 'brun',
    bookable: true,
  },
];

export const OFFERS_BY_ID = Object.fromEntries(OFFERS.map((o) => [o.id, o])) as Record<Offer['id'], Offer>;

export function getOffer(id: string): Offer | undefined {
  return OFFERS.find((o) => o.id === id);
}

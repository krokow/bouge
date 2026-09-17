import { OFFERS } from '@/data/offers';
import { ADMIN_ACCOUNT, SCHEDULE, TEAM_SEED } from '@/lib/config';
import { addDays, addMinutesToTime, minutesToTime, timeToMinutes, todayIso, toDateTime, weekdayOf } from '@/lib/date';
import { resolveCoachId } from '@/lib/coaches';
import type {
  Assignment,
  Block,
  Booking,
  Coach,
  Credential,
  EmailMessage,
  IsoDate,
  Offer,
  Time,
  User,
} from '@/lib/types';
import { type DatabaseShape, DB_VERSION, digestPassword } from './schema';

/**
 * Jeu de données de démonstration.
 *
 * Il est régénéré à partir de la date du jour pour que le tableau de bord soit
 * toujours « vivant » : de l'historique derrière, des rendez-vous devant.
 * Le générateur pseudo-aléatoire est déterministe (graine fixe) afin que deux
 * démonstrations successives montrent exactement les mêmes chiffres.
 *
 * MIGRATION : ce fichier disparaît le jour où la vraie base prend le relais.
 */

/** PRNG déterministe (mulberry32) : même graine ⇒ mêmes données. */
function makeRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CLIENTS: Array<{ firstName: string; lastName: string }> = [
  { firstName: 'Camille', lastName: 'Ferrand' },
  { firstName: 'Thomas', lastName: 'Nguyen' },
  { firstName: 'Sylvie', lastName: 'Marchand' },
  { firstName: 'Yanis', lastName: 'Belkacem' },
  { firstName: 'Léa', lastName: 'Doucet' },
  { firstName: 'Antoine', lastName: 'Rivière' },
  { firstName: 'Fatou', lastName: 'Diallo' },
  { firstName: 'Marc', lastName: 'Levasseur' },
  { firstName: 'Inès', lastName: 'Chevalier' },
  { firstName: 'Paul', lastName: 'Aubert' },
  { firstName: 'Nora', lastName: 'Benali' },
  { firstName: 'Julien', lastName: 'Perrot' },
  { firstName: 'Claire', lastName: 'Vasseur' },
  { firstName: 'Hugo', lastName: 'Mercier' },
  { firstName: 'Salomé', lastName: 'Tanguy' },
  { firstName: 'Bertrand', lastName: 'Ozanne' },
];

const NOTES = [
  'Genou droit sensible, on évite les impacts.',
  'Objectif : semi-marathon en mars.',
  'Reprise après une longue pause.',
  'Préfère travailler le haut du corps.',
  'Séance avec ma sœur, elle débute.',
  '',
  '',
  '',
];

function slugEmail(firstName: string, lastName: string): string {
  const strip = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z]/g, '').toLowerCase();
  return `${strip(firstName)}.${strip(lastName)}@example.com`;
}

/** Créneaux théoriques d'une journée, selon les horaires d'ouverture. */
function daySlotTimes(date: IsoDate): Time[] {
  const opening = SCHEDULE.openings.find((o) => o.weekday === weekdayOf(date));
  if (!opening) return [];
  const times: Time[] = [];
  const end = timeToMinutes(opening.end);
  for (let m = timeToMinutes(opening.start); m + SCHEDULE.slotMinutes <= end; m += SCHEDULE.slotMinutes) {
    times.push(minutesToTime(m));
  }
  return times;
}

/** Les créneaux tôt le matin et en fin de journée partent en premier. */
function slotDesirability(time: Time): number {
  const h = timeToMinutes(time) / 60;
  if (h >= 7 && h < 9) return 0.75;
  if (h >= 18 && h < 21) return 0.85;
  if (h >= 12 && h < 14) return 0.45;
  return 0.25;
}

export function createSeedDatabase(today: IsoDate = todayIso()): DatabaseShape {
  const random = makeRandom(20260914);
  const now = new Date().toISOString();

  /* --- Comptes ---------------------------------------------------------- */
  const admin: User = {
    id: 'usr_admin',
    email: ADMIN_ACCOUNT.email,
    firstName: 'Melvin',
    lastName: 'Maillot',
    phone: '06 74 90 08 02',
    role: 'admin',
    marketingOptIn: false,
    createdAt: now,
  };

  const users: User[] = [admin];
  const credentials: Credential[] = [
    { userId: admin.id, email: admin.email, passwordDigest: digestPassword(ADMIN_ACCOUNT.password) },
  ];

  CLIENTS.forEach((c, i) => {
    const email = slugEmail(c.firstName, c.lastName);
    const user: User = {
      id: `usr_demo_${i}`,
      email,
      firstName: c.firstName,
      lastName: c.lastName,
      phone: `06 ${String(10 + i).padStart(2, '0')} 00 00 ${String(10 + i).padStart(2, '0')}`,
      role: 'client',
      marketingOptIn: random() > 0.45,
      createdAt: new Date(Date.now() - (60 + i * 3) * 86_400_000).toISOString(),
    };
    users.push(user);
    // Tous les comptes de démonstration partagent le même mot de passe.
    credentials.push({ userId: user.id, email, passwordDigest: digestPassword('demo1234') });
  });

  const clients = users.filter((u) => u.role === 'client');

  /* --- L'équipe ---------------------------------------------------------- */
  // Melvin réutilise le compte gérant déjà créé ; les autres coachs reçoivent
  // le leur, avec le rôle `coach` : ils accèdent à leur back-office et à lui
  // seul. Voir TEAM_SEED dans src/lib/config.ts.
  const coaches: Coach[] = TEAM_SEED.map((c, i) => {
    let userId: string;
    if (c.owner) {
      userId = admin.id;
    } else {
      userId = `usr_coach_${c.slug}`;
      users.push({
        id: userId,
        email: c.email,
        firstName: c.firstName,
        lastName: c.lastName,
        role: 'coach',
        marketingOptIn: false,
        createdAt: new Date(Date.now() - (40 - i * 12) * 86_400_000).toISOString(),
      });
      credentials.push({ userId, email: c.email, passwordDigest: digestPassword(c.password) });
    }

    return {
      id: `cch_${c.slug}`,
      userId,
      firstName: c.firstName,
      lastName: c.lastName,
      slug: c.slug,
      role: c.role,
      bio: c.bio,
      specialties: [...c.specialties],
      photo: c.photo,
      color: c.color,
      owner: c.owner,
      active: true,
      // L'ordre d'arrivée dans l'équipe décide de l'ordre d'affichage.
      createdAt: new Date(Date.now() - (400 - i * 120) * 86_400_000).toISOString(),
    };
  });

  const owner = coaches.find((c) => c.owner)!;
  const sarah = coaches.find((c) => c.slug === 'sarah-lemoine');
  const karim = coaches.find((c) => c.slug === 'karim-benali');

  /* --- Affectations ------------------------------------------------------ */
  // Ce que le gérant a décidé : hors de ces plages, c'est lui qui assure.
  const assignments: Assignment[] = [];
  if (sarah) {
    assignments.push({
      id: 'asg_seed_1',
      coachId: sarah.id,
      type: 'range',
      startDate: addDays(today, 1),
      endDate: addDays(today, 12),
      note: 'Sarah prend les après-midis pendant ma formation',
      createdAt: now,
    });
  }
  if (karim) {
    assignments.push({
      id: 'asg_seed_2',
      coachId: karim.id,
      type: 'day',
      startDate: addDays(today, 5),
      endDate: addDays(today, 5),
      note: 'Journée préparation physique',
      createdAt: now,
    });
    // Affectation sur un créneau précis : elle l'emporte sur la période de
    // Sarah ci-dessus. C'est la règle de précision, illustrée dans les données.
    assignments.push({
      id: 'asg_seed_3',
      coachId: karim.id,
      type: 'slot',
      startDate: addDays(today, 8),
      endDate: addDays(today, 8),
      startTime: '18:00',
      endTime: '20:00',
      note: 'Suivi retour de blessure',
      createdAt: now,
    });
  }

  /* --- Indisponibilités ------------------------------------------------- */
  const blocks: Block[] = [
    {
      id: 'blk_seed_1',
      type: 'range',
      startDate: addDays(today, 17),
      endDate: addDays(today, 23),
      reason: 'Congés — studio fermé',
      createdAt: now,
    },
    {
      id: 'blk_seed_2',
      type: 'slot',
      startDate: addDays(today, 3),
      endDate: addDays(today, 3),
      startTime: '12:00',
      endTime: '14:00',
      reason: 'Formation continue',
      createdAt: now,
    },
    {
      id: 'blk_seed_3',
      type: 'day',
      startDate: addDays(today, 9),
      endDate: addDays(today, 9),
      reason: 'Intervention extérieure (entreprise)',
      createdAt: now,
    },
  ];

  // Indisponibilité qui ne concerne qu'un coach : seuls les créneaux qu'il
  // devait assurer disparaissent, le reste du planning ne bouge pas.
  if (sarah) {
    blocks.push({
      id: 'blk_seed_4',
      coachId: sarah.id,
      type: 'day',
      startDate: addDays(today, 6),
      endDate: addDays(today, 6),
      reason: 'Sarah — indisponible',
      createdAt: now,
    });
  }

  // Jours où le studio entier est fermé : aucune séance n'y est générée.
  // Les indisponibilités propres à un coach n'entrent pas ici — le studio
  // reste ouvert avec quelqu'un d'autre.
  const blockedDates = new Set<IsoDate>();
  blocks.forEach((b) => {
    if (b.coachId || b.type === 'slot') return;
    let d = b.startDate;
    while (d <= b.endDate) {
      blockedDates.add(d);
      d = addDays(d, 1);
    }
  });

  /* --- Réservations ------------------------------------------------------ */
  const bookings: Booking[] = [];
  const emails: EmailMessage[] = [];
  const bookableOffers: Offer[] = OFFERS.filter((o) => o.bookable);
  let refCounter = 0;

  const pick = <T,>(list: T[]): T => list[Math.floor(random() * list.length)];

  // 10 semaines d'historique derrière, 3 semaines de rendez-vous devant.
  for (let dayOffset = -70; dayOffset <= 21; dayOffset += 1) {
    const date = addDays(today, dayOffset);
    if (blockedDates.has(date)) continue;
    const times = daySlotTimes(date);
    if (times.length === 0) continue;

    // Le carnet s'est rempli progressivement : plus dense sur les dernières semaines.
    const maturity = dayOffset < 0 ? 1 : Math.max(0.15, 1 - dayOffset / 26);
    const seasonal = 0.55 + 0.45 * Math.sin((dayOffset + 70) / 9);

    for (const time of times) {
      const chance = slotDesirability(time) * maturity * seasonal;
      if (random() > chance) continue;

      const offer = pick(bookableOffers);
      const participants =
        offer.maxParticipants > offer.minParticipants
          ? offer.minParticipants + Math.floor(random() * (offer.maxParticipants - offer.minParticipants + 1))
          : offer.minParticipants;
      const client = pick(clients);
      const createdAt = new Date(toDateTime(date, time).getTime() - (2 + random() * 12) * 86_400_000).toISOString();
      const isPast = dayOffset < 0;
      const cancelled = random() < 0.06;
      const noShow = isPast && !cancelled && random() < 0.03;

      refCounter += 1;
      const booking: Booking = {
        id: `bkg_seed_${refCounter}`,
        reference: `BG-${String(1000 + refCounter).slice(-4)}`,
        userId: client.id,
        offerId: offer.id,
        // Le coach du jour, d'après les affectations en vigueur.
        coachId:
          resolveCoachId(date, time, addMinutesToTime(time, offer.durationMin), coaches, assignments) ?? owner.id,
        participants,
        date,
        startTime: time,
        endTime: addMinutesToTime(time, offer.durationMin),
        status: cancelled ? 'cancelled' : noShow ? 'no_show' : isPast ? 'completed' : 'confirmed',
        payment: {
          method: random() > 0.42 ? 'online' : 'onsite',
          status: cancelled ? 'refunded' : isPast || random() > 0.5 ? 'paid' : 'pending',
          amountCents: offer.pricePerPersonCents * (offer.id === 'petit-comite' ? participants : 1),
          cardLast4: random() > 0.42 ? String(4000 + Math.floor(random() * 5999)).slice(-4) : undefined,
          paidAt: isPast ? createdAt : undefined,
        },
        guestNames:
          participants > 1 ? Array.from({ length: participants - 1 }, () => pick(CLIENTS).firstName) : [],
        notes: pick(NOTES) || undefined,
        createdAt,
        updatedAt: createdAt,
        cancelledAt: cancelled ? createdAt : undefined,
        cancelledBy: cancelled ? (random() > 0.3 ? 'client' : 'studio') : undefined,
      };

      // Le paiement en ligne implique une carte ; pas de carte pour le paiement sur place.
      if (booking.payment.method === 'onsite') {
        booking.payment.cardLast4 = undefined;
        if (!isPast) booking.payment.status = 'pending';
      }

      bookings.push(booking);
    }
  }

  return {
    version: DB_VERSION,
    users,
    credentials,
    coaches,
    assignments,
    bookings,
    blocks,
    emails,
    session: null,
  };
}

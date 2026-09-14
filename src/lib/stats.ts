import { OFFERS } from '@/data/offers';
import { occupancyRate, openingTimes, type AvailabilityInput } from './availability';
import { addDays, diffDays, formatShortDate, fromIso, MONTH_LABELS, startOfWeek, toDateTime, todayIso, WEEKDAY_SHORT } from './date';
import { formatPriceCompact } from './format';
import type { Booking, IsoDate, OfferId } from './types';

/**
 * Indicateurs du tableau de bord.
 *
 * Fonctions pures, sans accès au stockage : elles pourront être exécutées côté
 * serveur (ou traduites en requêtes SQL d'agrégation) sans être réécrites.
 *
 * Convention retenue partout : une réservation annulée ne compte ni dans le
 * chiffre d'affaires ni dans le remplissage. Une séance non honorée reste due,
 * elle est donc comptée dans le chiffre d'affaires mais signalée à part.
 */

export function isBillable(booking: Booking): boolean {
  return booking.status !== 'cancelled';
}

export function revenueCents(bookings: Booking[]): number {
  return bookings.filter(isBillable).reduce((sum, b) => sum + b.payment.amountCents, 0);
}

export function inRange(bookings: Booking[], from: IsoDate, to: IsoDate): Booking[] {
  return bookings.filter((b) => b.date >= from && b.date <= to);
}

/** Réservations d'une journée, triées par horaire. */
export function bookingsOfDay(bookings: Booking[], date: IsoDate): Booking[] {
  return bookings
    .filter((b) => b.date === date && b.status !== 'cancelled')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/** Prochaines séances à partir de maintenant. */
export function upcomingBookings(bookings: Booking[], limit = 8): Booking[] {
  const now = Date.now();
  return bookings
    .filter((b) => b.status === 'confirmed' && toDateTime(b.date, b.startTime).getTime() >= now)
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))
    .slice(0, limit);
}

export interface PeriodSummary {
  bookings: number;
  participants: number;
  revenueCents: number;
  cancelled: number;
  noShow: number;
  occupancy: number;
  /** Encaissements restant à percevoir sur place. */
  pendingCents: number;
}

export function summarize(
  bookings: Booking[],
  from: IsoDate,
  to: IsoDate,
  availability: AvailabilityInput,
): PeriodSummary {
  const period = inRange(bookings, from, to);
  const active = period.filter(isBillable);
  return {
    bookings: active.length,
    participants: active.reduce((sum, b) => sum + b.participants, 0),
    revenueCents: revenueCents(period),
    cancelled: period.filter((b) => b.status === 'cancelled').length,
    noShow: period.filter((b) => b.status === 'no_show').length,
    occupancy: occupancyRate(from, to, availability),
    pendingCents: active
      .filter((b) => b.payment.status === 'pending')
      .reduce((sum, b) => sum + b.payment.amountCents, 0),
  };
}

/** Évolution jour par jour sur les N derniers jours. */
export function dailySeries(bookings: Booking[], days: number, to: IsoDate = todayIso()) {
  const from = addDays(to, -(days - 1));
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(from, i);
    const dayBookings = bookings.filter((b) => b.date === date && isBillable(b));
    return {
      date,
      label: `${fromIso(date).getDate()}/${fromIso(date).getMonth() + 1}`,
      count: dayBookings.length,
      revenue: revenueCents(dayBookings),
    };
  });
}

/** Évolution semaine par semaine, pour lisser le bruit du quotidien. */
export function weeklySeries(bookings: Booking[], weeks: number, to: IsoDate = todayIso()) {
  const currentWeek = startOfWeek(to);
  return Array.from({ length: weeks }, (_, i) => {
    const start = addDays(currentWeek, -(weeks - 1 - i) * 7);
    const end = addDays(start, 6);
    const weekBookings = inRange(bookings, start, end).filter(isBillable);
    return {
      start,
      label: `${fromIso(start).getDate()} ${MONTH_LABELS[fromIso(start).getMonth()].slice(0, 4)}`,
      count: weekBookings.length,
      revenue: revenueCents(weekBookings),
    };
  });
}

/** Répartition du chiffre d'affaires par formule. */
export function revenueByOffer(bookings: Booking[]) {
  const active = bookings.filter(isBillable);
  return OFFERS.map((offer) => {
    const matching = active.filter((b) => b.offerId === offer.id);
    return {
      id: offer.id as OfferId,
      label: offer.name,
      value: revenueCents(matching),
      count: matching.length,
      display: formatPriceCompact(revenueCents(matching)),
    };
  }).filter((entry) => entry.count > 0);
}

/** Créneaux les plus demandés, toutes journées confondues. */
export function popularHours(bookings: Booking[]) {
  const counts = new Map<string, number>();
  bookings.filter(isBillable).forEach((b) => {
    counts.set(b.startTime, (counts.get(b.startTime) ?? 0) + 1);
  });
  return [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([time, count]) => ({ label: time.replace(':', 'h'), value: count }));
}

/** Répartition par jour de la semaine (lundi → samedi). */
export function byWeekday(bookings: Booking[]) {
  const counts = new Array(7).fill(0) as number[];
  bookings.filter(isBillable).forEach((b) => {
    counts[fromIso(b.date).getDay()] += 1;
  });
  return [1, 2, 3, 4, 5, 6].map((weekday) => ({
    label: WEEKDAY_SHORT[weekday],
    value: counts[weekday],
  }));
}

/** Clients les plus assidus. */
export function topClients(bookings: Booking[], users: { id: string; firstName: string; lastName: string }[], limit = 5) {
  const counts = new Map<string, number>();
  bookings.filter(isBillable).forEach((b) => counts.set(b.userId, (counts.get(b.userId) ?? 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([userId, count]) => {
      const user = users.find((u) => u.id === userId);
      return {
        label: user ? `${user.firstName} ${user.lastName}` : 'Client supprimé',
        value: count,
      };
    });
}

/** Nombre total de créneaux ouvrables sur une période — dénominateur du remplissage. */
export function openSlotCount(from: IsoDate, to: IsoDate): number {
  let total = 0;
  for (let i = 0; i <= diffDays(from, to); i += 1) {
    total += openingTimes(addDays(from, i)).length;
  }
  return total;
}

/** Libellé court d'une période, pour les en-têtes de tableau de bord. */
export function periodLabel(from: IsoDate, to: IsoDate): string {
  return `${formatShortDate(from)} — ${formatShortDate(to)}`;
}

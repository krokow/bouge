import { SCHEDULE } from './config';
import { addDays, addMinutesToTime, minutesToTime, timeToMinutes, toDateTime, todayIso, weekdayOf } from './date';
import type { Block, Booking, IsoDate, Slot, SlotState, Time } from './types';

/**
 * Calcul des disponibilités.
 *
 * Fonctions pures : aucune dépendance au stockage. Elles sont donc réutilisables
 * telles quelles côté serveur lors de la migration — ce qui garantit que le
 * client et le backend appliqueront exactement les mêmes règles de planning.
 *
 * Règle de fond : le studio n'a qu'un coach. Un créneau occupé l'est pour tout
 * le monde, quel que soit le nombre de participants de la séance qui l'occupe.
 */

/** Créneaux théoriques d'une journée d'après les horaires d'ouverture. */
export function openingTimes(date: IsoDate): Time[] {
  const opening = SCHEDULE.openings.find((o) => o.weekday === weekdayOf(date));
  if (!opening) return [];
  const times: Time[] = [];
  const last = timeToMinutes(opening.end);
  for (let m = timeToMinutes(opening.start); m + SCHEDULE.slotMinutes <= last; m += SCHEDULE.slotMinutes) {
    times.push(minutesToTime(m));
  }
  return times;
}

export function isOpen(date: IsoDate): boolean {
  return !SCHEDULE.closedDates.includes(date) && openingTimes(date).length > 0;
}

/** Une réservation n'occupe le planning que si elle n'est pas annulée. */
function occupiesSlot(booking: Booking): boolean {
  return booking.status !== 'cancelled';
}

function overlaps(aStart: Time, aEnd: Time, bStart: Time, bEnd: Time): boolean {
  return timeToMinutes(aStart) < timeToMinutes(bEnd) && timeToMinutes(bStart) < timeToMinutes(aEnd);
}

/** Le blocage couvre-t-il ce créneau précis ? */
function blockCovers(block: Block, date: IsoDate, start: Time, end: Time): boolean {
  if (date < block.startDate || date > block.endDate) return false;
  if (block.type !== 'slot') return true; // jour / semaine / période : journée entière
  if (!block.startTime || !block.endTime) return true;
  return overlaps(start, end, block.startTime, block.endTime);
}

export interface AvailabilityInput {
  bookings: Booking[];
  blocks: Block[];
  /** Injectable pour les tests ; par défaut, l'instant présent. */
  now?: Date;
  /** Réservation en cours de report : son propre créneau reste sélectionnable. */
  ignoreBookingId?: string;
}

/** État détaillé de tous les créneaux d'une journée. */
export function computeDaySlots(date: IsoDate, input: AvailabilityInput): Slot[] {
  const { bookings, blocks, now = new Date(), ignoreBookingId } = input;
  const times = openingTimes(date);
  if (times.length === 0 || SCHEDULE.closedDates.includes(date)) return [];

  const dayBookings = bookings.filter((b) => b.date === date && b.id !== ignoreBookingId && occupiesSlot(b));
  const dayBlocks = blocks.filter((b) => date >= b.startDate && date <= b.endDate);
  const earliest = now.getTime() + SCHEDULE.minNoticeHours * 3_600_000;

  return times.map((startTime) => {
    const endTime = addMinutesToTime(startTime, SCHEDULE.slotMinutes);
    let state: SlotState = 'available';
    let bookingId: string | undefined;
    let blockId: string | undefined;

    const booking = dayBookings.find((b) => overlaps(startTime, endTime, b.startTime, b.endTime));
    const block = dayBlocks.find((b) => blockCovers(b, date, startTime, endTime));

    if (toDateTime(date, startTime).getTime() < earliest) {
      state = 'past';
    } else if (booking) {
      state = 'booked';
    } else if (block) {
      state = 'blocked';
    }

    if (booking) bookingId = booking.id;
    if (block) blockId = block.id;

    return { date, startTime, endTime, state, bookingId, blockId };
  });
}

/** Créneaux réservables par un client pour cette journée. */
export function availableTimes(date: IsoDate, input: AvailabilityInput): Time[] {
  return computeDaySlots(date, input)
    .filter((s) => s.state === 'available')
    .map((s) => s.startTime);
}

export function hasAvailability(date: IsoDate, input: AvailabilityInput): boolean {
  return availableTimes(date, input).length > 0;
}

/** Première date réservable à partir d'aujourd'hui, dans l'horizon d'ouverture. */
export function firstAvailableDate(input: AvailabilityInput, from: IsoDate = todayIso()): IsoDate | null {
  for (let i = 0; i <= SCHEDULE.bookingHorizonDays; i += 1) {
    const date = addDays(from, i);
    if (hasAvailability(date, input)) return date;
  }
  return null;
}

/** Dernière date ouverte à la réservation en ligne. */
export function bookingHorizonEnd(from: IsoDate = todayIso()): IsoDate {
  return addDays(from, SCHEDULE.bookingHorizonDays);
}

/**
 * Le client peut-il encore annuler ou reporter seul, en ligne ?
 * Au-delà du délai, il doit appeler le studio (politique affichée dans les CGV).
 */
export function canSelfManage(booking: Booking, now: Date = new Date()): boolean {
  if (booking.status !== 'confirmed') return false;
  const hours = (toDateTime(booking.date, booking.startTime).getTime() - now.getTime()) / 3_600_000;
  return hours >= SCHEDULE.cancellationNoticeHours;
}

/** Taux de remplissage d'une période : créneaux réservés / créneaux ouvrables. */
export function occupancyRate(from: IsoDate, to: IsoDate, input: AvailabilityInput): number {
  let open = 0;
  let taken = 0;
  let date = from;
  while (date <= to) {
    const slots = computeDaySlots(date, { ...input, now: new Date(0) }); // ignore le passé
    open += slots.filter((s) => s.state !== 'blocked').length;
    taken += slots.filter((s) => s.state === 'booked').length;
    date = addDays(date, 1);
  }
  return open === 0 ? 0 : taken / open;
}

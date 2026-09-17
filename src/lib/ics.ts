import { OFFERS_BY_ID } from '@/data/offers';
import { STUDIO } from './config';
import { toDateTime } from './date';
import type { Booking, Coach, User } from './types';

/**
 * Export iCalendar (RFC 5545).
 *
 * Produit un fichier .ics importable dans Google Agenda, Outlook, Apple Calendar.
 * Aucune dépendance : le format est un simple texte à plier à 75 octets par ligne.
 */

/** `Date` → `20260414T070000` (heure locale, associée à un TZID). */
function formatLocal(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}` +
    `T${p(date.getHours())}${p(date.getMinutes())}00`
  );
}

function formatUtc(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
}

/** Échappe les caractères réservés du format iCalendar. */
function escapeText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Replie les lignes à 75 octets, comme l'exige la RFC. */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    chunks.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  if (rest) chunks.push(` ${rest}`);
  return chunks.join('\r\n');
}

/**
 * Définition du fuseau Europe/Paris, pour que les horaires restent justes
 * même si l'agenda destinataire est réglé sur un autre fuseau.
 */
const VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  'TZID:Europe/Paris',
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0200',
  'TZNAME:CEST',
  'DTSTART:19700329T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0100',
  'TZNAME:CET',
  'DTSTART:19701025T030000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

export interface IcsEventInput {
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  description?: string;
  location?: string;
  /** Marque l'événement comme annulé côté agenda. */
  cancelled?: boolean;
  /** Bloque la disponibilité (par défaut) ou laisse le créneau libre. */
  busy?: boolean;
}

export function buildIcs(events: IcsEventInput[], calendarName: string): string {
  const stamp = formatUtc(new Date());
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BOUGE. Studio//Reservations//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    'X-WR-TIMEZONE:Europe/Paris',
    ...VTIMEZONE,
  ];

  for (const event of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.uid}@bouge-studio.fr`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Europe/Paris:${formatLocal(event.start)}`,
      `DTEND;TZID=Europe/Paris:${formatLocal(event.end)}`,
      `SUMMARY:${escapeText(event.summary)}`,
    );
    if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`);
    if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
    lines.push(`STATUS:${event.cancelled ? 'CANCELLED' : 'CONFIRMED'}`);
    lines.push(`TRANSP:${event.busy === false ? 'TRANSPARENT' : 'OPAQUE'}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n');
}

const STUDIO_LOCATION = `${STUDIO.legalName}, ${STUDIO.address.street}, ${STUDIO.address.postalCode} ${STUDIO.address.city}`;

/**
 * Convertit des réservations en événements iCalendar pour l'agenda du coach.
 *
 * Le nom du coach figure dans le descriptif : le gérant exporte l'agenda du
 * studio entier, il doit voir d'un coup d'œil qui assure quoi sans rouvrir le
 * site.
 */
export function bookingsToIcs(
  bookings: Booking[],
  users: User[],
  calendarName = 'BOUGE. — Réservations',
  coaches: Coach[] = [],
): string {
  const byId = new Map(users.map((u) => [u.id, u]));
  const events = bookings.map<IcsEventInput>((booking) => {
    const offer = OFFERS_BY_ID[booking.offerId];
    const user = byId.get(booking.userId);
    const who = user ? `${user.firstName} ${user.lastName}` : 'Client';
    const coach = coaches.find((c) => c.id === booking.coachId);
    const details = [
      `Formule : ${offer?.name ?? booking.offerId}`,
      coach ? `Coach : ${coach.firstName} ${coach.lastName}` : null,
      `Participants : ${booking.participants}`,
      `Référence : ${booking.reference}`,
      user?.phone ? `Téléphone : ${user.phone}` : null,
      user?.email ? `Email : ${user.email}` : null,
      booking.payment.method === 'online' ? 'Réglé en ligne' : 'À régler sur place',
      booking.notes ? `Note : ${booking.notes}` : null,
    ].filter(Boolean);

    return {
      uid: booking.id,
      start: toDateTime(booking.date, booking.startTime),
      end: toDateTime(booking.date, booking.endTime),
      summary: `${offer?.name ?? 'Séance'} — ${who}${booking.participants > 1 ? ` (+${booking.participants - 1})` : ''}`,
      description: details.join('\n'),
      location: STUDIO_LOCATION,
      cancelled: booking.status === 'cancelled',
    };
  });
  return buildIcs(events, calendarName);
}

/** Événement .ics remis au client pour sa propre séance. */
export function bookingToClientIcs(booking: Booking): string {
  const offer = OFFERS_BY_ID[booking.offerId];
  return buildIcs(
    [
      {
        uid: `client-${booking.id}`,
        start: toDateTime(booking.date, booking.startTime),
        end: toDateTime(booking.date, booking.endTime),
        summary: `${offer?.name ?? 'Séance'} — ${STUDIO.name}`,
        description: `Référence ${booking.reference}\nPrévoyez une tenue et une serviette.\nTéléphone du studio : ${STUDIO.phone}`,
        location: STUDIO_LOCATION,
      },
    ],
    `${STUDIO.name} — ma séance`,
  );
}

/** Déclenche le téléchargement d'un fichier .ics dans le navigateur. */
export function downloadIcs(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

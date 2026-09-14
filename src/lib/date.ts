import type { IsoDate, Time } from './types';

/**
 * Utilitaires de date, volontairement sans dépendance externe.
 *
 * Règle appliquée partout : une date civile (`YYYY-MM-DD`) et une heure (`HH:mm`)
 * sont manipulées comme du texte, et ne deviennent un `Date` qu'au dernier moment,
 * construit à partir de ses composantes locales. On évite ainsi le piège classique
 * de `new Date('2026-03-29')`, interprété en UTC, qui décale d'un jour une partie
 * de l'année à cause de l'heure d'été.
 */

export const WEEKDAY_LABELS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'] as const;
export const WEEKDAY_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'] as const;
export const MONTH_LABELS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
] as const;

/** `Date` → `YYYY-MM-DD` (composantes locales). */
export function toIso(date: Date): IsoDate {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** `YYYY-MM-DD` → `Date` à midi local (midi évite tout basculement de jour). */
export function fromIso(iso: IsoDate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/** `YYYY-MM-DD` + `HH:mm` → `Date` local exact. */
export function toDateTime(iso: IsoDate, time: Time): Date {
  const [y, m, d] = iso.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

export function todayIso(): IsoDate {
  return toIso(new Date());
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const d = fromIso(iso);
  d.setDate(d.getDate() + days);
  return toIso(d);
}

export function addMonths(iso: IsoDate, months: number): IsoDate {
  const d = fromIso(iso);
  d.setMonth(d.getMonth() + months, 1);
  return toIso(d);
}

/** Lundi de la semaine contenant `iso` (semaine française). */
export function startOfWeek(iso: IsoDate): IsoDate {
  const d = fromIso(iso);
  const shift = (d.getDay() + 6) % 7; // dimanche (0) → 6
  d.setDate(d.getDate() - shift);
  return toIso(d);
}

export function startOfMonth(iso: IsoDate): IsoDate {
  const d = fromIso(iso);
  d.setDate(1);
  return toIso(d);
}

export function daysInMonth(iso: IsoDate): number {
  const d = fromIso(iso);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function weekdayOf(iso: IsoDate): number {
  return fromIso(iso).getDay();
}

export function diffDays(from: IsoDate, to: IsoDate): number {
  return Math.round((fromIso(to).getTime() - fromIso(from).getTime()) / 86_400_000);
}

export function isSameDay(a: IsoDate, b: IsoDate): boolean {
  return a === b;
}

export function isBefore(a: IsoDate, b: IsoDate): boolean {
  return a < b; // le format ISO se trie alphabétiquement
}

/* --- Heures ---------------------------------------------------------------- */

export function timeToMinutes(time: Time): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): Time {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function addMinutesToTime(time: Time, minutes: number): Time {
  return minutesToTime(timeToMinutes(time) + minutes);
}

/** Heures restantes avant un créneau (négatif s'il est passé). */
export function hoursUntil(date: IsoDate, time: Time, now: Date = new Date()): number {
  return (toDateTime(date, time).getTime() - now.getTime()) / 3_600_000;
}

/* --- Formatage ------------------------------------------------------------- */

/** « mardi 14 avril » */
export function formatDayMonth(iso: IsoDate): string {
  const d = fromIso(iso);
  return `${WEEKDAY_LABELS[d.getDay()].toLowerCase()} ${d.getDate()} ${MONTH_LABELS[d.getMonth()]}`;
}

/** « Mardi 14 avril 2026 » */
export function formatLongDate(iso: IsoDate): string {
  const d = fromIso(iso);
  return `${WEEKDAY_LABELS[d.getDay()]} ${d.getDate()} ${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
}

/** « 14/04/2026 » */
export function formatShortDate(iso: IsoDate): string {
  const d = fromIso(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** « avril 2026 » */
export function formatMonthYear(iso: IsoDate): string {
  const d = fromIso(iso);
  return `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
}

/** « 07h00 » — notation horaire française */
export function formatTime(time: Time): string {
  return time.replace(':', 'h');
}

/** « Aujourd’hui », « Demain », sinon la date complète. */
export function formatRelativeDay(iso: IsoDate, today: IsoDate = todayIso()): string {
  const delta = diffDays(today, iso);
  if (delta === 0) return 'Aujourd’hui';
  if (delta === 1) return 'Demain';
  if (delta === -1) return 'Hier';
  return formatDayMonth(iso);
}

import { timeToMinutes, todayIso, toDateTime } from './date';
import type { IsoDate, RunSignup, SocialRun, Time } from './types';

/**
 * Les runs : sorties collectives gratuites animées par le gérant.
 *
 * ── Ce qu'un run occupe ─────────────────────────────────────────────────────
 * Un run se court dehors. Il rend le gérant indisponible, mais laisse la salle
 * libre : si un autre coach est affecté sur ce créneau, une séance de studio
 * reste réservable à la même heure. C'est la traduction exacte de la réalité
 * physique, et c'est ce que `runOccupiesSlot` encode.
 *
 * ── Une place par personne ──────────────────────────────────────────────────
 * Pas d'accompagnants : chaque participant a son compte et son inscription.
 * C'est le but du dispositif — dix participants, dix contacts.
 */

/** Places d'un run, par défaut. */
export const RUN_CAPACITY = 10;

/* -------------------------------------------------------------------------- */
/* Inscriptions                                                                */
/* -------------------------------------------------------------------------- */

/** Une inscription compte tant qu'elle n'a pas été annulée. */
export function isActiveSignup(signup: RunSignup): boolean {
  return !signup.cancelledAt;
}

export function signupsForRun(signups: RunSignup[], runId: string): RunSignup[] {
  return signups.filter((s) => s.runId === runId && isActiveSignup(s));
}

export function placesLeft(run: SocialRun, signups: RunSignup[]): number {
  return Math.max(0, run.capacity - signupsForRun(signups, run.id).length);
}

export function isSignedUp(signups: RunSignup[], runId: string, userId: string | undefined): boolean {
  if (!userId) return false;
  return signups.some((s) => s.runId === runId && s.userId === userId && isActiveSignup(s));
}

/* -------------------------------------------------------------------------- */
/* Sélection                                                                   */
/* -------------------------------------------------------------------------- */

/** Le run est-il passé ? Un run en cours compte encore comme à venir. */
export function isPastRun(run: SocialRun, now: Date = new Date()): boolean {
  return toDateTime(run.date, run.endTime).getTime() < now.getTime();
}

/**
 * Runs à annoncer au public : ouverts, pas encore passés, du plus proche au
 * plus lointain. Les runs complets restent affichés — savoir qu'ils partent
 * vite est une information, et cela évite de donner l'impression que le studio
 * n'en organise plus.
 */
export function upcomingRuns(runs: SocialRun[], now: Date = new Date()): SocialRun[] {
  return runs
    .filter((r) => r.status === 'open' && !isPastRun(r, now))
    .sort((a, b) => (a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date)));
}

/** Runs passés ou annulés, du plus récent au plus ancien — pour le gérant. */
export function pastRuns(runs: SocialRun[], now: Date = new Date()): SocialRun[] {
  return runs
    .filter((r) => r.status === 'cancelled' || isPastRun(r, now))
    .sort((a, b) => (a.date === b.date ? b.startTime.localeCompare(a.startTime) : b.date.localeCompare(a.date)));
}

/** Runs à venir auxquels cette personne est inscrite. */
export function myUpcomingRuns(
  runs: SocialRun[],
  signups: RunSignup[],
  userId: string | undefined,
  now: Date = new Date(),
): SocialRun[] {
  if (!userId) return [];
  const mine = new Set(signups.filter((s) => s.userId === userId && isActiveSignup(s)).map((s) => s.runId));
  return upcomingRuns(runs, now).filter((r) => mine.has(r.id));
}

/* -------------------------------------------------------------------------- */
/* Planning                                                                    */
/* -------------------------------------------------------------------------- */

function overlaps(aStart: Time, aEnd: Time, bStart: Time, bEnd: Time): boolean {
  return timeToMinutes(aStart) < timeToMinutes(bEnd) && timeToMinutes(bStart) < timeToMinutes(aEnd);
}

/**
 * Ce run occupe-t-il ce créneau, pour le coach qui l'assure ?
 *
 * La comparaison sur le coach est le cœur de la règle : le run prend le
 * gérant, pas la salle. Si le créneau a été confié à quelqu'un d'autre, il
 * reste réservable pendant que le gérant court.
 */
export function runOccupiesSlot(
  run: SocialRun,
  date: IsoDate,
  start: Time,
  end: Time,
  slotCoachId: string | undefined,
): boolean {
  if (run.status !== 'open') return false;
  if (run.date !== date) return false;
  if (run.coachId !== slotCoachId) return false;
  return overlaps(start, end, run.startTime, run.endTime);
}

/** Prochaine date de run, ou `null` si le studio n'en a pas programmé. */
export function nextRunDate(runs: SocialRun[], now: Date = new Date()): IsoDate | null {
  return upcomingRuns(runs, now)[0]?.date ?? null;
}

/** Un run est-il encore ouvert aux inscriptions ? */
export function canSignUp(run: SocialRun, signups: RunSignup[], now: Date = new Date()): boolean {
  return run.status === 'open' && !isPastRun(run, now) && placesLeft(run, signups) > 0;
}

/** Aujourd'hui, au format de la base — raccourci pour les composants. */
export { todayIso };

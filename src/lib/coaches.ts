import type { Assignment, Block, BlockType, Coach, IsoDate, Time } from './types';
import { timeToMinutes } from './date';

/**
 * Qui coache quoi.
 *
 * ── Le modèle, en une phrase ────────────────────────────────────────────────
 * Le studio n'a qu'une salle : il n'existe donc qu'un seul planning. Le
 * titulaire assure tout par défaut ; une affectation dit « sur cette plage,
 * c'est untel ». Choisir son coach à la réservation ne crée pas de créneaux
 * supplémentaires, cela filtre ceux qu'assure la personne demandée.
 *
 * Ce choix découle directement d'une contrainte physique. Le jour où le studio
 * disposerait de deux espaces, il faudrait au contraire donner un planning à
 * chaque coach — et ce fichier serait à réécrire, pas à étendre.
 */

/** Marqueur employé dans le tunnel pour « le coach m'est égal ». */
export const ANY_COACH = 'any' as const;
export type CoachChoice = string | typeof ANY_COACH;

/* -------------------------------------------------------------------------- */
/* Lecture de la liste                                                         */
/* -------------------------------------------------------------------------- */

/** Le titulaire du studio. Il y en a toujours exactement un. */
export function ownerCoach(coaches: Coach[]): Coach | undefined {
  return coaches.find((c) => c.owner);
}

export function coachById(coaches: Coach[], id: string | undefined): Coach | undefined {
  return id ? coaches.find((c) => c.id === id) : undefined;
}

export function coachName(coach: Coach | undefined): string {
  return coach ? `${coach.firstName} ${coach.lastName}` : 'Coach';
}

/**
 * Coachs proposés à la réservation, titulaire en tête.
 *
 * L'ordre est celui de l'affichage : le studio est celui de Melvin, il passe
 * devant, et les autres suivent par ordre d'arrivée dans l'équipe.
 */
export function bookableCoaches(coaches: Coach[]): Coach[] {
  return coaches
    .filter((c) => c.active)
    .sort((a, b) => {
      if (a.owner !== b.owner) return a.owner ? -1 : 1;
      return a.createdAt.localeCompare(b.createdAt);
    });
}

/* -------------------------------------------------------------------------- */
/* Résolution : quel coach assure un créneau donné                             */
/* -------------------------------------------------------------------------- */

/** Plages horaires qui se chevauchent, bornes exclusives. */
function overlaps(aStart: Time, aEnd: Time, bStart: Time, bEnd: Time): boolean {
  return timeToMinutes(aStart) < timeToMinutes(bEnd) && timeToMinutes(bStart) < timeToMinutes(aEnd);
}

/** Une plage datée couvre-t-elle ce créneau ? */
function covers(
  range: { type: BlockType; startDate: IsoDate; endDate: IsoDate; startTime?: Time; endTime?: Time },
  date: IsoDate,
  start: Time,
  end: Time,
): boolean {
  if (date < range.startDate || date > range.endDate) return false;
  if (range.type !== 'slot') return true; // jour, semaine, période : journée entière
  if (!range.startTime || !range.endTime) return true;
  return overlaps(start, end, range.startTime, range.endTime);
}

/**
 * Priorité d'une affectation en cas de chevauchement.
 *
 * Une affectation sur un créneau précis l'emporte sur une affectation à la
 * journée, qui l'emporte sur une période. C'est ce qu'attend le gérant :
 * « Karim prend la semaine, sauf mardi 18 h que je garde » doit fonctionner
 * sans avoir à découper la semaine à la main.
 */
const PRECISION: Record<BlockType, number> = { slot: 3, day: 2, week: 1, range: 0 };

/**
 * Coach qui assure ce créneau.
 *
 * Renvoie l'identifiant du titulaire si aucune affectation ne s'applique, et
 * `undefined` s'il n'existe aucun coach — cas qui ne devrait pas se produire,
 * l'équipe comptant toujours son titulaire.
 */
export function resolveCoachId(
  date: IsoDate,
  start: Time,
  end: Time,
  coaches: Coach[],
  assignments: Assignment[],
): string | undefined {
  const applicable = assignments.filter((a) => covers(a, date, start, end));

  if (applicable.length > 0) {
    // La plus précise ; à précision égale, la plus récemment créée.
    const winner = applicable.reduce((best, current) => {
      const dp = PRECISION[current.type] - PRECISION[best.type];
      if (dp !== 0) return dp > 0 ? current : best;
      return current.createdAt > best.createdAt ? current : best;
    });
    // Une affectation vers un coach supprimé de l'équipe est ignorée :
    // le créneau revient au titulaire plutôt que de disparaître.
    const assigned = coaches.find((c) => c.id === winner.coachId && c.active);
    if (assigned) return assigned.id;
  }

  return ownerCoach(coaches)?.id;
}

/* -------------------------------------------------------------------------- */
/* Indisponibilités                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Les blocages qui ferment ce créneau pour le coach qui l'assure.
 *
 * Deux natures de blocage cohabitent :
 *  - sans `coachId` : le studio est fermé, plus personne ne travaille ;
 *  - avec `coachId` : ce coach-là est absent. Comme il n'y a qu'une salle et
 *    qu'un seul planning, si c'est lui qui assurait le créneau, le créneau
 *    tombe — le studio ne bascule pas automatiquement sur un remplaçant, ce
 *    serait une décision du gérant, pas du logiciel.
 */
export function blockAppliesToSlot(
  block: Block,
  date: IsoDate,
  start: Time,
  end: Time,
  slotCoachId: string | undefined,
): boolean {
  if (!covers(block, date, start, end)) return false;
  if (!block.coachId) return true;
  return block.coachId === slotCoachId;
}

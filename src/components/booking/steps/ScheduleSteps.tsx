'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Calendar } from '../Calendar';
import { computeDaySlots, type AvailabilityInput } from '@/lib/availability';
import { ANY_COACH, coachById } from '@/lib/coaches';
import { formatDayMonth, formatLongDate, formatTime, timeToMinutes } from '@/lib/date';
import type { Coach, IsoDate, Slot, Time } from '@/lib/types';

/**
 * Choix de la date ET du créneau, sur un seul écran.
 *
 * Le calendrier et les créneaux vivent côte à côte : cliquer sur une date
 * affiche immédiatement ses horaires, sans étape de validation intermédiaire.
 * C'est une étape de moins, et surtout la possibilité de comparer plusieurs
 * journées d'un coup d'œil avant de se décider.
 *
 * Sur téléphone, les deux blocs s'empilent et la liste des créneaux est
 * amenée à l'écran automatiquement dès qu'une date est choisie.
 *
 * Le coach demandé à l'étape précédente filtre cette liste. Les créneaux
 * qu'assure quelqu'un d'autre ne sont pas grisés mais retirés — un bouton
 * barré n'apprend rien d'utile. Une ligne les annonce en toutes lettres, avec
 * la manière de les récupérer : c'est ce qui évite qu'une journée paraisse
 * fermée alors qu'elle est simplement tenue par un autre coach.
 */

/** Regroupe les créneaux par moment de la journée : plus lisible qu'une liste de 14 boutons. */
const PERIODS = [
  { id: 'matin', label: 'Matin', caption: 'avant 12h', from: 0, to: 12 * 60 },
  { id: 'midi', label: 'Midi', caption: '12h — 14h', from: 12 * 60, to: 14 * 60 },
  { id: 'apres-midi', label: 'Après-midi', caption: '14h — 18h', from: 14 * 60, to: 18 * 60 },
  { id: 'soir', label: 'Soir', caption: 'à partir de 18h', from: 18 * 60, to: 24 * 60 },
] as const;

export function ScheduleStep({
  date,
  time,
  onDateChange,
  onTimeChange,
  availability,
  maxDate,
  coaches = [],
  onCoachChoiceChange,
}: {
  date: IsoDate | null;
  time: Time | null;
  onDateChange: (date: IsoDate) => void;
  onTimeChange: (time: Time) => void;
  availability: AvailabilityInput;
  maxDate: IsoDate;
  /** L'équipe, pour nommer le coach de chaque créneau. */
  coaches?: Coach[];
  /** Permet de revenir à « peu importe » sans remonter d'une étape. */
  onCoachChoiceChange?: (choice: typeof ANY_COACH) => void;
}) {
  const slotsRef = useRef<HTMLDivElement>(null);
  const previousDate = useRef<IsoDate | null>(date);

  const wanted = availability.coachChoice;
  const filtering = Boolean(wanted) && wanted !== ANY_COACH;

  const allSlots = useMemo(() => (date ? computeDaySlots(date, availability) : []), [date, availability]);

  /** Le créneau est-il proposé compte tenu du coach demandé ? */
  const offered = (slot: Slot) => !filtering || slot.coachId === wanted;

  const slots = allSlots.filter(offered);

  // Créneaux libres ce jour-là, mais tenus par quelqu'un d'autre.
  const heldByOthers = filtering
    ? allSlots.filter((slot) => slot.state === 'available' && !offered(slot))
    : [];

  const groups = PERIODS.map((period) => ({
    ...period,
    slots: slots.filter((slot) => {
      const minutes = timeToMinutes(slot.startTime);
      return minutes >= period.from && minutes < period.to;
    }),
  })).filter((group) => group.slots.some((slot) => slot.state === 'available'));

  const available = slots.filter((slot) => slot.state === 'available').length;

  // Le nom du coach n'est utile sur les boutons que si le client n'en a pas
  // demandé un en particulier, et si l'équipe compte plus d'une personne.
  const showCoachOnSlots = !filtering && coaches.length > 1;
  const selectedSlot = time ? slots.find((s) => s.startTime === time) : undefined;
  const selectedCoach = coachById(coaches, selectedSlot?.coachId);

  // Sur petit écran, la liste des créneaux est sous le calendrier : on l'amène
  // à l'écran quand l'utilisateur change de date, sinon rien ne semble se passer.
  useEffect(() => {
    if (!date || previousDate.current === date) return;
    previousDate.current = date;
    if (window.matchMedia('(min-width: 1024px)').matches) return;
    slotsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [date]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,21rem)_1fr] lg:gap-7">
      <div className="lg:sticky lg:top-28">
        <Calendar value={date} onSelect={onDateChange} availability={availability} maxDate={maxDate} />
        <p className="mt-3 text-[length:var(--text-xs)] leading-relaxed text-anthracite/55">
          Ouvert du lundi au vendredi de 7h à 21h, le samedi de 9h à 14h. Les jours sans pastille sont fermés,
          complets ou bloqués.
        </p>
      </div>

      <div ref={slotsRef} className="flex scroll-mt-28 flex-col gap-5">
        {!date && (
          <div className="flex flex-col items-center gap-2 rounded-[1.5rem] border-2 border-dashed border-anthracite/15 px-5 py-12 text-center">
            <p className="font-display text-[length:var(--text-2xl)] leading-none">Choisissez une date</p>
            <p className="max-w-[34ch] text-[length:var(--text-sm)] text-anthracite/55">
              Les créneaux disponibles s’afficheront ici, immédiatement.
            </p>
          </div>
        )}

        {date && (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-[length:var(--text-2xl)] leading-none">{formatLongDate(date)}</h3>
              <p
                aria-live="polite"
                className={`text-[length:var(--text-sm)] font-semibold ${available > 0 ? 'text-jade' : 'text-orange-dark'}`}
              >
                {available > 0
                  ? `${available} créneau${available > 1 ? 'x' : ''} disponible${available > 1 ? 's' : ''}`
                  : 'complet'}
              </p>
            </div>

            {groups.length === 0 && (
              <p className="rounded-xl bg-orange/10 px-4 py-3 text-[length:var(--text-sm)]">
                Plus rien de libre le {formatDayMonth(date)}
                {filtering ? ' avec ce coach' : ''}. Choisissez une autre date dans le calendrier — les jours à
                pastille verte sont les plus ouverts.
              </p>
            )}

            {heldByOthers.length > 0 && (
              <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-xl bg-anthracite/5 px-4 py-3 text-[length:var(--text-sm)] leading-relaxed text-anthracite/70">
                <span>
                  {heldByOthers.length === 1
                    ? 'Un autre créneau est libre ce jour-là'
                    : `${heldByOthers.length} autres créneaux sont libres ce jour-là`}
                  , assurés par quelqu’un d’autre de l’équipe.
                </span>
                {onCoachChoiceChange && (
                  <button
                    type="button"
                    onClick={() => onCoachChoiceChange(ANY_COACH)}
                    className="font-semibold text-orange-dark underline underline-offset-2 hover:text-orange"
                  >
                    Les afficher
                  </button>
                )}
              </p>
            )}

            {groups.map((group) => (
              <fieldset key={group.id} className="flex flex-col gap-2.5 border-0 p-0">
                <legend className="flex items-baseline gap-2 pb-1">
                  <span className="font-display text-[length:var(--text-lg)] leading-none">{group.label}</span>
                  <span className="text-[length:var(--text-2xs)] uppercase tracking-[0.12em] text-anthracite/40">
                    {group.caption}
                  </span>
                </legend>

                {/* `auto-fill` : la grille s'adapte seule, de 2 colonnes sur petit
                    mobile à 6 sur grand écran, sans point de rupture codé en dur. */}
                <ul className="grid grid-cols-[repeat(auto-fill,minmax(5.25rem,1fr))] gap-2">
                  {group.slots.map((slot) => {
                    const selected = time === slot.startTime;
                    const disabled = slot.state !== 'available';
                    return (
                      <li key={slot.startTime}>
                        <button
                          type="button"
                          disabled={disabled}
                          aria-pressed={selected}
                          onClick={() => onTimeChange(slot.startTime)}
                          className={[
                            'flex min-h-12 w-full items-center justify-center rounded-xl border-2 text-[length:var(--text-sm)] font-semibold',
                            'transition-[border-color,background-color,transform] duration-200',
                            selected
                              ? 'border-orange bg-orange text-creme'
                              : disabled
                                ? 'cursor-not-allowed border-anthracite/8 bg-anthracite/4 text-anthracite/25 line-through'
                                : 'border-anthracite/15 bg-blanc text-anthracite hover:-translate-y-0.5 hover:border-orange hover:bg-orange/10',
                          ].join(' ')}
                        >
                          <span className="flex flex-col items-center leading-none">
                            {formatTime(slot.startTime)}
                            {showCoachOnSlots && slot.coachId && (
                              <span
                                className={`mt-1 text-[0.62rem] font-medium uppercase tracking-[0.08em] ${
                                  selected ? 'text-creme/75' : 'text-anthracite/45'
                                }`}
                              >
                                {coachById(coaches, slot.coachId)?.firstName}
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </fieldset>
            ))}

            {time && (
              <p className="rounded-xl bg-jade/12 px-4 py-3 text-[length:var(--text-sm)] leading-relaxed">
                Séance retenue&nbsp;: <strong>{formatLongDate(date)} à {formatTime(time)}</strong>
                {selectedCoach ? (
                  <>
                    , avec <strong>{selectedCoach.firstName} {selectedCoach.lastName}</strong>
                  </>
                ) : null}
                . Le créneau n’est bloqué qu’une fois la réservation confirmée.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Calendar } from '../Calendar';
import { computeDaySlots, type AvailabilityInput } from '@/lib/availability';
import { formatDayMonth, formatLongDate, formatTime, timeToMinutes } from '@/lib/date';
import type { IsoDate, Time } from '@/lib/types';

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
}: {
  date: IsoDate | null;
  time: Time | null;
  onDateChange: (date: IsoDate) => void;
  onTimeChange: (time: Time) => void;
  availability: AvailabilityInput;
  maxDate: IsoDate;
}) {
  const slotsRef = useRef<HTMLDivElement>(null);
  const previousDate = useRef<IsoDate | null>(date);

  const slots = useMemo(() => (date ? computeDaySlots(date, availability) : []), [date, availability]);

  const groups = PERIODS.map((period) => ({
    ...period,
    slots: slots.filter((slot) => {
      const minutes = timeToMinutes(slot.startTime);
      return minutes >= period.from && minutes < period.to;
    }),
  })).filter((group) => group.slots.some((slot) => slot.state === 'available'));

  const available = slots.filter((slot) => slot.state === 'available').length;

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
                Plus rien de libre le {formatDayMonth(date)}. Choisissez une autre date dans le calendrier — les
                jours à pastille verte sont les plus ouverts.
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
                          {formatTime(slot.startTime)}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </fieldset>
            ))}

            {time && (
              <p className="rounded-xl bg-jade/12 px-4 py-3 text-[length:var(--text-sm)] leading-relaxed">
                Séance retenue&nbsp;: <strong>{formatLongDate(date)} à {formatTime(time)}</strong>. Le créneau n’est
                bloqué qu’une fois la réservation confirmée.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

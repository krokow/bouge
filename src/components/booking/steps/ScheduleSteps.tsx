'use client';

import { useMemo } from 'react';
import { Calendar } from '../Calendar';
import { computeDaySlots, type AvailabilityInput } from '@/lib/availability';
import { formatLongDate, formatTime, timeToMinutes } from '@/lib/date';
import type { IsoDate, Time } from '@/lib/types';

export function DateStep({
  value,
  onSelect,
  availability,
  maxDate,
}: {
  value: IsoDate | null;
  onSelect: (date: IsoDate) => void;
  availability: AvailabilityInput;
  maxDate: IsoDate;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="mx-auto w-full max-w-md lg:mx-0">
        <Calendar value={value} onSelect={onSelect} availability={availability} maxDate={maxDate} />
      </div>
      <p className="text-[length:var(--text-sm)] leading-relaxed text-anthracite/60">
        Le studio est ouvert du lundi au vendredi de 7h à 21h, et le samedi de 9h à 14h. Les jours sans pastille
        sont fermés, complets ou bloqués par le coach.
      </p>
    </div>
  );
}

/** Regroupe les créneaux par moment de la journée : plus lisible qu'une liste de 14 boutons. */
const PERIODS = [
  { id: 'matin', label: 'Matin', caption: 'avant 12h', from: 0, to: 12 * 60 },
  { id: 'midi', label: 'Midi', caption: '12h — 14h', from: 12 * 60, to: 14 * 60 },
  { id: 'apres-midi', label: 'Après-midi', caption: '14h — 18h', from: 14 * 60, to: 18 * 60 },
  { id: 'soir', label: 'Soir', caption: 'à partir de 18h', from: 18 * 60, to: 24 * 60 },
] as const;

export function TimeStep({
  date,
  value,
  onSelect,
  availability,
}: {
  date: IsoDate;
  value: Time | null;
  onSelect: (time: Time) => void;
  availability: AvailabilityInput;
}) {
  const slots = useMemo(() => computeDaySlots(date, availability), [date, availability]);
  const groups = PERIODS.map((period) => ({
    ...period,
    slots: slots.filter((slot) => {
      const minutes = timeToMinutes(slot.startTime);
      return minutes >= period.from && minutes < period.to;
    }),
  })).filter((group) => group.slots.some((slot) => slot.state === 'available'));

  const available = slots.filter((slot) => slot.state === 'available').length;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[length:var(--text-sm)] text-anthracite/60">
        <span className="font-semibold text-anthracite">{formatLongDate(date)}</span> —{' '}
        {available > 0 ? `${available} créneau${available > 1 ? 'x' : ''} disponible${available > 1 ? 's' : ''}` : 'aucun créneau disponible'}
      </p>

      {groups.length === 0 && (
        <p className="rounded-xl bg-orange/10 px-4 py-3 text-[length:var(--text-sm)]">
          Cette journée est complète. Revenez à l’étape précédente pour choisir une autre date.
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
              const selected = value === slot.startTime;
              const disabled = slot.state !== 'available';
              return (
                <li key={slot.startTime}>
                  <button
                    type="button"
                    disabled={disabled}
                    aria-pressed={selected}
                    onClick={() => onSelect(slot.startTime)}
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
    </div>
  );
}

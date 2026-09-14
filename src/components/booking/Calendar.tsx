'use client';

import { useMemo, useState } from 'react';
import { availableTimes, isOpen, type AvailabilityInput } from '@/lib/availability';
import {
  addDays,
  addMonths,
  daysInMonth,
  formatLongDate,
  formatMonthYear,
  fromIso,
  startOfMonth,
  todayIso,
  toIso,
  WEEKDAY_SHORT,
} from '@/lib/date';
import type { IsoDate } from '@/lib/types';

/**
 * Calendrier de sélection de date.
 *
 * Choix d'ergonomie :
 *  - semaine commençant le lundi, comme tous les agendas français ;
 *  - chaque jour indique le nombre de créneaux réellement libres, pour éviter
 *    d'ouvrir une journée vide ;
 *  - cases d'au moins 44px de côté : utilisable au pouce sans zoomer ;
 *  - navigation au clavier par les flèches, avec un seul jour dans l'ordre de
 *    tabulation (modèle « grille » recommandé par les WAI-ARIA Authoring Practices).
 */
export function Calendar({
  value,
  onSelect,
  availability,
  minDate = todayIso(),
  maxDate,
}: {
  value: IsoDate | null;
  onSelect: (date: IsoDate) => void;
  availability: AvailabilityInput;
  minDate?: IsoDate;
  maxDate: IsoDate;
}) {
  const [month, setMonth] = useState<IsoDate>(startOfMonth(value ?? minDate));
  const [focused, setFocused] = useState<IsoDate>(value ?? minDate);

  const days = useMemo(() => {
    const first = startOfMonth(month);
    const total = daysInMonth(month);
    // Décalage pour que la grille commence un lundi.
    const leading = (fromIso(first).getDay() + 6) % 7;

    const cells: Array<{ date: IsoDate; slots: number; selectable: boolean } | null> = [];
    for (let i = 0; i < leading; i += 1) cells.push(null);

    for (let day = 0; day < total; day += 1) {
      const date = addDays(first, day);
      const withinRange = date >= minDate && date <= maxDate;
      const slots = withinRange && isOpen(date) ? availableTimes(date, availability).length : 0;
      cells.push({ date, slots, selectable: withinRange && slots > 0 });
    }
    return cells;
  }, [month, minDate, maxDate, availability]);

  const canGoBack = startOfMonth(month) > startOfMonth(minDate);
  const canGoForward = startOfMonth(month) < startOfMonth(maxDate);

  const moveFocus = (delta: number) => {
    const next = addDays(focused, delta);
    if (next < minDate || next > maxDate) return;
    setFocused(next);
    if (startOfMonth(next) !== startOfMonth(month)) setMonth(startOfMonth(next));
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const moves: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
      PageUp: -daysInMonth(month),
      PageDown: daysInMonth(month),
    };
    const delta = moves[event.key];
    if (delta !== undefined) {
      event.preventDefault();
      moveFocus(delta);
    }
  };

  return (
    <div className="u-card overflow-hidden p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <NavButton
          label="Mois précédent"
          disabled={!canGoBack}
          onClick={() => setMonth(addMonths(month, -1))}
          direction="prev"
        />
        <p aria-live="polite" className="font-display text-[length:var(--text-xl)] leading-none">
          {formatMonthYear(month)}
        </p>
        <NavButton
          label="Mois suivant"
          disabled={!canGoForward}
          onClick={() => setMonth(addMonths(month, 1))}
          direction="next"
        />
      </div>

      <div role="grid" aria-label="Choisir une date" onKeyDown={onKeyDown}>
        <div role="row" className="mb-1.5 grid grid-cols-7 gap-1">
          {/* Lundi → dimanche */}
          {[1, 2, 3, 4, 5, 6, 0].map((weekday) => (
            <abbr
              key={weekday}
              role="columnheader"
              title={WEEKDAY_SHORT[weekday]}
              className="py-1 text-center text-[length:var(--text-2xs)] font-bold uppercase tracking-wider text-anthracite/40 no-underline"
            >
              {WEEKDAY_SHORT[weekday][0]}
            </abbr>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((cell, index) => {
            if (!cell) return <span key={`pad-${index}`} role="gridcell" aria-hidden="true" />;
            const selected = cell.date === value;
            const isToday = cell.date === todayIso();
            return (
              <button
                key={cell.date}
                type="button"
                role="gridcell"
                aria-selected={selected}
                aria-label={`${formatLongDate(cell.date)}${
                  cell.selectable ? ` — ${cell.slots} créneau${cell.slots > 1 ? 'x' : ''} disponible${cell.slots > 1 ? 's' : ''}` : ' — indisponible'
                }`}
                disabled={!cell.selectable}
                tabIndex={cell.date === focused ? 0 : -1}
                ref={(node) => {
                  // Garde le focus visible pendant la navigation au clavier.
                  if (node && cell.date === focused && node.ownerDocument.activeElement?.closest('[role="grid"]')) {
                    node.focus();
                  }
                }}
                onClick={() => {
                  setFocused(cell.date);
                  onSelect(cell.date);
                }}
                className={[
                  'relative flex aspect-square min-h-11 flex-col items-center justify-center rounded-xl',
                  'text-[length:var(--text-sm)] font-semibold transition-[background-color,color,transform] duration-200',
                  selected
                    ? 'bg-orange text-creme shadow-[0_8px_20px_-8px_rgba(226,97,41,0.9)]'
                    : cell.selectable
                      ? 'bg-creme text-anthracite hover:-translate-y-0.5 hover:bg-orange/15'
                      : 'cursor-not-allowed text-anthracite/22',
                  isToday && !selected ? 'ring-1 ring-inset ring-anthracite/30' : '',
                ].join(' ')}
              >
                <span>{fromIso(cell.date).getDate()}</span>
                {/* Pastille de disponibilité, masquée quand le jour est choisi. */}
                {cell.selectable && !selected && (
                  <span
                    aria-hidden="true"
                    className={`absolute bottom-1.5 size-1.5 rounded-full ${
                      cell.slots >= 4 ? 'bg-jade' : 'bg-orange'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-anthracite/10 pt-3 text-[length:var(--text-2xs)] text-anthracite/55">
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-jade" /> Bien disponible
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-orange" /> Presque complet
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-anthracite/22" /> Fermé ou complet
        </li>
      </ul>
    </div>
  );
}

function NavButton({
  label,
  disabled,
  onClick,
  direction,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  direction: 'prev' | 'next';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid size-11 place-items-center rounded-full border-2 border-anthracite/12 text-anthracite transition-colors duration-200 hover:border-anthracite/30 hover:bg-anthracite/5 disabled:pointer-events-none disabled:opacity-30"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="size-4">
        <path d={direction === 'prev' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  );
}

/** Export utilitaire : dernière date sélectionnable, calculée par l'appelant. */
export function monthEndOf(date: IsoDate): IsoDate {
  return toIso(new Date(fromIso(date).getFullYear(), fromIso(date).getMonth() + 1, 0, 12));
}

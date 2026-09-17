'use client';

import { CoachAvatar } from '@/components/ui/CoachAvatar';
import { COLOR_CLASSES } from '@/lib/colors';
import { ANY_COACH, type CoachChoice } from '@/lib/coaches';
import { asset } from '@/lib/config';
import type { Coach } from '@/lib/types';

/**
 * Choix du coach, avant la date et le créneau.
 *
 * « Peu importe » vient en premier et est sélectionné par défaut : c'est le
 * choix qui laisse le plus de créneaux ouverts, et le studio a intérêt à ce
 * qu'il soit le plus courant. Le titulaire suit immédiatement, puis le reste
 * de l'équipe.
 *
 * Choisir quelqu'un de précis ne crée pas de créneaux : le studio n'a qu'une
 * salle. Cela masque ceux qu'assure quelqu'un d'autre — d'où l'avertissement
 * affiché sous les cartes, qui évite de faire croire à un planning vide.
 */
export function CoachStep({
  coaches,
  value,
  onChange,
  countFor,
}: {
  coaches: Coach[];
  value: CoachChoice;
  onChange: (choice: CoachChoice) => void;
  /** Nombre de créneaux libres sur l'horizon, pour ce choix. */
  countFor: (choice: CoachChoice) => number;
}) {
  const anySelected = value === ANY_COACH;
  const totalAny = countFor(ANY_COACH);

  return (
    <fieldset className="flex flex-col gap-5 border-0 p-0">
      <legend className="sr-only">Choix du coach</legend>

      <ul className="grid gap-3 sm:grid-cols-2">
        {/* Peu importe */}
        <li className="sm:col-span-2">
          <button
            type="button"
            onClick={() => onChange(ANY_COACH)}
            aria-pressed={anySelected}
            className={[
              'group flex w-full items-center gap-4 rounded-[1.5rem] border-2 p-4 text-left sm:p-5',
              'transition-[border-color,background-color,transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
              anySelected
                ? 'border-orange bg-orange/10 shadow-[0_16px_36px_-22px_rgba(226,97,41,0.9)]'
                : 'border-anthracite/12 bg-blanc hover:-translate-y-1 hover:border-anthracite/30',
            ].join(' ')}
          >
            <img
              src={asset('/brand/mascotte-face-dark.webp')}
              alt=""
              width={520}
              height={520}
              className={`size-14 shrink-0 object-contain transition-transform duration-300 ${anySelected ? 'scale-105' : 'group-hover:scale-105'}`}
            />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-display text-[length:var(--text-2xl)] leading-none text-anthracite">
                Peu importe
              </span>
              <span className="text-[length:var(--text-sm)] leading-snug text-anthracite/65">
                Le studio vous place sur le créneau qui vous arrange — c’est le choix qui en laisse le plus.
              </span>
            </span>
            <SlotCount count={totalAny} className="ml-auto hidden sm:flex" />
          </button>
        </li>

        {coaches.map((coach) => {
          const selected = value === coach.id;
          const count = countFor(coach.id);
          const tone = COLOR_CLASSES[coach.color];

          return (
            <li key={coach.id}>
              <button
                type="button"
                onClick={() => onChange(coach.id)}
                aria-pressed={selected}
                className={[
                  'group flex h-full w-full flex-col gap-3 rounded-[1.5rem] border-2 p-4 text-left sm:p-5',
                  'transition-[border-color,background-color,transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                  selected
                    ? `${tone.border} ${tone.soft} shadow-[0_16px_36px_-24px_rgba(35,35,35,0.55)]`
                    : 'border-anthracite/12 bg-blanc hover:-translate-y-1 hover:border-anthracite/30',
                ].join(' ')}
              >
                <span className="flex items-center gap-3">
                  <CoachAvatar
                    coach={coach}
                    className={`transition-transform duration-300 ${selected ? 'scale-105' : 'group-hover:scale-105'}`}
                  />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-display text-[length:var(--text-xl)] leading-none text-anthracite">
                        {coach.firstName} {coach.lastName}
                      </span>
                      {coach.owner && (
                        <span className={`rounded-full px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] ${tone.solid}`}>
                          Fondateur
                        </span>
                      )}
                    </span>
                    <span className="text-[length:var(--text-xs)] leading-snug text-anthracite/55">{coach.role}</span>
                  </span>
                </span>

                {coach.bio && (
                  <span className="text-[length:var(--text-sm)] leading-relaxed text-anthracite/70">{coach.bio}</span>
                )}

                <span className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
                  {coach.specialties.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-anthracite/12 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-anthracite/55"
                    >
                      {tag}
                    </span>
                  ))}
                </span>

                <SlotCount count={count} />
              </button>
            </li>
          );
        })}
      </ul>

      <p className="text-[length:var(--text-xs)] leading-relaxed text-anthracite/55">
        Le studio n’accueille qu’une séance à la fois. Demander un coach précis ne fait pas apparaître de
        créneaux&nbsp;: cela masque ceux qu’assure quelqu’un d’autre. Si votre horaire compte plus que la
        personne, «&nbsp;peu importe&nbsp;» vous en laissera davantage.
      </p>
    </fieldset>
  );
}

/** Nombre de créneaux libres, en clair plutôt qu'en pastille muette. */
function SlotCount({ count, className = '' }: { count: number; className?: string }) {
  return (
    <span
      className={`flex items-baseline gap-1.5 text-[length:var(--text-xs)] ${count === 0 ? 'text-anthracite/40' : 'text-anthracite/60'} ${className}`}
    >
      <span className="font-display text-[length:var(--text-lg)] leading-none text-anthracite">{count}</span>
      {count === 0 ? 'aucun créneau libre' : count === 1 ? 'créneau libre' : 'créneaux libres'}
    </span>
  );
}

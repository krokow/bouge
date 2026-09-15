'use client';

/**
 * Fil d'étapes du tunnel de réservation.
 *
 * Sur grand écran, toutes les étapes sont visibles d'un coup. Sur mobile, la
 * liste défile horizontalement et l'étape courante est recentrée
 * automatiquement — on ne perd jamais de vue où l'on en est, et la barre ne
 * mange pas la moitié de l'écran.
 */
import { useEffect, useRef } from 'react';

export interface StepDefinition {
  id: string;
  label: string;
  shortLabel: string;
}

export function Stepper({
  steps,
  current,
  furthest,
  onSelect,
}: {
  steps: StepDefinition[];
  current: number;
  /** Étape la plus avancée atteinte : au-delà, on ne peut pas sauter. */
  furthest: number;
  onSelect: (index: number) => void;
}) {
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const active = listRef.current?.querySelector('[data-active="true"]');
    active?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [current]);

  const progress = steps.length > 1 ? current / (steps.length - 1) : 0;

  return (
    <nav aria-label="Étapes de la réservation">
      {/* Barre de progression continue, lisible même quand les libellés sont coupés */}
      <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-anthracite/10">
        <div
          className="h-full rounded-full bg-orange transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ width: `${Math.max(6, progress * 100)}%` }}
        />
      </div>

      <ol
        ref={listRef}
        // Défilement horizontal sur petit écran, passage à la ligne à partir
        // du laptop : aucun libellé n'est jamais tronqué.
        className="flex snap-x gap-1.5 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {steps.map((step, index) => {
          const state = index === current ? 'current' : index < furthest ? 'done' : 'todo';
          const reachable = index <= furthest;
          return (
            // `shrink-0` est indispensable : sans lui, les étapes se
            // compriment pour tenir dans la largeur et le libellé passe
            // par-dessus la pastille numérotée.
            <li key={step.id} className="shrink-0 snap-center">
              <button
                type="button"
                data-active={index === current}
                disabled={!reachable}
                onClick={() => reachable && onSelect(index)}
                aria-current={index === current ? 'step' : undefined}
                className={[
                  'flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-[length:var(--text-2xs)]',
                  'font-bold uppercase tracking-[0.1em] transition-colors duration-300',
                  state === 'current'
                    ? 'bg-anthracite text-creme'
                    : state === 'done'
                      ? 'bg-orange/15 text-orange-dark hover:bg-orange/25'
                      : 'text-anthracite/35',
                  reachable ? 'cursor-pointer' : 'cursor-default',
                ].join(' ')}
              >
                <span
                  aria-hidden="true"
                  className={[
                    'grid size-5 shrink-0 place-items-center rounded-full text-[0.62rem]',
                    state === 'current' ? 'bg-orange text-creme' : state === 'done' ? 'bg-orange text-creme' : 'bg-anthracite/12',
                  ].join(' ')}
                >
                  {state === 'done' ? (
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="size-2.5">
                      <path d="M4 10.5l4 4 8-9" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="sm:hidden">{step.shortLabel}</span>
                <span className="hidden sm:inline">{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

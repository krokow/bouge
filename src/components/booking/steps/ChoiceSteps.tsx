'use client';

import { OFFERS } from '@/data/offers';
import { Price } from '@/components/ui/Price';
import { COLOR_CLASSES } from '@/lib/colors';
import { asset, MAX_PARTICIPANTS } from '@/lib/config';
import { pluralize } from '@/lib/format';
import type { Offer, OfferId } from '@/lib/types';

/** Offres compatibles avec un nombre de participants donné. */
export function offersFor(participants: number): Offer[] {
  return OFFERS.filter(
    (offer) => offer.bookable && participants >= offer.minParticipants && participants <= offer.maxParticipants,
  );
}

const PARTICIPANT_CHOICES = [
  { count: 1, title: 'Seul', caption: 'En tête-à-tête avec le coach', mascotte: 'mascotte-walk-dark.webp' },
  { count: 2, title: 'À deux', caption: 'Conjoint, ami, collègue, parent', mascotte: 'mascotte-lift-dark.webp' },
  { count: 3, title: 'À trois', caption: 'Le maximum, et c’est assumé', mascotte: 'mascotte-run-dark.webp' },
];

export function ParticipantsStep({
  value,
  onChange,
}: {
  value: number;
  onChange: (count: number) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-5 border-0 p-0">
      <legend className="sr-only">Nombre de participants</legend>
      <ul className="grid gap-3 sm:grid-cols-3">
        {PARTICIPANT_CHOICES.map((choice) => {
          const selected = value === choice.count;
          return (
            <li key={choice.count}>
              <button
                type="button"
                onClick={() => onChange(choice.count)}
                aria-pressed={selected}
                className={[
                  'group flex h-full w-full flex-col items-center gap-2 rounded-[1.5rem] border-2 p-5 text-center',
                  'transition-[border-color,background-color,transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                  selected
                    ? 'border-orange bg-orange/10 shadow-[0_16px_36px_-22px_rgba(226,97,41,0.9)]'
                    : 'border-anthracite/12 bg-blanc hover:-translate-y-1 hover:border-anthracite/30',
                ].join(' ')}
              >
                <img
                  src={asset(`/brand/${choice.mascotte}`)}
                  alt=""
                  width={760}
                  height={760}
                  className={`h-20 w-auto transition-transform duration-300 sm:h-24 ${selected ? 'scale-105' : 'group-hover:scale-105'}`}
                />
                <span className="font-display text-[length:var(--text-2xl)] leading-none">{choice.title}</span>
                <span className="text-[length:var(--text-xs)] leading-snug text-anthracite/60">{choice.caption}</span>
                <span className="mt-1 text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.12em] text-anthracite/40">
                  {choice.count} {pluralize(choice.count, 'personne')}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="flex items-start gap-2.5 rounded-xl bg-jade/10 px-4 py-3 text-[length:var(--text-sm)] leading-relaxed text-anthracite/72">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="mt-0.5 size-4 shrink-0 text-jade" aria-hidden="true">
          <circle cx="10" cy="10" r="8" />
          <path d="M10 9.2v4.4M10 6.4v.1" strokeLinecap="round" />
        </svg>
        Le studio ne dépasse jamais {MAX_PARTICIPANTS} participants par séance&nbsp;: c’est la condition pour que
        le coach puisse corriger chacun.
      </p>
    </fieldset>
  );
}

export function OfferStep({
  participants,
  value,
  onChange,
}: {
  participants: number;
  value: OfferId | null;
  onChange: (id: OfferId) => void;
}) {
  const options = offersFor(participants);

  return (
    <fieldset className="flex flex-col gap-4 border-0 p-0">
      <legend className="sr-only">Choix de la formule</legend>

      {options.length === 0 && (
        <p className="rounded-xl bg-orange/10 px-4 py-3 text-[length:var(--text-sm)]">
          Aucune formule ne correspond à ce nombre de participants. Revenez à l’étape précédente.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {options.map((offer) => {
          const selected = value === offer.id;
          const c = COLOR_CLASSES[offer.color];
          const total = offer.pricePerPersonCents * (offer.id === 'petit-comite' ? participants : 1);
          return (
            <li key={offer.id}>
              <button
                type="button"
                onClick={() => onChange(offer.id)}
                aria-pressed={selected}
                className={[
                  'flex w-full flex-col gap-3 rounded-[1.5rem] border-2 p-5 text-left',
                  'transition-[border-color,background-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                  selected
                    ? 'border-orange bg-orange/8'
                    : 'border-anthracite/12 bg-blanc hover:-translate-y-0.5 hover:border-anthracite/30',
                ].join(' ')}
              >
                <span className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className={`flex items-center gap-2 text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.16em] ${c.text}`}>
                      <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${c.dot}`} />
                      {offer.durationMin} min
                      {offer.sessionsIncluded ? ` · ${offer.sessionsIncluded} séances/mois` : ''}
                    </span>
                    <span className="font-display text-[length:var(--text-2xl)] leading-none">{offer.name}</span>
                    <span className="font-hand text-lg text-anthracite/60">{offer.tagline}</span>
                  </span>

                  <span className="flex shrink-0 flex-col items-end">
                    <Price cents={total} className="text-[length:var(--text-2xl)]" />
                    <span className="text-[length:var(--text-2xs)] text-anthracite/50">
                      {offer.id === 'petit-comite' && participants > 1
                        ? `soit ${Math.round(offer.pricePerPersonCents / 100)} € par personne`
                        : offer.priceUnit}
                    </span>
                  </span>
                </span>

                <span className="text-[length:var(--text-sm)] leading-relaxed text-anthracite/70">
                  {offer.description}
                </span>

                <span className="flex flex-wrap gap-1.5">
                  {offer.highlights.slice(0, 3).map((point) => (
                    <span
                      key={point}
                      className={`rounded-full px-2.5 py-1 text-[length:var(--text-2xs)] font-medium ${c.soft} text-anthracite/75`}
                    >
                      {point}
                    </span>
                  ))}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

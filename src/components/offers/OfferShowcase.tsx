'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, ButtonLink } from '@/components/ui/Button';
import { Price } from '@/components/ui/Price';
import { OFFERS } from '@/data/offers';
import { COLOR_CLASSES } from '@/lib/colors';
import { asset } from '@/lib/config';
import { BOOKING_HREF } from '@/lib/nav';
import type { Offer } from '@/lib/types';

/**
 * Présentation des formules en « sommaire éditorial ».
 *
 * Plutôt qu'une grille de quatre cartes identiques, les noms des formules sont
 * composés en très grand — la signature typographique de la marque — et l'on
 * bascule de l'une à l'autre. La formule active se remplit, les autres restent
 * en contour ; le panneau de droite prend la couleur de la formule choisie.
 *
 * Accessibilité : c'est un vrai jeu d'onglets (rôles ARIA, navigation aux
 * flèches, panneaux toujours présents dans le DOM). Les quatre descriptions
 * restent donc lisibles par un lecteur d'écran et indexables, même masquées.
 *
 * Adaptativité : deux colonnes à partir du laptop, empilé en dessous avec
 * le panneau amené à l'écran lors du changement de formule.
 */

const MASCOTTES: Record<Offer['id'], string> = {
  decouverte: 'mascotte-walk-light.webp',
  individuel: 'mascotte-lift-light.webp',
  'petit-comite': 'mascotte-run-light.webp',
  abonnement: 'mascotte-face-light.webp',
};

export function OfferShowcase() {
  const [active, setActive] = useState(0);
  const baseId = useId();
  const tabsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  // Sur petit écran le panneau est sous la liste : on l'amène à l'écran
  // quand l'utilisateur change de formule, sinon le changement passe inaperçu.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (window.matchMedia('(min-width: 1024px)').matches) return;
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [active]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    const moves: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    const delta = moves[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    const next = (active + delta + OFFERS.length) % OFFERS.length;
    setActive(next);
    tabsRef.current[next]?.focus();
  };

  return (
    <section className="u-section relative overflow-hidden bg-anthracite text-creme">
      <div className="u-container relative grid items-start gap-[var(--spacing-fluid-3)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-[var(--spacing-fluid-4)]">
        {/* Sommaire des formules */}
        <div
          role="tablist"
          aria-label="Nos formules"
          aria-orientation="vertical"
          onKeyDown={onKeyDown}
          className="flex flex-col lg:sticky lg:top-28"
        >
          {OFFERS.map((offer, index) => {
            const selected = index === active;
            const c = COLOR_CLASSES[offer.color];
            return (
              <button
                key={offer.id}
                ref={(node) => {
                  tabsRef.current[index] = node;
                }}
                role="tab"
                id={`${baseId}-tab-${offer.id}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel-${offer.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(index)}
                className="group flex items-center gap-3 border-b border-creme/12 py-4 text-left transition-colors duration-300 last:border-0 sm:gap-5 sm:py-5"
              >
                <span
                  className={[
                    'font-sans text-[length:var(--text-2xs)] font-bold tabular-nums transition-colors duration-300',
                    selected ? c.text : 'text-creme/30 group-hover:text-creme/60',
                  ].join(' ')}
                >
                  0{index + 1}
                </span>

                <span
                  className={[
                    'min-w-0 flex-1 font-display text-[length:var(--text-4xl)] leading-[0.92] transition-all duration-400',
                    selected ? 'text-creme' : 'u-outline-text text-creme/40 group-hover:text-creme/75',
                  ].join(' ')}
                >
                  {offer.name}
                </span>

                <span
                  aria-hidden="true"
                  className={[
                    'grid size-8 shrink-0 place-items-center rounded-full transition-all duration-400 sm:size-10',
                    selected
                      ? `${c.solid} scale-110`
                      : 'bg-creme/10 text-creme/45 group-hover:bg-creme/20 group-hover:text-creme/80',
                  ].join(' ')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                    <path d="M5 12h13M13 6l6 6-6 6" />
                  </svg>
                </span>
              </button>
            );
          })}

          <p className="hidden pt-6 text-[length:var(--text-sm)] text-creme/45 lg:block">
            Utilisez les flèches du clavier pour parcourir les formules.
          </p>
        </div>

        {/* Panneau de détail */}
        <div ref={panelRef} className="scroll-mt-24">
          {OFFERS.map((offer, index) => (
            <OfferPanel
              key={offer.id}
              offer={offer}
              id={`${baseId}-panel-${offer.id}`}
              labelledBy={`${baseId}-tab-${offer.id}`}
              hidden={index !== active}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function OfferPanel({
  offer,
  id,
  labelledBy,
  hidden,
  index,
}: {
  offer: Offer;
  id: string;
  labelledBy: string;
  hidden: boolean;
  index: number;
}) {
  const c = COLOR_CLASSES[offer.color];

  return (
    <div
      role="tabpanel"
      id={id}
      aria-labelledby={labelledBy}
      hidden={hidden}
      tabIndex={0}
      className={`relative overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10 ${c.solid}`}
      style={hidden ? undefined : { animation: 'u-fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}
    >
      {/* Mascotte en fond, discrète */}
      <img
        src={asset(`/brand/${MASCOTTES[offer.id]}`)}
        alt=""
        width={760}
        height={760}
        loading="lazy"
        className="pointer-events-none absolute -bottom-6 -right-6 h-40 w-auto opacity-20 sm:h-52 lg:h-60"
      />

      <div className="relative flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="rounded-full bg-anthracite/25 px-3 py-1.5 text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.14em] backdrop-blur-sm">
            {offer.durationMin} min
          </span>
          <span className="rounded-full bg-anthracite/25 px-3 py-1.5 text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.14em] backdrop-blur-sm">
            {offer.maxParticipants > 1
              ? `${offer.minParticipants} à ${offer.maxParticipants} personnes`
              : 'en tête-à-tête'}
          </span>
          {offer.featured && (
            <span className="rounded-full bg-creme px-3 py-1.5 text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.14em] text-anthracite">
              Le plus choisi
            </span>
          )}
        </div>

        <p className="font-hand text-[length:var(--text-2xl)] leading-tight opacity-90">{offer.tagline}</p>

        <p className="max-w-[54ch] text-[length:var(--text-base)] leading-relaxed opacity-95">{offer.description}</p>

        <div className="flex flex-wrap items-end gap-x-6 gap-y-2 border-y border-current/25 py-5">
          <Price
            cents={offer.pricePerPersonCents}
            unit={offer.priceUnit}
            className="text-[length:var(--text-5xl)]"
            unitClassName="text-[length:var(--text-sm)] opacity-75"
          />
          {offer.sessionsIncluded && (
            <span className="text-[length:var(--text-sm)] opacity-75">
              soit {Math.round(offer.pricePerPersonCents / offer.sessionsIncluded / 100)} € la séance
            </span>
          )}
        </div>

        <ul className="grid gap-2.5 sm:grid-cols-2">
          {offer.highlights.map((point) => (
            <li key={point} className="flex items-start gap-2.5 text-[length:var(--text-sm)] leading-relaxed">
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="mt-[0.3em] size-3.5 shrink-0"
              >
                <path d="M4 10.5l4 4 8-9" />
              </svg>
              {point}
            </li>
          ))}
        </ul>

        <p className="rounded-2xl bg-anthracite/22 px-4 py-3.5 text-[length:var(--text-sm)] leading-relaxed backdrop-blur-sm">
          <span className="font-bold">Pour qui&nbsp;: </span>
          {offer.audience}
        </p>

        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
          <ButtonLink href={`${BOOKING_HREF}?offre=${offer.id}`} variant="cream" size="lg" className="sm:flex-1">
            Réserver cette formule <ArrowRight />
          </ButtonLink>
          <span className="text-center text-[length:var(--text-xs)] opacity-75 sm:text-left">
            Formule {index + 1} sur {OFFERS.length}
          </span>
        </div>
      </div>
    </div>
  );
}

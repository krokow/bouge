'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, ButtonLink } from '@/components/ui/Button';
import { Price } from '@/components/ui/Price';
import { OFFERS } from '@/data/offers';
import { COLOR_CLASSES } from '@/lib/colors';
import { asset } from '@/lib/config';
import { BOOKING_HREF } from '@/lib/nav';
import type { Offer } from '@/lib/types';

/**
 * Présentation des formules.
 *
 * Deux modes, choisis automatiquement — jamais deux contenus différents, les
 * mêmes textes dans les deux cas.
 *
 * 1. « Défilement » (à partir de 1024px, si les animations sont autorisées).
 *    La section est haute de plusieurs écrans et son contenu reste épinglé :
 *    en descendant, on traverse les quatre formules l'une après l'autre, et en
 *    remontant on les retraverse dans l'autre sens. C'est le défilement natif
 *    du navigateur qui pilote tout — aucun événement de molette n'est
 *    intercepté : l'inertie, le clavier, la barre de défilement et le retour
 *    arrière fonctionnent normalement. On ne peut donc pas « passer à côté »
 *    d'une formule sans l'avoir vue, et on n'est jamais bloqué dans la section.
 *
 * 2. « Empilé » (mobile, tablette, ou préférence « animations réduites »).
 *    Les quatre formules sont simplement les unes sous les autres. Sur un
 *    téléphone, épingler une section coûte cher en défilement et se comporte
 *    mal avec les barres d'adresse rétractables : l'empilement est à la fois
 *    plus simple et plus sûr.
 *
 * Le rendu statique part du mode empilé : le HTML servi contient les quatre
 * descriptions complètes, indexables et lisibles sans JavaScript.
 */

const MASCOTTES: Record<Offer['id'], string> = {
  decouverte: 'mascotte-walk-dark.webp',
  individuel: 'mascotte-lift-dark.webp',
  'petit-comite': 'mascotte-run-dark.webp',
  abonnement: 'mascotte-face-dark.webp',
};

/** Hauteur de défilement allouée à chaque formule, en pourcentage de l'écran. */
const SCROLL_PER_OFFER = 70;

export function OfferShowcase() {
  const [mode, setMode] = useState<'stack' | 'scroll'>('stack');
  const [active, setActive] = useState(0);
  const baseId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<Array<HTMLButtonElement | null>>([]);

  /* --- Choix du mode ---------------------------------------------------- */
  useEffect(() => {
    // La hauteur compte autant que la largeur : sur un écran court, le
    // panneau ne tiendrait pas dans la zone épinglée et serait rogné.
    // En dessous de 760px de haut, on repasse donc à l'empilement.
    const wide = window.matchMedia('(min-width: 1024px) and (min-height: 760px)');
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setMode(wide.matches && !calm.matches ? 'scroll' : 'stack');
    apply();
    wide.addEventListener('change', apply);
    calm.addEventListener('change', apply);
    return () => {
      wide.removeEventListener('change', apply);
      calm.removeEventListener('change', apply);
    };
  }, []);

  /* --- Le défilement pilote la formule affichée ------------------------- */
  useEffect(() => {
    if (mode !== 'scroll') return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const travel = wrapper.offsetHeight - window.innerHeight;
      if (travel <= 0) return;
      const scrolled = -wrapper.getBoundingClientRect().top;
      const progress = Math.min(1, Math.max(0, scrolled / travel));
      // `progress` vaut 1 tout en bas : sans ce garde-fou, l'index déborderait.
      const index = Math.min(OFFERS.length - 1, Math.floor(progress * OFFERS.length));
      setActive((current) => (current === index ? current : index));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [mode]);

  /** Amène la page au segment de défilement correspondant à une formule. */
  const scrollToOffer = useCallback((index: number) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const travel = wrapper.offsetHeight - window.innerHeight;
    const step = travel / OFFERS.length;
    // On vise le milieu du segment : la formule reste active même si le
    // défilement s'arrête un peu avant ou après.
    const top = wrapper.offsetTop + step * (index + 0.5);
    window.scrollTo({ top, behavior: 'smooth' });
  }, []);

  const onKeyDown = (event: React.KeyboardEvent) => {
    const moves: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    const delta = moves[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    const next = (active + delta + OFFERS.length) % OFFERS.length;
    setActive(next);
    tabsRef.current[next]?.focus();
    scrollToOffer(next);
  };

  /* --- Mode empilé ------------------------------------------------------ */
  if (mode === 'stack') {
    return (
      <section className="u-section bg-creme">
        <div className="u-container flex flex-col gap-4 sm:gap-5">
          {OFFERS.map((offer, index) => (
            <article key={offer.id} className="flex flex-col gap-3">
              <h2 className="flex items-baseline gap-3">
                <span className={`font-sans text-[length:var(--text-2xs)] font-bold ${COLOR_CLASSES[offer.color].text}`}>
                  0{index + 1}
                </span>
                <span className="text-[length:var(--text-4xl)] leading-[0.92]">{offer.name}</span>
              </h2>
              <OfferPanel offer={offer} index={index} />
            </article>
          ))}
        </div>
      </section>
    );
  }

  /* --- Mode défilement -------------------------------------------------- */
  return (
    <section className="bg-creme">
      <div
        ref={wrapperRef}
        style={{ height: `calc(${OFFERS.length * SCROLL_PER_OFFER}vh + 100vh)` }}
      >
        {/* Rembourrage asymétrique : il faut dégager la barre de navigation en
            haut, mais rien n'impose la même marge en bas — autant de place
            gagnée pour le panneau. */}
        <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden pb-[clamp(1.5rem,4vh,3rem)] pt-[clamp(5.5rem,9vh,7rem)]">
          <div className="u-container grid w-full items-center gap-[var(--spacing-fluid-4)] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            {/* Sommaire des formules */}
            <div className="flex flex-col">
              <p className="mb-5 flex items-center gap-2.5 text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.22em] text-orange">
                <span aria-hidden="true" className="inline-block h-[2px] w-7 rounded-full bg-current opacity-60" />
                Nos formules
              </p>

              <div
                role="tablist"
                aria-label="Nos formules"
                aria-orientation="vertical"
                onKeyDown={onKeyDown}
                className="flex flex-col"
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
                      onClick={() => {
                        setActive(index);
                        scrollToOffer(index);
                      }}
                      className="group relative flex items-center gap-4 border-b border-anthracite/12 py-3.5 text-left last:border-0 sm:py-4"
                    >
                      {/* Trait de progression, qui se remplit sur la formule active */}
                      <span
                        aria-hidden="true"
                        className={`absolute bottom-[-1px] left-0 h-[2px] rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${c.dot} ${
                          selected ? 'w-full' : 'w-0'
                        }`}
                      />

                      <span
                        className={[
                          'font-sans text-[length:var(--text-2xs)] font-bold tabular-nums transition-colors duration-300',
                          selected ? c.text : 'text-anthracite/30 group-hover:text-anthracite/60',
                        ].join(' ')}
                      >
                        0{index + 1}
                      </span>

                      <span
                        className={[
                          'min-w-0 flex-1 font-display leading-[0.92] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                          // Aucune classe de couleur sur la variante en
                          // contour : `u-outline-text` s'en charge (voir
                          // globals.css), sans quoi elle serait écrasée.
                          selected
                            ? 'text-[length:var(--text-4xl)] text-anthracite'
                            : 'u-outline-text text-[length:var(--text-3xl)]',
                        ].join(' ')}
                      >
                        {offer.name}
                      </span>

                      <span
                        aria-hidden="true"
                        className={[
                          'grid size-9 shrink-0 place-items-center rounded-full transition-all duration-500',
                          selected ? `${c.solid} scale-100 opacity-100` : 'scale-75 bg-anthracite/8 text-anthracite/40 opacity-0 group-hover:opacity-100',
                        ].join(' ')}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                          <path d="M5 12h13M13 6l6 6-6 6" />
                        </svg>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* L'indication disparaît une fois la dernière formule atteinte :
                  la laisser inviterait à chercher une cinquième. */}
              <p
                aria-live="polite"
                className="mt-6 flex items-center gap-2.5 text-[length:var(--text-xs)] text-anthracite/45"
              >
                {active < OFFERS.length - 1 ? (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      aria-hidden="true"
                      className="size-4 animate-bounce"
                    >
                      <path d="M12 5v14M6 13l6 6 6-6" />
                    </svg>
                    Continuez à faire défiler&nbsp;: {OFFERS.length - active - 1} formule
                    {OFFERS.length - active - 1 > 1 ? 's' : ''} encore.
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="size-4 text-jade"
                    >
                      <path d="M4 10.5l4 4 8-9" />
                    </svg>
                    Vous avez vu les quatre formules. Le comparatif suit.
                  </>
                )}
              </p>
            </div>

            {/* Panneau de détail */}
            <div className="relative">
              {OFFERS.map((offer, index) => (
                <div
                  key={offer.id}
                  role="tabpanel"
                  id={`${baseId}-panel-${offer.id}`}
                  aria-labelledby={`${baseId}-tab-${offer.id}`}
                  hidden={index !== active}
                >
                  {/* La clé force le rejeu de l'animation à chaque changement. */}
                  <div
                    key={`${offer.id}-${active}`}
                    style={{ animation: 'u-offer-in 0.55s cubic-bezier(0.22,1,0.36,1) both' }}
                  >
                    <OfferPanel offer={offer} index={index} compact />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes u-offer-in {
          from { opacity: 0; transform: translate3d(0, 28px, 0) scale(0.985); }
          to   { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
        }
      `}</style>
    </section>
  );
}

/**
 * Le contenu d'une formule.
 * `compact` réduit les marges pour que le panneau tienne dans un écran épinglé.
 */
function OfferPanel({ offer, index, compact }: { offer: Offer; index: number; compact?: boolean }) {
  const c = COLOR_CLASSES[offer.color];

  return (
    <div
      className={[
        'relative overflow-hidden rounded-[2rem]',
        compact ? 'p-5 xl:p-7' : 'p-6 sm:p-8',
        c.solid,
      ].join(' ')}
    >
      <img
        src={asset(`/brand/${MASCOTTES[offer.id]}`)}
        alt=""
        width={760}
        height={760}
        loading="lazy"
        className={`pointer-events-none absolute -bottom-6 -right-6 w-auto opacity-20 ${compact ? 'h-40 xl:h-48' : 'h-40 sm:h-52'}`}
      />

      <div className={`relative flex flex-col ${compact ? 'gap-3' : 'gap-5'}`}>
        <div className="flex flex-wrap items-center gap-2">
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

        <div className={`flex flex-wrap items-end gap-x-6 gap-y-2 border-y border-current/25 ${compact ? 'py-3' : 'py-4'}`}>
          <Price
            cents={offer.pricePerPersonCents}
            unit={offer.priceUnit}
            className={compact ? 'text-[length:var(--text-4xl)]' : 'text-[length:var(--text-5xl)]'}
            unitClassName="text-[length:var(--text-sm)] opacity-75"
          />
          {offer.sessionsIncluded && (
            <span className="text-[length:var(--text-sm)] opacity-75">
              soit {Math.round(offer.pricePerPersonCents / offer.sessionsIncluded / 100)} € la séance
            </span>
          )}
        </div>

        <ul className={`grid sm:grid-cols-2 ${compact ? 'gap-1.5' : 'gap-2'}`}>
          {offer.highlights.map((point) => (
            <li
              key={point}
              className={`flex items-start gap-2.5 leading-relaxed ${compact ? 'text-[length:var(--text-xs)]' : 'text-[length:var(--text-sm)]'}`}
            >
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

        {/* En mode épinglé, l'encadré coûterait une soixantaine de pixels de
            hauteur : la même information tient sur une ligne. */}
        {compact ? (
          <p className="text-[length:var(--text-xs)] leading-relaxed opacity-85">
            <span className="font-bold">Pour qui&nbsp;: </span>
            {offer.audience}
          </p>
        ) : (
          <p className="rounded-2xl bg-anthracite/22 px-4 py-3 text-[length:var(--text-sm)] leading-relaxed backdrop-blur-sm">
            <span className="font-bold">Pour qui&nbsp;: </span>
            {offer.audience}
          </p>
        )}

        <div className="flex flex-col gap-3 pt-0.5 sm:flex-row sm:items-center">
          <ButtonLink
            href={`${BOOKING_HREF}?offre=${offer.id}`}
            variant="cream"
            size={compact ? 'md' : 'lg'}
            className="sm:flex-1"
          >
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

'use client';

import { useEffect, useRef, useState } from 'react';
import { HeroVideo } from './HeroVideo';
import { ArrowRight, ButtonLink } from '@/components/ui/Button';
import { asset, MAX_PARTICIPANTS, STUDIO } from '@/lib/config';
import { BOOKING_HREF } from '@/lib/nav';

const STATS = [
  { value: `${MAX_PARTICIPANTS}`, label: 'personnes maximum par séance' },
  { value: `${STUDIO.coach.years}+`, label: 'années de coaching' },
  { value: '7h—21h', label: 'du lundi au vendredi' },
];

export function Hero() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Parallaxe douce du contenu au défilement.
  // Écrit dans une variable CSS via requestAnimationFrame : aucune remise en
  // page, la composition reste sur le GPU et le scroll ne saccade pas.
  useEffect(() => {
    const node = contentRef.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const progress = Math.min(1, window.scrollY / Math.max(1, window.innerHeight));
      node.style.setProperty('--hero-shift', `${progress * 70}px`);
      node.style.setProperty('--hero-fade', `${1 - progress * 1.25}`);
      node.style.setProperty('--hero-scale', `${1 - progress * 0.06}`);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section
      className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden text-creme"
      aria-label="Présentation du studio"
    >
      <HeroVideo />

      {/* Badge tournant, en haut à droite — disparaît sous 1024px pour laisser
          respirer le logo sur mobile. */}
      <img
        src={asset('/brand/badge-creme.webp')}
        alt=""
        width={640}
        height={640}
        className="u-spin-slow absolute right-[4vw] top-[16vh] z-10 hidden size-28 opacity-80 xl:block"
      />

      <div
        ref={contentRef}
        className="u-container relative z-10 flex flex-col items-center pb-[clamp(6rem,14vh,10rem)] pt-[clamp(7rem,18vh,12rem)] text-center"
        style={{
          transform: 'translate3d(0, var(--hero-shift, 0px), 0) scale(var(--hero-scale, 1))',
          opacity: 'var(--hero-fade, 1)',
          willChange: 'transform, opacity',
        }}
      >
        {/* Bandeau d'accroche */}
        <p
          className="mb-[clamp(1.5rem,4vh,2.75rem)] inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border border-creme/25 bg-anthracite/30 px-4 py-2 text-[length:var(--text-2xs)] font-semibold uppercase tracking-[0.2em] backdrop-blur-md sm:px-5"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'none' : 'translateY(14px)',
            transition: 'opacity 0.8s ease 0.1s, transform 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s',
          }}
        >
          <span className="text-orange">Depuis {STUDIO.since}</span>
          <span aria-hidden="true" className="text-creme/30">
            •
          </span>
          <span>{STUDIO.address.city}</span>
          <span aria-hidden="true" className="hidden text-creme/30 sm:inline">
            •
          </span>
          <span className="hidden sm:inline">Douche &amp; vestiaire</span>
        </p>

        {/* Le logo est la pièce maîtresse du premier écran. */}
        <h1
          className="mb-[clamp(1.25rem,3.5vh,2.25rem)] w-full"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'none' : 'translateY(26px) scale(0.96)',
            transition: 'opacity 1s ease 0.22s, transform 1.1s cubic-bezier(0.22,1,0.36,1) 0.22s',
          }}
        >
          <img
            src={asset('/brand/logo-stack-creme.webp')}
            alt={`${STUDIO.name} — ${STUDIO.baseline}`}
            width={1000}
            height={640}
            fetchPriority="high"
            decoding="async"
            className="mx-auto h-auto w-[min(88vw,clamp(17rem,42vw,34rem))] drop-shadow-[0_18px_44px_rgba(0,0,0,0.42)]"
          />
          <span className="sr-only">
            {STUDIO.name} — studio de coaching sportif à {STUDIO.address.city}
          </span>
        </h1>

        <p
          className="mb-[clamp(1.75rem,4.5vh,2.75rem)] max-w-[22ch] text-balance font-display text-[length:var(--text-3xl)] leading-[0.95] text-creme sm:max-w-[26ch]"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'none' : 'translateY(22px)',
            transition: 'opacity 0.9s ease 0.42s, transform 0.9s cubic-bezier(0.22,1,0.36,1) 0.42s',
          }}
        >
          Seul, à deux ou à trois.
          <br />
          <span className="text-orange">Jamais plus.</span>
        </p>

        <div
          className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'none' : 'translateY(18px)',
            transition: 'opacity 0.9s ease 0.58s, transform 0.9s cubic-bezier(0.22,1,0.36,1) 0.58s',
          }}
        >
          <ButtonLink href={BOOKING_HREF} size="lg" className="relative">
            {/* Anneau pulsé : attire l'œil sur l'action principale. */}
            <span
              aria-hidden="true"
              className="absolute inset-0 -z-10 rounded-full bg-orange/60"
              style={{ animation: 'u-pulse-ring 2.8s cubic-bezier(0.22,1,0.36,1) infinite' }}
            />
            Prendre rendez-vous
            <ArrowRight />
          </ButtonLink>
          <ButtonLink href="/offres/" size="lg" variant="outline" className="text-creme">
            Découvrir les offres
          </ButtonLink>
        </div>

        {/* Chiffres clés */}
        <ul
          className="mt-[clamp(2.5rem,7vh,4.5rem)] grid w-full max-w-2xl grid-cols-3 gap-x-2 gap-y-4 border-t border-creme/15 pt-6"
          style={{
            opacity: mounted ? 1 : 0,
            transition: 'opacity 1s ease 0.8s',
          }}
        >
          {STATS.map((stat) => (
            <li key={stat.label} className="flex flex-col items-center gap-1">
              <span className="font-display text-[length:var(--text-2xl)] leading-none text-orange">{stat.value}</span>
              <span className="max-w-[16ch] text-balance text-[length:var(--text-2xs)] uppercase tracking-[0.12em] text-creme/60">
                {stat.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Invitation à défiler */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-5 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-creme/50 md:flex"
        style={{ opacity: mounted ? 1 : 0, transition: 'opacity 1s ease 1.2s' }}
      >
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.3em]">Défilez</span>
        <span className="relative block h-9 w-[1.5px] overflow-hidden bg-creme/20">
          <span
            className="absolute inset-x-0 top-0 block h-3 bg-orange"
            style={{ animation: 'u-scroll-cue 2.2s ease-in-out infinite' }}
          />
        </span>
      </div>

      <style>{`
        @keyframes u-scroll-cue {
          0% { transform: translateY(-100%); }
          60%, 100% { transform: translateY(300%); }
        }
      `}</style>
    </section>
  );
}

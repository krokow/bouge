'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { asset } from '@/lib/config';

/**
 * Bandeau défilant, en boucle continue.
 *
 * ── Le piège, et pourquoi ce composant mesure ───────────────────────────────
 * La recette habituelle — dupliquer le contenu une fois et translater la piste
 * de -50 % — ne tient que si UNE copie est déjà plus large que l'écran. Sinon
 * la piste se vide par la droite en fin de cycle et il ne reste qu'un aplat de
 * couleur : c'est exactement ce qui se produisait ici sur grand écran, où les
 * quatre mots ne remplissaient pas 1920 px.
 *
 * On mesure donc la largeur réelle d'un motif, puis on le répète autant de fois
 * qu'il faut pour couvrir la largeur visible PLUS un motif d'avance. Le
 * déplacement vaut exactement un motif : à la fin du cycle, le motif suivant se
 * retrouve précisément là où était le premier. Comme tous les motifs sont
 * identiques au pixel près, le raccord est invisible et il n'y a jamais de
 * retour en arrière.
 *
 * Deux précautions rendent ce raccord fiable :
 *  - la mesure attend le chargement des polices. Mesurée avec la police de
 *    repli, la largeur serait fausse de plusieurs dizaines de pixels et le
 *    bandeau sauterait à chaque tour ;
 *  - elle utilise `getBoundingClientRect()`, en nombre décimal, et non
 *    `offsetWidth`, qui arrondit à l'entier : un demi-pixel d'écart suffit à
 *    créer une saccade visible à chaque boucle.
 *
 * Seule la transformation est animée : composition sur le GPU, aucune remise en
 * page, aucune saccade au défilement.
 */
export function Marquee({
  items,
  className = '',
  tone = 'orange',
  speed = 70,
}: {
  items: string[];
  className?: string;
  tone?: 'orange' | 'anthracite' | 'jade';
  /** Vitesse de défilement en pixels par seconde, identique à toute largeur. */
  speed?: number;
}) {
  const tones = {
    orange: 'bg-orange text-creme',
    anthracite: 'bg-anthracite text-creme',
    jade: 'bg-jade text-creme',
  } as const;

  const frameRef = useRef<HTMLDivElement>(null);
  const patternRef = useRef<HTMLDivElement>(null);

  /** Largeur d'un motif, en pixels. `null` tant qu'elle n'est pas mesurée. */
  const [patternWidth, setPatternWidth] = useState<number | null>(null);
  /** Nombre de motifs à poser dans la piste. */
  const [repeats, setRepeats] = useState(2);

  const measure = useCallback(() => {
    const frame = frameRef.current;
    const pattern = patternRef.current;
    if (!frame || !pattern) return;

    const width = pattern.getBoundingClientRect().width;
    const visible = frame.getBoundingClientRect().width;
    if (width <= 0 || visible <= 0) return;

    // Couvrir la largeur visible, plus un motif d'avance pour le raccord.
    const needed = Math.ceil(visible / width) + 1;

    // On n'écrit dans l'état que si la valeur change réellement : sans cela,
    // le moindre recalcul relancerait l'animation depuis le début, ce qui se
    // voit comme un à-coup.
    setPatternWidth((current) => (current !== null && Math.abs(current - width) < 0.5 ? current : width));
    setRepeats((current) => (current === needed ? current : needed));
  }, []);

  useEffect(() => {
    measure();

    // Les polices de la marque arrivent après le premier rendu : sans cette
    // seconde mesure, la largeur retenue serait celle de la police de repli.
    let cancelled = false;
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => {
        if (!cancelled) measure();
      });
    }

    const frame = frameRef.current;
    if (!frame || typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => {
        cancelled = true;
        window.removeEventListener('resize', measure);
      };
    }

    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [measure]);

  // Vitesse constante : une piste deux fois plus large met deux fois plus de
  // temps. Sans cela, le bandeau filerait sur grand écran et traînerait sur
  // téléphone.
  const duration = patternWidth === null ? 0 : patternWidth / speed;

  const pattern = (first: boolean) => (
    <div
      ref={first ? patternRef : undefined}
      aria-hidden="true"
      className="flex shrink-0 items-center gap-8 pr-8 sm:gap-12 sm:pr-12"
    >
      {items.map((item, i) => (
        <Fragment key={`${item}-${i}`}>
          <span className="whitespace-nowrap font-display text-[length:var(--text-xl)] uppercase leading-none tracking-tight">
            {item}
          </span>
          <img
            src={asset('/brand/monogram-anthracite.webp')}
            alt=""
            width={512}
            height={492}
            loading="lazy"
            className="size-5 shrink-0 opacity-45 sm:size-6"
          />
        </Fragment>
      ))}
    </div>
  );

  return (
    <div
      ref={frameRef}
      className={`relative flex overflow-hidden py-3.5 ${tones[tone]} ${className}`}
      role="presentation"
      aria-hidden="true"
    >
      {/* L'animation n'est posée qu'une fois la mesure faite : un bandeau
          immobile pendant une image vaut mieux qu'une boucle fausse. */}
      <div
        className={`flex shrink-0 ${patternWidth === null ? '' : 'u-marquee-track'}`}
        style={
          patternWidth === null
            ? undefined
            : ({
                '--marquee-shift': `${patternWidth}px`,
                '--marquee-duration': `${duration}s`,
              } as React.CSSProperties)
        }
      >
        {Array.from({ length: repeats }, (_, i) => (
          <Fragment key={i}>{pattern(i === 0)}</Fragment>
        ))}
      </div>
    </div>
  );
}

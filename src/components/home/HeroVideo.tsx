'use client';

import { useEffect, useRef, useState } from 'react';
import { asset } from '@/lib/config';

/**
 * Fond vidéo du hero.
 *
 * Stratégie de performance et d'adaptation, dans cet ordre :
 *
 * 1. L'affiche (`hero-poster.webp`, 37 Ko) est peinte immédiatement. C'est elle
 *    qui sert de LCP : le premier écran est complet avant même que la vidéo
 *    ne commence à se télécharger.
 * 2. La vidéo n'est demandée qu'après le montage, et uniquement si le contexte
 *    s'y prête — on ne la charge pas si l'utilisateur a réduit les animations,
 *    activé le mode économie de données, ou s'il est en 2G.
 * 3. Deux fichiers selon l'orientation : une version portrait légère (276 Ko)
 *    pour les mobiles, la version paysage (641 Ko) ailleurs. `object-fit: cover`
 *    recadre sans jamais déformer l'image.
 * 4. La vidéo n'apparaît qu'une fois réellement lisible, en fondu sur l'affiche :
 *    aucun saut visuel, aucun écran noir.
 *
 * REMPLACEMENT : déposer la vraie vidéo du studio sous
 * `public/media/hero.mp4` (+ `hero-mobile.mp4`, + `hero-poster.webp`).
 * Aucun code à modifier — voir docs/MEDIA.md.
 */
export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [wanted, setWanted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // API Network Information : absente de Safari/Firefox, d'où le typage souple.
    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    const frugal =
      connection?.saveData === true ||
      connection?.effectiveType === '2g' ||
      connection?.effectiveType === 'slow-2g';

    if (reducedMotion || frugal) return;

    // Laisse le premier rendu se terminer avant d'engager la bande passante.
    // `requestIdleCallback` est absent de Safari < 17, d'où le repli sur un timer.
    const ric = window.requestIdleCallback;
    if (typeof ric === 'function') {
      const handle = ric(() => setWanted(true), { timeout: 1200 });
      return () => window.cancelIdleCallback?.(handle);
    }
    const timer = window.setTimeout(() => setWanted(true), 400);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!wanted) return;
    const video = videoRef.current;
    if (!video) return;
    // Certains navigateurs refusent la lecture automatique : l'affiche reste
    // alors visible, ce qui est un repli parfaitement acceptable.
    video.play().catch(() => undefined);
  }, [wanted]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-anthracite">
      <img
        src={asset('/media/hero-poster.webp')}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 size-full object-cover"
      />

      {wanted && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster={asset('/media/hero-poster.webp')}
          aria-hidden="true"
          tabIndex={-1}
          onCanPlay={() => setReady(true)}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-1000 ${
            ready ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Version portrait allégée pour les écrans plus hauts que larges. */}
          <source src={asset('/media/hero-mobile.mp4')} type="video/mp4" media="(max-aspect-ratio: 1/1)" />
          <source src={asset('/media/hero.mp4')} type="video/mp4" />
        </video>
      )}

      {/* Voile de lisibilité : garantit le contraste du logo et du CTA
          quel que soit le plan de la vidéo. */}
      <div className="u-hero-scrim absolute inset-0" />
      <div className="u-grain absolute inset-0 opacity-60" />
    </div>
  );
}

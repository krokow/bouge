'use client';

import { useEffect, useRef, useState } from 'react';
import { asset } from '@/lib/config';

/**
 * Fond vidéo du hero.
 *
 * La vidéo est chargée et jouée dans tous les cas, sans condition : c'est une
 * demande explicite du studio, la vidéo fait partie de l'identité du premier
 * écran. Les seuls replis restants sont ceux que le navigateur impose :
 * si la lecture automatique est refusée ou si le fichier ne charge pas,
 * l'affiche reste visible.
 *
 * Deux définitions servies selon la largeur d'écran (même cadrage, 1,7 Mo sur
 * téléphone contre 5,9 Mo ailleurs) et `object-fit: cover` pour recadrer sans
 * jamais déformer l'image.
 *
 * REMPLACEMENT : déposer la vidéo sous `public/media/hero.mp4`, puis
 * régénérer la version mobile et l'affiche — voir docs/MEDIA.md.
 */
export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Le choix de la source se fait en JavaScript, et non par l'attribut `media`
  // d'une balise <source> : cet attribut n'est pas appliqué de façon fiable
  // dans une balise <video> (contrairement à <picture>), et le navigateur peut
  // retenir le mauvais fichier. La source est fixée une fois au montage : la
  // changer en cours de route relancerait la lecture depuis le début.
  useEffect(() => {
    const small = window.matchMedia('(max-width: 700px)').matches;
    setSource(asset(small ? '/media/hero-mobile.mp4' : '/media/hero.mp4'));
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !source) return;
    // Certains navigateurs refusent la lecture automatique même en muet
    // (économiseur de batterie iOS, réglage utilisateur) : l'affiche reste
    // alors affichée, ce qui est le seul repli acceptable.
    video.play().catch(() => undefined);
  }, [source]);

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

      {source && (
        <video
          ref={videoRef}
          src={source}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={asset('/media/hero-poster.webp')}
          aria-hidden="true"
          tabIndex={-1}
          onCanPlay={() => setReady(true)}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${
            ready ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Voile de lisibilité : garantit le contraste du logo et du CTA
          quel que soit le plan de la vidéo. */}
      <div className="u-hero-scrim absolute inset-0" />
      <div className="u-grain absolute inset-0 opacity-60" />
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { asset } from '@/lib/config';

/**
 * Fond vidéo du hero.
 *
 * La vidéo est chargée et jouée dans tous les cas, sans condition : c'est une
 * demande explicite du studio, la vidéo fait partie de l'identité du premier
 * écran.
 *
 * AUCUN CONTRÔLE, AUCUNE INTERACTION (demande client). Le mode économie
 * d'énergie d'iOS interdit toute lecture automatique, sur tous les sites :
 * aucune page ne peut passer outre. Safari affiche alors un bouton « lecture »
 * sur la vidéo. Pour qu'il n'apparaisse jamais :
 *   - la vidéo reste invisible tant qu'elle ne joue pas réellement (événement
 *     `playing`, et non `canplay`) : on voit l'affiche, image fixe identique à
 *     la première image de la boucle ;
 *   - le bouton natif de WebKit est masqué en CSS (`.u-hero-video`) ;
 *   - la vidéo ne reçoit aucun clic ni tap (`pointer-events: none`) ;
 *   - la lecture est relancée au premier contact avec la page (tap, défilement
 *     au doigt, clic, touche) : iOS l'autorise dès que l'utilisateur interagit.
 *
 * Deux fichiers : la version paysage 1920×1080 (2,9 Mo) et, pour les
 * téléphones tenus en portrait, une version recadrée en portrait 3:4 au centre
 * (540×720, 0,8 Mo). `object-fit: cover` n'affiche de toute façon que le centre
 * de l'image sur un écran vertical : la recadrer à l'encodage garde exactement
 * ce qui est visible, en plus net et plus léger. Un téléphone en paysage reçoit
 * la version paysage, qu'il afficherait sinon étirée.
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
    const small = window.matchMedia('(max-width: 700px) and (orientation: portrait)').matches;
    setSource(asset(small ? '/media/hero-mobile.mp4' : '/media/hero.mp4'));
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !source) return;
    const tryPlay = () => {
      if (video.paused) video.play().catch(() => undefined);
    };
    tryPlay();
    // Lecture refusée (économie d'énergie iOS, réglage utilisateur) : nouvel
    // essai au premier geste sur la page, n'importe où. Les écouteurs sont
    // passifs et retirés dès que la vidéo joue.
    const events = ['touchend', 'pointerdown', 'click', 'keydown', 'scroll'] as const;
    events.forEach((e) => window.addEventListener(e, tryPlay, { passive: true }));
    const stop = () => events.forEach((e) => window.removeEventListener(e, tryPlay));
    video.addEventListener('playing', stop);
    // Retour sur l'onglet : iOS met la vidéo en pause en arrière-plan.
    const onVisible = () => document.visibilityState === 'visible' && tryPlay();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stop();
      video.removeEventListener('playing', stop);
      document.removeEventListener('visibilitychange', onVisible);
    };
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
          controls={false}
          disablePictureInPicture
          disableRemotePlayback
          aria-hidden="true"
          tabIndex={-1}
          onPlaying={() => setReady(true)}
          className={`u-hero-video absolute inset-0 size-full object-cover transition-opacity duration-700 ${
            ready ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Voile de lisibilité : garantit le contraste du logo et du CTA
          quel que soit le plan de la vidéo. Pas de texture de grain ici : en
          mode `overlay` sur une vraie vidéo, elle délavait l'image en un voile
          laiteux (retour client). */}
      <div className="u-hero-scrim absolute inset-0" />
    </div>
  );
}

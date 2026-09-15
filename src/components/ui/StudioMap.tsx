'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { asset, STUDIO } from '@/lib/config';

/**
 * Carte interactive du studio.
 *
 * Choix techniques et leurs raisons :
 *
 * - **Leaflet + tuiles OpenStreetMap**, plutôt que Google Maps. Google dépose
 *   des cookies et transmet des données à des fins publicitaires : il faudrait
 *   le conditionner au consentement, et la carte resterait grise pour qui
 *   refuse. OpenStreetMap ne dépose aucun cookie, la carte s'affiche donc pour
 *   tout le monde, et la promesse faite dans la politique de confidentialité
 *   (aucun traceur tiers) reste tenue.
 * - **Chargement paresseux** : la bibliothèque (~42 Ko compressés) et les
 *   tuiles ne sont demandées qu'à l'approche de la carte dans le viewport.
 *   Elles ne pèsent rien sur le chargement initial de la page.
 * - **Zoom à la molette uniquement avec Ctrl (ou ⌘)**, comme sur Google Maps.
 *   Une molette nue au-dessus d'une carte qui zoome au lieu de laisser la page
 *   descendre est le défaut le plus agaçant des cartes intégrées : ici, le
 *   défilement de la page n'est jamais capturé. Sur trackpad macOS, le
 *   pincement envoie justement des événements avec Ctrl : le geste naturel
 *   fonctionne donc sans rien apprendre. Déplacement au glisser, double-clic,
 *   boutons +/− et clavier restent disponibles sans modificateur.
 * - **Repli** : si les tuiles ne chargent pas (réseau filtré, serveur
 *   indisponible), un visuel de secours et l'adresse en clair prennent la
 *   place. On ne laisse jamais un rectangle gris.
 */

const { address, coordinates } = STUDIO;
const FULL_ADDRESS = `${address.street}, ${address.postalCode} ${address.city}`;

/** Itinéraire : Google Maps reste ce que la plupart des gens ouvrent. */
const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  `${FULL_ADDRESS}, ${address.country}`,
)}`;
const OSM_URL = `https://www.openstreetmap.org/?mlat=${coordinates.lat}&mlon=${coordinates.lon}#map=${coordinates.zoom}/${coordinates.lat}/${coordinates.lon}`;

export function StudioMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const wheelCleanup = useRef<(() => void) | null>(null);
  const nudgeTimer = useRef<number | undefined>(undefined);
  /**
   * Deux états distincts, et c'est volontaire : `shouldLoad` déclenche la
   * construction une seule fois, `status` ne fait que décrire le résultat.
   * Les mélanger casserait tout — l'effet de construction dépendrait alors
   * d'une valeur qu'il modifie lui-même, et détruirait la carte à la première
   * tuile chargée.
   */
  const [shouldLoad, setShouldLoad] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ready' | 'failed'>('idle');
  /** Passe à `true` le temps de rappeler qu'il faut Ctrl pour zoomer. */
  const [nudge, setNudge] = useState(false);

  /* --- On ne charge la carte qu'à son approche --------------------------- */
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /* --- Construction de la carte ------------------------------------------ */
  useEffect(() => {
    if (!shouldLoad || mapRef.current) return;
    let cancelled = false;

    (async () => {
      const L = await import('leaflet');
      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [coordinates.lat, coordinates.lon],
        zoom: coordinates.zoom,
        // Voir la note en tête de fichier : le défilement de la page prime.
        scrollWheelZoom: false,
        zoomControl: true,
        attributionControl: true,
      });
      mapRef.current = map;

      const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        // Attribution obligatoire : les données OpenStreetMap sont sous ODbL.
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      });

      // Si aucune tuile n'arrive, on bascule sur le repli plutôt que de laisser
      // un rectangle vide.
      let loaded = false;
      tiles.on('tileload', () => {
        loaded = true;
        if (!cancelled) setStatus('ready');
      });
      tiles.on('tileerror', () => {
        if (!loaded && !cancelled) setStatus('failed');
      });
      window.setTimeout(() => {
        if (!loaded && !cancelled) setStatus((s) => (s === 'ready' ? s : 'failed'));
      }, 8000);

      tiles.addTo(map);

      // Marqueur dessiné en HTML plutôt qu'en image : il porte le monogramme de
      // la marque, et cela évite au passage le problème classique du chemin
      // d'icône par défaut de Leaflet cassé par les empaqueteurs.
      // La taille de l'image est posée en style en ligne : Leaflet impose un
      // `width: auto` sur les images de son calque de marqueurs, et une règle
      // en ligne est le seul moyen simple de passer devant à coup sûr.
      const icon = L.divIcon({
        className: '',
        html: `
          <span class="u-map-pin">
            <span class="u-map-pin__ring"></span>
            <img src="${asset('/brand/monogram-orange.webp')}" alt="" width="30" height="29"
                 style="width:30px;height:auto" />
          </span>`,
        iconSize: [46, 46],
        iconAnchor: [23, 23],
        popupAnchor: [0, -20],
      });

      L.marker([coordinates.lat, coordinates.lon], { icon, title: STUDIO.name, keyboard: true })
        .addTo(map)
        .bindPopup(
          `<strong>${STUDIO.name}</strong><br>${address.street}<br>${address.postalCode} ${address.city}`,
        );

      // Molette : on zoome seulement si Ctrl (ou ⌘) est enfoncé. Sinon on ne
      // touche à rien et la page défile comme partout ailleurs.
      // `passive: false` est indispensable : sans cela le navigateur refuse le
      // `preventDefault()` qui empêche le zoom de la page entière.
      const onWheel = (event: WheelEvent) => {
        if (!(event.ctrlKey || event.metaKey)) {
          setNudge(true);
          window.clearTimeout(nudgeTimer.current);
          nudgeTimer.current = window.setTimeout(() => setNudge(false), 1600);
          return;
        }
        event.preventDefault();
        const around = map.containerPointToLatLng(map.mouseEventToContainerPoint(event));
        map.setZoomAround(around, map.getZoom() + (event.deltaY < 0 ? 0.6 : -0.6));
      };
      map.getContainer().addEventListener('wheel', onWheel, { passive: false });
      wheelCleanup.current = () => map.getContainer().removeEventListener('wheel', onWheel);
    })();

    return () => {
      cancelled = true;
      wheelCleanup.current?.();
      window.clearTimeout(nudgeTimer.current);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [shouldLoad]);

  const recenter = useCallback(() => {
    mapRef.current?.flyTo([coordinates.lat, coordinates.lon], coordinates.zoom, { duration: 0.8 });
  }, []);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="relative overflow-hidden rounded-[1.5rem] border-2 border-anthracite/12">
        {/* Conteneur de la carte. `aria-label` plutôt qu'un rôle applicatif :
            la carte est un complément, l'adresse reste lisible juste à côté. */}
        <div
          ref={containerRef}
          role="application"
          aria-label={`Carte de localisation du studio, ${FULL_ADDRESS}`}
          className="u-map aspect-[16/11] w-full bg-creme-dim sm:aspect-[16/9]"
        />

        {/* Repli : réseau filtré, serveur de tuiles injoignable… */}
        {status === 'failed' && (
          <div className="absolute inset-0 grid place-items-center">
            <img
              src={asset('/media/studio-accueil.webp')}
              alt=""
              width={1600}
              height={1100}
              className="absolute inset-0 size-full object-cover"
            />
            <div className="relative flex flex-col items-center gap-3 bg-anthracite/70 p-6 text-center text-creme backdrop-blur-sm">
              <p className="font-display text-[length:var(--text-xl)] leading-none">Carte indisponible</p>
              <p className="max-w-[28ch] text-[length:var(--text-sm)] leading-relaxed text-creme/80">
                {address.street}
                <br />
                {address.postalCode} {address.city}
              </p>
              <a
                href={OSM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[length:var(--text-sm)] font-semibold text-orange underline-offset-4 hover:underline"
              >
                Ouvrir dans OpenStreetMap
              </a>
            </div>
          </div>
        )}

        {/* Mode d'emploi discret, qui s'illumine si l'on tourne la molette
            sans modificateur. */}
        {status === 'ready' && (
          <p
            aria-hidden="true"
            className={[
              'pointer-events-none absolute inset-x-0 bottom-0 z-[500] hidden px-4 pb-3 pt-8 text-center',
              'text-[length:var(--text-xs)] font-medium transition-all duration-300 sm:block',
              nudge
                ? 'bg-gradient-to-t from-anthracite/90 to-transparent text-creme'
                : 'bg-gradient-to-t from-anthracite/55 to-transparent text-creme/75',
            ].join(' ')}
          >
            Glissez pour vous déplacer · <kbd className="font-sans font-bold">Ctrl</kbd> + molette pour zoomer
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <a
          href={DIRECTIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-anthracite px-5 text-[length:var(--text-sm)] font-semibold text-creme no-underline transition-colors hover:bg-anthracite-700"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true" className="size-4">
            <path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" strokeLinejoin="round" />
            <circle cx="12" cy="10" r="2.6" />
          </svg>
          Itinéraire
        </a>

        {status === 'ready' && (
          <button
            type="button"
            onClick={recenter}
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-[length:var(--text-sm)] font-semibold text-anthracite/60 transition-colors hover:text-orange"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true" className="size-4">
              <circle cx="12" cy="12" r="7.5" />
              <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" strokeLinecap="round" />
            </svg>
            Recentrer
          </button>
        )}
      </div>
    </div>
  );
}

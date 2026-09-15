'use client';

import { type ElementType, type ReactNode, useEffect, useRef, useState } from 'react';

/**
 * Révélation à l'entrée dans le viewport.
 *
 * Volontairement en CSS + IntersectionObserver plutôt qu'en JavaScript animé :
 * le navigateur compose la transition sur le GPU, ce qui reste fluide même sur
 * un mobile d'entrée de gamme avec la vidéo du hero en lecture.
 *
 * La révélation s'applique à tous les visiteurs, sans exception liée aux
 * préférences système : voir la note en fin de globals.css.
 */
export function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  distance = 26,
  className = '',
  once = true,
}: {
  children: ReactNode;
  as?: ElementType;
  /** Décalage en millisecondes, pour créer un effet de cascade. */
  delay?: number;
  /** Amplitude du déplacement vertical, en pixels. */
  distance?: number;
  className?: string;
  once?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Sécurité : si l'observateur n'est pas disponible, on affiche le contenu.
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      // Déclenche un peu avant l'arrivée à l'écran : le contenu est déjà en
      // place quand l'utilisateur le regarde.
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once]);

  return (
    <Tag
      ref={ref}
      className={`${visible ? 'is-revealed' : ''} ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : `translate3d(0, ${distance}px, 0)`,
        transition: `opacity 0.75s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.75s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
        willChange: visible ? 'auto' : 'opacity, transform',
      }}
    >
      {children}
    </Tag>
  );
}

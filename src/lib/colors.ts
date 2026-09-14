import type { BrandColor } from './types';

/**
 * Correspondance couleur de marque → classes utilitaires.
 *
 * Tailwind analyse le code source de façon statique : une classe construite
 * dynamiquement (`bg-${color}`) ne serait jamais générée. D'où cette table
 * explicite, qui reste la seule façon fiable de colorer un composant à partir
 * d'une donnée.
 */
export const COLOR_CLASSES: Record<
  BrandColor,
  { solid: string; text: string; border: string; soft: string; dot: string; gradient: string }
> = {
  orange: {
    solid: 'bg-orange text-creme',
    text: 'text-orange',
    border: 'border-orange',
    soft: 'bg-orange/12',
    dot: 'bg-orange',
    gradient: 'from-orange/25 to-orange/0',
  },
  jade: {
    solid: 'bg-jade text-creme',
    text: 'text-jade',
    border: 'border-jade',
    soft: 'bg-jade/12',
    dot: 'bg-jade',
    gradient: 'from-jade/25 to-jade/0',
  },
  ciel: {
    solid: 'bg-ciel text-anthracite',
    text: 'text-ciel',
    border: 'border-ciel',
    soft: 'bg-ciel/15',
    dot: 'bg-ciel',
    gradient: 'from-ciel/25 to-ciel/0',
  },
  brun: {
    solid: 'bg-brun text-creme',
    text: 'text-brun',
    border: 'border-brun',
    soft: 'bg-brun/12',
    dot: 'bg-brun',
    gradient: 'from-brun/25 to-brun/0',
  },
};

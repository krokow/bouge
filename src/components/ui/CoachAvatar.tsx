import { asset } from '@/lib/config';
import { COLOR_CLASSES } from '@/lib/colors';
import type { Coach } from '@/lib/types';

/** Initiales du coach, repli quand aucune photo n'est fournie. */
export function coachInitials(coach: Coach): string {
  return `${coach.firstName.charAt(0)}${coach.lastName.charAt(0)}`.toUpperCase();
}

/**
 * Photo de profil d'un coach.
 *
 * Un coach ajouté depuis l'espace gérant n'a pas de photo tant que personne
 * n'en dépose une : ses initiales s'affichent alors sur sa couleur. Le studio
 * peut donc constituer son équipe sans attendre la séance photo, et le site ne
 * montre jamais de cadre vide ni d'image cassée.
 */
export function CoachAvatar({
  coach,
  size = 'md',
  className = '',
}: {
  coach: Coach;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = {
    sm: 'size-10 text-[length:var(--text-xs)]',
    md: 'size-14 text-[length:var(--text-base)]',
    lg: 'size-20 text-[length:var(--text-2xl)]',
  } as const;

  const shared = `shrink-0 overflow-hidden rounded-full object-cover ${sizes[size]} ${className}`;

  if (coach.photo) {
    return (
      <img
        src={asset(coach.photo)}
        alt={`${coach.firstName} ${coach.lastName}`}
        width={360}
        height={360}
        loading="lazy"
        decoding="async"
        className={shared}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`flex items-center justify-center font-display leading-none ${COLOR_CLASSES[coach.color].solid} ${shared}`}
    >
      {coachInitials(coach)}
    </span>
  );
}

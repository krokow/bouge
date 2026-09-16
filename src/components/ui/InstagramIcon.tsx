/**
 * Glyphe Instagram.
 *
 * Dessiné à la main plutôt qu'importé d'une bibliothèque d'icônes : c'est le
 * seul logo de marque tierce du site, et il sert à quatre endroits. Il hérite
 * de `currentColor`, donc il prend la couleur du texte qui l'entoure.
 */
export function InstagramIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

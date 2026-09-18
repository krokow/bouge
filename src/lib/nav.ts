/** Architecture de navigation du site — source unique pour la navbar et le pied de page. */

import type { UserRole } from './types';

export interface NavItem {
  href: string;
  label: string;
  /** Repère visuel « bientôt disponible ». */
  soon?: boolean;
}

export const MAIN_NAV: NavItem[] = [
  { href: '/offres/', label: 'Nos offres' },
  { href: '/studio/', label: 'Le studio' },
  { href: '/osteopathie/', label: 'Ostéopathie', soon: true },
  { href: '/a-propos/', label: 'À propos' },
  { href: '/contact/', label: 'Contact' },
];

export const LEGAL_NAV: NavItem[] = [
  { href: '/mentions-legales/', label: 'Mentions légales' },
  { href: '/cgv/', label: 'CGV' },
  { href: '/confidentialite/', label: 'Politique de confidentialité' },
];

export const BOOKING_HREF = '/reserver/';
export const ACCOUNT_HREF = '/compte/';
export const LOGIN_HREF = '/connexion/';
export const ADMIN_HREF = '/admin/';

/**
 * Où mène « mon compte », et comment le lien s'appelle, selon le rôle.
 *
 * Une seule source de vérité, volontairement. Trois écrans posaient chacun la
 * même question à leur façon (`role === 'admin' ? … : …`), si bien que
 * l'apparition du rôle `coach` a suffi à les désaccorder : la barre de
 * navigation envoyait les coachs vers l'espace client, où ils ne trouvaient
 * évidemment rien. Ajouter un rôle ne doit pas obliger à retrouver tous les
 * endroits qui en dépendent.
 *
 * La règle est écrite « à l'envers » : seul le client va dans l'espace client,
 * tout le reste va dans l'espace de gestion. Un nouveau rôle de gestion sera
 * donc correctement orienté sans qu'on y pense.
 */
export function workspaceFor(role: UserRole | undefined): { href: string; label: string } {
  if (!role) return { href: LOGIN_HREF, label: 'Se connecter' };
  return role === 'client'
    ? { href: ACCOUNT_HREF, label: 'Mon espace' }
    : { href: ADMIN_HREF, label: 'Tableau de bord' };
}

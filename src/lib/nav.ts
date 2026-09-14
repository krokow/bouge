/** Architecture de navigation du site — source unique pour la navbar et le pied de page. */

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

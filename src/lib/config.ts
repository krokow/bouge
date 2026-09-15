import type { ScheduleConfig } from './types';

/**
 * Paramètres du studio.
 *
 * Le nom du coach, l'adresse et le téléphone sont les informations réelles,
 * communiquées par le studio. Les accès (transports) restent à confirmer :
 * voir docs/CONTENU.md.
 */
export const STUDIO = {
  name: 'BOUGE.',
  legalName: 'BOUGE. Studio',
  baseline: 'SPORT ET BIEN PLUS.',
  slogan: 'Bougez. Rencontrez. Recommencez.',
  claim: 'BE READY FOR IT!',
  since: 2026,
  coach: {
    firstName: 'Melvin',
    lastName: 'Maillot',
    fullName: 'Melvin Maillot',
    role: 'Coach sportif diplômé STAPS',
    years: 10,
  },
  address: {
    street: '8 rue Albert Simonin',
    postalCode: '92400',
    city: 'Courbevoie',
    country: 'France',
  },
  /**
   * Position du marqueur sur la carte de la page Contact.
   *
   * ⚠️ À VÉRIFIER — ces coordonnées n'ont pas pu être géocodées automatiquement
   * et pointent sur le quartier, pas encore sur le numéro exact.
   *
   * Pour les corriger en dix secondes : ouvrir Google Maps, clic droit sur la
   * porte du studio, cliquer sur les chiffres qui s'affichent en haut du menu
   * (ils sont copiés), puis les coller ci-dessous dans l'ordre lat / lon.
   */
  coordinates: {
    lat: 48.8975,
    lon: 2.2555,
    /** Niveau de zoom initial : 17 ≈ l'échelle d'une rue. */
    zoom: 17,
    verified: false,
  },
  phone: '06 74 90 08 02',
  phoneHref: '+33674900802',
  email: 'bonjour@bouge-studio.fr',
  instagram: 'https://instagram.com/bouge.studio',
  /**
   * Transports à proximité, affichés sur la page Contact.
   * ⚠️ Temps de trajet à vérifier sur place avant la mise en ligne.
   */
  access: [
    { label: 'Transilien L — Courbevoie', detail: 'à quelques minutes à pied' },
    { label: 'Ligne 1 — Esplanade de La Défense', detail: 'à une dizaine de minutes' },
    { label: 'Stationnement', detail: 'places en voirie dans la rue' },
  ],
} as const;

/** Horaires affichés au public (dérivés de SCHEDULE, tenus synchronisés). */
export const OPENING_HOURS = [
  { days: 'Lundi — Vendredi', hours: '07h00 — 21h00' },
  { days: 'Samedi', hours: '09h00 — 14h00' },
  { days: 'Dimanche', hours: 'Fermé' },
] as const;

/**
 * Grille de créneaux du studio.
 * Une seule source de vérité : le tunnel de réservation ET l'espace admin
 * calculent leurs créneaux à partir de cet objet.
 */
export const SCHEDULE: ScheduleConfig = {
  slotMinutes: 60,
  openings: [
    { weekday: 1, start: '07:00', end: '21:00' }, // lundi
    { weekday: 2, start: '07:00', end: '21:00' },
    { weekday: 3, start: '07:00', end: '21:00' },
    { weekday: 4, start: '07:00', end: '21:00' },
    { weekday: 5, start: '07:00', end: '21:00' }, // vendredi
    { weekday: 6, start: '09:00', end: '14:00' }, // samedi
    // Dimanche : fermé (absent de la liste).
  ],
  closedDates: [],
  bookingHorizonDays: 60,
  minNoticeHours: 2,
  cancellationNoticeHours: 24,
  reminderHoursBefore: 24,
};

/** Compte administrateur unique (le gérant). Démo : identifiants en clair. */
export const ADMIN_ACCOUNT = {
  email: 'melvin@bouge-studio.fr',
  password: 'bouge2026',
} as const;

/** Nombre maximum de participants par séance, toutes offres confondues. */
export const MAX_PARTICIPANTS = 3;

export const SITE = {
  /** Utilisé pour les métadonnées Open Graph. Remplacer par le domaine final. */
  url: 'https://bouge-studio.fr',
  locale: 'fr_FR',
  timeZone: 'Europe/Paris',
} as const;

/**
 * Préfixe d'URL quand le site est servi depuis un sous-répertoire
 * (GitLab Pages / GitHub Pages). Injecté au build par `NEXT_PUBLIC_BASE_PATH`.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** Préfixe un chemin de fichier statique (`/brand/logo.webp` → `/bouge/brand/logo.webp`). */
export function asset(path: string): string {
  return `${BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`;
}

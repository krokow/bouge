import type { ScheduleConfig } from './types';

/**
 * Paramètres du studio.
 *
 * ⚠️ AVANT MISE EN LIGNE — tout ce bloc est du contenu de démonstration.
 * Les coordonnées, le numéro de téléphone (plage 01 99 00 XX XX réservée à la
 * fiction par l'ARCEP, elle ne sonne donc chez personne) et l'adresse doivent
 * être remplacés par les informations réelles du studio.
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
    role: 'Coach sportif diplômé STAPS',
    years: 10,
  },
  address: {
    street: '18 rue de l’Industrie',
    postalCode: '92400',
    city: 'Courbevoie',
    country: 'France',
  },
  phone: '01 99 00 14 25',
  phoneHref: '+33199001425',
  email: 'bonjour@bouge-studio.fr',
  instagram: 'https://instagram.com/bouge.studio',
  /** Transports à proximité, affichés sur la page Contact. */
  access: [
    { label: 'Ligne 1 — Esplanade de La Défense', detail: '8 min à pied' },
    { label: 'Transilien L — Courbevoie', detail: '6 min à pied' },
    { label: 'Bus 275 / 178 — arrêt Industrie', detail: 'au pied du studio' },
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

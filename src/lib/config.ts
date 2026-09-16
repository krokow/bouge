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

/**
 * Réseaux sociaux.
 *
 * Le compte Instagram est celui de Melvin, pas celui du studio : c'est lui qui
 * porte l'audience, et le studio n'a pas encore de compte propre. Si BOUGE.
 * ouvre le sien un jour, il suffira d'ajouter une seconde entrée ici — rien
 * d'autre dans le site ne code en dur le pseudonyme ni l'adresse.
 *
 * `followers` est saisi à la main, volontairement. Le nombre d'abonnés se lit
 * bien par l'API Instagram (champ `followers_count`), mais cela suppose un
 * compte professionnel, une application Meta et un jeton renouvelé côté
 * serveur : beaucoup de fragilité pour un seul chiffre. On l'affiche donc
 * arrondi et précédé d'un « + », formulation qui reste vraie tant que le
 * compte grossit. À relire de temps en temps.
 */
export const SOCIAL = {
  instagram: {
    /** Sans l'arobase : elle est ajoutée à l'affichage. */
    handle: 'melvinmaillot',
    url: 'https://www.instagram.com/melvinmaillot/',
    /** Ordre de grandeur, pas un compteur. Voir le commentaire ci-dessus. */
    followers: 60_000,
    followersLabel: '60 K',
    /** Passe à `true` le jour où le chiffre vient réellement de l'API. */
    live: false,
  },
} as const;

/** Adresse du profil Instagram, raccourci utilisé un peu partout. */
export const INSTAGRAM_URL = SOCIAL.instagram.url;

/** Pseudonyme précédé de son arobase, tel qu'il s'affiche. */
export const INSTAGRAM_HANDLE = `@${SOCIAL.instagram.handle}`;

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

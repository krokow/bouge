/**
 * Modèle de données BOUGE.
 *
 * ⚠️ MIGRATION BACKEND — à lire avant de brancher une vraie base de données.
 * Ces types sont volontairement écrits comme un schéma de base relationnelle :
 *   - identifiants opaques (string) plutôt que des index de tableau ;
 *   - dates en ISO 8601 (`YYYY-MM-DD`) et heures en `HH:mm`, jamais d'objet Date
 *     sérialisé, pour éviter tout décalage de fuseau entre client et serveur ;
 *   - montants en centimes (entiers) : aucun arrondi flottant sur les prix ;
 *   - aucune donnée dérivée stockée (le statut « passé/à venir » est calculé).
 * Un `CREATE TABLE` se déduit directement de chaque interface.
 */

/** Date civile au format `YYYY-MM-DD` (fuseau du studio, Europe/Paris). */
export type IsoDate = string;
/** Heure locale au format `HH:mm` sur 24 h. */
export type Time = string;
/** Horodatage ISO 8601 complet, UTC. */
export type Timestamp = string;

/* -------------------------------------------------------------------------- */
/* Offres                                                                      */
/* -------------------------------------------------------------------------- */

export type OfferId = 'decouverte' | 'individuel' | 'petit-comite' | 'abonnement';

export type BrandColor = 'orange' | 'jade' | 'ciel' | 'brun';

export interface Offer {
  id: OfferId;
  name: string;
  /** Accroche courte affichée sous le nom. */
  tagline: string;
  description: string;
  /** Durée d'un créneau, en minutes. */
  durationMin: number;
  minParticipants: number;
  /** Jamais plus de 3 : c'est la promesse du studio. */
  maxParticipants: number;
  /** Prix par personne, en centimes. */
  pricePerPersonCents: number;
  /** Mention affichée à côté du prix (« la séance », « par mois »…). */
  priceUnit: string;
  /** Nombre de séances incluses, pour les formules d'abonnement. */
  sessionsIncluded?: number;
  highlights: string[];
  /** Pour qui cette offre est-elle pensée. */
  audience: string;
  color: BrandColor;
  featured?: boolean;
  /** `false` pour une offre présentée mais pas encore réservable (ostéopathie). */
  bookable: boolean;
}

/* -------------------------------------------------------------------------- */
/* Planning                                                                    */
/* -------------------------------------------------------------------------- */

/** 0 = dimanche … 6 = samedi (aligné sur `Date.prototype.getDay`). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface WeeklyOpening {
  weekday: Weekday;
  /** Heure du premier créneau. */
  start: Time;
  /** Heure de fin du dernier créneau. */
  end: Time;
}

export interface ScheduleConfig {
  /** Pas de la grille de créneaux, en minutes. */
  slotMinutes: number;
  openings: WeeklyOpening[];
  /** Fermetures annuelles connues (fériés, congés). */
  closedDates: IsoDate[];
  /** Horizon de réservation ouvert au public, en jours. */
  bookingHorizonDays: number;
  /** Délai minimum entre la réservation et la séance, en heures. */
  minNoticeHours: number;
  /** Au-delà de ce délai avant la séance, l'annulation en ligne est libre. */
  cancellationNoticeHours: number;
  /** Rappel automatique envoyé N heures avant la séance. */
  reminderHoursBefore: number;
}

/* -------------------------------------------------------------------------- */
/* Comptes                                                                     */
/* -------------------------------------------------------------------------- */

export type UserRole = 'client' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  /** Consentement explicite à la communication marketing (RGPD, art. 6.1.a). */
  marketingOptIn: boolean;
  createdAt: Timestamp;
}

/**
 * Enregistrement d'authentification, séparé du profil.
 *
 * ⚠️ DÉMO UNIQUEMENT : `passwordDigest` est produit par une fonction de hachage
 * non cryptographique, côté navigateur. En production le mot de passe ne doit
 * jamais transiter ni être vérifié côté client : hachage serveur avec Argon2id
 * ou bcrypt (coût ≥ 12), et session par cookie httpOnly + SameSite=Lax.
 */
export interface Credential {
  userId: string;
  email: string;
  passwordDigest: string;
}

export interface Session {
  userId: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

/* -------------------------------------------------------------------------- */
/* Réservations                                                                */
/* -------------------------------------------------------------------------- */

export type BookingStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type PaymentMethod = 'onsite' | 'online';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface Payment {
  method: PaymentMethod;
  status: PaymentStatus;
  /** Montant total de la réservation, en centimes. */
  amountCents: number;
  /** Renseigné uniquement pour un paiement en ligne. */
  cardLast4?: string;
  paidAt?: Timestamp;
  /**
   * En production : identifiant Stripe (`pi_...`) renvoyé par le PaymentIntent.
   * Laissé vide en démo, aucune transaction réelle n'est effectuée.
   */
  providerReference?: string;
}

export interface Booking {
  id: string;
  /** Référence lisible communiquée au client (ex. « BG-4F2K »). */
  reference: string;
  userId: string;
  offerId: OfferId;
  participants: number;
  date: IsoDate;
  startTime: Time;
  endTime: Time;
  status: BookingStatus;
  payment: Payment;
  /** Prénoms des accompagnants, saisis par le client. */
  guestNames: string[];
  /** Objectif ou information utile transmise au coach. */
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  cancelledAt?: Timestamp;
  cancelledBy?: 'client' | 'studio';
}

/* -------------------------------------------------------------------------- */
/* Indisponibilités du coach                                                   */
/* -------------------------------------------------------------------------- */

export type BlockType = 'day' | 'week' | 'range' | 'slot';

export interface Block {
  id: string;
  type: BlockType;
  /** Premier jour bloqué (inclus). */
  startDate: IsoDate;
  /** Dernier jour bloqué (inclus). Égal à `startDate` pour un blocage d'un jour. */
  endDate: IsoDate;
  /** Renseignés uniquement pour `type: 'slot'` : plage horaire bloquée. */
  startTime?: Time;
  endTime?: Time;
  reason: string;
  createdAt: Timestamp;
}

/* -------------------------------------------------------------------------- */
/* Emails transactionnels (simulés)                                            */
/* -------------------------------------------------------------------------- */

export type EmailKind = 'welcome' | 'confirmation' | 'reminder' | 'cancellation' | 'reschedule';

/**
 * En démo, les emails sont écrits dans la « boîte d'envoi » locale et visibles
 * depuis l'espace admin. En production : file d'attente côté serveur envoyée
 * par un service transactionnel (Brevo, Postmark, SES…).
 */
export interface EmailMessage {
  id: string;
  kind: EmailKind;
  to: string;
  subject: string;
  body: string;
  bookingId?: string;
  createdAt: Timestamp;
  /** Pour un rappel : date d'envoi programmée. */
  scheduledFor?: Timestamp;
  status: 'queued' | 'sent';
}

/* -------------------------------------------------------------------------- */
/* Vues calculées                                                              */
/* -------------------------------------------------------------------------- */

export type SlotState = 'available' | 'booked' | 'blocked' | 'past' | 'closed';

export interface Slot {
  date: IsoDate;
  startTime: Time;
  endTime: Time;
  state: SlotState;
  /** Réservation occupant le créneau, le cas échéant. */
  bookingId?: string;
  /** Blocage rendant le créneau indisponible, le cas échéant. */
  blockId?: string;
}

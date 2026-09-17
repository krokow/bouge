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

/**
 * `admin` est le gérant : Melvin. Il voit et gère tout le studio.
 * `coach` est un intervenant : il ne voit que sa propre activité.
 * `client` réserve des séances.
 */
export type UserRole = 'client' | 'coach' | 'admin';

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
/* Étendue d'une plage : partagée par les affectations et les indisponibilités */
/* -------------------------------------------------------------------------- */

export type BlockType = 'day' | 'week' | 'range' | 'slot';

/* -------------------------------------------------------------------------- */
/* Coachs                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Un intervenant du studio.
 *
 * Le studio n'a qu'une salle : deux séances ne peuvent pas avoir lieu en même
 * temps. Un coach ne possède donc pas son propre planning — il y a un seul
 * planning, celui du studio, et une affectation (`Assignment`) désigne qui
 * l'assure sur telle plage. Par défaut, c'est le titulaire.
 */
export interface Coach {
  id: string;
  /** Compte de connexion associé, pour l'accès au back-office. */
  userId: string;
  firstName: string;
  lastName: string;
  /** Identifiant lisible utilisé dans les adresses (« melvin-maillot »). */
  slug: string;
  /** Intitulé affiché sous le nom (« Coach diplômé STAPS »). */
  role: string;
  /** Présentation courte, affichée sur le site et dans le tunnel. */
  bio: string;
  /** Deux ou trois spécialités, affichées en étiquettes. */
  specialties: string[];
  /** Chemin de la photo de profil, relatif à la racine publique. */
  photo: string;
  /** Couleur de marque associée, pour le repérer d'un coup d'œil. */
  color: BrandColor;
  /**
   * Le titulaire du studio. Il assure tous les créneaux qui ne sont pas
   * affectés à quelqu'un d'autre, et il est seul à pouvoir gérer l'équipe.
   * Un seul coach porte ce drapeau.
   */
  owner: boolean;
  /** Un coach désactivé n'est plus proposé à la réservation, mais son
   *  historique et ses séances à venir sont conservés. */
  active: boolean;
  createdAt: Timestamp;
}

/**
 * « Sur cette plage, c'est untel qui coache. »
 *
 * Même vocabulaire que les indisponibilités (`Block`) : un jour, une semaine,
 * une période ou un créneau précis. Ce qui n'est couvert par aucune
 * affectation revient au titulaire.
 *
 * En cas de chevauchement, la règle est écrite dans `resolveCoachId`
 * (src/lib/coaches.ts) : la plus précise gagne, puis la plus récente.
 */
export interface Assignment {
  id: string;
  coachId: string;
  type: BlockType;
  startDate: IsoDate;
  endDate: IsoDate;
  /** Renseignés uniquement pour `type: 'slot'`. */
  startTime?: Time;
  endTime?: Time;
  /** Mot du gérant, visible de lui seul (« remplacement congés »). */
  note?: string;
  createdAt: Timestamp;
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
  /** Coach qui assure la séance, figé à la réservation. */
  coachId: string;
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

export interface Block {
  id: string;
  /**
   * Absent : le studio entier est fermé, personne ne peut réserver.
   * Renseigné : seul ce coach est indisponible. Les créneaux qu'il aurait
   * assurés disparaissent ; les autres ne bougent pas.
   */
  coachId?: string;
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
  /** Coach qui assure ce créneau, d'après les affectations en vigueur. */
  coachId?: string;
}

'use client';

import { OFFERS_BY_ID } from '@/data/offers';
import { SCHEDULE, STUDIO } from '@/lib/config';
import { ANY_COACH, coachById, coachName, type CoachChoice, ownerCoach, resolveCoachId } from '@/lib/coaches';
import { isPastRun, placesLeft, RUN_CAPACITY, signupsForRun } from '@/lib/runs';
import { addMinutesToTime, formatLongDate, formatTime, toDateTime } from '@/lib/date';
import { formatPrice } from '@/lib/format';
import type {
  Assignment,
  Block,
  Booking,
  Coach,
  RunSignup,
  SocialRun,
  EmailKind,
  EmailMessage,
  IsoDate,
  OfferId,
  PaymentMethod,
  Time,
  User,
} from '@/lib/types';
import {
  DatabaseShape,
  DB_STORAGE_KEY,
  DB_VERSION,
  digestPassword,
  emptyDatabase,
  newId,
  newReference,
  slugify,
} from './schema';
import { createSeedDatabase } from './seed';

/**
 * Base de démonstration persistée dans le navigateur.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * MIGRATION VERS UN VRAI BACKEND
 * ────────────────────────────────────────────────────────────────────────────
 * Toutes les méthodes publiques sont `async` alors que rien ici ne l'exige :
 * c'est volontaire. Le jour de la bascule, il suffit de réécrire le corps de
 * chaque méthode en `fetch('/api/…')` — les composants React, qui `await`
 * déjà ces appels, n'ont pas une ligne à changer.
 *
 * Correspondance prévue :
 *   signUp / signIn / signOut  → POST /api/auth/{register,login,logout}
 *   listBookings               → GET  /api/bookings
 *   createBooking              → POST /api/bookings
 *   cancelBooking              → POST /api/bookings/:id/cancel
 *   rescheduleBooking          → POST /api/bookings/:id/reschedule
 *   createBlock / deleteBlock  → POST|DELETE /api/blocks
 *   addCoach / updateCoach     → POST|PATCH  /api/coaches
 *   assignCoach / unassign     → POST|DELETE /api/assignments
 *   createRun / cancelRun      → POST|DELETE /api/runs
 *   joinRun / leaveRun         → POST|DELETE /api/runs/:id/signups
 *   emails                     → file d'attente serveur (Brevo, Postmark, SES…)
 */
class BougeDatabase {
  private state: DatabaseShape = emptyDatabase();
  private listeners = new Set<() => void>();
  private hydrated = false;
  /** Instantané stable pour `useSyncExternalStore` (évite les boucles de rendu). */
  private snapshot: DatabaseShape = this.state;

  /* --- Cycle de vie ---------------------------------------------------- */

  private hydrate(): void {
    if (this.hydrated || typeof window === 'undefined') return;
    this.hydrated = true;
    try {
      const raw = window.localStorage.getItem(DB_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DatabaseShape;
        if (parsed.version === DB_VERSION) {
          this.state = parsed;
          this.snapshot = parsed;
          return;
        }
      }
    } catch {
      // localStorage indisponible (navigation privée, stockage bloqué) :
      // on repart sur un jeu de démonstration en mémoire.
    }
    this.state = createSeedDatabase();
    this.snapshot = this.state;
    this.persist();
  }

  private persist(): void {
    // Chaque écriture produit de NOUVELLES références de tableaux.
    // C'est indispensable : les composants mémoïsent leurs calculs sur
    // `state.bookings` ou `state.blocks`, et un tableau muté en place garderait
    // la même référence — l'écran ne se mettrait jamais à jour.
    this.snapshot = {
      ...this.state,
      users: [...this.state.users],
      credentials: [...this.state.credentials],
      coaches: [...this.state.coaches],
      assignments: [...this.state.assignments],
      bookings: [...this.state.bookings],
      blocks: [...this.state.blocks],
      runs: [...this.state.runs],
      runSignups: [...this.state.runSignups],
      emails: [...this.state.emails],
    };
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Quota dépassé ou stockage refusé : la démo continue en mémoire.
    }
  }

  private commit(): void {
    this.persist();
    this.listeners.forEach((fn) => fn());
  }

  /** Remet la démonstration à zéro (bouton dédié dans l'espace admin). */
  async reset(): Promise<void> {
    this.state = createSeedDatabase();
    this.commit();
  }

  /* --- Abonnement React ------------------------------------------------ */

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): DatabaseShape => {
    this.hydrate();
    return this.snapshot;
  };

  /** Rendu serveur (export statique) : base vide, l'hydratation se fait au client. */
  getServerSnapshot = (): DatabaseShape => emptyDatabase();

  /* --- Authentification ------------------------------------------------ */

  async currentUser(): Promise<User | null> {
    this.hydrate();
    const { session, users } = this.state;
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      this.state.session = null;
      this.commit();
      return null;
    }
    return users.find((u) => u.id === session.userId) ?? null;
  }

  async signUp(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    marketingOptIn?: boolean;
  }): Promise<User> {
    this.hydrate();
    const email = input.email.trim().toLowerCase();
    if (this.state.credentials.some((c) => c.email === email)) {
      throw new Error('Un compte existe déjà avec cette adresse email.');
    }
    const user: User = {
      id: newId('usr'),
      email,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phone: input.phone?.trim() || undefined,
      role: 'client',
      marketingOptIn: input.marketingOptIn ?? false,
      createdAt: new Date().toISOString(),
    };
    this.state.users = [...this.state.users, user];
    this.state.credentials = [
      ...this.state.credentials,
      { userId: user.id, email, passwordDigest: digestPassword(input.password) },
    ];
    this.openSession(user.id);
    this.queueEmail({
      kind: 'welcome',
      to: user.email,
      subject: `Bienvenue chez ${STUDIO.name}`,
      body:
        `Bonjour ${user.firstName},\n\n` +
        `Votre compte ${STUDIO.name} est créé. Vous pouvez désormais réserver vos séances en ligne, ` +
        `les reporter ou les annuler jusqu'à ${SCHEDULE.cancellationNoticeHours} h avant l'heure prévue.\n\n` +
        `À très vite au studio,\n${STUDIO.coach.firstName}`,
    });
    this.commit();
    return user;
  }

  async signIn(email: string, password: string): Promise<User> {
    this.hydrate();
    const normalized = email.trim().toLowerCase();
    const credential = this.state.credentials.find((c) => c.email === normalized);
    if (!credential || credential.passwordDigest !== digestPassword(password)) {
      // Message volontairement identique dans les deux cas : ne pas révéler
      // si l'adresse existe (recommandation CNIL / OWASP).
      throw new Error('Email ou mot de passe incorrect.');
    }
    const user = this.state.users.find((u) => u.id === credential.userId);
    if (!user) throw new Error('Compte introuvable.');
    this.openSession(user.id);
    this.commit();
    return user;
  }

  async signOut(): Promise<void> {
    this.hydrate();
    this.state.session = null;
    this.commit();
  }

  private openSession(userId: string): void {
    this.state.session = {
      userId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    };
  }

  async updateProfile(userId: string, patch: Partial<Pick<User, 'firstName' | 'lastName' | 'phone' | 'marketingOptIn'>>): Promise<void> {
    this.hydrate();
    this.state.users = this.state.users.map((u) => (u.id === userId ? { ...u, ...patch } : u));
    this.commit();
  }

  /** Suppression de compte — droit à l'effacement (RGPD, art. 17). */
  async deleteAccount(userId: string): Promise<void> {
    this.hydrate();
    this.state.users = this.state.users.filter((u) => u.id !== userId);
    this.state.credentials = this.state.credentials.filter((c) => c.userId !== userId);
    this.state.bookings = this.state.bookings.filter((b) => b.userId !== userId);
    this.state.runSignups = this.state.runSignups.filter((r) => r.userId !== userId);
    this.state.session = null;
    this.commit();
  }

  /* --- Réservations ---------------------------------------------------- */

  async createBooking(input: {
    userId: string;
    offerId: OfferId;
    participants: number;
    date: IsoDate;
    startTime: Time;
    /** Coach demandé, ou `ANY_COACH` si le client s'en remet au studio. */
    coachChoice?: CoachChoice;
    paymentMethod: PaymentMethod;
    cardLast4?: string;
    guestNames?: string[];
    notes?: string;
  }): Promise<Booking> {
    this.hydrate();
    const offer = OFFERS_BY_ID[input.offerId];
    if (!offer) throw new Error('Offre inconnue.');

    // Garde-fou serveur : on revérifie que le créneau est libre au moment du
    // paiement, et pas seulement au moment de l'affichage.
    const taken = this.state.bookings.some(
      (b) => b.date === input.date && b.startTime === input.startTime && b.status !== 'cancelled',
    );
    if (taken) throw new Error('Ce créneau vient d’être réservé. Merci d’en choisir un autre.');

    // Le coach est figé maintenant, pas recalculé à l'affichage : si le gérant
    // change ses affectations demain, les séances déjà vendues gardent le
    // coach annoncé au client.
    const endTime = addMinutesToTime(input.startTime, offer.durationMin);
    const scheduled = resolveCoachId(
      input.date,
      input.startTime,
      endTime,
      this.state.coaches,
      this.state.assignments,
    );
    const wanted = input.coachChoice && input.coachChoice !== ANY_COACH ? input.coachChoice : undefined;
    if (wanted && wanted !== scheduled) {
      throw new Error('Ce créneau n’est plus assuré par le coach demandé. Merci d’en choisir un autre.');
    }
    const coachId = scheduled ?? ownerCoach(this.state.coaches)?.id ?? '';

    const amountCents = offer.pricePerPersonCents * (offer.id === 'petit-comite' ? input.participants : 1);
    const now = new Date().toISOString();
    const booking: Booking = {
      id: newId('bkg'),
      reference: newReference(),
      userId: input.userId,
      offerId: input.offerId,
      coachId,
      participants: input.participants,
      date: input.date,
      startTime: input.startTime,
      endTime,
      status: 'confirmed',
      payment: {
        method: input.paymentMethod,
        status: input.paymentMethod === 'online' ? 'paid' : 'pending',
        amountCents,
        cardLast4: input.paymentMethod === 'online' ? input.cardLast4 : undefined,
        paidAt: input.paymentMethod === 'online' ? now : undefined,
      },
      guestNames: input.guestNames ?? [],
      notes: input.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };
    this.state.bookings = [...this.state.bookings, booking];

    const user = this.state.users.find((u) => u.id === input.userId);
    if (user) {
      this.queueEmail({
        kind: 'confirmation',
        to: user.email,
        bookingId: booking.id,
        subject: `Séance confirmée — ${formatLongDate(booking.date)} à ${formatTime(booking.startTime)}`,
        body: this.confirmationBody(booking, user),
      });
      // Rappel automatique, programmé côté serveur en production.
      this.queueEmail({
        kind: 'reminder',
        to: user.email,
        bookingId: booking.id,
        subject: `Rappel — votre séance ${STUDIO.name} demain à ${formatTime(booking.startTime)}`,
        body:
          `Bonjour ${user.firstName},\n\n` +
          `Petit rappel : votre ${offer.name.toLowerCase()} a lieu ${formatLongDate(booking.date)} ` +
          `à ${formatTime(booking.startTime)} au studio, ${STUDIO.address.street}, ${STUDIO.address.city}.\n\n` +
          `Prévoyez une tenue et une serviette — douche et vestiaire sont sur place.\n\n` +
          `À demain,\n${STUDIO.coach.firstName}`,
        scheduledFor: new Date(
          toDateTime(booking.date, booking.startTime).getTime() - SCHEDULE.reminderHoursBefore * 3_600_000,
        ).toISOString(),
      });
    }

    this.commit();
    return booking;
  }

  private confirmationBody(booking: Booking, user: User): string {
    const offer = OFFERS_BY_ID[booking.offerId];
    const payment =
      booking.payment.method === 'online'
        ? `Réglé en ligne : ${formatPrice(booking.payment.amountCents)}.`
        : `À régler sur place : ${formatPrice(booking.payment.amountCents)}.`;
    return (
      `Bonjour ${user.firstName},\n\n` +
      `Votre séance est confirmée.\n\n` +
      `  Référence   ${booking.reference}\n` +
      `  Formule     ${offer.name}\n` +
      `  Date        ${formatLongDate(booking.date)}\n` +
      `  Horaire     ${formatTime(booking.startTime)} — ${formatTime(booking.endTime)}\n` +
      `  Coach       ${coachName(coachById(this.state.coaches, booking.coachId))}\n` +
      `  Participants ${booking.participants}\n` +
      `  Lieu        ${STUDIO.address.street}, ${STUDIO.address.postalCode} ${STUDIO.address.city}\n\n` +
      `${payment}\n\n` +
      `Vous pouvez reporter ou annuler cette séance en ligne jusqu'à ` +
      `${SCHEDULE.cancellationNoticeHours} h avant l'horaire prévu. Passé ce délai, appelez-nous au ${STUDIO.phone}.\n\n` +
      `À très vite,\n${STUDIO.coach.firstName}`
    );
  }

  async cancelBooking(bookingId: string, by: 'client' | 'studio', reason?: string): Promise<void> {
    this.hydrate();
    const existing = this.state.bookings.find((b) => b.id === bookingId);
    if (!existing) return;
    const cancelledAt = new Date().toISOString();
    const booking: Booking = {
      ...existing,
      status: 'cancelled',
      cancelledAt,
      cancelledBy: by,
      updatedAt: cancelledAt,
      payment: {
        ...existing.payment,
        status: existing.payment.status === 'paid' ? 'refunded' : existing.payment.status,
      },
    };
    this.replaceBooking(booking);

    const user = this.state.users.find((u) => u.id === booking.userId);
    if (user) {
      this.queueEmail({
        kind: 'cancellation',
        to: user.email,
        bookingId: booking.id,
        subject: `Séance annulée — ${formatLongDate(booking.date)}`,
        body:
          `Bonjour ${user.firstName},\n\n` +
          `Votre séance du ${formatLongDate(booking.date)} à ${formatTime(booking.startTime)} ` +
          `(référence ${booking.reference}) a bien été annulée${by === 'studio' ? ' par le studio' : ''}.\n` +
          (reason ? `Motif : ${reason}\n` : '') +
          (booking.payment.status === 'refunded'
            ? `\nLe remboursement de ${formatPrice(booking.payment.amountCents)} est en cours.\n`
            : '') +
          `\nÀ bientôt,\n${STUDIO.coach.firstName}`,
      });
    }
    this.commit();
  }

  async rescheduleBooking(bookingId: string, date: IsoDate, startTime: Time): Promise<void> {
    this.hydrate();
    const existing = this.state.bookings.find((b) => b.id === bookingId);
    if (!existing) return;
    const offer = OFFERS_BY_ID[existing.offerId];
    const taken = this.state.bookings.some(
      (b) => b.id !== bookingId && b.date === date && b.startTime === startTime && b.status !== 'cancelled',
    );
    if (taken) throw new Error('Ce créneau vient d’être réservé. Merci d’en choisir un autre.');

    const previous = `${formatLongDate(existing.date)} à ${formatTime(existing.startTime)}`;
    const endTime = addMinutesToTime(startTime, offer.durationMin);
    // Le créneau change, donc peut-être le coach : le nouvel horaire peut être
    // affecté à quelqu'un d'autre. On le recalcule et l'email le dit.
    const coachId =
      resolveCoachId(date, startTime, endTime, this.state.coaches, this.state.assignments) ?? existing.coachId;
    const booking: Booking = {
      ...existing,
      date,
      startTime,
      endTime,
      coachId,
      updatedAt: new Date().toISOString(),
    };
    this.replaceBooking(booking);

    const user = this.state.users.find((u) => u.id === booking.userId);
    if (user) {
      this.queueEmail({
        kind: 'reschedule',
        to: user.email,
        bookingId: booking.id,
        subject: `Séance reportée — ${formatLongDate(date)} à ${formatTime(startTime)}`,
        body:
          `Bonjour ${user.firstName},\n\n` +
          `Votre séance (référence ${booking.reference}) a été déplacée.\n\n` +
          `  Ancien créneau  ${previous}\n` +
          `  Nouveau créneau ${formatLongDate(date)} à ${formatTime(startTime)}\n` +
          (coachId !== existing.coachId
            ? `  Coach           ${coachName(coachById(this.state.coaches, coachId))} vous accueillera\n`
            : '') +
          `\n` +
          `À très vite,\n${STUDIO.coach.firstName}`,
      });
    }
    this.commit();
  }

  async setBookingStatus(bookingId: string, status: Booking['status']): Promise<void> {
    this.hydrate();
    const existing = this.state.bookings.find((b) => b.id === bookingId);
    if (!existing) return;
    this.replaceBooking({ ...existing, status, updatedAt: new Date().toISOString() });
    this.commit();
  }

  async setPaymentStatus(bookingId: string, status: Booking['payment']['status']): Promise<void> {
    this.hydrate();
    const existing = this.state.bookings.find((b) => b.id === bookingId);
    if (!existing) return;
    const now = new Date().toISOString();
    this.replaceBooking({
      ...existing,
      payment: { ...existing.payment, status, paidAt: status === 'paid' ? now : undefined },
      updatedAt: now,
    });
    this.commit();
  }

  /** Remplace une réservation par une nouvelle version (mise à jour immuable). */
  private replaceBooking(booking: Booking): void {
    this.state.bookings = this.state.bookings.map((b) => (b.id === booking.id ? booking : b));
  }

  /* --- Indisponibilités ------------------------------------------------ */

  async createBlock(input: Omit<Block, 'id' | 'createdAt'>): Promise<Block> {
    this.hydrate();
    const block: Block = { ...input, id: newId('blk'), createdAt: new Date().toISOString() };
    this.state.blocks = [...this.state.blocks, block];
    this.commit();
    return block;
  }

  async deleteBlock(blockId: string): Promise<void> {
    this.hydrate();
    this.state.blocks = this.state.blocks.filter((b) => b.id !== blockId);
    this.commit();
  }

  /* --- L'équipe --------------------------------------------------------- */
  /*
   * Réservé au gérant. Le contrôle est ici purement côté client — suffisant
   * pour la maquette, à remplacer impérativement par une vérification du rôle
   * côté serveur à la migration : ces méthodes seront alors des routes
   * protégées, et non des fonctions appelables depuis la console du
   * navigateur.
   */

  /**
   * Ajoute un coach et lui ouvre un accès à son back-office.
   *
   * Le mot de passe est provisoire : en production il faut envoyer un lien
   * d'activation par email, jamais transmettre un mot de passe choisi par
   * quelqu'un d'autre.
   */
  async addCoach(input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
    bio?: string;
    specialties?: string[];
    color?: Coach['color'];
    photo?: string;
  }): Promise<Coach> {
    this.hydrate();
    const email = input.email.trim().toLowerCase();
    if (this.state.credentials.some((c) => c.email === email)) {
      throw new Error('Un compte existe déjà avec cette adresse email.');
    }

    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    if (!firstName || !lastName) throw new Error('Le prénom et le nom sont obligatoires.');

    const now = new Date().toISOString();
    const user: User = {
      id: newId('usr'),
      email,
      firstName,
      lastName,
      role: 'coach',
      marketingOptIn: false,
      createdAt: now,
    };

    const coach: Coach = {
      id: newId('cch'),
      userId: user.id,
      firstName,
      lastName,
      slug: slugify(`${firstName} ${lastName}`),
      role: input.role.trim() || 'Coach sportif',
      bio: input.bio?.trim() ?? '',
      specialties: input.specialties?.filter(Boolean) ?? [],
      // Sans photo fournie, le site affiche les initiales sur un aplat de
      // couleur : voir le composant CoachAvatar.
      photo: input.photo ?? '',
      color: input.color ?? 'jade',
      owner: false,
      active: true,
      createdAt: now,
    };

    this.state.users = [...this.state.users, user];
    this.state.credentials = [
      ...this.state.credentials,
      { userId: user.id, email, passwordDigest: digestPassword(input.password) },
    ];
    this.state.coaches = [...this.state.coaches, coach];
    this.commit();
    return coach;
  }

  async updateCoach(
    coachId: string,
    patch: Partial<Pick<Coach, 'firstName' | 'lastName' | 'role' | 'bio' | 'specialties' | 'color' | 'photo' | 'active'>>,
  ): Promise<void> {
    this.hydrate();
    this.state.coaches = this.state.coaches.map((c) => (c.id === coachId ? { ...c, ...patch } : c));

    // Le nom affiché dans l'espace client vient du compte, pas de la fiche :
    // les deux doivent rester d'accord.
    const coach = this.state.coaches.find((c) => c.id === coachId);
    if (coach && (patch.firstName || patch.lastName)) {
      this.state.users = this.state.users.map((u) =>
        u.id === coach.userId ? { ...u, firstName: coach.firstName, lastName: coach.lastName } : u,
      );
    }
    this.commit();
  }

  /**
   * Retire un coach de l'équipe.
   *
   * Ses séances passées ne sont jamais effacées : elles font l'historique et
   * le chiffre d'affaires du studio. S'il lui reste des séances à venir, la
   * suppression est refusée — elles doivent d'abord être reprises par
   * quelqu'un ou annulées, sinon des clients se présenteraient devant une
   * porte sans personne derrière.
   */
  async removeCoach(coachId: string): Promise<void> {
    this.hydrate();
    const coach = this.state.coaches.find((c) => c.id === coachId);
    if (!coach) return;
    if (coach.owner) throw new Error('Le gérant du studio ne peut pas être retiré de l’équipe.');

    const today = new Date().toISOString().slice(0, 10);
    const upcoming = this.state.bookings.filter(
      (b) => b.coachId === coachId && b.status === 'confirmed' && b.date >= today,
    );
    if (upcoming.length > 0) {
      throw new Error(
        `${coach.firstName} a encore ${upcoming.length} séance${upcoming.length > 1 ? 's' : ''} à venir. ` +
          'Réaffectez-les ou annulez-les avant de le retirer de l’équipe.',
      );
    }

    this.state.coaches = this.state.coaches.filter((c) => c.id !== coachId);
    // Les affectations et indisponibilités qui le désignaient n'ont plus
    // d'objet : les créneaux concernés reviennent au titulaire.
    this.state.assignments = this.state.assignments.filter((a) => a.coachId !== coachId);
    this.state.blocks = this.state.blocks.filter((b) => b.coachId !== coachId);
    // Son accès est fermé ; son profil disparaît. Les réservations passées
    // conservent son identifiant, qui n'est plus résolu qu'en historique.
    this.state.users = this.state.users.filter((u) => u.id !== coach.userId);
    this.state.credentials = this.state.credentials.filter((c) => c.userId !== coach.userId);
    if (this.state.session?.userId === coach.userId) this.state.session = null;
    this.commit();
  }

  /* --- Affectations ------------------------------------------------------ */

  async createAssignment(input: Omit<Assignment, 'id' | 'createdAt'>): Promise<Assignment> {
    this.hydrate();
    if (!this.state.coaches.some((c) => c.id === input.coachId)) {
      throw new Error('Ce coach ne fait pas partie de l’équipe.');
    }
    const assignment: Assignment = { ...input, id: newId('asg'), createdAt: new Date().toISOString() };
    this.state.assignments = [...this.state.assignments, assignment];
    this.commit();
    return assignment;
  }

  async deleteAssignment(assignmentId: string): Promise<void> {
    this.hydrate();
    this.state.assignments = this.state.assignments.filter((a) => a.id !== assignmentId);
    this.commit();
  }

  /* --- Runs : sorties collectives gratuites ----------------------------- */
  /*
   * Réservé au gérant, qui les anime toutes. Contrôle côté navigateur en
   * démonstration, à refaire côté serveur à la migration.
   */

  async createRun(input: {
    date: IsoDate;
    startTime: Time;
    title: string;
    description?: string;
    meetingPoint?: string;
    capacity?: number;
  }): Promise<SocialRun> {
    this.hydrate();
    const owner = ownerCoach(this.state.coaches);
    if (!owner) throw new Error('Aucun gérant identifié pour animer la sortie.');

    const endTime = addMinutesToTime(input.startTime, SCHEDULE.slotMinutes);

    // Deux sorties ne peuvent pas se chevaucher : le gérant ne peut pas être
    // à deux endroits, et un doublon accidentel est vite arrivé.
    const clash = this.state.runs.some(
      (r) =>
        r.status === 'open' &&
        r.date === input.date &&
        r.startTime < endTime &&
        input.startTime < r.endTime,
    );
    if (clash) throw new Error('Une sortie est déjà programmée sur ce créneau.');

    // Une séance déjà vendue passe avant : on ne la sacrifie pas pour un run.
    const booked = this.state.bookings.some(
      (b) =>
        b.status !== 'cancelled' &&
        b.date === input.date &&
        b.coachId === owner.id &&
        b.startTime < endTime &&
        input.startTime < b.endTime,
    );
    if (booked) {
      throw new Error('Une séance est déjà réservée sur ce créneau. Annulez-la d’abord, ou choisissez une autre heure.');
    }

    const run: SocialRun = {
      id: newId('run'),
      coachId: owner.id,
      date: input.date,
      startTime: input.startTime,
      endTime,
      title: input.title.trim() || 'Run collectif',
      description: input.description?.trim() ?? '',
      meetingPoint: input.meetingPoint?.trim() || `${STUDIO.address.street}, ${STUDIO.address.city}`,
      capacity: input.capacity && input.capacity > 0 ? input.capacity : RUN_CAPACITY,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    this.state.runs = [...this.state.runs, run];
    this.commit();
    return run;
  }

  async updateRun(
    runId: string,
    patch: Partial<Pick<SocialRun, 'title' | 'description' | 'meetingPoint' | 'capacity'>>,
  ): Promise<void> {
    this.hydrate();
    const existing = this.state.runs.find((r) => r.id === runId);
    if (!existing) return;

    // Réduire le nombre de places en dessous des inscrits déjà là reviendrait
    // à décider en silence qui reste dehors.
    if (patch.capacity !== undefined) {
      const taken = signupsForRun(this.state.runSignups, runId).length;
      if (patch.capacity < taken) {
        throw new Error(`${taken} personnes sont déjà inscrites : le nombre de places ne peut pas descendre en dessous.`);
      }
    }

    this.state.runs = this.state.runs.map((r) => (r.id === runId ? { ...r, ...patch } : r));
    this.commit();
  }

  /**
   * Annule une sortie et prévient les inscrits.
   *
   * La sortie n'est pas supprimée : le gérant garde la trace de ce qui était
   * prévu, et les inscriptions restent rattachées.
   */
  async cancelRun(runId: string, reason?: string): Promise<void> {
    this.hydrate();
    const run = this.state.runs.find((r) => r.id === runId);
    if (!run || run.status === 'cancelled') return;

    const cancelledAt = new Date().toISOString();
    this.state.runs = this.state.runs.map((r) =>
      r.id === runId ? { ...r, status: 'cancelled' as const, cancelledAt } : r,
    );

    for (const signup of signupsForRun(this.state.runSignups, runId)) {
      const user = this.state.users.find((u) => u.id === signup.userId);
      if (!user) continue;
      this.queueEmail({
        kind: 'cancellation',
        to: user.email,
        subject: `Sortie annulée — ${formatLongDate(run.date)}`,
        body:
          `Bonjour ${user.firstName},\n\n` +
          `La sortie « ${run.title} » du ${formatLongDate(run.date)} à ${formatTime(run.startTime)} est annulée.\n` +
          (reason ? `Motif : ${reason}\n` : '') +
          `\nAucune démarche de votre part, votre place est libérée. La prochaine date sera annoncée sur le site.\n\n` +
          `À bientôt,\n${STUDIO.coach.firstName}`,
      });
    }
    this.commit();
  }

  /** Supprime définitivement une sortie sans inscrit. */
  async deleteRun(runId: string): Promise<void> {
    this.hydrate();
    if (signupsForRun(this.state.runSignups, runId).length > 0) {
      throw new Error('Des personnes sont inscrites : annulez la sortie plutôt que de la supprimer, elles seront prévenues.');
    }
    this.state.runs = this.state.runs.filter((r) => r.id !== runId);
    this.state.runSignups = this.state.runSignups.filter((r) => r.runId !== runId);
    this.commit();
  }

  /* --- Inscriptions aux runs -------------------------------------------- */

  async joinRun(runId: string, userId: string): Promise<RunSignup> {
    this.hydrate();
    const run = this.state.runs.find((r) => r.id === runId);
    if (!run) throw new Error('Cette sortie n’existe plus.');
    if (run.status === 'cancelled') throw new Error('Cette sortie a été annulée.');
    if (isPastRun(run)) throw new Error('Cette sortie a déjà eu lieu.');

    const already = this.state.runSignups.find(
      (s) => s.runId === runId && s.userId === userId && !s.cancelledAt,
    );
    if (already) return already;

    // Contrôle refait au moment de valider, et pas seulement à l'affichage :
    // deux personnes peuvent viser la dernière place en même temps.
    if (placesLeft(run, this.state.runSignups) <= 0) {
      throw new Error('La dernière place vient d’être prise. Guettez la prochaine date.');
    }

    const signup: RunSignup = {
      id: newId('rsg'),
      runId,
      userId,
      createdAt: new Date().toISOString(),
    };
    this.state.runSignups = [...this.state.runSignups, signup];

    const user = this.state.users.find((u) => u.id === userId);
    if (user) {
      this.queueEmail({
        kind: 'confirmation',
        to: user.email,
        subject: `Inscription confirmée — ${run.title}, ${formatLongDate(run.date)}`,
        body:
          `Bonjour ${user.firstName},\n\n` +
          `Votre place est réservée pour « ${run.title} ».\n\n` +
          `  Date            ${formatLongDate(run.date)}\n` +
          `  Heure           ${formatTime(run.startTime)} — ${formatTime(run.endTime)}\n` +
          `  Rendez-vous     ${run.meetingPoint}\n` +
          `  Participation   gratuite\n\n` +
          `C'est une sortie collective : on court à l'allure du groupe, personne n'est laissé derrière.\n` +
          `Si vous ne pouvez plus venir, désinscrivez-vous depuis votre espace : votre place profitera à quelqu'un d'autre.\n\n` +
          `À très vite,\n${STUDIO.coach.firstName}`,
      });
      this.queueEmail({
        kind: 'reminder',
        to: user.email,
        subject: `Rappel — ${run.title} demain à ${formatTime(run.startTime)}`,
        body:
          `Bonjour ${user.firstName},\n\n` +
          `Petit rappel : « ${run.title} » a lieu ${formatLongDate(run.date)} à ${formatTime(run.startTime)}.\n` +
          `Rendez-vous : ${run.meetingPoint}.\n\n` +
          `À demain,\n${STUDIO.coach.firstName}`,
        scheduledFor: new Date(
          toDateTime(run.date, run.startTime).getTime() - SCHEDULE.reminderHoursBefore * 3_600_000,
        ).toISOString(),
      });
    }

    this.commit();
    return signup;
  }

  /**
   * Désinscription.
   *
   * Possible jusqu'au départ, sans délai : il n'y a pas d'argent en jeu, et
   * plus tôt la place est rendue, plus elle a de chances de servir.
   */
  async leaveRun(runId: string, userId: string): Promise<void> {
    this.hydrate();
    const cancelledAt = new Date().toISOString();
    this.state.runSignups = this.state.runSignups.map((s) =>
      s.runId === runId && s.userId === userId && !s.cancelledAt ? { ...s, cancelledAt } : s,
    );
    this.commit();
  }

  /* --- Emails simulés -------------------------------------------------- */

  private queueEmail(input: {
    kind: EmailKind;
    to: string;
    subject: string;
    body: string;
    bookingId?: string;
    scheduledFor?: string;
  }): void {
    const email: EmailMessage = {
      id: newId('eml'),
      kind: input.kind,
      to: input.to,
      subject: input.subject,
      body: input.body,
      bookingId: input.bookingId,
      createdAt: new Date().toISOString(),
      scheduledFor: input.scheduledFor,
      status: input.scheduledFor ? 'queued' : 'sent',
    };
    // On garde la boîte d'envoi de démonstration à une taille raisonnable.
    this.state.emails = [email, ...this.state.emails].slice(0, 80);
  }
}

/** Instance unique, partagée par toute l'application. */
export const db = new BougeDatabase();

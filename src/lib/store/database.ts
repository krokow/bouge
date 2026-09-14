'use client';

import { OFFERS_BY_ID } from '@/data/offers';
import { SCHEDULE, STUDIO } from '@/lib/config';
import { addMinutesToTime, formatLongDate, formatTime, toDateTime } from '@/lib/date';
import { formatPrice } from '@/lib/format';
import type {
  Block,
  Booking,
  EmailKind,
  EmailMessage,
  IsoDate,
  OfferId,
  PaymentMethod,
  Time,
  User,
} from '@/lib/types';
import { DatabaseShape, DB_STORAGE_KEY, DB_VERSION, digestPassword, emptyDatabase, newId, newReference } from './schema';
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
      bookings: [...this.state.bookings],
      blocks: [...this.state.blocks],
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

    const amountCents = offer.pricePerPersonCents * (offer.id === 'petit-comite' ? input.participants : 1);
    const now = new Date().toISOString();
    const booking: Booking = {
      id: newId('bkg'),
      reference: newReference(),
      userId: input.userId,
      offerId: input.offerId,
      participants: input.participants,
      date: input.date,
      startTime: input.startTime,
      endTime: addMinutesToTime(input.startTime, offer.durationMin),
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
    const booking: Booking = {
      ...existing,
      date,
      startTime,
      endTime: addMinutesToTime(startTime, offer.durationMin),
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
          `  Nouveau créneau ${formatLongDate(date)} à ${formatTime(startTime)}\n\n` +
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

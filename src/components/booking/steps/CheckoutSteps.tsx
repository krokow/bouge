'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox, FormError, TextArea, TextField } from '@/components/ui/Field';
import { Price } from '@/components/ui/Price';
import { OFFERS_BY_ID } from '@/data/offers';
import { asset, SCHEDULE, STUDIO } from '@/lib/config';
import { formatLongDate, formatTime } from '@/lib/date';
import { useAction, useCoach } from '@/lib/hooks/useDatabase';
import { db } from '@/lib/store/database';
import type { Booking, PaymentMethod, User } from '@/lib/types';
import { bookingToClientIcs, downloadIcs } from '@/lib/ics';

/* -------------------------------------------------------------------------- */
/* Étape 5 — Identification                                                    */
/* -------------------------------------------------------------------------- */

export function AuthStep({
  user,
  participants,
  guestNames,
  notes,
  onGuestNamesChange,
  onNotesChange,
}: {
  user: User | null;
  participants: number;
  guestNames: string[];
  notes: string;
  onGuestNamesChange: (names: string[]) => void;
  onNotesChange: (notes: string) => void;
}) {
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');

  return (
    <div className="flex flex-col gap-6">
      {user ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-jade/40 bg-jade/10 p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-jade font-display text-lg leading-none text-creme">
              {user.firstName[0]}
              {user.lastName[0]}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="font-semibold">
                {user.firstName} {user.lastName}
              </span>
              <span className="truncate text-[length:var(--text-sm)] text-anthracite/60">{user.email}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => void db.signOut()}
            className="text-[length:var(--text-sm)] font-semibold text-anthracite/60 underline-offset-4 hover:text-orange hover:underline"
          >
            Ce n’est pas vous&nbsp;?
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex gap-1.5 rounded-full bg-anthracite/6 p-1.5">
            {(
              [
                { id: 'signup', label: 'Créer un compte' },
                { id: 'signin', label: 'J’ai déjà un compte' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMode(tab.id)}
                aria-pressed={mode === tab.id}
                className={[
                  'min-h-11 flex-1 rounded-full px-4 text-[length:var(--text-sm)] font-semibold transition-colors duration-300',
                  mode === tab.id ? 'bg-anthracite text-creme' : 'text-anthracite/60 hover:text-anthracite',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {mode === 'signup' ? <SignUpForm /> : <SignInForm />}
        </div>
      )}

      {/* Informations complémentaires — visibles une fois identifié */}
      {user && (
        <div className="flex flex-col gap-4 rounded-2xl border-2 border-anthracite/12 bg-blanc p-5">
          <h3 className="text-[length:var(--text-xl)]">Quelques précisions</h3>

          {participants > 1 && (
            <div className="flex flex-col gap-3">
              <p className="text-[length:var(--text-sm)] text-anthracite/65">
                Qui vous accompagne&nbsp;? Le prénom suffit, c’est pour que le coach sache qui attendre.
              </p>
              {Array.from({ length: participants - 1 }).map((_, index) => (
                <TextField
                  key={index}
                  id={`guest-${index}`}
                  label={`Accompagnant ${index + 1}`}
                  placeholder="Prénom"
                  value={guestNames[index] ?? ''}
                  onChange={(e) => {
                    const next = [...guestNames];
                    next[index] = e.target.value;
                    onGuestNamesChange(next);
                  }}
                />
              ))}
            </div>
          )}

          <TextArea
            id="booking-notes"
            label="Objectif, blessure, contrainte"
            hint="facultatif"
            rows={3}
            value={notes}
            placeholder="Ex : genou droit sensible, je prépare un 10 km en mai."
            onChange={(e) => onNotesChange(e.target.value)}
          />
          <p className="text-[length:var(--text-2xs)] leading-relaxed text-anthracite/50">
            Ces informations ne servent qu’à adapter la séance et ne sont visibles que par le coach. Voir la{' '}
            <Link href="/confidentialite/" className="text-orange underline-offset-4 hover:underline">
              politique de confidentialité
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}

function SignUpForm() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    marketingOptIn: false,
  });
  const [touched, setTouched] = useState(false);
  const { run, pending, error } = useAction(db.signUp.bind(db));

  const passwordTooShort = form.password.length > 0 && form.password.length < 8;

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setTouched(true);
        if (form.password.length < 8) return;
        void run(form);
      }}
      className="flex flex-col gap-4 rounded-2xl border-2 border-anthracite/12 bg-blanc p-5"
    >
      {error && <FormError>{error}</FormError>}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="su-firstname"
          label="Prénom"
          required
          autoComplete="given-name"
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
        />
        <TextField
          id="su-lastname"
          label="Nom"
          required
          autoComplete="family-name"
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
        />
      </div>
      <TextField
        id="su-email"
        label="Email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <TextField
        id="su-phone"
        label="Téléphone"
        hint="facultatif"
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        placeholder="06 12 34 56 78"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />
      <TextField
        id="su-password"
        label="Mot de passe"
        hint="8 caractères minimum"
        type="password"
        required
        autoComplete="new-password"
        error={touched && passwordTooShort ? 'Le mot de passe doit faire au moins 8 caractères.' : undefined}
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />

      <Checkbox
        id="su-optin"
        checked={form.marketingOptIn}
        onChange={(e) => setForm({ ...form, marketingOptIn: e.target.checked })}
      >
        Je veux recevoir les actualités du studio (nouveaux créneaux, ouverture du cabinet d’ostéopathie).
        Facultatif, désinscription en un clic.
      </Checkbox>

      <Button type="submit" size="md" block disabled={pending}>
        {pending ? 'Création…' : 'Créer mon compte'}
      </Button>

      <p className="text-[length:var(--text-2xs)] leading-relaxed text-anthracite/50">
        En créant un compte, vous acceptez les{' '}
        <Link href="/cgv/" className="text-orange underline-offset-4 hover:underline">
          conditions générales de vente
        </Link>
        .
      </p>
    </form>
  );
}

function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { run, pending, error } = useAction((e: string, p: string) => db.signIn(e, p));

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void run(email, password);
      }}
      className="flex flex-col gap-4 rounded-2xl border-2 border-anthracite/12 bg-blanc p-5"
    >
      {error && <FormError>{error}</FormError>}

      <TextField
        id="si-email"
        label="Email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        id="si-password"
        label="Mot de passe"
        type="password"
        required
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button type="submit" size="md" block disabled={pending}>
        {pending ? 'Connexion…' : 'Se connecter'}
      </Button>

      <DemoCredentials />
    </form>
  );
}

/** Rappel des identifiants de test — visible uniquement dans cette démonstration. */
export function DemoCredentials() {
  return (
    <p className="rounded-xl bg-ciel/12 px-4 py-3 text-[length:var(--text-2xs)] leading-relaxed text-anthracite/70">
      <strong>Démonstration</strong> — compte client de test&nbsp;: <code>camille.ferrand@example.com</code> /{' '}
      <code>demo1234</code>. Compte gérant&nbsp;: <code>{STUDIO.email.replace('bonjour', 'melvin')}</code> /{' '}
      <code>bouge2026</code>.
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* Étape 6 — Paiement                                                          */
/* -------------------------------------------------------------------------- */

export interface CardDraft {
  number: string;
  expiry: string;
  cvv: string;
  holder: string;
}

export const EMPTY_CARD: CardDraft = { number: '', expiry: '', cvv: '', holder: '' };

/** Regroupe les chiffres par 4 pendant la saisie. */
function formatCardNumber(raw: string): string {
  return raw
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function isCardComplete(card: CardDraft): boolean {
  const digits = card.number.replace(/\s/g, '');
  const [month, year] = card.expiry.split('/');
  const validExpiry =
    /^\d{2}$/.test(month ?? '') &&
    /^\d{2}$/.test(year ?? '') &&
    Number(month) >= 1 &&
    Number(month) <= 12 &&
    // Comparaison sur l'année à deux chiffres : suffisant pour une saisie MM/AA.
    Number(`20${year}`) * 100 + Number(month) >= new Date().getFullYear() * 100 + (new Date().getMonth() + 1);
  return digits.length === 16 && validExpiry && /^\d{3,4}$/.test(card.cvv) && card.holder.trim().length > 2;
}

export function PaymentStep({
  method,
  onMethodChange,
  card,
  onCardChange,
  amountCents,
}: {
  method: PaymentMethod | null;
  onMethodChange: (method: PaymentMethod) => void;
  card: CardDraft;
  onCardChange: (card: CardDraft) => void;
  amountCents: number;
}) {
  const options = [
    {
      id: 'onsite' as const,
      title: 'Payer sur place',
      caption: 'Carte ou espèces, avant la séance',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="size-6">
          <path d="M3 10h18M6 15h4" strokeLinecap="round" />
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
        </svg>
      ),
    },
    {
      id: 'online' as const,
      title: 'Payer en ligne',
      caption: 'Par carte bancaire, maintenant',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="size-6">
          <rect x="3" y="6" width="18" height="12" rx="2.5" />
          <path d="M7 14h3" strokeLinecap="round" />
          <circle cx="16.5" cy="12" r="2.2" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-3 border-0 p-0">
        <legend className="sr-only">Mode de paiement</legend>
        <ul className="grid gap-3 sm:grid-cols-2">
          {options.map((option) => {
            const selected = method === option.id;
            return (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => onMethodChange(option.id)}
                  aria-pressed={selected}
                  className={[
                    'flex h-full w-full items-start gap-3.5 rounded-[1.5rem] border-2 p-5 text-left',
                    'transition-[border-color,background-color,transform] duration-300',
                    selected
                      ? 'border-orange bg-orange/8'
                      : 'border-anthracite/12 bg-blanc hover:-translate-y-0.5 hover:border-anthracite/30',
                  ].join(' ')}
                >
                  <span className={`shrink-0 ${selected ? 'text-orange' : 'text-anthracite/45'}`}>{option.icon}</span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-display text-[length:var(--text-xl)] leading-none">{option.title}</span>
                    <span className="text-[length:var(--text-xs)] text-anthracite/60">{option.caption}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      {method === 'onsite' && (
        <div className="rounded-2xl border-2 border-anthracite/12 bg-blanc p-5">
          <p className="text-[length:var(--text-sm)] leading-relaxed text-anthracite/72">
            Votre créneau est réservé dès la validation. Vous réglerez{' '}
            <strong>
              <Price cents={amountCents} className="text-[length:var(--text-base)]" />
            </strong>{' '}
            au studio avant la séance, par carte ou en espèces. Une facture vous est remise sur demande.
          </p>
        </div>
      )}

      {method === 'online' && (
        <div className="flex flex-col gap-4 rounded-2xl border-2 border-anthracite/12 bg-blanc p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-[length:var(--text-xl)]">Carte bancaire</h3>
            <span className="flex items-center gap-1.5 text-[length:var(--text-2xs)] font-semibold uppercase tracking-[0.1em] text-jade">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.9" className="size-3.5" aria-hidden="true">
                <rect x="4" y="9" width="12" height="8" rx="2" />
                <path d="M7 9V6.5a3 3 0 016 0V9" />
              </svg>
              Paiement sécurisé
            </span>
          </div>

          {/* Avertissement bien visible : cette interface n'encaisse rien. */}
          <p className="flex items-start gap-2.5 rounded-xl border-2 border-orange/40 bg-orange/10 px-4 py-3 text-[length:var(--text-sm)] leading-relaxed">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.9" className="mt-0.5 size-4 shrink-0 text-orange-dark" aria-hidden="true">
              <circle cx="10" cy="10" r="8" />
              <path d="M10 6v4.5M10 13.6v.1" strokeLinecap="round" />
            </svg>
            <span>
              <strong>Interface de démonstration.</strong> Aucun paiement n’est encaissé et aucune donnée de carte
              n’est transmise ni conservée. En production, cet écran sera remplacé par le module de paiement{' '}
              <strong>Stripe</strong>, hébergé par Stripe et certifié PCI-DSS&nbsp;: les numéros de carte ne
              transiteront jamais par le site.
            </span>
          </p>

          <TextField
            id="card-number"
            label="Numéro de carte"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="4242 4242 4242 4242"
            value={card.number}
            onChange={(e) => onCardChange({ ...card, number: formatCardNumber(e.target.value) })}
          />
          <div className="grid grid-cols-2 gap-4">
            <TextField
              id="card-expiry"
              label="Expiration"
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/AA"
              value={card.expiry}
              onChange={(e) => onCardChange({ ...card, expiry: formatExpiry(e.target.value) })}
            />
            <TextField
              id="card-cvv"
              label="Cryptogramme"
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="123"
              maxLength={4}
              value={card.cvv}
              onChange={(e) => onCardChange({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
            />
          </div>
          <TextField
            id="card-holder"
            label="Titulaire de la carte"
            autoComplete="cc-name"
            placeholder="Prénom Nom"
            value={card.holder}
            onChange={(e) => onCardChange({ ...card, holder: e.target.value })}
          />

          <div className="flex items-baseline justify-between gap-4 border-t-2 border-anthracite/12 pt-4">
            <span className="text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.12em] text-anthracite/45">
              Montant débité
            </span>
            <Price cents={amountCents} className="text-[length:var(--text-2xl)]" />
          </div>
        </div>
      )}

      <p className="text-[length:var(--text-2xs)] leading-relaxed text-anthracite/50">
        Quel que soit le mode choisi, vous pouvez annuler ou reporter votre séance en ligne jusqu’à{' '}
        {SCHEDULE.cancellationNoticeHours}&nbsp;h avant l’horaire prévu. Voir les{' '}
        <Link href="/cgv/" className="text-orange underline-offset-4 hover:underline">
          conditions générales
        </Link>
        .
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Étape 7 — Confirmation                                                      */
/* -------------------------------------------------------------------------- */

export function ConfirmationStep({ booking, user }: { booking: Booking; user: User }) {
  const offer = OFFERS_BY_ID[booking.offerId];
  const bookingCoach = useCoach(booking.coachId);

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-[1.75rem] border-2 border-jade/40 bg-jade/10 p-6 sm:p-8">
        <img
          src={asset('/brand/mascotte-run-dark.webp')}
          alt=""
          width={760}
          height={640}
          className="u-float pointer-events-none absolute -right-4 bottom-0 hidden h-36 w-auto opacity-25 sm:block"
        />
        <div className="relative flex flex-col gap-3">
          <span className="grid size-12 place-items-center rounded-full bg-jade text-creme">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" className="size-6">
              <path d="M4 10.5l4 4 8-9" />
            </svg>
          </span>
          <h2 className="text-[length:var(--text-4xl)]">C’est réservé.</h2>
          <p className="max-w-[48ch] leading-relaxed text-anthracite/75">
            Un email de confirmation vient de partir vers <strong>{user.email}</strong>. Vous recevrez aussi un
            rappel {SCHEDULE.reminderHoursBefore}&nbsp;h avant la séance.
          </p>
          <p className="mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-anthracite px-4 py-2 font-display text-[length:var(--text-lg)] leading-none text-creme">
            {booking.reference}
          </p>
        </div>
      </div>

      <dl className="grid gap-px overflow-hidden rounded-[1.5rem] border-2 border-anthracite/12 bg-anthracite/12 sm:grid-cols-2">
        <Detail label="Formule">{offer.name}</Detail>
        {/* Le client doit savoir qui l'accueille : c'est la première question
            qu'il se posera en arrivant devant la porte. */}
        {bookingCoach && (
          <Detail label="Votre coach">
            {bookingCoach.firstName} {bookingCoach.lastName}
          </Detail>
        )}
        <Detail label="Participants">{booking.participants}</Detail>
        <Detail label="Date">{formatLongDate(booking.date)}</Detail>
        <Detail label="Horaire">
          {formatTime(booking.startTime)} — {formatTime(booking.endTime)}
        </Detail>
        <Detail label="Lieu">
          {STUDIO.address.street}, {STUDIO.address.postalCode} {STUDIO.address.city}
        </Detail>
        <Detail label="Paiement">
          {booking.payment.method === 'online' ? (
            <>
              Réglé en ligne — <Price cents={booking.payment.amountCents} className="text-[length:var(--text-base)]" />
            </>
          ) : (
            <>
              À régler sur place — <Price cents={booking.payment.amountCents} className="text-[length:var(--text-base)]" />
            </>
          )}
        </Detail>
      </dl>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="dark"
          size="md"
          onClick={() => downloadIcs(bookingToClientIcs(booking), `bouge-${booking.reference}`)}
          className="sm:flex-1"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="size-4" aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" rx="2.5" />
            <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
          </svg>
          Ajouter à mon agenda
        </Button>
        <Button variant="outline" size="md" onClick={() => window.print()} className="sm:flex-1">
          Imprimer le récapitulatif
        </Button>
      </div>

      <div className="rounded-2xl bg-anthracite/5 p-5 text-[length:var(--text-sm)] leading-relaxed text-anthracite/70">
        <p className="mb-2 font-semibold text-anthracite">Avant de venir</p>
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>Prévoyez une tenue et des chaussures d’intérieur propres.</li>
          <li>Serviettes, douche et vestiaire sont fournis sur place.</li>
          <li>Arrivez cinq minutes en avance pour le premier rendez-vous.</li>
          <li>
            Besoin de changer&nbsp;? Rendez-vous dans votre{' '}
            <Link href="/compte/" className="font-semibold text-orange underline-offset-4 hover:underline">
              espace personnel
            </Link>
            , jusqu’à {SCHEDULE.cancellationNoticeHours}&nbsp;h avant.
          </li>
        </ul>
      </div>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 bg-blanc px-5 py-4">
      <dt className="text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.12em] text-anthracite/45">
        {label}
      </dt>
      <dd className="font-semibold text-anthracite">{children}</dd>
    </div>
  );
}

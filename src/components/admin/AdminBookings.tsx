'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Price } from '@/components/ui/Price';
import { OFFERS, OFFERS_BY_ID } from '@/data/offers';
import { formatLongDate, formatShortDate, formatTime, toDateTime, todayIso } from '@/lib/date';
import { useDatabase } from '@/lib/hooks/useDatabase';
import { bookingsToIcs, downloadIcs } from '@/lib/ics';
import { db } from '@/lib/store/database';
import type { Booking, BookingStatus } from '@/lib/types';

type Period = 'upcoming' | 'today' | 'past' | 'all';

const PERIODS: Array<{ id: Period; label: string }> = [
  { id: 'upcoming', label: 'À venir' },
  { id: 'today', label: 'Aujourd’hui' },
  { id: 'past', label: 'Passées' },
  { id: 'all', label: 'Toutes' },
];

const STATUS_STYLES: Record<BookingStatus, { label: string; className: string }> = {
  confirmed: { label: 'Confirmée', className: 'bg-jade/15 text-jade-dark' },
  completed: { label: 'Terminée', className: 'bg-anthracite/8 text-anthracite/60' },
  cancelled: { label: 'Annulée', className: 'bg-orange/15 text-orange-dark' },
  no_show: { label: 'Absente', className: 'bg-brun/15 text-brun' },
};

/**
 * Liste des réservations.
 *
 * Tableau à partir de 1024px, cartes empilées en dessous : un tableau de six
 * colonnes n'est pas consultable sur un téléphone, et le gérant doit pouvoir
 * vérifier un rendez-vous depuis le sien.
 */
export function AdminBookings() {
  const state = useDatabase();
  const [period, setPeriod] = useState<Period>('upcoming');
  const [offerFilter, setOfferFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const usersById = useMemo(() => new Map(state.users.map((u) => [u.id, u])), [state.users]);
  const today = todayIso();

  const rows = useMemo(() => {
    const now = Date.now();
    const query = search.trim().toLowerCase();

    return state.bookings
      .filter((booking) => {
        if (offerFilter !== 'all' && booking.offerId !== offerFilter) return false;

        const end = toDateTime(booking.date, booking.endTime).getTime();
        if (period === 'upcoming' && (end < now || booking.status === 'cancelled')) return false;
        if (period === 'today' && booking.date !== today) return false;
        if (period === 'past' && end >= now) return false;

        if (query) {
          const user = usersById.get(booking.userId);
          const haystack = [
            booking.reference,
            user?.firstName,
            user?.lastName,
            user?.email,
            user?.phone,
            OFFERS_BY_ID[booking.offerId]?.name,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const key = (x: Booking) => `${x.date}${x.startTime}`;
        return period === 'past' ? key(b).localeCompare(key(a)) : key(a).localeCompare(key(b));
      });
  }, [state.bookings, usersById, period, offerFilter, search, today]);

  const totalCents = rows.filter((b) => b.status !== 'cancelled').reduce((s, b) => s + b.payment.amountCents, 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Filtres */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <ul className="flex gap-1.5 rounded-full bg-anthracite/6 p-1.5">
            {PERIODS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setPeriod(item.id)}
                  aria-pressed={period === item.id}
                  className={[
                    'min-h-10 whitespace-nowrap rounded-full px-3.5 text-[length:var(--text-sm)] font-semibold transition-colors duration-300',
                    period === item.id ? 'bg-anthracite text-creme' : 'text-anthracite/60 hover:text-anthracite',
                  ].join(' ')}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>

          <select
            value={offerFilter}
            onChange={(e) => setOfferFilter(e.target.value)}
            aria-label="Filtrer par formule"
            className="min-h-11 rounded-xl border-2 border-anthracite/12 bg-blanc px-3 text-[length:var(--text-sm)] outline-none focus:border-orange"
          >
            <option value="all">Toutes les formules</option>
            {OFFERS.map((offer) => (
              <option key={offer.id} value={offer.id}>
                {offer.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un client, un email, une référence…"
            aria-label="Rechercher une réservation"
            className="min-h-11 min-w-0 flex-1 rounded-xl border-2 border-anthracite/12 bg-blanc px-4 text-[length:var(--text-sm)] outline-none focus:border-orange"
          />
          <Button
            variant="dark"
            size="sm"
            onClick={() => downloadIcs(bookingsToIcs(rows, state.users, 'BOUGE. — sélection'), 'bouge-selection')}
            disabled={rows.length === 0}
          >
            Exporter (.ics)
          </Button>
        </div>
      </div>

      <p className="text-[length:var(--text-sm)] text-anthracite/60" role="status">
        {rows.length} réservation{rows.length > 1 ? 's' : ''} ·{' '}
        <Price cents={totalCents} className="text-[length:var(--text-sm)]" /> au total
      </p>

      {/* Tableau — laptop et plus */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[54rem] border-collapse text-left text-[length:var(--text-sm)]">
          <caption className="sr-only">Liste des réservations</caption>
          <thead>
            <tr className="text-[length:var(--text-2xs)] uppercase tracking-[0.12em] text-anthracite/45">
              <th scope="col" className="border-b-2 border-anthracite/12 pb-3 pr-3">Date</th>
              <th scope="col" className="border-b-2 border-anthracite/12 pb-3 pr-3">Client</th>
              <th scope="col" className="border-b-2 border-anthracite/12 pb-3 pr-3">Formule</th>
              <th scope="col" className="border-b-2 border-anthracite/12 pb-3 pr-3">Pers.</th>
              <th scope="col" className="border-b-2 border-anthracite/12 pb-3 pr-3">Paiement</th>
              <th scope="col" className="border-b-2 border-anthracite/12 pb-3 pr-3">Statut</th>
              <th scope="col" className="border-b-2 border-anthracite/12 pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((booking) => {
              const user = usersById.get(booking.userId);
              const offer = OFFERS_BY_ID[booking.offerId];
              const status = STATUS_STYLES[booking.status];
              return (
                <tr key={booking.id} className="align-middle">
                  <td className="border-b border-anthracite/8 py-3 pr-3">
                    <span className="block font-semibold">{formatShortDate(booking.date)}</span>
                    <span className="text-[length:var(--text-xs)] text-anthracite/50">
                      {formatTime(booking.startTime)}
                    </span>
                  </td>
                  <td className="border-b border-anthracite/8 py-3 pr-3">
                    <span className="block font-semibold">
                      {user ? `${user.firstName} ${user.lastName}` : 'Supprimé'}
                    </span>
                    <span className="text-[length:var(--text-xs)] text-anthracite/50">{user?.phone ?? user?.email}</span>
                  </td>
                  <td className="border-b border-anthracite/8 py-3 pr-3">{offer.name}</td>
                  <td className="border-b border-anthracite/8 py-3 pr-3">{booking.participants}</td>
                  <td className="border-b border-anthracite/8 py-3 pr-3">
                    <span className="block">
                      <Price cents={booking.payment.amountCents} className="text-[length:var(--text-sm)]" />
                    </span>
                    <span className="text-[length:var(--text-xs)] text-anthracite/50">
                      {booking.payment.method === 'online' ? 'en ligne' : 'sur place'}
                      {booking.payment.status === 'pending' && ' · à encaisser'}
                    </span>
                  </td>
                  <td className="border-b border-anthracite/8 py-3 pr-3">
                    <span className={`rounded-full px-2.5 py-1 text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.08em] ${status.className}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="border-b border-anthracite/8 py-3">
                    <Actions booking={booking} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cartes — tablette et mobile */}
      <ul className="flex flex-col gap-3 lg:hidden">
        {rows.map((booking) => {
          const user = usersById.get(booking.userId);
          const offer = OFFERS_BY_ID[booking.offerId];
          const status = STATUS_STYLES[booking.status];
          return (
            <li key={booking.id} className="u-card flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-semibold">
                    {user ? `${user.firstName} ${user.lastName}` : 'Client supprimé'}
                  </span>
                  <span className="text-[length:var(--text-xs)] text-anthracite/55">
                    {formatLongDate(booking.date)} · {formatTime(booking.startTime)}
                  </span>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[length:var(--text-2xs)] font-bold uppercase ${status.className}`}>
                  {status.label}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[length:var(--text-xs)]">
                <div className="flex justify-between gap-2">
                  <dt className="text-anthracite/50">Formule</dt>
                  <dd className="text-right font-semibold">{offer.name}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-anthracite/50">Pers.</dt>
                  <dd className="text-right font-semibold">{booking.participants}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-anthracite/50">Montant</dt>
                  <dd className="text-right font-semibold">
                    <Price cents={booking.payment.amountCents} className="text-[length:var(--text-xs)]" />
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-anthracite/50">Paiement</dt>
                  <dd className="text-right font-semibold">
                    {booking.payment.status === 'paid' ? 'Réglé' : booking.payment.status === 'refunded' ? 'Remboursé' : 'Sur place'}
                  </dd>
                </div>
              </dl>

              <Actions booking={booking} />
            </li>
          );
        })}
      </ul>

      {rows.length === 0 && (
        <p className="u-card px-4 py-10 text-center text-anthracite/55">
          Aucune réservation ne correspond à ces filtres.
        </p>
      )}
    </div>
  );
}

function Actions({ booking }: { booking: Booking }) {
  const upcoming = toDateTime(booking.date, booking.endTime).getTime() >= Date.now();

  return (
    <div className="flex flex-wrap gap-2">
      {booking.payment.status === 'pending' && booking.status !== 'cancelled' && (
        <Button size="sm" variant="jade" onClick={() => void db.setPaymentStatus(booking.id, 'paid')}>
          Encaissé
        </Button>
      )}
      {booking.status === 'confirmed' && upcoming && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (window.confirm('Annuler cette réservation ? Le client sera prévenu par email.')) {
              void db.cancelBooking(booking.id, 'studio');
            }
          }}
          className="text-orange-dark"
        >
          Annuler
        </Button>
      )}
      {booking.status === 'confirmed' && !upcoming && (
        <>
          <Button size="sm" variant="ghost" onClick={() => void db.setBookingStatus(booking.id, 'completed')} className="text-anthracite/60">
            Honorée
          </Button>
          <Button size="sm" variant="ghost" onClick={() => void db.setBookingStatus(booking.id, 'no_show')} className="text-anthracite/60">
            Absent
          </Button>
        </>
      )}
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import type { AdminSection } from './AdminShell';
import { Gauge } from './Charts';
import { Button } from '@/components/ui/Button';
import { OFFERS_BY_ID } from '@/data/offers';
import { COLOR_CLASSES } from '@/lib/colors';
import { addDays, formatRelativeDay, formatTime, startOfWeek, todayIso } from '@/lib/date';
import { formatPrice } from '@/lib/format';
import { useAdminScope } from './AdminScope';
import { bookingsOfDay, summarize, upcomingBookings } from '@/lib/stats';
import type { Booking, User } from '@/lib/types';

export function AdminOverview({ onNavigate }: { onNavigate: (section: AdminSection) => void }) {
  // Les chiffres portent sur le périmètre consulté, mais le calcul des
  // créneaux ouvrables reste celui du studio : c'est ce qui donne un taux de
  // remplissage comparable d'un coach à l'autre.
  const { data: state, availability } = useAdminScope();
  const today = todayIso();

  const week = useMemo(() => {
    const start = startOfWeek(today);
    return summarize(state.bookings, start, addDays(start, 6), availability);
  }, [state.bookings, availability, today]);

  const month = useMemo(() => {
    const start = addDays(today, -29);
    return summarize(state.bookings, start, today, availability);
  }, [state.bookings, availability, today]);

  const todayBookings = bookingsOfDay(state.bookings, today);
  const next = upcomingBookings(state.bookings, 6);
  const usersById = useMemo(() => new Map(state.users.map((u) => [u.id, u])), [state.users]);

  const activeBlocks = state.blocks.filter((b) => b.endDate >= today);

  return (
    <div className="flex flex-col gap-6">
      {/* Chiffres clés */}
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Séances cette semaine" value={String(week.bookings)} detail={`${week.participants} participants`} />
        <KpiCard label="Recette de la semaine" value={formatPrice(week.revenueCents)} detail={week.pendingCents > 0 ? `dont ${formatPrice(week.pendingCents)} à encaisser` : 'tout est réglé'} />
        <KpiCard label="Recette 30 derniers jours" value={formatPrice(month.revenueCents)} detail={`${month.bookings} séances`} />
        <KpiCard
          label="Annulations (30 j)"
          value={String(month.cancelled)}
          detail={month.noShow > 0 ? `${month.noShow} non honorée${month.noShow > 1 ? 's' : ''}` : 'aucune absence'}
          tone={month.cancelled > 6 ? 'warn' : 'neutral'}
        />
      </ul>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        {/* Programme du jour */}
        <section className="u-card flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[length:var(--text-2xl)]">Aujourd’hui</h2>
            <span className="rounded-full bg-anthracite/6 px-3 py-1.5 text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.12em] text-anthracite/55">
              {todayBookings.length} séance{todayBookings.length > 1 ? 's' : ''}
            </span>
          </div>

          {todayBookings.length === 0 ? (
            <p className="rounded-xl bg-anthracite/4 px-4 py-6 text-center text-anthracite/55">
              Aucune séance prévue aujourd’hui.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {todayBookings.map((booking) => (
                <SessionRow key={booking.id} booking={booking} user={usersById.get(booking.userId)} />
              ))}
            </ul>
          )}

          <Button variant="dark" size="sm" onClick={() => onNavigate('calendar')} className="self-start">
            Ouvrir le calendrier
          </Button>
        </section>

        {/* Remplissage + blocages */}
        <div className="flex flex-col gap-4">
          <section className="u-card flex flex-col items-center gap-3 p-5 sm:p-6">
            <h2 className="self-start text-[length:var(--text-2xl)]">Remplissage</h2>
            <div className="flex w-full flex-wrap items-center justify-around gap-4">
              <Gauge ratio={week.occupancy} label="Cette semaine" />
              <Gauge ratio={month.occupancy} label="30 derniers jours" />
            </div>
            <p className="text-center text-[length:var(--text-2xs)] leading-relaxed text-anthracite/50">
              Part des créneaux ouverts effectivement réservés, hors périodes bloquées.
            </p>
          </section>

          <section className="u-card flex flex-col gap-3 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[length:var(--text-xl)]">Indisponibilités à venir</h2>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('blocks')} className="text-anthracite/55">
                Gérer
              </Button>
            </div>
            {activeBlocks.length === 0 ? (
              <p className="text-[length:var(--text-sm)] text-anthracite/55">Aucun blocage enregistré.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {activeBlocks.slice(0, 4).map((block) => (
                  <li key={block.id} className="flex items-center justify-between gap-3 text-[length:var(--text-sm)]">
                    <span className="min-w-0 truncate text-anthracite/75">{block.reason}</span>
                    <span className="shrink-0 text-[length:var(--text-2xs)] text-anthracite/45">
                      {formatRelativeDay(block.startDate)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* Prochaines séances */}
      <section className="u-card flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[length:var(--text-2xl)]">Prochaines séances</h2>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('bookings')} className="text-anthracite/55">
            Toutes les réservations
          </Button>
        </div>
        {next.length === 0 ? (
          <p className="text-anthracite/55">Aucune séance à venir.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {next.map((booking) => (
              <SessionRow key={booking.id} booking={booking} user={usersById.get(booking.userId)} showDate />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  detail,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  detail: string;
  tone?: 'neutral' | 'warn';
}) {
  return (
    <li className={`u-card flex flex-col gap-1 p-4 sm:p-5 ${tone === 'warn' ? 'border-orange/40' : ''}`}>
      <span className="text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.12em] text-anthracite/45">
        {label}
      </span>
      <span className="font-display text-[length:var(--text-3xl)] leading-none">{value}</span>
      <span className="text-[length:var(--text-xs)] text-anthracite/55">{detail}</span>
    </li>
  );
}

function SessionRow({
  booking,
  user,
  showDate,
}: {
  booking: Booking;
  user?: User;
  showDate?: boolean;
}) {
  const offer = OFFERS_BY_ID[booking.offerId];
  const color = COLOR_CLASSES[offer.color];

  return (
    <li className="flex items-center gap-3 rounded-xl bg-creme px-3.5 py-3">
      <span className={`flex w-14 shrink-0 flex-col items-center rounded-lg px-1 py-1.5 text-creme ${color.solid}`}>
        <span className="font-display text-[length:var(--text-sm)] leading-none">{formatTime(booking.startTime)}</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-semibold">
          {user ? `${user.firstName} ${user.lastName}` : 'Client supprimé'}
          {booking.participants > 1 && (
            <span className="ml-1.5 text-anthracite/45">+{booking.participants - 1}</span>
          )}
        </span>
        <span className="truncate text-[length:var(--text-xs)] text-anthracite/55">
          {offer.name}
          {showDate && ` · ${formatRelativeDay(booking.date)}`}
          {booking.notes && ' · note'}
        </span>
      </span>
      <span
        className={[
          'shrink-0 rounded-full px-2.5 py-1 text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.08em]',
          booking.payment.status === 'paid' ? 'bg-jade/15 text-jade-dark' : 'bg-orange/15 text-orange-dark',
        ].join(' ')}
      >
        {booking.payment.status === 'paid' ? 'Réglé' : 'Sur place'}
      </span>
    </li>
  );
}

'use client';

import { useState } from 'react';
import { Calendar } from '@/components/booking/Calendar';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/Field';
import { Price } from '@/components/ui/Price';
import { OFFERS_BY_ID } from '@/data/offers';
import { bookingHorizonEnd, canSelfManage, computeDaySlots, type AvailabilityInput } from '@/lib/availability';
import { COLOR_CLASSES } from '@/lib/colors';
import { SCHEDULE, STUDIO } from '@/lib/config';
import { formatLongDate, formatTime, hoursUntil, todayIso } from '@/lib/date';
import { useAction } from '@/lib/hooks/useDatabase';
import { bookingToClientIcs, downloadIcs } from '@/lib/ics';
import { db } from '@/lib/store/database';
import type { Booking, IsoDate, Time } from '@/lib/types';

const STATUS_LABELS: Record<Booking['status'], { label: string; className: string }> = {
  confirmed: { label: 'Confirmée', className: 'bg-jade/15 text-jade-dark' },
  completed: { label: 'Terminée', className: 'bg-anthracite/8 text-anthracite/60' },
  cancelled: { label: 'Annulée', className: 'bg-orange/15 text-orange-dark' },
  no_show: { label: 'Non honorée', className: 'bg-brun/15 text-brun' },
};

const PAYMENT_LABELS: Record<Booking['payment']['status'], string> = {
  paid: 'Réglé en ligne',
  pending: 'À régler sur place',
  refunded: 'Remboursé',
};

export function BookingCard({
  booking,
  availability,
  past = false,
}: {
  booking: Booking;
  availability: AvailabilityInput;
  past?: boolean;
}) {
  const offer = OFFERS_BY_ID[booking.offerId];
  const color = COLOR_CLASSES[offer.color];
  const status = STATUS_LABELS[booking.status];
  const editable = canSelfManage(booking);
  const hoursLeft = hoursUntil(booking.date, booking.startTime);

  const [mode, setMode] = useState<'idle' | 'reschedule' | 'confirm-cancel'>('idle');
  const [newDate, setNewDate] = useState<IsoDate | null>(null);
  const [newTime, setNewTime] = useState<Time | null>(null);

  const cancel = useAction(() => db.cancelBooking(booking.id, 'client'));
  const reschedule = useAction((d: IsoDate, t: Time) => db.rescheduleBooking(booking.id, d, t));

  const slots = newDate
    ? computeDaySlots(newDate, { ...availability, ignoreBookingId: booking.id }).filter((s) => s.state === 'available')
    : [];

  return (
    <article
      className={[
        'u-card flex flex-col gap-4 p-5 transition-opacity duration-300 sm:p-6',
        booking.status === 'cancelled' ? 'opacity-65' : '',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className={`flex items-center gap-2 text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.16em] ${color.text}`}>
            <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${color.dot}`} />
            {offer.name}
          </span>
          <h3 className="text-[length:var(--text-2xl)] leading-none">
            {formatLongDate(booking.date)}
          </h3>
          <p className="text-[length:var(--text-sm)] text-anthracite/60">
            {formatTime(booking.startTime)} — {formatTime(booking.endTime)} · {booking.participants}{' '}
            {booking.participants > 1 ? 'personnes' : 'personne'}
            {booking.guestNames.length > 0 && ` (avec ${booking.guestNames.join(', ')})`}
          </p>
        </div>

        <span className={`shrink-0 rounded-full px-3 py-1.5 text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.1em] ${status.className}`}>
          {status.label}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-anthracite/10 pt-4 text-[length:var(--text-sm)] text-anthracite/65">
        <span className="font-mono text-[length:var(--text-xs)] font-semibold tracking-wider text-anthracite">
          {booking.reference}
        </span>
        <span>
          {PAYMENT_LABELS[booking.payment.status]} ·{' '}
          <Price cents={booking.payment.amountCents} className="text-[length:var(--text-sm)]" />
        </span>
      </div>

      {booking.notes && (
        <p className="rounded-xl bg-anthracite/4 px-4 py-3 text-[length:var(--text-sm)] leading-relaxed text-anthracite/70">
          <span className="font-semibold">Votre note&nbsp;: </span>
          {booking.notes}
        </p>
      )}

      {(cancel.error || reschedule.error) && <FormError>{cancel.error ?? reschedule.error}</FormError>}

      {/* Actions — uniquement pour les séances à venir et confirmées */}
      {!past && booking.status === 'confirmed' && (
        <>
          {editable ? (
            <div className="flex flex-col gap-3">
              {mode === 'idle' && (
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <Button variant="dark" size="sm" onClick={() => setMode('reschedule')} className="sm:flex-1">
                    Reporter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMode('confirm-cancel')}
                    className="text-anthracite/70 sm:flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadIcs(bookingToClientIcs(booking), `bouge-${booking.reference}`)}
                    className="text-anthracite/60 sm:flex-1"
                  >
                    Ajouter à l’agenda
                  </Button>
                </div>
              )}

              {mode === 'confirm-cancel' && (
                <div className="flex flex-col gap-3 rounded-2xl border-2 border-orange/40 bg-orange/8 p-4">
                  <p className="text-[length:var(--text-sm)] leading-relaxed">
                    Annuler cette séance&nbsp;? Le créneau sera immédiatement remis à disposition.
                    {booking.payment.status === 'paid' && ' Votre paiement sera remboursé sous 14 jours.'}
                  </p>
                  <div className="flex flex-col gap-2.5 sm:flex-row">
                    <Button
                      size="sm"
                      onClick={() => void cancel.run()}
                      disabled={cancel.pending}
                      className="sm:flex-1"
                    >
                      {cancel.pending ? 'Annulation…' : 'Oui, annuler'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setMode('idle')} className="sm:flex-1">
                      Garder ma séance
                    </Button>
                  </div>
                </div>
              )}

              {mode === 'reschedule' && (
                <div className="flex flex-col gap-4 rounded-2xl border-2 border-anthracite/12 bg-creme p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-[length:var(--text-lg)]">Choisir un nouveau créneau</h4>
                    <Button variant="ghost" size="sm" onClick={() => setMode('idle')} className="text-anthracite/55">
                      Fermer
                    </Button>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_1fr]">
                    <Calendar
                      value={newDate}
                      onSelect={(d) => {
                        setNewDate(d);
                        setNewTime(null);
                      }}
                      availability={{ ...availability, ignoreBookingId: booking.id }}
                      minDate={todayIso()}
                      maxDate={bookingHorizonEnd()}
                    />

                    <div className="flex flex-col gap-3">
                      {!newDate && <p className="text-[length:var(--text-sm)] text-anthracite/55">Choisissez d’abord une date.</p>}
                      {newDate && (
                        <ul className="grid grid-cols-[repeat(auto-fill,minmax(4.75rem,1fr))] gap-2">
                          {slots.map((slot) => (
                            <li key={slot.startTime}>
                              <button
                                type="button"
                                aria-pressed={newTime === slot.startTime}
                                onClick={() => setNewTime(slot.startTime)}
                                className={[
                                  'min-h-11 w-full rounded-xl border-2 text-[length:var(--text-sm)] font-semibold transition-colors duration-200',
                                  newTime === slot.startTime
                                    ? 'border-orange bg-orange text-creme'
                                    : 'border-anthracite/15 bg-blanc hover:border-orange hover:bg-orange/10',
                                ].join(' ')}
                              >
                                {formatTime(slot.startTime)}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <Button
                        size="md"
                        disabled={!newDate || !newTime || reschedule.pending}
                        onClick={async () => {
                          if (!newDate || !newTime) return;
                          const ok = await reschedule.run(newDate, newTime);
                          if (ok !== undefined) setMode('idle');
                        }}
                        className="mt-auto"
                      >
                        {reschedule.pending ? 'Report…' : 'Confirmer le report'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="flex items-start gap-2.5 rounded-xl bg-anthracite/5 px-4 py-3 text-[length:var(--text-sm)] leading-relaxed text-anthracite/70">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.9" className="mt-0.5 size-4 shrink-0 text-anthracite/45" aria-hidden="true">
                <circle cx="10" cy="10" r="8" />
                <path d="M10 5.6V10l2.6 1.8" strokeLinecap="round" />
              </svg>
              <span>
                {hoursLeft > 0
                  ? `Il reste moins de ${SCHEDULE.cancellationNoticeHours} h avant la séance : le report et l’annulation ne sont plus possibles en ligne.`
                  : 'Cette séance a commencé ou est passée.'}{' '}
                Pour toute demande, appelez le studio au{' '}
                <a href={`tel:${STUDIO.phoneHref}`} className="font-semibold text-orange">
                  {STUDIO.phone}
                </a>
                .
              </span>
            </p>
          )}
        </>
      )}
    </article>
  );
}

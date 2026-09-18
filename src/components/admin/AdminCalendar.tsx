'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { OFFERS_BY_ID } from '@/data/offers';
import { computeDaySlots, openingTimes, type AvailabilityInput } from '@/lib/availability';
import { SCHEDULE } from '@/lib/config';
import {
  addDays,
  formatLongDate,
  formatShortDate,
  formatTime,
  fromIso,
  startOfWeek,
  todayIso,
  WEEKDAY_SHORT,
} from '@/lib/date';
import { useAdminData, useAdminScope } from './AdminScope';
import { useCurrentCoach } from '@/lib/hooks/useDatabase';
import { db } from '@/lib/store/database';
import type { IsoDate, Slot, Time } from '@/lib/types';

/**
 * Vue calendrier du gérant.
 *
 * Grille hebdomadaire à partir de 768px (jours en colonnes, heures en lignes),
 * et sélecteur de jour + liste verticale en dessous : sur un téléphone, une
 * grille 7×14 serait illisible, alors qu'une liste d'une journée reste
 * parfaitement utilisable au pouce.
 *
 * Un clic sur un créneau libre le bloque ; un clic sur un créneau bloqué le
 * libère. Les créneaux réservés ouvrent le détail de la réservation.
 */
export function AdminCalendar() {
  const { data: state, full, availability, coach, canSeeBooking } = useAdminScope();
  const myCoach = useCurrentCoach();

  /**
   * Coach dont les séances sont mises en avant.
   *
   * C'est celui de l'espace consulté ; dans la vue « tout le studio », c'est
   * la personne connectée. Le gérant repère ainsi d'un coup d'œil les séances
   * qu'il assure lui-même au milieu de celles de son équipe, ce qui est la
   * question qu'on se pose en ouvrant son agenda de la semaine.
   */
  const focusCoachId = coach?.id ?? myCoach?.id;
  const [weekStart, setWeekStart] = useState<IsoDate>(startOfWeek(todayIso()));
  const [selectedDay, setSelectedDay] = useState<IsoDate>(todayIso());
  const [detail, setDetail] = useState<Slot | null>(null);

  // Lundi → samedi : le dimanche est fermé, on ne l'affiche pas.
  const days = useMemo(() => Array.from({ length: 6 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  // Toutes les heures ouvrables de la semaine, pour aligner les lignes.
  const hours = useMemo(() => {
    const set = new Set<Time>();
    days.forEach((day) => openingTimes(day).forEach((time) => set.add(time)));
    return [...set].sort();
  }, [days]);

  const slotsByDay = useMemo(
    () => new Map(days.map((day) => [day, computeDaySlots(day, { ...availability, now: new Date(0) })])),
    [days, availability],
  );

  const usersById = useMemo(() => new Map(state.users.map((u) => [u.id, u])), [state.users]);

  /**
   * Libellé d'un créneau occupé.
   *
   * Une séance hors périmètre reste visible — la salle est bel et bien prise —
   * mais sans le nom du client : un coach n'a pas à connaître la clientèle de
   * ses collègues. Seul le prénom du coach s'affiche, pour que l'agenda reste
   * compréhensible.
   */
  const bookedLabel = (slot: Slot): string => {
    if (canSeeBooking(slot.bookingId)) {
      const booking = state.bookings.find((b) => b.id === slot.bookingId);
      return usersById.get(booking?.userId ?? '')?.firstName ?? 'Réservé';
    }
    const other = full.coaches.find((c) => c.id === slot.coachId);
    return other ? `Séance · ${other.firstName}` : 'Séance';
  };

  /** La séance est-elle assurée par le coach mis en avant ? */
  const isOwnSlot = (slot: Slot): boolean =>
    slot.state === 'booked' && Boolean(focusCoachId) && slot.coachId === focusCoachId;

  /** Titre de la sortie occupant le créneau. */
  const runLabel = (slot: Slot): string => {
    if (slot.state !== 'run') return '';
    const run = full.runs.find((r) => r.id === slot.runId);
    return run ? run.title : 'Sortie collective';
  };

  /** Nom du coach du créneau, pour l'infobulle. */
  const coachNameOf = (slot: Slot): string | undefined =>
    full.coaches.find((c) => c.id === slot.coachId)?.firstName;

  const toggleSlot = async (slot: Slot) => {
    if (slot.state === 'booked') {
      // Le détail d'une séance qu'on n'assure pas n'est pas consultable.
      if (canSeeBooking(slot.bookingId)) setDetail(slot);
      return;
    }
    if (slot.state === 'run') {
      // Une sortie se gère depuis « Les runs » : un clic ici ne doit surtout
      // pas poser un blocage par-dessus, ce que ferait la suite sans ce garde.
      return;
    }
    if (slot.state === 'blocked' && slot.blockId) {
      const block = state.blocks.find((b) => b.id === slot.blockId);
      // On ne défait ici que les blocages d'un seul créneau : lever une période
      // entière d'un clic serait trop facile à déclencher par erreur.
      if (block?.type === 'slot' && block.startDate === block.endDate) {
        await db.deleteBlock(block.id);
      } else {
        window.alert(
          'Ce créneau fait partie d’une période bloquée. Rendez-vous dans « Indisponibilités » pour la modifier.',
        );
      }
      return;
    }
    await db.createBlock({
      // Dans l'espace d'un coach, le blocage ne vaut que pour lui. Dans la vue
      // « tout le studio », il ferme le créneau pour tout le monde.
      coachId: coach?.id,
      type: 'slot',
      startDate: slot.date,
      endDate: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      reason: coach ? `${coach.firstName} — indisponible` : 'Indisponible',
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Navigation de semaine */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setWeekStart(addDays(weekStart, -7))} className="text-anthracite/65">
            ← Semaine
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setWeekStart(startOfWeek(todayIso()))} className="text-anthracite/65">
            Aujourd’hui
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setWeekStart(addDays(weekStart, 7))} className="text-anthracite/65">
            Semaine →
          </Button>
        </div>
        <p className="text-[length:var(--text-sm)] font-semibold text-anthracite/70">
          {formatShortDate(weekStart)} — {formatShortDate(addDays(weekStart, 5))}
        </p>
      </div>

      <Legend
        withTeam={full.coaches.length > 1}
        withRuns={full.runs.length > 0}
        focusName={full.coaches.find((c) => c.id === focusCoachId)?.firstName}
      />

      {/* Grille hebdomadaire — tablette et plus */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[42rem] border-separate border-spacing-1">
          <caption className="sr-only">
            Planning de la semaine du {formatLongDate(weekStart)}
          </caption>
          <thead>
            <tr>
              <th scope="col" className="w-14 text-left text-[length:var(--text-2xs)] font-bold uppercase tracking-wider text-anthracite/40">
                <span className="sr-only">Heure</span>
              </th>
              {days.map((day) => {
                const isToday = day === todayIso();
                return (
                  <th key={day} scope="col" className="pb-1">
                    <span
                      className={`flex flex-col items-center rounded-lg py-1.5 ${
                        isToday ? 'bg-anthracite text-creme' : 'text-anthracite/70'
                      }`}
                    >
                      <span className="text-[length:var(--text-2xs)] font-bold uppercase tracking-wider opacity-70">
                        {WEEKDAY_SHORT[fromIso(day).getDay()]}
                      </span>
                      <span className="font-display text-[length:var(--text-lg)] leading-none">
                        {fromIso(day).getDate()}
                      </span>
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {hours.map((hour) => (
              <tr key={hour}>
                <th scope="row" className="pr-1 text-right align-middle text-[length:var(--text-2xs)] font-semibold text-anthracite/40">
                  {formatTime(hour)}
                </th>
                {days.map((day) => {
                  const slot = slotsByDay.get(day)?.find((s) => s.startTime === hour);
                  if (!slot) {
                    return <td key={day} className="h-10 rounded-md bg-anthracite/3" aria-hidden="true" />;
                  }
                  return (
                    <td key={day} className="h-10 p-0">
                      <SlotButton
                        slot={slot}
                        label={slot.state === 'booked' ? bookedLabel(slot) : runLabel(slot)}
                        coachName={coachNameOf(slot)}
                        own={isOwnSlot(slot)}
                        onClick={() => void toggleSlot(slot)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vue mobile : sélecteur de jour + liste */}
      <div className="flex flex-col gap-3 md:hidden">
        <ul className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {days.map((day) => {
            const active = day === selectedDay;
            return (
              <li key={day} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  aria-pressed={active}
                  className={[
                    'flex min-h-14 w-14 flex-col items-center justify-center rounded-xl transition-colors duration-200',
                    active ? 'bg-anthracite text-creme' : 'bg-blanc text-anthracite/65',
                  ].join(' ')}
                >
                  <span className="text-[length:var(--text-2xs)] font-bold uppercase tracking-wider opacity-70">
                    {WEEKDAY_SHORT[fromIso(day).getDay()]}
                  </span>
                  <span className="font-display text-[length:var(--text-lg)] leading-none">{fromIso(day).getDate()}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="text-[length:var(--text-sm)] font-semibold">{formatLongDate(selectedDay)}</p>

        <ul className="flex flex-col gap-1.5">
          {(slotsByDay.get(selectedDay) ?? computeDaySlots(selectedDay, { ...availability, now: new Date(0) })).map(
            (slot) => {
              const booking = state.bookings.find((b) => b.id === slot.bookingId);
              const user = booking ? usersById.get(booking.userId) : undefined;
              const mine = canSeeBooking(slot.bookingId);
              return (
                <li key={slot.startTime} className="flex items-center gap-2">
                  <span className="w-12 shrink-0 text-[length:var(--text-xs)] font-semibold text-anthracite/45">
                    {formatTime(slot.startTime)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <SlotButton
                      slot={slot}
                      label={
                        slot.state === 'booked'
                          ? mine
                            ? `${user?.firstName ?? 'Client'} · ${booking ? OFFERS_BY_ID[booking.offerId].name : ''}`
                            : bookedLabel(slot)
                          : slot.state === 'run'
                            ? runLabel(slot)
                            : slot.state === 'blocked'
                            ? 'Bloqué'
                            : 'Libre'
                      }
                      coachName={coachNameOf(slot)}
                      own={isOwnSlot(slot)}
                      onClick={() => void toggleSlot(slot)}
                      tall
                    />
                  </span>
                </li>
              );
            },
          )}
          {(slotsByDay.get(selectedDay)?.length ?? 0) === 0 && (
            <li className="rounded-xl bg-anthracite/4 px-4 py-6 text-center text-anthracite/55">
              Studio fermé ce jour-là.
            </li>
          )}
        </ul>
      </div>

      {detail && <BookingDetail slot={detail} onClose={() => setDetail(null)} />}

      <p className="text-[length:var(--text-2xs)] leading-relaxed text-anthracite/50">
        Astuce&nbsp;: cliquez sur un créneau libre pour le bloquer, sur un créneau bloqué pour le rouvrir. Les
        périodes complètes (congés) se gèrent dans l’onglet «&nbsp;Indisponibilités&nbsp;». Les réservations sont
        ouvertes jusqu’à {SCHEDULE.bookingHorizonDays} jours à l’avance.
      </p>
    </div>
  );
}

/**
 * Un créneau dans la grille.
 *
 * ── Deux façons d'être occupé ───────────────────────────────────────────────
 * Une séance qu'on assure soi-même est en orange plein : c'est celle qui
 * engage, celle qu'il faut voir. Une séance tenue par quelqu'un d'autre est
 * en brun clair : la salle est prise, il n'y a rien à faire, l'œil passe.
 *
 * Le libellé disait déjà « Séance · Untel », mais dans une case de grille il
 * est tronqué, et il faut le lire. La couleur, elle, se voit sans lire —
 * c'est elle qui doit porter l'information.
 *
 * Le brun est choisi parce qu'il reste dans la famille chaude de l'orange
 * (donc « occupé », et non « libre » comme le vert) tout en étant nettement
 * plus discret. Il ne se confond ni avec le vert pâle d'un créneau libre, ni
 * avec l'anthracite plein d'un créneau bloqué.
 *
 * L'intensité n'est pas cosmétique : un premier essai à 18 % donnait un beige
 * si clair qu'il se distinguait mal du vert pâle d'un créneau libre. Or c'est
 * exactement la confusion à éviter — croire libre un créneau que la salle a
 * déjà pris. 32 % suffit à trancher, et reste loin de l'orange plein.
 */
function SlotButton({
  slot,
  label,
  onClick,
  tall,
  own = true,
  coachName,
}: {
  slot: Slot;
  label: string;
  onClick: () => void;
  tall?: boolean;
  /** La séance est-elle assurée par le coach de l'espace consulté ? */
  own?: boolean;
  /** Prénom du coach qui l'assure, pour l'infobulle. */
  coachName?: string;
}) {
  const styles: Record<string, string> = {
    available: 'bg-jade/12 text-jade-dark hover:bg-jade/25',
    booked: own
      ? 'bg-orange text-creme hover:bg-orange-dark'
      : 'bg-brun/32 text-brun hover:bg-brun/45',
    // Le ciel n'est employé nulle part ailleurs dans la grille : une sortie
    // ne se confond donc avec aucun autre état. Elle n'est pas cliquable, d'où
    // l'absence d'effet au survol.
    run: 'bg-ciel text-anthracite',
    blocked: 'bg-anthracite/70 text-creme hover:bg-anthracite',
    past: 'bg-anthracite/5 text-anthracite/30',
    closed: 'bg-anthracite/5 text-anthracite/30',
  };

  const state =
    slot.state === 'booked'
      ? own
        ? 'réservé'
        : `réservé${coachName ? ` — séance de ${coachName}` : ' par un autre coach'}`
      : slot.state === 'run'
        ? 'sortie collective'
        : slot.state === 'blocked'
          ? 'bloqué'
          : 'libre';

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${formatLongDate(slot.date)} à ${formatTime(slot.startTime)} — ${state}`}
      className={[
        'w-full truncate rounded-md px-1.5 text-[length:var(--text-2xs)] font-semibold transition-colors duration-200',
        tall ? 'min-h-11 text-left text-[length:var(--text-sm)]' : 'h-10',
        styles[slot.state] ?? styles.available,
      ].join(' ')}
    >
      {label}
    </button>
  );
}

function Legend({ withTeam, withRuns, focusName }: { withTeam: boolean; withRuns: boolean; focusName?: string }) {
  const items = [
    { label: 'Libre', className: 'bg-jade/25' },
    // Le libellé nomme la personne quand il y en a plusieurs : « Réservé »
    // tout court ne dirait pas de qui, ce qui est justement la question.
    { label: withTeam ? `Séance de ${focusName ?? 'vous'}` : 'Réservé', className: 'bg-orange' },
    ...(withTeam ? [{ label: 'Séance d’un autre coach', className: 'bg-brun/32' }] : []),
    ...(withRuns ? [{ label: 'Sortie collective', className: 'bg-ciel' }] : []),
    { label: 'Bloqué', className: 'bg-anthracite/70' },
    { label: 'Fermé', className: 'bg-anthracite/10' },
  ];
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[length:var(--text-2xs)] text-anthracite/55">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span aria-hidden="true" className={`size-3 rounded ${item.className}`} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

function BookingDetail({ slot, onClose }: { slot: Slot; onClose: () => void }) {
  const state = useAdminData();
  const booking = state.bookings.find((b) => b.id === slot.bookingId);
  const user = booking ? state.users.find((u) => u.id === booking.userId) : undefined;
  if (!booking) return null;
  const offer = OFFERS_BY_ID[booking.offerId];

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-anthracite/60 p-3 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="slot-detail-title"
        className="u-card w-full max-w-md overflow-y-auto p-6"
        style={{ animation: 'u-fade-up 0.35s cubic-bezier(0.22,1,0.36,1) both', maxHeight: '86svh' }}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.14em] text-orange">
              {offer.name}
            </span>
            <h3 id="slot-detail-title" className="text-[length:var(--text-2xl)] leading-none">
              {user ? `${user.firstName} ${user.lastName}` : 'Client supprimé'}
            </h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-anthracite/55">
            Fermer
          </Button>
        </div>

        <dl className="flex flex-col gap-2.5 text-[length:var(--text-sm)]">
          <Row label="Date">{formatLongDate(booking.date)}</Row>
          <Row label="Horaire">
            {formatTime(booking.startTime)} — {formatTime(booking.endTime)}
          </Row>
          <Row label="Participants">
            {booking.participants}
            {booking.guestNames.length > 0 && ` (${booking.guestNames.join(', ')})`}
          </Row>
          <Row label="Référence">{booking.reference}</Row>
          {user?.phone && <Row label="Téléphone">{user.phone}</Row>}
          {user?.email && <Row label="Email">{user.email}</Row>}
          {booking.notes && <Row label="Note">{booking.notes}</Row>}
        </dl>

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          {booking.payment.status === 'pending' && (
            <Button size="sm" variant="jade" onClick={() => void db.setPaymentStatus(booking.id, 'paid')} className="sm:flex-1">
              Marquer comme réglé
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (window.confirm('Annuler cette réservation et prévenir le client ?')) {
                void db.cancelBooking(booking.id, 'studio');
                onClose();
              }
            }}
            className="text-orange-dark sm:flex-1"
          >
            Annuler la séance
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-anthracite/8 pb-2 last:border-0">
      <dt className="shrink-0 text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.1em] text-anthracite/45">
        {label}
      </dt>
      <dd className="text-right font-semibold">{children}</dd>
    </div>
  );
}

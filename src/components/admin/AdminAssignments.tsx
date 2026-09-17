'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FormError, TextField } from '@/components/ui/Field';
import { CoachAvatar } from '@/components/ui/CoachAvatar';
import { openingTimes } from '@/lib/availability';
import { bookableCoaches, coachById, ownerCoach } from '@/lib/coaches';
import { COLOR_CLASSES } from '@/lib/colors';
import { addDays, formatLongDate, formatShortDate, formatTime, startOfWeek, todayIso } from '@/lib/date';
import { useAction } from '@/lib/hooks/useDatabase';
import { db } from '@/lib/store/database';
import type { BlockType, IsoDate } from '@/lib/types';
import { useAdminScope } from './AdminScope';

/**
 * « Qui assure quoi » — réservé au gérant.
 *
 * Le principe tient en une phrase : par défaut, le gérant assure tout. Une
 * affectation confie une plage à quelqu'un d'autre.
 *
 * Le vocabulaire est le même que celui des indisponibilités — journée, semaine,
 * période, créneau — parce que ce sont les mêmes situations : « je suis en
 * formation la semaine prochaine, Sarah prend le relais ».
 *
 * Deux affectations peuvent se chevaucher, et c'est voulu : « Karim prend la
 * semaine, sauf mardi 18 h que je garde » doit fonctionner sans découper la
 * semaine à la main. La plus précise l'emporte, puis la plus récente — règle
 * écrite dans resolveCoachId (src/lib/coaches.ts) et rappelée à l'écran.
 */
const TYPES: Array<{ id: BlockType; label: string; help: string }> = [
  { id: 'day', label: 'Une journée', help: 'Toute la journée choisie revient à ce coach.' },
  { id: 'week', label: 'Une semaine', help: 'Du lundi au dimanche de la semaine contenant la date choisie.' },
  { id: 'range', label: 'Une période', help: 'Congés, absence prolongée : indiquez le début et la fin.' },
  { id: 'slot', label: 'Un créneau', help: 'Une plage horaire précise, sur une seule journée.' },
];

const TYPE_LABELS: Record<BlockType, string> = {
  day: 'Journée',
  week: 'Semaine',
  range: 'Période',
  slot: 'Créneau',
};

export function AdminAssignments() {
  const { full, isOwner } = useAdminScope();
  const today = todayIso();

  const others = useMemo(
    () => bookableCoaches(full.coaches).filter((c) => !c.owner),
    [full.coaches],
  );
  const owner = ownerCoach(full.coaches);

  const [coachId, setCoachId] = useState('');
  const [type, setType] = useState<BlockType>('day');
  const [startDate, setStartDate] = useState<IsoDate>(today);
  const [endDate, setEndDate] = useState<IsoDate>(today);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const create = useAction(db.createAssignment.bind(db));
  const remove = useAction(db.deleteAssignment.bind(db));

  const times = useMemo(() => {
    const available = openingTimes(startDate);
    return available.length > 0 ? available : ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00'];
  }, [startDate]);

  const { upcoming, past } = useMemo(() => {
    const sorted = [...full.assignments].sort((a, b) => a.startDate.localeCompare(b.startDate));
    return {
      upcoming: sorted.filter((a) => a.endDate >= today),
      past: sorted.filter((a) => a.endDate < today).reverse(),
    };
  }, [full.assignments, today]);

  if (!isOwner) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!coachId) {
      setError('Choisissez le coach à qui confier cette plage.');
      return;
    }

    let from = startDate;
    let to = startDate;

    if (type === 'week') {
      from = startOfWeek(startDate);
      to = addDays(from, 6);
    } else if (type === 'range') {
      if (endDate < startDate) {
        setError('La date de fin doit être postérieure à la date de début.');
        return;
      }
      to = endDate;
    } else if (type === 'slot' && endTime <= startTime) {
      setError('L’heure de fin doit être postérieure à l’heure de début.');
      return;
    }

    const created = await create.run({
      coachId,
      type,
      startDate: from,
      endDate: to,
      startTime: type === 'slot' ? startTime : undefined,
      endTime: type === 'slot' ? endTime : undefined,
      note: note.trim() || undefined,
    });
    if (created) setNote('');
  };

  if (others.length === 0) {
    return (
      <div className="u-card flex flex-col items-start gap-3 p-5 sm:p-6">
        <h2 className="text-[length:var(--text-2xl)]">Vous assurez toutes les séances</h2>
        <p className="max-w-[60ch] text-[length:var(--text-sm)] leading-relaxed text-anthracite/65">
          Il n’y a personne d’autre dans l’équipe pour l’instant. Ajoutez un coach depuis «&nbsp;L’équipe&nbsp;»
          pour pouvoir lui confier une journée, une semaine ou un créneau.
        </p>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[22rem_1fr]">
      <form onSubmit={submit} className="u-card flex flex-col gap-4 p-5 sm:p-6">
        <h2 className="text-[length:var(--text-2xl)]">Confier une plage</h2>
        <p className="text-[length:var(--text-xs)] leading-relaxed text-anthracite/60">
          Hors des plages listées ici, c’est vous qui assurez les séances.
        </p>

        {(error || create.error) && <FormError>{error ?? create.error}</FormError>}

        <fieldset className="flex flex-col gap-2 border-0 p-0">
          <legend className="mb-1 text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.14em] text-anthracite/55">
            Coach
          </legend>
          <div className="flex flex-col gap-1.5">
            {others.map((coach) => (
              <button
                key={coach.id}
                type="button"
                onClick={() => setCoachId(coach.id)}
                aria-pressed={coachId === coach.id}
                className={[
                  'flex min-h-12 items-center gap-2.5 rounded-xl border-2 px-2 py-1 text-left text-[length:var(--text-sm)] font-semibold',
                  'transition-colors duration-200',
                  coachId === coach.id
                    ? `${COLOR_CLASSES[coach.color].border} ${COLOR_CLASSES[coach.color].soft} text-anthracite`
                    : 'border-anthracite/12 bg-creme text-anthracite/65 hover:border-anthracite/30',
                ].join(' ')}
              >
                <CoachAvatar coach={coach} size="sm" />
                <span className="min-w-0 truncate">
                  {coach.firstName} {coach.lastName}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2 border-0 p-0">
          <legend className="mb-1 text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.14em] text-anthracite/55">
            Étendue
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setType(item.id)}
                aria-pressed={type === item.id}
                className={[
                  'min-h-11 rounded-xl border-2 px-3 text-[length:var(--text-sm)] font-semibold transition-colors duration-200',
                  type === item.id
                    ? 'border-orange bg-orange/10 text-anthracite'
                    : 'border-anthracite/12 bg-creme text-anthracite/65 hover:border-anthracite/30',
                ].join(' ')}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="text-[length:var(--text-xs)] leading-relaxed text-anthracite/55">
            {TYPES.find((t) => t.id === type)?.help}
          </p>
        </fieldset>

        <TextField
          id="assign-start"
          label={type === 'range' ? 'Du' : type === 'week' ? 'Semaine contenant le' : 'Date'}
          type="date"
          value={startDate}
          min={today}
          onChange={(e) => setStartDate(e.target.value)}
        />

        {type === 'range' && (
          <TextField
            id="assign-end"
            label="Au"
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        )}

        {type === 'slot' && (
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.14em] text-anthracite/55">
                De
              </span>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="min-h-12 rounded-xl border-2 border-anthracite/15 bg-creme px-3 outline-none focus:border-orange"
              >
                {times.map((time) => (
                  <option key={time} value={time}>
                    {formatTime(time)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.14em] text-anthracite/55">
                À
              </span>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="min-h-12 rounded-xl border-2 border-anthracite/15 bg-creme px-3 outline-none focus:border-orange"
              >
                {[...times, '21:00', '22:00'].map((time) => (
                  <option key={time} value={time}>
                    {formatTime(time)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <TextField
          id="assign-note"
          label="Note"
          hint="facultatif, visible de vous seul"
          placeholder="Remplacement congés, suivi d’un client…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <Button type="submit" size="md" block disabled={create.pending}>
          {create.pending ? 'Enregistrement…' : 'Confier cette plage'}
        </Button>

        <p className="text-[length:var(--text-2xs)] leading-relaxed text-anthracite/50">
          Deux plages peuvent se superposer&nbsp;: la plus précise l’emporte. Confier une semaine à quelqu’un puis
          garder un créneau pour vous fonctionne, sans découper la semaine.
          {' '}Les séances déjà réservées gardent le coach annoncé au client.
        </p>
      </form>

      <div className="flex flex-col gap-5">
        {remove.error && <FormError>{remove.error}</FormError>}

        <AssignmentList
          title="À venir"
          empty={`Aucune plage confiée. ${owner ? owner.firstName : 'Vous'} assure toutes les séances.`}
          rows={upcoming}
          coaches={full.coaches}
          onDelete={(id) => void remove.run(id)}
        />

        {past.length > 0 && (
          <AssignmentList title="Passées" rows={past.slice(0, 8)} coaches={full.coaches} muted />
        )}
      </div>
    </div>
  );
}

function AssignmentList({
  title,
  rows,
  coaches,
  onDelete,
  empty,
  muted = false,
}: {
  title: string;
  rows: Array<{
    id: string;
    coachId: string;
    type: BlockType;
    startDate: IsoDate;
    endDate: IsoDate;
    startTime?: string;
    endTime?: string;
    note?: string;
  }>;
  coaches: Parameters<typeof coachById>[0];
  onDelete?: (id: string) => void;
  empty?: string;
  muted?: boolean;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[length:var(--text-xl)]">{title}</h2>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-anthracite/15 px-4 py-6 text-center text-[length:var(--text-sm)] text-anthracite/55">
          {empty}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => {
            const coach = coachById(coaches, row.coachId);
            const single = row.startDate === row.endDate;
            return (
              <li
                key={row.id}
                className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-anthracite/10 bg-blanc p-3 ${
                  muted ? 'opacity-60' : ''
                }`}
              >
                {coach && <CoachAvatar coach={coach} size="sm" />}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="text-[length:var(--text-sm)] font-semibold">
                    {coach ? `${coach.firstName} ${coach.lastName}` : 'Coach retiré de l’équipe'}
                  </p>
                  <p className="text-[length:var(--text-xs)] text-anthracite/60">
                    <span className="font-semibold text-anthracite/75">{TYPE_LABELS[row.type]}</span>
                    {' · '}
                    {single ? formatLongDate(row.startDate) : `${formatShortDate(row.startDate)} → ${formatShortDate(row.endDate)}`}
                    {row.startTime && row.endTime ? ` · ${formatTime(row.startTime)} — ${formatTime(row.endTime)}` : ''}
                  </p>
                  {row.note && <p className="text-[length:var(--text-xs)] italic text-anthracite/45">{row.note}</p>}
                </div>
                {onDelete && (
                  <Button variant="ghost" size="sm" onClick={() => onDelete(row.id)} className="text-orange-dark">
                    Reprendre
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

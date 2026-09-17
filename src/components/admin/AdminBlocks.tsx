'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FormError, TextField } from '@/components/ui/Field';
import { openingTimes } from '@/lib/availability';
import { addDays, formatLongDate, formatShortDate, formatTime, startOfWeek, todayIso } from '@/lib/date';
import { useAdminScope } from './AdminScope';
import { db } from '@/lib/store/database';
import type { Block, BlockType, IsoDate } from '@/lib/types';

/**
 * Gestion des indisponibilités du coach.
 *
 * Quatre granularités, correspondant aux situations réelles du studio :
 *  - journée entière (rendez-vous extérieur) ;
 *  - semaine entière (formation) ;
 *  - période (congés) ;
 *  - créneau précis (imprévu d'une ou deux heures).
 */
const TYPES: Array<{ id: BlockType; label: string; help: string }> = [
  { id: 'day', label: 'Une journée', help: 'Le studio est fermé toute la journée choisie.' },
  { id: 'week', label: 'Une semaine', help: 'Du lundi au dimanche de la semaine contenant la date choisie.' },
  { id: 'range', label: 'Une période', help: 'Congés, travaux : indiquez la date de début et de fin.' },
  { id: 'slot', label: 'Un créneau', help: 'Une plage horaire précise sur une seule journée.' },
];

const TYPE_LABELS: Record<BlockType, string> = {
  day: 'Journée',
  week: 'Semaine',
  range: 'Période',
  slot: 'Créneau',
};

export function AdminBlocks() {
  const { data: state, coach } = useAdminScope();
  const today = todayIso();

  const [type, setType] = useState<BlockType>('day');
  const [startDate, setStartDate] = useState<IsoDate>(today);
  const [endDate, setEndDate] = useState<IsoDate>(today);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const times = useMemo(() => {
    const available = openingTimes(startDate);
    // Journée fermée : on retombe sur une grille standard pour rester utilisable.
    return available.length > 0 ? available : ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00'];
  }, [startDate]);

  const { upcoming, past } = useMemo(() => {
    const sorted = [...state.blocks].sort((a, b) => a.startDate.localeCompare(b.startDate));
    return {
      upcoming: sorted.filter((b) => b.endDate >= today),
      past: sorted.filter((b) => b.endDate < today).reverse(),
    };
  }, [state.blocks, today]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

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
    } else if (type === 'slot') {
      if (endTime <= startTime) {
        setError('L’heure de fin doit être postérieure à l’heure de début.');
        return;
      }
    }

    await db.createBlock({
      // Dans l'espace d'un coach, l'indisponibilité ne vaut que pour lui : les
      // créneaux qu'il aurait assurés disparaissent, le reste du planning ne
      // bouge pas. Dans la vue « tout le studio », elle ferme pour tout le monde.
      coachId: coach?.id,
      type,
      startDate: from,
      endDate: to,
      startTime: type === 'slot' ? startTime : undefined,
      endTime: type === 'slot' ? endTime : undefined,
      reason: reason.trim() || (coach ? `${coach.firstName} — indisponible` : 'Indisponible'),
    });

    setReason('');
  };

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[22rem_1fr]">
      <form onSubmit={submit} className="u-card flex flex-col gap-4 p-5 sm:p-6">
        <h2 className="text-[length:var(--text-2xl)]">Bloquer une disponibilité</h2>
        <p className="text-[length:var(--text-xs)] leading-relaxed text-anthracite/60">
          {coach
            ? `Cette indisponibilité ne concerne que ${coach.firstName}. Les créneaux assurés par quelqu’un d’autre restent ouverts.`
            : 'Le studio sera fermé pour tout le monde sur la plage choisie.'}
        </p>

        {error && <FormError>{error}</FormError>}

        <fieldset className="flex flex-col gap-2 border-0 p-0">
          <legend className="mb-1 text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.14em] text-anthracite/55">
            Type de blocage
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
                  type === item.id ? 'border-orange bg-orange/10 text-anthracite' : 'border-anthracite/12 bg-creme text-anthracite/65 hover:border-anthracite/30',
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
          id="block-start"
          label={type === 'range' ? 'Du' : type === 'week' ? 'Semaine contenant le' : 'Date'}
          type="date"
          value={startDate}
          min={today}
          onChange={(e) => setStartDate(e.target.value)}
        />

        {type === 'range' && (
          <TextField
            id="block-end"
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
          id="block-reason"
          label="Motif"
          hint="facultatif"
          placeholder="Congés, formation, rendez-vous…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <Button type="submit" size="md" block>
          Bloquer
        </Button>

        <p className="text-[length:var(--text-2xs)] leading-relaxed text-anthracite/50">
          Un blocage rend les créneaux concernés invisibles à la réservation. Les réservations déjà confirmées sur
          ces créneaux ne sont pas annulées automatiquement&nbsp;: vérifiez l’onglet «&nbsp;Réservations&nbsp;».
        </p>
      </form>

      <div className="flex flex-col gap-5">
        <section className="flex flex-col gap-3">
          <h2 className="text-[length:var(--text-2xl)]">Blocages en cours et à venir</h2>
          {upcoming.length === 0 ? (
            <p className="u-card px-4 py-8 text-center text-anthracite/55">Aucun blocage enregistré.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {upcoming.map((block) => (
                <BlockRow key={block.id} block={block} />
              ))}
            </ul>
          )}
        </section>

        {past.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-[length:var(--text-xl)] text-anthracite/60">Blocages passés</h2>
            <ul className="flex flex-col gap-2.5 opacity-60">
              {past.slice(0, 6).map((block) => (
                <BlockRow key={block.id} block={block} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

function BlockRow({ block }: { block: Block }) {
  const single = block.startDate === block.endDate;

  return (
    <li className="u-card flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-anthracite px-2.5 py-1 text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.1em] text-creme">
            {TYPE_LABELS[block.type]}
          </span>
          <span className="font-semibold">{block.reason}</span>
        </span>
        <span className="text-[length:var(--text-sm)] text-anthracite/55">
          {single ? formatLongDate(block.startDate) : `${formatShortDate(block.startDate)} → ${formatShortDate(block.endDate)}`}
          {block.startTime && block.endTime && ` · ${formatTime(block.startTime)} — ${formatTime(block.endTime)}`}
        </span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          if (window.confirm('Lever ce blocage ? Les créneaux redeviendront réservables.')) {
            void db.deleteBlock(block.id);
          }
        }}
        className="text-orange-dark"
      >
        Lever
      </Button>
    </li>
  );
}

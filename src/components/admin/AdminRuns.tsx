'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FormError, TextArea, TextField } from '@/components/ui/Field';
import { openingTimes } from '@/lib/availability';
import { formatLongDate, formatTime, todayIso } from '@/lib/date';
import { useAction } from '@/lib/hooks/useDatabase';
import { pastRuns, placesLeft, RUN_CAPACITY, signupsForRun, upcomingRuns } from '@/lib/runs';
import { db } from '@/lib/store/database';
import type { IsoDate, SocialRun } from '@/lib/types';
import { useAdminScope } from './AdminScope';

/**
 * Les sorties collectives — réservé au gérant.
 *
 * C'est lui qui les anime toutes : il n'y a donc pas de choix de coach, et un
 * coach n'a pas accès à cette section.
 *
 * Une sortie occupe le gérant, pas la salle. Sur le créneau concerné, il ne
 * peut plus prendre de séance ; en revanche, un créneau confié à quelqu'un
 * d'autre reste réservable à la même heure — c'est rappelé sous le formulaire,
 * parce que ce n'est pas évident et que c'est exactement ce qui permet de
 * placer une sortie sans perdre de chiffre d'affaires.
 */
export function AdminRuns() {
  const { full, isOwner } = useAdminScope();
  const today = todayIso();

  const [date, setDate] = useState<IsoDate>(today);
  const [startTime, setStartTime] = useState('09:00');
  const [title, setTitle] = useState('Run du samedi');
  const [description, setDescription] = useState('');
  const [meetingPoint, setMeetingPoint] = useState('');
  const [capacity, setCapacity] = useState(RUN_CAPACITY);

  const create = useAction(db.createRun.bind(db));
  const cancel = useAction(db.cancelRun.bind(db));
  const remove = useAction(db.deleteRun.bind(db));

  const times = useMemo(() => {
    const open = openingTimes(date);
    // Journée fermée au studio : une sortie reste possible, elle se court
    // dehors. On propose alors une grille standard.
    return open.length > 0 ? open : ['08:00', '09:00', '10:00', '11:00', '18:00', '19:00'];
  }, [date]);

  const next = useMemo(() => upcomingRuns(full.runs), [full.runs]);
  const done = useMemo(() => pastRuns(full.runs), [full.runs]);

  if (!isOwner) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const created = await create.run({ date, startTime, title, description, meetingPoint, capacity });
    if (created) {
      setDescription('');
      setMeetingPoint('');
    }
  };

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[22rem_1fr]">
      <form onSubmit={submit} className="u-card flex flex-col gap-4 p-5 sm:p-6">
        <h2 className="text-[length:var(--text-2xl)]">Programmer une sortie</h2>

        {create.error && <FormError>{create.error}</FormError>}

        <TextField
          id="run-date"
          label="Date"
          type="date"
          value={date}
          min={today}
          onChange={(e) => setDate(e.target.value)}
        />

        <label className="flex flex-col gap-1.5">
          <span className="text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.14em] text-anthracite/55">
            Heure de départ
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

        <TextField
          id="run-title"
          label="Intitulé"
          hint="affiché sur le site"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <TextField
          id="run-place"
          label="Point de rendez-vous"
          hint="défaut : le studio"
          placeholder="Parvis de La Défense, sous la Grande Arche"
          value={meetingPoint}
          onChange={(e) => setMeetingPoint(e.target.value)}
        />

        <TextArea
          id="run-description"
          label="Description"
          hint="deux phrases suffisent"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <TextField
          id="run-capacity"
          label="Places"
          type="number"
          min={1}
          max={50}
          value={capacity}
          onChange={(e) => setCapacity(Number(e.target.value))}
        />

        <Button type="submit" size="md" block disabled={create.pending}>
          {create.pending ? 'Enregistrement…' : 'Programmer la sortie'}
        </Button>

        <p className="text-[length:var(--text-2xs)] leading-relaxed text-anthracite/50">
          La sortie vous occupe une heure&nbsp;: vous ne pourrez plus prendre de séance sur ce créneau. La salle,
          elle, reste libre — si vous avez confié le créneau à un autre coach dans «&nbsp;Qui assure quoi&nbsp;»,
          une séance de studio reste réservable pendant que vous courez.
        </p>
      </form>

      <div className="flex flex-col gap-6">
        {(cancel.error || remove.error) && <FormError>{cancel.error ?? remove.error}</FormError>}

        <RunList
          title="À venir"
          empty="Aucune sortie programmée. Le site annonce « les prochaines dates arrivent bientôt »."
          runs={next}
          signupCount={(id) => signupsForRun(full.runSignups, id).length}
          namesFor={(id) =>
            signupsForRun(full.runSignups, id)
              .map((s) => full.users.find((u) => u.id === s.userId))
              .filter((u): u is NonNullable<typeof u> => Boolean(u))
          }
          left={(run) => placesLeft(run, full.runSignups)}
          onCancel={(run) => {
            const count = signupsForRun(full.runSignups, run.id).length;
            const message =
              count > 0
                ? `Annuler « ${run.title} » ? Les ${count} personnes inscrites recevront un email.`
                : `Annuler « ${run.title} » ?`;
            if (window.confirm(message)) void cancel.run(run.id);
          }}
          onDelete={(run) => {
            if (window.confirm(`Supprimer définitivement « ${run.title} » ?`)) void remove.run(run.id);
          }}
        />

        {done.length > 0 && (
          <RunList
            title="Passées et annulées"
            runs={done.slice(0, 6)}
            signupCount={(id) => signupsForRun(full.runSignups, id).length}
            namesFor={(id) =>
              signupsForRun(full.runSignups, id)
                .map((s) => full.users.find((u) => u.id === s.userId))
                .filter((u): u is NonNullable<typeof u> => Boolean(u))
            }
            left={(run) => placesLeft(run, full.runSignups)}
            muted
          />
        )}
      </div>
    </div>
  );
}

function RunList({
  title,
  runs,
  empty,
  signupCount,
  namesFor,
  left,
  onCancel,
  onDelete,
  muted = false,
}: {
  title: string;
  runs: SocialRun[];
  empty?: string;
  signupCount: (runId: string) => number;
  namesFor: (runId: string) => Array<{ id: string; firstName: string; lastName: string; email: string }>;
  left: (run: SocialRun) => number;
  onCancel?: (run: SocialRun) => void;
  onDelete?: (run: SocialRun) => void;
  muted?: boolean;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[length:var(--text-xl)]">{title}</h2>

      {runs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-anthracite/15 px-4 py-6 text-center text-[length:var(--text-sm)] text-anthracite/55">
          {empty}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {runs.map((run) => {
            const count = signupCount(run.id);
            const cancelled = run.status === 'cancelled';
            return (
              <li
                key={run.id}
                className={`flex flex-col gap-3 rounded-2xl border border-anthracite/10 bg-blanc p-4 ${
                  muted || cancelled ? 'opacity-70' : ''
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-display text-[length:var(--text-xl)] leading-none">{run.title}</span>
                      {cancelled && (
                        <span className="rounded-full bg-orange/15 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-orange-dark">
                          Annulée
                        </span>
                      )}
                    </p>
                    <p className="text-[length:var(--text-xs)] text-anthracite/60">
                      {formatLongDate(run.date)} · {formatTime(run.startTime)} — {formatTime(run.endTime)} ·{' '}
                      {run.meetingPoint}
                    </p>
                  </div>

                  <p className="shrink-0 text-right">
                    <span className="font-display text-[length:var(--text-2xl)] leading-none">{count}</span>
                    <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-anthracite/45">
                      {count > 1 ? 'inscrits' : 'inscrit'} / {run.capacity}
                    </span>
                  </p>
                </div>

                {count > 0 && <Roster people={namesFor(run.id)} />}

                {!cancelled && (onCancel || onDelete) && (
                  <div className="flex flex-wrap gap-2 border-t border-anthracite/8 pt-3">
                    {onCancel && (
                      <Button variant="ghost" size="sm" onClick={() => onCancel(run)} className="text-orange-dark">
                        Annuler la sortie
                      </Button>
                    )}
                    {onDelete && count === 0 && (
                      <Button variant="ghost" size="sm" onClick={() => onDelete(run)} className="text-anthracite/55">
                        Supprimer
                      </Button>
                    )}
                    {left(run) === 0 && (
                      <span className="self-center text-[length:var(--text-xs)] font-semibold text-jade">Complet</span>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/**
 * Liste des inscrits.
 *
 * Les adresses sont affichées : c'est tout l'intérêt du dispositif pour le
 * studio — dix participants, dix contacts à relancer. Elles ne sortent pas de
 * l'espace du gérant.
 */
function Roster({ people }: { people: Array<{ id: string; firstName: string; lastName: string; email: string }> }) {
  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-[length:var(--text-sm)] font-semibold text-anthracite/70 marker:hidden hover:text-anthracite [&::-webkit-details-marker]:hidden">
        <span className="underline-offset-4 group-open:underline">Voir les inscrits</span>
      </summary>
      <ul className="mt-2 flex flex-col gap-1.5">
        {people.map((p) => (
          <li key={p.id} className="flex flex-wrap items-baseline gap-x-3 text-[length:var(--text-sm)]">
            <span className="font-semibold">
              {p.firstName} {p.lastName}
            </span>
            <a href={`mailto:${p.email}`} className="text-anthracite/55 underline-offset-4 hover:text-orange hover:underline">
              {p.email}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}

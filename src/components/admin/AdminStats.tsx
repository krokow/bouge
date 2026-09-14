'use client';

import { useMemo, useState } from 'react';
import { AreaChart, BarChart, DonutChart, Gauge } from './Charts';
import { Price } from '@/components/ui/Price';
import type { AvailabilityInput } from '@/lib/availability';
import { addDays, todayIso } from '@/lib/date';
import { formatPercent, formatPrice, formatPriceCompact } from '@/lib/format';
import { useDatabase } from '@/lib/hooks/useDatabase';
import {
  byWeekday,
  dailySeries,
  popularHours,
  revenueByOffer,
  summarize,
  topClients,
  weeklySeries,
} from '@/lib/stats';

const RANGES = [
  { id: 30, label: '30 jours' },
  { id: 90, label: '90 jours' },
  { id: 180, label: '6 mois' },
] as const;

export function AdminStats({ availability }: { availability: AvailabilityInput }) {
  const state = useDatabase();
  const [days, setDays] = useState<number>(30);
  const today = todayIso();
  const from = addDays(today, -(days - 1));

  const period = useMemo(
    () => state.bookings.filter((b) => b.date >= from && b.date <= today),
    [state.bookings, from, today],
  );

  const summary = useMemo(() => summarize(state.bookings, from, today, availability), [state.bookings, from, today, availability]);

  // En deçà de 60 jours, le détail quotidien reste lisible ; au-delà, on agrège
  // par semaine pour éviter une courbe illisible.
  const trend = useMemo(() => {
    if (days <= 30) {
      return dailySeries(state.bookings, days, today).map((d) => ({
        label: d.label,
        value: d.count,
        display: `${d.count} séance${d.count > 1 ? 's' : ''}`,
      }));
    }
    return weeklySeries(state.bookings, Math.ceil(days / 7), today).map((w) => ({
      label: w.label,
      value: w.count,
      display: `${w.count} séances`,
    }));
  }, [state.bookings, days, today]);

  const revenueTrend = useMemo(() => {
    const series = days <= 30 ? dailySeries(state.bookings, days, today) : weeklySeries(state.bookings, Math.ceil(days / 7), today);
    return series.map((entry) => ({
      label: entry.label,
      value: entry.revenue / 100,
      display: formatPriceCompact(entry.revenue),
    }));
  }, [state.bookings, days, today]);

  const offerSplit = useMemo(
    () => revenueByOffer(period).map((o) => ({ label: o.label, value: o.value, display: o.display })),
    [period],
  );

  const hours = useMemo(() => popularHours(period), [period]);
  const weekdays = useMemo(() => byWeekday(period), [period]);
  const clients = useMemo(() => topClients(period, state.users), [period, state.users]);

  const averageBasket = summary.bookings > 0 ? summary.revenueCents / summary.bookings : 0;
  const cancellationRate = period.length > 0 ? summary.cancelled / period.length : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ul className="flex gap-1.5 rounded-full bg-anthracite/6 p-1.5">
          {RANGES.map((range) => (
            <li key={range.id}>
              <button
                type="button"
                onClick={() => setDays(range.id)}
                aria-pressed={days === range.id}
                className={[
                  'min-h-10 whitespace-nowrap rounded-full px-4 text-[length:var(--text-sm)] font-semibold transition-colors duration-300',
                  days === range.id ? 'bg-anthracite text-creme' : 'text-anthracite/60 hover:text-anthracite',
                ].join(' ')}
              >
                {range.label}
              </button>
            </li>
          ))}
        </ul>
        <p className="text-[length:var(--text-sm)] text-anthracite/55">Données simulées à des fins de démonstration.</p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Chiffre d’affaires" value={formatPrice(summary.revenueCents)} detail={`${summary.bookings} séances`} />
        <Kpi label="Panier moyen" value={formatPrice(Math.round(averageBasket))} detail="par séance" />
        <Kpi label="Participants" value={String(summary.participants)} detail={`${(summary.participants / Math.max(1, summary.bookings)).toFixed(1)} par séance`} />
        <Kpi
          label="Taux d’annulation"
          value={formatPercent(cancellationRate)}
          detail={`${summary.cancelled} annulation${summary.cancelled > 1 ? 's' : ''}`}
        />
      </ul>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Séances réservées" subtitle={days <= 30 ? 'par jour' : 'par semaine'}>
          <AreaChart points={trend} caption={`Nombre de séances sur ${days} jours`} />
        </Panel>

        <Panel title="Chiffre d’affaires" subtitle={days <= 30 ? 'par jour' : 'par semaine'}>
          <AreaChart points={revenueTrend} caption={`Chiffre d’affaires sur ${days} jours`} color="#439677" />
        </Panel>

        <Panel title="Répartition par formule" subtitle="part du chiffre d’affaires">
          {offerSplit.length > 0 ? (
            <DonutChart
              points={offerSplit}
              caption="Chiffre d’affaires par formule"
              centerValue={formatPriceCompact(summary.revenueCents)}
              centerLabel="total"
            />
          ) : (
            <Empty />
          )}
        </Panel>

        <Panel title="Remplissage" subtitle="créneaux réservés sur créneaux ouverts">
          <div className="flex flex-wrap items-center justify-around gap-5 py-2">
            <Gauge ratio={summary.occupancy} label={`Sur ${days} jours`} />
            <dl className="flex flex-col gap-2.5 text-[length:var(--text-sm)]">
              <Line label="À encaisser sur place">
                <Price cents={summary.pendingCents} className="text-[length:var(--text-sm)]" />
              </Line>
              <Line label="Séances non honorées">{summary.noShow}</Line>
              <Line label="Annulations">{summary.cancelled}</Line>
            </dl>
          </div>
        </Panel>

        <Panel title="Créneaux les plus demandés" subtitle="toutes journées confondues">
          {hours.length > 0 ? <BarChart points={hours} caption="Réservations par heure de début" /> : <Empty />}
        </Panel>

        <Panel title="Jours les plus chargés" subtitle="du lundi au samedi">
          <BarChart points={weekdays} caption="Réservations par jour de la semaine" color="#69acde" />
        </Panel>
      </div>

      <Panel title="Clients les plus assidus" subtitle={`sur ${days} jours`}>
        {clients.length > 0 ? (
          <ol className="flex flex-col gap-2.5">
            {clients.map((client, index) => (
              <li key={client.label} className="flex items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-anthracite/8 font-display text-[length:var(--text-sm)] leading-none">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold">{client.label}</span>
                <span className="shrink-0 text-[length:var(--text-sm)] text-anthracite/55">
                  {client.value} séance{client.value > 1 ? 's' : ''}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <Empty />
        )}
      </Panel>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="u-card flex min-w-0 flex-col gap-4 p-5 sm:p-6">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-[length:var(--text-xl)]">{title}</h2>
        {subtitle && <p className="text-[length:var(--text-xs)] text-anthracite/50">{subtitle}</p>}
      </div>
      <div className="min-w-0 text-anthracite">{children}</div>
    </section>
  );
}

function Kpi({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <li className="u-card flex flex-col gap-1 p-4 sm:p-5">
      <span className="text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.12em] text-anthracite/45">
        {label}
      </span>
      <span className="font-display text-[length:var(--text-3xl)] leading-none">{value}</span>
      <span className="text-[length:var(--text-xs)] text-anthracite/55">{detail}</span>
    </li>
  );
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-5">
      <dt className="text-anthracite/55">{label}</dt>
      <dd className="font-semibold">{children}</dd>
    </div>
  );
}

function Empty() {
  return <p className="py-8 text-center text-[length:var(--text-sm)] text-anthracite/45">Pas encore de données sur cette période.</p>;
}

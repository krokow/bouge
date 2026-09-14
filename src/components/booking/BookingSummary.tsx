'use client';

import { useState } from 'react';
import { OFFERS_BY_ID } from '@/data/offers';
import { Price } from '@/components/ui/Price';
import { asset, MAX_PARTICIPANTS } from '@/lib/config';
import { formatLongDate, formatTime } from '@/lib/date';
import { pluralize } from '@/lib/format';
import type { OfferId, IsoDate, Time } from '@/lib/types';

export interface SummaryData {
  participants: number;
  offerId: OfferId | null;
  date: IsoDate | null;
  startTime: Time | null;
}

/** Montant total : seul le petit comité se facture par personne. */
export function totalCents(data: SummaryData): number {
  if (!data.offerId) return 0;
  const offer = OFFERS_BY_ID[data.offerId];
  return offer.pricePerPersonCents * (offer.id === 'petit-comite' ? data.participants : 1);
}

function Rows({ data }: { data: SummaryData }) {
  const offer = data.offerId ? OFFERS_BY_ID[data.offerId] : null;
  return (
    <dl className="flex flex-col gap-3 text-[length:var(--text-sm)]">
      <Row label="Participants">
        {data.participants} {pluralize(data.participants, 'personne')}
        {data.participants === MAX_PARTICIPANTS && (
          <span className="ml-1.5 text-anthracite/40">(maximum)</span>
        )}
      </Row>
      <Row label="Formule">{offer ? offer.name : <Pending />}</Row>
      <Row label="Date">{data.date ? formatLongDate(data.date) : <Pending />}</Row>
      <Row label="Horaire">
        {data.startTime && offer ? (
          <>
            {formatTime(data.startTime)} <span className="text-anthracite/40">({offer.durationMin} min)</span>
          </>
        ) : (
          <Pending />
        )}
      </Row>
    </dl>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-anthracite/8 pb-3 last:border-0 last:pb-0">
      <dt className="shrink-0 text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.12em] text-anthracite/45">
        {label}
      </dt>
      <dd className="text-right font-semibold text-anthracite">{children}</dd>
    </div>
  );
}

function Pending() {
  return <span className="font-normal text-anthracite/30">À choisir</span>;
}

/** Récapitulatif latéral, affiché à partir du laptop. */
export function BookingSummary({ data }: { data: SummaryData }) {
  const offer = data.offerId ? OFFERS_BY_ID[data.offerId] : null;
  const total = totalCents(data);

  return (
    <aside className="u-card sticky top-28 hidden flex-col gap-5 p-6 lg:flex">
      <div className="flex items-center gap-3">
        <img src={asset('/brand/monogram-orange.webp')} alt="" width={512} height={492} className="size-9" />
        <h2 className="text-[length:var(--text-xl)] leading-none">Votre séance</h2>
      </div>

      <Rows data={data} />

      <div className="flex items-baseline justify-between gap-4 border-t-2 border-anthracite/12 pt-4">
        <span className="text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.12em] text-anthracite/45">
          Total
        </span>
        {offer ? (
          <Price cents={total} className="text-[length:var(--text-3xl)]" />
        ) : (
          <span className="text-anthracite/30">—</span>
        )}
      </div>

      {offer?.id === 'petit-comite' && data.participants > 1 && (
        <p className="text-[length:var(--text-2xs)] leading-relaxed text-anthracite/50">
          Tarif par personne, réglé en une seule fois par la personne qui réserve.
        </p>
      )}

      <p className="flex items-start gap-2 rounded-xl bg-jade/10 px-3.5 py-3 text-[length:var(--text-2xs)] leading-relaxed text-anthracite/70">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="mt-px size-3.5 shrink-0 text-jade" aria-hidden="true">
          <circle cx="10" cy="10" r="8" />
          <path d="M10 9.2v4.4M10 6.4v.1" strokeLinecap="round" />
        </svg>
        Annulation ou report en ligne, sans frais, jusqu’à 24&nbsp;h avant la séance.
      </p>
    </aside>
  );
}

/**
 * Récapitulatif mobile : barre repliable ancrée en bas d'écran.
 * Elle reste hors du flux pour ne jamais recouvrir les boutons d'étape,
 * grâce à la marge basse réservée dans le tunnel.
 */
export function BookingSummaryBar({ data }: { data: SummaryData }) {
  const [open, setOpen] = useState(false);
  const offer = data.offerId ? OFFERS_BY_ID[data.offerId] : null;
  const total = totalCents(data);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-anthracite/12 bg-blanc/95 backdrop-blur-lg lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {open && (
        <div className="u-container max-h-[45svh] overflow-y-auto border-b border-anthracite/10 py-4">
          <Rows data={data} />
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="u-container flex min-h-14 w-full items-center justify-between gap-4 py-2 text-left"
      >
        <span className="flex min-w-0 flex-col">
          <span className="text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.12em] text-anthracite/45">
            {open ? 'Masquer le détail' : 'Votre séance'}
          </span>
          <span className="truncate text-[length:var(--text-sm)] font-semibold">
            {offer ? offer.name : 'Formule à choisir'}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {offer ? <Price cents={total} className="text-[length:var(--text-xl)]" /> : <span className="text-anthracite/30">—</span>}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            aria-hidden="true"
            className={`size-4 text-anthracite/45 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          >
            <path d="M6 15l6-6 6 6" />
          </svg>
        </span>
      </button>
    </div>
  );
}

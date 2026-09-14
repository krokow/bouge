import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BookingFunnel, FunnelSkeleton } from '@/components/booking/BookingFunnel';
import { STUDIO } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Réserver une séance',
  description:
    `Réservez votre séance de coaching au studio ${STUDIO.name} en moins d’une minute : ` +
    'participants, formule, date, créneau, paiement sur place ou en ligne.',
  robots: { index: true, follow: true },
};

export default function ReserverPage() {
  return (
    <section className="bg-creme pb-[var(--spacing-fluid-6)] pt-[clamp(6.5rem,13vh,9rem)]">
      <div className="u-container">
        {/* `useSearchParams` impose une frontière Suspense en export statique :
            la page est pré-rendue, les paramètres sont lus côté navigateur. */}
        <Suspense fallback={<FunnelSkeleton />}>
          <BookingFunnel />
        </Suspense>
      </div>
    </section>
  );
}

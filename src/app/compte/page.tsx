import type { Metadata } from 'next';
import { AccountDashboard } from '@/components/account/AccountDashboard';

export const metadata: Metadata = {
  title: 'Mon espace',
  description: 'Consultez, reportez ou annulez vos séances de coaching.',
  robots: { index: false, follow: false },
};

export default function ComptePage() {
  return (
    <section className="bg-creme pb-[var(--spacing-fluid-6)] pt-[clamp(6.5rem,13vh,9rem)]">
      <div className="u-container">
        <AccountDashboard />
      </div>
    </section>
  );
}

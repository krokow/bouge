import type { Metadata } from 'next';
import { AuthPanel } from '@/components/account/AuthPanel';
import { STUDIO } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Connexion',
  description: `Accédez à votre espace ${STUDIO.name} pour consulter, reporter ou annuler vos séances.`,
  robots: { index: false, follow: true },
};

export default function ConnexionPage() {
  return (
    <section className="bg-creme pb-[var(--spacing-fluid-6)] pt-[clamp(6.5rem,13vh,9rem)]">
      <div className="u-container">
        <AuthPanel />
      </div>
    </section>
  );
}

import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';

export const metadata: Metadata = {
  title: 'Tableau de bord',
  description: 'Espace de gestion du studio : rendez-vous, disponibilités, statistiques.',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <section className="bg-creme pb-[var(--spacing-fluid-6)] pt-[clamp(6.5rem,13vh,9rem)]">
      <div className="u-container-wide">
        <AdminShell />
      </div>
    </section>
  );
}

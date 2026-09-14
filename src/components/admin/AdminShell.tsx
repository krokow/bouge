'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AdminOverview } from './AdminOverview';
import { AdminCalendar } from './AdminCalendar';
import { AdminBookings } from './AdminBookings';
import { AdminBlocks } from './AdminBlocks';
import { AdminStats } from './AdminStats';
import { AdminEmails } from './AdminEmails';
import { Button } from '@/components/ui/Button';
import { asset, STUDIO } from '@/lib/config';
import { useCurrentUser, useDatabase, useMounted } from '@/lib/hooks/useDatabase';
import { bookingsToIcs, downloadIcs } from '@/lib/ics';
import { db } from '@/lib/store/database';
import { LOGIN_HREF } from '@/lib/nav';

export type AdminSection = 'overview' | 'calendar' | 'bookings' | 'blocks' | 'stats' | 'emails';

const SECTIONS: Array<{ id: AdminSection; label: string; short: string; icon: React.ReactNode }> = [
  { id: 'overview', label: 'Vue d’ensemble', short: 'Accueil', icon: <IconGrid /> },
  { id: 'calendar', label: 'Calendrier', short: 'Agenda', icon: <IconCalendar /> },
  { id: 'bookings', label: 'Réservations', short: 'RDV', icon: <IconList /> },
  { id: 'blocks', label: 'Indisponibilités', short: 'Blocages', icon: <IconLock /> },
  { id: 'stats', label: 'Statistiques', short: 'Stats', icon: <IconChart /> },
  { id: 'emails', label: 'Emails envoyés', short: 'Emails', icon: <IconMail /> },
];

/**
 * Coquille de l'espace d'administration.
 *
 * Accès réservé au compte gérant. En démonstration, le contrôle est purement
 * côté client — suffisant pour la maquette, mais à remplacer impérativement par
 * un contrôle serveur (session + vérification du rôle à chaque requête) lors de
 * la migration : une vérification dans le navigateur ne protège rien.
 *
 * Adaptativité : barre latérale à partir de 1280px, onglets défilants en
 * dessous. Le gérant doit pouvoir bloquer un créneau depuis son téléphone.
 */
export function AdminShell() {
  const router = useRouter();
  const state = useDatabase();
  const user = useCurrentUser();
  const mounted = useMounted();
  const [section, setSection] = useState<AdminSection>('overview');

  useEffect(() => {
    if (mounted && (!user || user.role !== 'admin')) router.replace(LOGIN_HREF);
  }, [mounted, user, router]);

  const availability = useMemo(
    () => ({ bookings: state.bookings, blocks: state.blocks }),
    [state.bookings, state.blocks],
  );

  if (!mounted || !user || user.role !== 'admin') {
    return <div className="h-96 animate-pulse rounded-[1.75rem] bg-anthracite/6" aria-hidden="true" />;
  }

  return (
    <div className="grid items-start gap-[var(--spacing-fluid-3)] xl:grid-cols-[15rem_1fr]">
      {/* Navigation — barre latérale sur grand écran */}
      <nav aria-label="Sections du tableau de bord" className="xl:sticky xl:top-28">
        <ul className="flex gap-1.5 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible xl:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SECTIONS.map((item) => (
            <li key={item.id} className="shrink-0 xl:w-full">
              <button
                type="button"
                onClick={() => setSection(item.id)}
                aria-current={section === item.id ? 'page' : undefined}
                className={[
                  'flex min-h-11 w-full items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 text-[length:var(--text-sm)]',
                  'font-semibold transition-colors duration-300',
                  section === item.id
                    ? 'bg-anthracite text-creme'
                    : 'text-anthracite/60 hover:bg-anthracite/6 hover:text-anthracite',
                ].join(' ')}
              >
                <span className="shrink-0 opacity-80">{item.icon}</span>
                <span className="xl:hidden">{item.short}</span>
                <span className="hidden xl:inline">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-4 hidden flex-col gap-2 rounded-2xl border border-anthracite/10 bg-blanc p-4 xl:flex">
          <p className="text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.14em] text-anthracite/45">
            Exports
          </p>
          <Button
            variant="dark"
            size="sm"
            onClick={() =>
              downloadIcs(bookingsToIcs(state.bookings.filter((b) => b.status !== 'cancelled'), state.users), 'bouge-agenda')
            }
          >
            Agenda complet (.ics)
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm('Réinitialiser toutes les données de démonstration ?')) void db.reset();
            }}
            className="text-anthracite/55"
          >
            Réinitialiser la démo
          </Button>
        </div>
      </nav>

      <div className="flex min-w-0 flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img src={asset('/brand/monogram-orange.webp')} alt="" width={512} height={492} className="size-11" />
            <div className="flex flex-col">
              <p className="text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.18em] text-orange">
                Espace gérant
              </p>
              <h1 className="text-[length:var(--text-3xl)] leading-none">
                {SECTIONS.find((s) => s.id === section)?.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-[length:var(--text-sm)] text-anthracite/55 sm:inline">
              {user.firstName} {user.lastName}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void db.signOut().then(() => router.push('/'))}
              className="text-anthracite/60"
            >
              Déconnexion
            </Button>
          </div>
        </header>

        <div key={section} style={{ animation: 'u-fade-up 0.4s cubic-bezier(0.22,1,0.36,1) both' }}>
          {section === 'overview' && <AdminOverview onNavigate={setSection} />}
          {section === 'calendar' && <AdminCalendar availability={availability} />}
          {section === 'bookings' && <AdminBookings />}
          {section === 'blocks' && <AdminBlocks />}
          {section === 'stats' && <AdminStats availability={availability} />}
          {section === 'emails' && <AdminEmails />}
        </div>

        {/* Exports, version mobile */}
        <div className="flex flex-col gap-2.5 rounded-2xl border border-anthracite/10 bg-blanc p-4 sm:flex-row xl:hidden">
          <Button
            variant="dark"
            size="sm"
            onClick={() =>
              downloadIcs(bookingsToIcs(state.bookings.filter((b) => b.status !== 'cancelled'), state.users), 'bouge-agenda')
            }
            className="sm:flex-1"
          >
            Exporter l’agenda (.ics)
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm('Réinitialiser toutes les données de démonstration ?')) void db.reset();
            }}
            className="text-anthracite/55 sm:flex-1"
          >
            Réinitialiser la démo
          </Button>
        </div>

        <p className="text-[length:var(--text-2xs)] leading-relaxed text-anthracite/45">
          Démonstration&nbsp;: les données affichées sont fictives et stockées dans ce navigateur. En production,
          l’accès à cet espace sera contrôlé côté serveur. Studio {STUDIO.name}.
        </p>
      </div>
    </div>
  );
}

/* --- Icônes ---------------------------------------------------------------- */

function IconGrid() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4" aria-hidden="true">
      <rect x="2.5" y="2.5" width="6" height="6" rx="1.5" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1.5" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1.5" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1.5" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4" aria-hidden="true">
      <rect x="2.5" y="4" width="15" height="13.5" rx="2" />
      <path d="M2.5 8h15M6.5 2.5v3M13.5 2.5v3" strokeLinecap="round" />
    </svg>
  );
}
function IconList() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4" aria-hidden="true">
      <path d="M7 5h10M7 10h10M7 15h10M3.2 5h.01M3.2 10h.01M3.2 15h.01" strokeLinecap="round" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4" aria-hidden="true">
      <rect x="4" y="8.5" width="12" height="8.5" rx="2" />
      <path d="M7 8.5V6a3 3 0 016 0v2.5" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4" aria-hidden="true">
      <path d="M3 17h14M6 13.5V9M10 13.5V4.5M14 13.5v-6" strokeLinecap="round" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4" aria-hidden="true">
      <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
      <path d="M3 6l7 5 7-5" strokeLinecap="round" />
    </svg>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AdminOverview } from './AdminOverview';
import { AdminCalendar } from './AdminCalendar';
import { AdminBookings } from './AdminBookings';
import { AdminBlocks } from './AdminBlocks';
import { AdminStats } from './AdminStats';
import { AdminEmails } from './AdminEmails';
import { AdminTeam } from './AdminTeam';
import { AdminAssignments } from './AdminAssignments';
import { AdminRuns } from './AdminRuns';
import { AdminScopeProvider, useAdminScope } from './AdminScope';
import { CoachAvatar } from '@/components/ui/CoachAvatar';
import { Button } from '@/components/ui/Button';
import { asset, STUDIO } from '@/lib/config';
import type { Coach } from '@/lib/types';
import { useCurrentCoach, useCurrentUser, useDatabase, useMounted } from '@/lib/hooks/useDatabase';
import { bookingsToIcs, downloadIcs } from '@/lib/ics';
import { db } from '@/lib/store/database';
import { LOGIN_HREF } from '@/lib/nav';

export type AdminSection =
  | 'overview'
  | 'calendar'
  | 'bookings'
  | 'blocks'
  | 'stats'
  | 'emails'
  | 'team'
  | 'assignments'
  | 'runs';

/** `owner: true` : section réservée au gérant du studio. */
const SECTIONS: Array<{
  id: AdminSection;
  label: string;
  short: string;
  icon: React.ReactNode;
  owner?: boolean;
}> = [
  { id: 'overview', label: 'Vue d’ensemble', short: 'Accueil', icon: <IconGrid /> },
  { id: 'calendar', label: 'Calendrier', short: 'Agenda', icon: <IconCalendar /> },
  { id: 'bookings', label: 'Réservations', short: 'RDV', icon: <IconList /> },
  { id: 'blocks', label: 'Indisponibilités', short: 'Blocages', icon: <IconLock /> },
  { id: 'assignments', label: 'Qui assure quoi', short: 'Coachs', icon: <IconSwap />, owner: true },
  { id: 'team', label: 'L’équipe', short: 'Équipe', icon: <IconTeam />, owner: true },
  { id: 'runs', label: 'Les runs', short: 'Runs', icon: <IconRun />, owner: true },
  { id: 'stats', label: 'Statistiques', short: 'Stats', icon: <IconChart /> },
  { id: 'emails', label: 'Emails envoyés', short: 'Emails', icon: <IconMail /> },
];

/**
 * Coquille de l'espace d'administration.
 *
 * Deux publics, un seul écran :
 *  - le gérant voit tout le studio, gère l'équipe, décide qui assure quoi, et
 *    peut se placer dans l'espace de n'importe quel coach pour le gérer ;
 *  - un coach n'accède qu'à son propre espace, sans en changer.
 *
 * Le périmètre consulté est porté par `AdminScopeProvider` : les sections ne
 * savent rien du basculement, elles lisent les données qu'on leur donne.
 *
 * ⚠️ DÉMONSTRATION — le contrôle d'accès est ici purement côté navigateur. Il
 * est suffisant pour la maquette et ne protège rien en production : à la
 * migration, la session et le rôle doivent être vérifiés côté serveur à chaque
 * requête, et les données filtrées avant l'envoi.
 *
 * Adaptativité : barre latérale à partir de 1280px, onglets défilants en
 * dessous. Le gérant doit pouvoir bloquer un créneau depuis son téléphone.
 */
export function AdminShell() {
  const router = useRouter();
  const state = useDatabase();
  const user = useCurrentUser();
  const myCoach = useCurrentCoach();
  const mounted = useMounted();
  const [section, setSection] = useState<AdminSection>('overview');
  /** Coach dont on consulte l'espace. `null` : tout le studio. */
  const [viewing, setViewing] = useState<Coach | null>(null);

  const isOwner = user?.role === 'admin';
  const allowed = Boolean(user && (isOwner || user.role === 'coach'));

  useEffect(() => {
    if (mounted && !allowed) router.replace(LOGIN_HREF);
  }, [mounted, allowed, router]);

  // Un coach est rivé à son propre espace : il ne choisit pas son périmètre.
  useEffect(() => {
    if (!isOwner && myCoach) setViewing(myCoach);
  }, [isOwner, myCoach]);

  // Les sections réservées au gérant ne doivent pas rester ouvertes si le
  // compte change, ni être atteignables par un coach.
  useEffect(() => {
    const current = SECTIONS.find((item) => item.id === section);
    if (current?.owner && !isOwner) setSection('overview');
  }, [section, isOwner]);

  if (!mounted || !user || !allowed) {
    return <div className="h-96 animate-pulse rounded-[1.75rem] bg-anthracite/6" aria-hidden="true" />;
  }

  const sections = SECTIONS.filter((item) => !item.owner || isOwner);
  const scopedCoach = isOwner ? viewing : myCoach;

  return (
    <AdminScopeProvider coach={scopedCoach} isOwner={isOwner}>
      <AdminBody
        section={section}
        setSection={setSection}
        sections={sections}
        isOwner={isOwner}
        coaches={state.coaches}
        viewing={viewing}
        setViewing={setViewing}
        user={user}
        onSignOut={() => void db.signOut().then(() => router.push('/'))}
      />
    </AdminScopeProvider>
  );
}

function AdminBody({
  section,
  setSection,
  sections,
  isOwner,
  coaches,
  viewing,
  setViewing,
  user,
  onSignOut,
}: {
  section: AdminSection;
  setSection: (section: AdminSection) => void;
  sections: typeof SECTIONS;
  isOwner: boolean;
  coaches: Coach[];
  viewing: Coach | null;
  setViewing: (coach: Coach | null) => void;
  user: { firstName: string; lastName: string };
  onSignOut: () => void;
}) {
  const { data: state, coach } = useAdminScope();

  return (
    <div className="grid items-start gap-[var(--spacing-fluid-3)] xl:grid-cols-[15rem_1fr]">
      {/* Navigation — barre latérale sur grand écran */}
      <nav aria-label="Sections du tableau de bord" className="xl:sticky xl:top-28">
        <ul className="flex gap-1.5 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible xl:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sections.map((item) => (
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
              downloadIcs(
                bookingsToIcs(
                  state.bookings.filter((b) => b.status !== 'cancelled'),
                  state.users,
                  coach ? `BOUGE. — ${coach.firstName}` : 'BOUGE. — Réservations',
                  coaches,
                ),
                coach ? `bouge-agenda-${coach.slug}` : 'bouge-agenda',
              )
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
                {coach ? `Espace de ${coach.firstName}` : 'Espace gérant'}
              </p>
              <h1 className="text-[length:var(--text-3xl)] leading-none">
                {sections.find((item) => item.id === section)?.label}
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
              onClick={onSignOut}
              className="text-anthracite/60"
            >
              Déconnexion
            </Button>
          </div>
        </header>

        {/* Sélecteur de périmètre — le gérant seul en dispose. Il n'apparaît
            que s'il y a quelqu'un d'autre à consulter. */}
        {isOwner && coaches.length > 1 && (
          <ScopePicker coaches={coaches} viewing={viewing} onChange={setViewing} />
        )}

        <div key={`${section}-${coach?.id ?? 'studio'}`} style={{ animation: 'u-fade-up 0.4s cubic-bezier(0.22,1,0.36,1) both' }}>
          {section === 'overview' && <AdminOverview onNavigate={setSection} />}
          {section === 'calendar' && <AdminCalendar />}
          {section === 'bookings' && <AdminBookings />}
          {section === 'blocks' && <AdminBlocks />}
          {section === 'assignments' && <AdminAssignments />}
          {section === 'team' && <AdminTeam onInspect={(c) => { setViewing(c); setSection('overview'); }} />}
          {section === 'runs' && <AdminRuns />}
          {section === 'stats' && <AdminStats />}
          {section === 'emails' && <AdminEmails />}
        </div>

        {/* Exports, version mobile */}
        <div className="flex flex-col gap-2.5 rounded-2xl border border-anthracite/10 bg-blanc p-4 sm:flex-row xl:hidden">
          <Button
            variant="dark"
            size="sm"
            onClick={() =>
              downloadIcs(
                bookingsToIcs(
                  state.bookings.filter((b) => b.status !== 'cancelled'),
                  state.users,
                  coach ? `BOUGE. — ${coach.firstName}` : 'BOUGE. — Réservations',
                  coaches,
                ),
                coach ? `bouge-agenda-${coach.slug}` : 'bouge-agenda',
              )
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
/**
 * Sélecteur de périmètre du gérant.
 *
 * « Tout le studio » d'abord : c'est la vue par défaut et celle qui sert le
 * plus. Les coachs suivent, chacun ouvrant son propre espace tel qu'il le voit
 * lui-même — mêmes écrans, mêmes actions, mêmes limites. Le gérant gère ainsi
 * à leur place sans avoir à se connecter avec leur compte.
 */
function ScopePicker({
  coaches,
  viewing,
  onChange,
}: {
  coaches: Coach[];
  viewing: Coach | null;
  onChange: (coach: Coach | null) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-anthracite/10 bg-blanc p-3">
      <p className="px-1 text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.14em] text-anthracite/45">
        Espace consulté
      </p>
      <ul className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <li className="shrink-0">
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-pressed={viewing === null}
            className={[
              'flex min-h-11 items-center gap-2 whitespace-nowrap rounded-xl px-3.5 text-[length:var(--text-sm)] font-semibold',
              'transition-colors duration-200',
              viewing === null
                ? 'bg-anthracite text-creme'
                : 'text-anthracite/60 hover:bg-anthracite/6 hover:text-anthracite',
            ].join(' ')}
          >
            Tout le studio
          </button>
        </li>
        {coaches.map((c) => {
          const active = viewing?.id === c.id;
          return (
            <li key={c.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onChange(c)}
                aria-pressed={active}
                className={[
                  'flex min-h-11 items-center gap-2 whitespace-nowrap rounded-xl py-1 pl-1 pr-3.5 text-[length:var(--text-sm)] font-semibold',
                  'transition-colors duration-200',
                  active
                    ? 'bg-anthracite text-creme'
                    : 'text-anthracite/60 hover:bg-anthracite/6 hover:text-anthracite',
                ].join(' ')}
              >
                <CoachAvatar coach={c} size="sm" className="size-9" />
                {c.firstName}
                {!c.active && (
                  <span className="rounded-full bg-anthracite/10 px-2 py-0.5 text-[0.62rem] uppercase tracking-wide text-anthracite/50">
                    inactif
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function IconTeam() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4" aria-hidden="true">
      <circle cx="7.5" cy="7" r="2.6" />
      <path d="M2.5 16c0-2.5 2.2-4.2 5-4.2s5 1.7 5 4.2" strokeLinecap="round" />
      <path d="M13.2 5.1a2.6 2.6 0 0 1 0 5" strokeLinecap="round" />
      <path d="M14.5 12.2c1.8.5 3 1.9 3 3.8" strokeLinecap="round" />
    </svg>
  );
}

function IconRun() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4" aria-hidden="true">
      <circle cx="12.5" cy="4" r="1.8" />
      <path d="M11 8l-3 2 1.5 3M8 10L5 8M9.5 13l-2 4M9.5 13l3 1 1 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSwap() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4" aria-hidden="true">
      <path d="M3 7h11l-3-3M17 13H6l3 3" strokeLinecap="round" strokeLinejoin="round" />
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
